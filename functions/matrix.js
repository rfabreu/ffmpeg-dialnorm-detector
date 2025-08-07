// functions/matrix.js

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("[matrix] Missing Supabase configuration");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setUTCHours(23, 59, 59, 999);

    // Fetch all streams.
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

    // Fetch measurements recorded on the given date.
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

    // Group measurements by stream_id and hour-of-day.
    const groups = {};
    measurements.forEach((m) => {
      const t = new Date(m.timestamp);
      const hour = t.getUTCHours();
      const slot = String(hour).padStart(2, "0") + ":00";
      if (!groups[m.stream_id]) groups[m.stream_id] = {};
      if (!groups[m.stream_id][slot]) {
        groups[m.stream_id][slot] = { sum: m.avg_db, count: 1 };
      } else {
        groups[m.stream_id][slot].sum += m.avg_db;
        groups[m.stream_id][slot].count += 1;
      }
    });

    // Construct the response array.
    const result = streams.map((s) => {
      let ipPort = s.mcast_url || "";
      ipPort = ipPort.replace(/^udp:\/\//, "");
      const idx = ipPort.indexOf("?");
      if (idx !== -1) ipPort = ipPort.slice(0, idx);

      const readings = {};
      const group = groups[s.id] || {};
      Object.keys(group).forEach((slot) => {
        const { sum, count } = group[slot];
        const avg = sum / count;
        readings[slot] = `${avg.toFixed(1)} dB`;
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
