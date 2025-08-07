// functions/matrix.js

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("[matrix] Missing Supabase configuration");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Define the expected time slots (9 runs per day from 09:00 to 17:00).
const TIME_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

exports.handler = async (event) => {
  // Ensure a date query parameter is provided.  Use ISO format (YYYY-MM-DD).
  const date = event.queryStringParameters && event.queryStringParameters.date;
  if (!date) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Missing 'date' query parameter (YYYY-MM-DD)",
      }),
    };
  }

  try {
    // Parse date and compute start/end timestamps in UTC.
    const startDate = new Date(date);
    if (Number.isNaN(startDate.getTime())) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Invalid date '${date}'. Expected YYYY-MM-DD format.`,
        }),
      };
    }
    // Start at 00:00:00.000 UTC
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    // End at 23:59:59.999 UTC
    endDate.setUTCHours(23, 59, 59, 999);

    // Fetch all streams (channels) from the database.  We include name,
    // profile and multicast URL.
    const { data: streams, error: streamsErr } = await supabase
      .from("streams")
      .select("id, name, mcast_url");
    if (streamsErr) {
      console.error("[matrix] stream query error", streamsErr);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: streamsErr.message }),
      };
    }

    // Fetch measurements recorded on the given date.  We only need the stream id,
    // timestamp and average dB value.
    const { data: measurements, error: measErr } = await supabase
      .from("measurements")
      .select("stream_id, timestamp, avg_db")
      .gte("timestamp", startDate.toISOString())
      .lte("timestamp", endDate.toISOString())
      .order("timestamp", { ascending: true });
    if (measErr) {
      console.error("[matrix] measurement query error", measErr);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: measErr.message }),
      };
    }

    // Group measurements by stream_id and predefined hour slots.  For each
    // measurement, determine the hour slot (e.g. 15:00) based on its UTC
    // timestamp.  Only measurements that fall into TIME_SLOTS are retained.
    const groups = {};
    measurements.forEach((m) => {
      const t = new Date(m.timestamp);
      // Use UTC hour to map into the nine predefined slots.
      const hour = t.getUTCHours();
      const slot = String(hour).padStart(2, "0") + ":00";
      if (!TIME_SLOTS.includes(slot)) return;
      if (!groups[m.stream_id]) groups[m.stream_id] = {};
      if (!groups[m.stream_id][slot]) {
        groups[m.stream_id][slot] = { sum: m.avg_db, count: 1 };
      } else {
        groups[m.stream_id][slot].sum += m.avg_db;
        groups[m.stream_id][slot].count += 1;
      }
    });

    // Construct the response array.  For each stream we map to an object
    // containing its name, multicast IP (stripped of protocol and query) and a
    // readings object keyed by TIME_SLOTS.  If no measurement exists for a
    // slot, the property will be undefined and clients can render "N/A".
    const result = streams.map((s) => {
      let ipPort = s.mcast_url || "";
      ipPort = ipPort.replace(/^udp:\/\//, "");
      const idx = ipPort.indexOf("?");
      if (idx !== -1) ipPort = ipPort.slice(0, idx);

      const readings = {};
      const group = groups[s.id] || {};
      TIME_SLOTS.forEach((slot) => {
        if (group[slot]) {
          const { sum, count } = group[slot];
          const avg = sum / count;
          readings[slot] = `${avg.toFixed(1)} dB`;
        }
      });
      return {
        channelName: s.name,
        ip: ipPort,
        readings,
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error("[matrix] unexpected error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
