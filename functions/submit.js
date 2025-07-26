const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    const { stream_id, timestamp, min_db, max_db, avg_db, status } = JSON.parse(
      event.body
    );
    const { error } = await supabase
      .from("measurements")
      .insert([{ stream_id, timestamp, min_db, max_db, avg_db, status }]);
    if (error) throw error;
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
