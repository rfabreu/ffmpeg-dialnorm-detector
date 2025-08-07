// functions/dates.js

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("[dates] Missing Supabase configuration");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Update this string whenever you modify the function to verify deployment.
const VERSION = "v4";

exports.handler = async () => {
  try {
    // 1. Get the oldest and newest timestamps in the table.
    const { data: earliestData, error: earliestErr } = await supabase
      .from("measurements")
      .select("timestamp")
      .order("timestamp", { ascending: true })
      .limit(1);

    if (earliestErr) {
      console.error("[dates] earliest query error", earliestErr);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: earliestErr.message }),
      };
    }
    if (!earliestData || earliestData.length === 0) {
      // No measurements present at all.
      return {
        statusCode: 200,
        body: JSON.stringify({ version: VERSION, dates: [] }),
      };
    }

    const { data: latestData, error: latestErr } = await supabase
      .from("measurements")
      .select("timestamp")
      .order("timestamp", { ascending: false })
      .limit(1);

    if (latestErr) {
      console.error("[dates] latest query error", latestErr);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: latestErr.message }),
      };
    }

    const startDateStr = earliestData[0].timestamp.slice(0, 10);
    const endDateStr = latestData[0].timestamp.slice(0, 10);

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // 2. Loop over each day in the range and see if there is at least one row for that day.
    const dates = [];
    const oneDay = 24 * 60 * 60 * 1000;
    for (let d = startDate; d <= endDate; d = new Date(d.getTime() + oneDay)) {
      const dateStr = d.toISOString().slice(0, 10);
      const { data: rows, error: countErr } = await supabase
        .from("measurements")
        .select("id")
        .gte("timestamp", `${dateStr}T00:00:00+00:00`)
        .lte("timestamp", `${dateStr}T23:59:59+00:00`)
        .limit(1); // just check for existence

      if (countErr) {
        console.error(`[dates] count query error for ${dateStr}`, countErr);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: countErr.message }),
        };
      }
      if (rows && rows.length > 0) {
        dates.push(dateStr);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ version: VERSION, dates }),
    };
  } catch (err) {
    console.error("[dates] unexpected error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
