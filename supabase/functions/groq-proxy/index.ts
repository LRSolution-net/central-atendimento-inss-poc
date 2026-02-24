// ================================================================
// Edge Function: groq-proxy
// Proxy para a Groq API — resolve o bloqueio de CORS do navegador.
// A chave VITE_GROQ_API_KEY fica segura no servidor, não no bundle.
//
// Deploy:
//   supabase functions deploy groq-proxy
//
// Secrets necessários (no Supabase Dashboard → Edge Functions → Secrets):
//   GROQ_API_KEY = gsk_...
// ================================================================

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: CORS });
  }

  const groqKey = Deno.env.get('GROQ_API_KEY');
  if (!groqKey) {
    return new Response(
      JSON.stringify({ error: 'GROQ_API_KEY não configurado nos secrets da Edge Function.' }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const groqRes = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${groqKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await groqRes.json();

  return new Response(JSON.stringify(data), {
    status: groqRes.status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});
