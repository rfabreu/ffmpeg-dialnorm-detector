// functions/matrix.js

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
// Prefer service‑role key if available; fall back to anon key otherwise.
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("[matrix] Missing Supabase configuration");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Function to convert UTC time to EST
function convertUTCToEST(utcTimeString) {
  try {
    const utcDate = new Date(utcTimeString);
    if (isNaN(utcDate.getTime())) {
      console.error("[matrix] Invalid UTC time:", utcTimeString);
      return "00:00";
    }

    return utcDate.toLocaleTimeString("en-US", {
      timeZone: "America/New_York",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (error) {
    console.error("[matrix] Error converting UTC to EST:", error);
    return "00:00";
  }
}

exports.handler = async (event) => {
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
    // Determine UTC start and end of the specified date.
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

    // Fetch all streams (channels).
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

    // Fetch up to 100k measurements for the given date.
    const { data: measurements, error: measErr } = await supabase
      .from("measurements")
      .select("stream_id, timestamp, avg_db")
      .gte("timestamp", startDate.toISOString())
      .lte("timestamp", endDate.toISOString())
      .order("timestamp", { ascending: true })
      .limit(100000);

    if (measErr) {
      console.error("[matrix] measurement query error", measErr);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: measErr.message }),
      };
    }

    // NEW LOGIC: Group measurements by stream_id and scan time (more granular)
    const groups = {};
    measurements.forEach((m) => {
      const t = new Date(m.timestamp);
      // Create a more granular time slot (5-minute intervals for better scan separation)
      const minutes = Math.floor(t.getUTCMinutes() / 5) * 5;
      const slot =
        String(t.getUTCHours()).padStart(2, "0") +
        ":" +
        String(minutes).padStart(2, "0");

      if (!groups[m.stream_id]) groups[m.stream_id] = {};
      if (!groups[m.stream_id][slot]) {
        groups[m.stream_id][slot] = {
          sum: m.avg_db,
          count: 1,
          lastTimestamp: m.timestamp,
        };
      } else {
        groups[m.stream_id][slot].sum += m.avg_db;
        groups[m.stream_id][slot].count += 1;
        // Update lastTimestamp if this measurement is newer
        if (
          new Date(m.timestamp) >
          new Date(groups[m.stream_id][slot].lastTimestamp)
        ) {
          groups[m.stream_id][slot].lastTimestamp = m.timestamp;
        }
      }
    });

    // Build the response array.
    const result = streams.map((s) => {
      // Strip the protocol and any query parameters from the multicast URL.
      let ipPort = s.mcast_url || "";
      ipPort = ipPort.replace(/^udp:\/\//, "");
      const idx = ipPort.indexOf("?");
      if (idx !== -1) ipPort = ipPort.slice(0, idx);

      const readings = {};
      const group = groups[s.id] || {};
      Object.keys(group).forEach((slot) => {
        const { sum, count, lastTimestamp } = group[slot];
        const avg = sum / count;
        const estTime = convertUTCToEST(lastTimestamp);
        readings[slot] = `${avg.toFixed(1)} dB (${estTime} EST)`;
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
