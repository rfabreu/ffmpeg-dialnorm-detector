// functions/dates.js

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
// Prefer service‑role key if available; fall back to anon key otherwise.
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("[dates] Missing Supabase configuration");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

exports.handler = async () => {
  try {
    // Select up to 100k timestamps to cover all measurement rows.
    const { data, error } = await supabase
      .from("measurements")
      .select("timestamp")
      .order("timestamp", { ascending: true })
      .limit(100000);

    if (error) {
      console.error("[dates] measurement query error", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }

    // Extract unique YYYY-MM-DD strings in chronological order.
    const seen = new Set();
    const dates = [];
    data.forEach((m) => {
      const dateStr = m.timestamp.slice(0, 10);
      if (!seen.has(dateStr)) {
        seen.add(dateStr);
        dates.push(dateStr);
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify(dates),
    };
  } catch (err) {
    console.error("[dates] unexpected error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
