// functions/submit.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('⚠️ Missing SUPABASE_URL or SERVICE_ROLE_KEY');
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

exports.handler = async (event) => {
  let p;
  try {
    p = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON' })
    };
  }

  // 1) Upsert into streams (on mcast_url) & grab the id
  const { data: stream, error: upsertErr } = await supabase
    .from('streams')
    .upsert(
      {
        name:      p.name,
        node:      p.node,
        profile:   p.profile,
        mcast_url: p.mcast_url
      },
      { onConflict: 'mcast_url' }
    )
    .select('id')
    .single();

  if (upsertErr || !stream?.id) {
    console.error('[submit] stream upsert error', upsertErr);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: upsertErr?.message || 'No stream ID' })
    };
  }

  // 2) Insert into measurements with the real stream_id
  const { error: measErr } = await supabase
    .from('measurements')
    .insert([
      {
        stream_id: stream.id,
        timestamp: p.timestamp,
        min_db:    p.min_db,
        max_db:    p.max_db,
        avg_db:    p.avg_db,
        status:    p.status
      }
    ]);

  if (measErr) {
    console.error('[submit] measurement error', measErr);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: measErr.message })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};
