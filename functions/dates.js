// functions/dates.js

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("[dates] Missing Supabase configuration");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

exports.handler = async () => {
  try {
    const { data, error } = await supabase
      .from("measurements")
      .select("timestamp")
      .order("timestamp", { ascending: true })
      .range(0, 99999); // fetch up to 100k rows

    if (error) {
      console.error("[dates] measurement query error", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }

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
