// functions/measurements.js

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const PUBLIC_KEY   = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !PUBLIC_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
}

const supabase = createClient(SUPABASE_URL, PUBLIC_KEY);

exports.handler = async (event) => {
  // Check for an optional 'since' query parameter
  const since = event.queryStringParameters && event.queryStringParameters.since;

  // Base query: select all columns from "measurements", sorted by timestamp
  let query = supabase.from("measurements")
                     .select("*")
                     .order("timestamp", { ascending: true });

  if (since) {
    // If 'since' is provided, get only measurements with timestamp greater than the given value
    query = query.gt("timestamp", since);
  } else {
    // If no 'since' provided (initial load), fetch the full history (up to 10,000 entries)
    query = query.range(0, 9999);
  }

  const { data, error } = await query;
  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
