// ================================================================
// Edge Function: meta-whatsapp
// Envia mensagens via Meta WhatsApp Business Cloud API (grátis).
//
// Deploy:
//   supabase functions deploy meta-whatsapp
//
// Secrets necessários (Supabase Dashboard → Edge Functions → Secrets):
//   META_WA_TOKEN        = EAAxxxxxxx  (token permanente da Meta)
//   META_WA_PHONE_ID     = 1234567890  (Phone Number ID do painel Meta)
//
// Como obter:
//   1. Acesse developers.facebook.com → Create App → Business
//   2. Adicione o produto "WhatsApp"
//   3. Em WhatsApp → API Setup: copie Phone Number ID e gere token
//   4. O número fornecido pela Meta (test number) já funciona sem aprovação
// ================================================================

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

  const token   = Deno.env.get('META_WA_TOKEN');
  const phoneId = Deno.env.get('META_WA_PHONE_ID');

  if (!token || !phoneId) {
    return new Response(
      JSON.stringify({ error: 'META_WA_TOKEN ou META_WA_PHONE_ID não configurados.' }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }

  let body: any;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const { numero, mensagem } = body;
  if (!numero || !mensagem) {
    return new Response(JSON.stringify({ error: 'numero e mensagem são obrigatórios.' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  // Normaliza número — Meta exige só dígitos com código do país (ex: 5511999999999)
  const digits = String(numero).replace(/\D/g, '');
  const to = digits.startsWith('55') ? digits : `55${digits}`;

  const metaRes = await fetch(
    `https://graph.facebook.com/v19.0/${phoneId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: mensagem },
      }),
    }
  );

  const data = await metaRes.json();

  if (!metaRes.ok) {
    return new Response(JSON.stringify({ error: data?.error?.message || 'Erro Meta API', data }), {
      status: metaRes.status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, data }), {
    status: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});
