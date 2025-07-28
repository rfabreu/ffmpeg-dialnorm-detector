// functions/submit.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('⚠️ Missing SUPABASE_URL or SERVICE_ROLE_KEY');
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

exports.handler = async (event) => {
  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON' })
    };
  }

  // ─── 1) Upsert the stream definition ────────────────────────────────
  //    ON CONFLICT by mcast_url so we never duplicate
  const { data: stream, error: upsertErr } = await supabase
    .from('streams')
    .upsert(
      {
        name:      payload.name,
        node:      payload.node,
        profile:   payload.profile,
        mcast_url: payload.mcast_url
      },
      { onConflict: 'mcast_url' }
    )
    .select('id')
    .single();

  if (upsertErr || !stream?.id) {
    console.error('[submit] stream upsert error', upsertErr);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: upsertErr?.message || 'Stream upsert failed' })
    };
  }

  // ─── 2) Insert the measurement with the returned stream.id ───────────
  const { error: measErr } = await supabase
    .from('measurements')
    .insert([
      {
        stream_id: stream.id,
        timestamp: payload.timestamp,
        min_db:    payload.min_db,
        max_db:    payload.max_db,
        avg_db:    payload.avg_db,
        status:    payload.status
      }
    ]);

  if (measErr) {
    console.error('[submit] measurement insert error', measErr);
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
