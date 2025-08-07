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
    // Start at 00:00:00.000 UTC
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    // End at 23:59:59.999 UTC
    endDate.setUTCHours(23, 59, 59, 999);

    // Fetch all streams (channels) from the database.  We include name,
    // profile and multicast URL.  Additional fields can be selected here.
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
    // timestamp and average dB value.  Ordering by timestamp helps ensure that
    // grouping by hour preserves chronological order when multiple readings are
    // averaged.
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

    // Group measurements by stream_id and hour-of-day.  For each stream and hour,
    // accumulate sum and count to compute an average.
    const groups = {};
    measurements.forEach((m) => {
      const t = new Date(m.timestamp);
      // Use UTC hours to avoid timezone discrepancies.  Format as "HH:00".
      const hourKey = String(t.getUTCHours()).padStart(2, "0") + ":00";
      if (!groups[m.stream_id]) groups[m.stream_id] = {};
      if (!groups[m.stream_id][hourKey]) {
        groups[m.stream_id][hourKey] = { sum: m.avg_db, count: 1 };
      } else {
        groups[m.stream_id][hourKey].sum += m.avg_db;
        groups[m.stream_id][hourKey].count += 1;
      }
    });

    // Construct the response array.  For each stream we map to an object
    // containing its name, multicast IP and a readings object.  We convert
    // average values to fixed decimals and append 'dB' for display.
    const result = streams.map((s) => {
      const readings = {};
      const group = groups[s.id] || {};
      Object.keys(group).forEach((hour) => {
        const { sum, count } = group[hour];
        const avg = sum / count;
        // Format with one decimal place plus unit.
        readings[hour] = `${avg.toFixed(1)} dB`;
      });
      return {
        channelName: s.name,
        ip: s.mcast_url,
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
