// functions/measurements.js

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const PUBLIC_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !PUBLIC_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
}

const supabase = createClient(SUPABASE_URL, PUBLIC_KEY);

exports.handler = async () => {
  const { data, error } = await supabase
    .from("measurements")
    .select("*")
    .order("timestamp", { ascending: true });

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
