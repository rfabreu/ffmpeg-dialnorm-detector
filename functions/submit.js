const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

exports.handler = async (event) => {
  const p = JSON.parse(event.body);

  // 1) Upsert stream
  const { data: stream, error: upErr } = await supabase
    .from("streams")
    .upsert(
      {
        name: p.name,
        node: p.node,
        profile: p.profile,
        mcast_url: p.mcast_url,
      },
      { onConflict: "mcast_url" }
    )
    .select("id")
    .single();
  if (upErr)
    return { statusCode: 500, body: JSON.stringify({ error: upErr.message }) };

  // 2) Insert measurement
  const { error: measErr } = await supabase.from("measurements").insert([
    {
      stream_id: stream.id,
      timestamp: p.timestamp,
      min_db: p.min_db,
      max_db: p.max_db,
      avg_db: p.avg_db,
      status: p.status,
    },
  ]);
  if (measErr)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: measErr.message }),
    };

  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
