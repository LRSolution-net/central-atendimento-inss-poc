// ================================================================
// Supabase Edge Function: whatsapp-webhook
// Recebe mensagens do Evolution API e salva na tabela atendimentos.
//
// URL pública (após deploy):
//   https://<projeto>.supabase.co/functions/v1/whatsapp-webhook
//
// Configure no Evolution API:
//   Webhook URL: https://<projeto>.supabase.co/functions/v1/whatsapp-webhook
//   Events: MESSAGES_UPSERT
// ================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!  // service_role ignora RLS
);

// Normaliza número para apenas dígitos, sem o sufixo @s.whatsapp.net
function normalizeNumber(jid: string): string {
  return jid.replace(/@.*$/, '').replace(/\D/g, '');
}

Deno.serve(async (req: Request) => {
  // Evolution API envia POST; responde OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  // Estrutura do evento MESSAGES_UPSERT da Evolution API v2
  // body = { event: 'messages.upsert', data: { key: { remoteJid, fromMe, id }, message: { conversation | extendedTextMessage } } }
  const event = body?.event;
  if (event !== 'messages.upsert') {
    // Ignora outros eventos (status, connection, etc.)
    return new Response(JSON.stringify({ ignored: true, event }), { status: 200 });
  }

  const data = body?.data;
  const fromMe: boolean = data?.key?.fromMe === true;

  // Só processa mensagens recebidas do lead (fromMe = false)
  if (fromMe) {
    return new Response(JSON.stringify({ ignored: true, reason: 'fromMe' }), { status: 200 });
  }

  const remoteJid: string = data?.key?.remoteJid || '';
  const numero = normalizeNumber(remoteJid);

  // Mensagem pode estar em conversation ou extendedTextMessage
  const texto: string =
    data?.message?.conversation ||
    data?.message?.extendedTextMessage?.text ||
    data?.message?.imageMessage?.caption ||
    '[Mensagem sem texto]';

  if (!numero) {
    return new Response(JSON.stringify({ error: 'numero vazio' }), { status: 400 });
  }

  // Busca o lead pelo número (sem código do país 55 ou com)
  // Tenta com e sem o prefixo 55
  const numSem55 = numero.startsWith('55') ? numero.slice(2) : numero;
  const numCom55 = numero.startsWith('55') ? numero : `55${numero}`;

  const { data: leads, error: leadError } = await supabase
    .from('leads')
    .select('id, nome')
    .or(`whatsapp.eq.${numSem55},whatsapp.eq.${numCom55},whatsapp.eq.+${numCom55}`)
    .limit(1);

  if (leadError) {
    console.error('Erro ao buscar lead:', leadError);
    return new Response(JSON.stringify({ error: leadError.message }), { status: 500 });
  }

  if (!leads || leads.length === 0) {
    // Lead não encontrado — registra sem lead_id para não perder a mensagem
    console.warn(`Lead não encontrado para número: ${numero}`);
    return new Response(JSON.stringify({ warning: 'lead não encontrado', numero }), { status: 200 });
  }

  const lead = leads[0];

  // Insere na tabela atendimentos como mensagem recebida
  const { error: insertError } = await supabase
    .from('atendimentos')
    .insert({
      lead_id:     lead.id,
      tipo:        'whatsapp_recebido',
      direcao:     'recebido',
      descricao:   texto,
      responsavel: lead.nome,    // nome do lead que respondeu
      numero_lead: numero,
    });

  if (insertError) {
    console.error('Erro ao inserir atendimento:', insertError);
    return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
  }

  console.log(`✅ Mensagem de ${lead.nome} (${numero}) salva.`);
  return new Response(JSON.stringify({ ok: true, lead_id: lead.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
