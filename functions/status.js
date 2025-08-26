// functions/status.js

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("[status] Missing Supabase configuration");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

exports.handler = async (event) => {
  try {
    // Get the last 24 hours of measurements
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Fetch recent measurements with stream information
    const { data: measurements, error: measErr } = await supabase
      .from("measurements")
      .select("*, streams(name, profile)")
      .gte("timestamp", yesterday.toISOString())
      .order("timestamp", { ascending: false });

    if (measErr) {
      console.error("[status] measurement query error", measErr);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: measErr.message }),
      };
    }

    // Group by stream and calculate status summary
    const streamStatus = {};
    measurements.forEach((m) => {
      if (!streamStatus[m.stream_id]) {
        streamStatus[m.stream_id] = {
          stream_id: m.stream_id,
          name: m.streams?.name || "Unknown",
          profile: m.streams?.profile || "unknown",
          total_measurements: 0,
          status_counts: {
            normal: 0,
            too_low: 0,
            too_loud: 0
          },
          latest_measurement: null,
          latest_status: null
        };
      }

      const status = m.status || "normal";
      streamStatus[m.stream_id].total_measurements++;
      streamStatus[m.stream_id].status_counts[status] = 
        (streamStatus[m.stream_id].status_counts[status] || 0) + 1;

      // Keep track of latest measurement
      if (!streamStatus[m.stream_id].latest_measurement || 
          new Date(m.timestamp) > new Date(streamStatus[m.stream_id].latest_measurement.timestamp)) {
        streamStatus[m.stream_id].latest_measurement = m;
        streamStatus[m.stream_id].latest_status = status;
      }
    });

    // Convert to array and add summary stats
    const result = Object.values(streamStatus).map(stream => ({
      ...stream,
      status_percentage: {
        normal: stream.total_measurements > 0 ? 
          ((stream.status_counts.normal / stream.total_measurements) * 100).toFixed(1) : 0,
        too_low: stream.total_measurements > 0 ? 
          ((stream.status_counts.too_low / stream.total_measurements) * 100).toFixed(1) : 0,
        too_loud: stream.total_measurements > 0 ? 
          ((stream.status_counts.too_loud / stream.total_measurements) * 100).toFixed(1) : 0
      }
    }));

    // Add overall summary
    const totalStreams = result.length;
    const totalMeasurements = result.reduce((sum, s) => sum + s.total_measurements, 0);
    const overallStatus = {
      total_streams: totalStreams,
      total_measurements: totalMeasurements,
      streams_with_issues: result.filter(s => 
        s.status_counts.too_low > 0 || s.status_counts.too_loud > 0
      ).length,
      timestamp: now.toISOString()
    };

    return {
      statusCode: 200,
      body: JSON.stringify({
        summary: overallStatus,
        streams: result
      }),
    };
  } catch (err) {
    console.error("[status] unexpected error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};