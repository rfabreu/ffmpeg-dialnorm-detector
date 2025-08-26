// functions/measurements.js

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const PUBLIC_KEY   = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !PUBLIC_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
}

const supabase = createClient(SUPABASE_URL, PUBLIC_KEY);

exports.handler = async (event) => {
  // Check for optional query parameters
  const since = event.queryStringParameters && event.queryStringParameters.since;
  const streamId = event.queryStringParameters && event.queryStringParameters.stream_id;
  const status = event.queryStringParameters && event.queryStringParameters.status;
  const limit = event.queryStringParameters && event.queryStringParameters.limit;

  // Base query: select all columns from "measurements", sorted by timestamp
  let query = supabase.from("measurements")
                     .select("*, streams(name, profile, mcast_url)")
                     .order("timestamp", { ascending: false });

  if (since) {
    // If 'since' is provided, get only measurements with timestamp greater than the given value
    query = query.gt("timestamp", since);
  }
  
  if (streamId) {
    // Filter by specific stream
    query = query.eq("stream_id", streamId);
  }
  
  if (status) {
    // Filter by status
    query = query.eq("status", status);
  }

  // Apply limit (default to 1000 if not specified)
  const queryLimit = limit ? parseInt(limit) : 1000;
  query = query.limit(queryLimit);

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
