/* ================================================================
   mensagemService.js
   Canais de envio:
   1. Meta WhatsApp Business Cloud API (grátis, via Edge Function)
   2. Evolution API  (self-hosted, via Edge Function ou direto)
   3. wa.me (fallback — abre WhatsApp Web)

   IA:
   - Groq API via Edge Function proxy (resolve CORS do navegador)
================================================================ */

const SUPABASE_URL        = import.meta.env.VITE_SUPABASE_URL       || '';
const EVOLUTION_URL       = import.meta.env.VITE_EVOLUTION_API_URL   || '';
const EVOLUTION_KEY       = import.meta.env.VITE_EVOLUTION_API_KEY   || '';
const EVOLUTION_INSTANCE  = import.meta.env.VITE_EVOLUTION_INSTANCE  || '';
const META_ENABLED        = import.meta.env.VITE_META_WA_ENABLED === 'true';
// Groq key pode ser deixada vazia — a Edge Function usa o secret do servidor
const GROQ_KEY_LOCAL      = import.meta.env.VITE_GROQ_API_KEY        || '';

/* ─── Checagens de configuração ──────────────────────────── */
export function isEvolutionConfigurado() {
    return Boolean(EVOLUTION_URL && EVOLUTION_KEY && EVOLUTION_INSTANCE);
}

export function isMetaConfigurado() {
    return META_ENABLED;
}

export function isGroqConfigurado() {
    // Groq funciona se: tiver key local OU tiver URL do Supabase (usa Edge Function)
    return Boolean(GROQ_KEY_LOCAL || SUPABASE_URL);
}

/* ─── Envio via Meta WhatsApp Cloud API (Edge Function) ──── */
export async function enviarViaMeta(numero, mensagem) {
    const url = `${SUPABASE_URL}/functions/v1/meta-whatsapp`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero, mensagem }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || `Meta API erro ${res.status}`);
    return data;
}

/* ─── Envio via Evolution API ────────────────────────────── */
export async function enviarViaEvolution(numero, mensagem) {
    const digits  = String(numero).replace(/\D/g, '');
    const destino = digits.startsWith('55') ? digits : `55${digits}`;
    const url = `${EVOLUTION_URL.replace(/\/$/, '')}/message/sendText/${EVOLUTION_INSTANCE}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
        body: JSON.stringify({ number: destino, textMessage: { text: mensagem } }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Evolution API erro ${res.status}`);
    }
    return await res.json();
}

/* ─── Fallback wa.me ─────────────────────────────────────── */
export function enviarViaWaMe(numero, mensagem) {
    const digits = String(numero).replace(/\D/g, '');
    window.open(
        `https://wa.me/${digits}?text=${encodeURIComponent(mensagem)}`,
        '_blank', 'noopener,noreferrer',
    );
}

/* ─── Envio unificado (Meta → Evolution → wa.me) ────────── */
export async function enviarMensagem(numero, mensagem) {
    if (isMetaConfigurado()) {
        await enviarViaMeta(numero, mensagem);
        return { canal: 'meta' };
    }
    if (isEvolutionConfigurado()) {
        await enviarViaEvolution(numero, mensagem);
        return { canal: 'evolution' };
    }
    enviarViaWaMe(numero, mensagem);
    return { canal: 'wame' };
}

/* ─── Groq AI via Edge Function proxy (resolve CORS) ─────── */
export async function melhorarComIA(contexto) {
    const {
        etapa, nome, beneficio, situacao,
        classificacao, observacoes, documentos, mensagemAtual,
    } = contexto;

    const sistema = `Você é um atendente humanizado de um escritório de advocacia especializado em INSS.
Seu tom é acolhedor, respeitoso e profissional.
Escreva em português do Brasil.
Seja direto, evite textos muito longos.
Nunca invente informações jurídicas.
Use o formato WhatsApp para negrito (*texto*).`;

    const instrucoes = {
        abertura:      `Escreva uma mensagem de abertura calorosa para ${nome}, que entrou em contato sobre *${beneficio}* (situação: ${situacao}). Prioridade: ${classificacao}. ${observacoes ? `Observação: ${observacoes}` : ''} Apresente o escritório e pergunte se pode atendê-lo agora.`,
        qualificacao:  `Escreva uma mensagem de qualificação para ${nome} sobre *${beneficio}*. Faça 2 perguntas objetivas para entender melhor a situação antes de pedir os documentos.`,
        documentos:    `Escreva uma mensagem solicitando os seguintes documentos para ${nome}: ${documentos?.join(', ')}. Seja gentil e explique resumidamente para que servem.`,
        encerramento:  `Escreva uma mensagem de encerramento para ${nome}, informando que os documentos foram recebidos e o especialista entrará em contato em breve. Agradeça e seja encorajador.`,
        personalizada: `Melhore esta mensagem mantendo tom humanizado, sem alterar informações essenciais:\n\n${mensagemAtual}`,
    };

    const payload = {
        model: 'llama-3.3-70b-versatile',
        messages: [
            { role: 'system', content: sistema },
            { role: 'user',   content: instrucoes[etapa] || instrucoes.personalizada },
        ],
        temperature: 0.7,
        max_tokens: 400,
    };

    // Usa Edge Function proxy se disponível (produção/GitHub Pages)
    // Cai direto na Groq se tiver key local (dev local sem Edge Function)
    let res;
    if (SUPABASE_URL) {
        res = await fetch(`${SUPABASE_URL}/functions/v1/groq-proxy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    } else if (GROQ_KEY_LOCAL) {
        res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type':  'application/json',
                'Authorization': `Bearer ${GROQ_KEY_LOCAL}`,
            },
            body: JSON.stringify(payload),
        });
    } else {
        throw new Error('Configure VITE_SUPABASE_URL ou VITE_GROQ_API_KEY.');
    }

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Groq erro ${res.status}`);
    }

    const json = await res.json();
    return json.choices?.[0]?.message?.content?.trim() || '';
}

/* ─── Scripts predefinidos por etapa ────────────────────── */
export function gerarScriptEtapa(etapa, { nome, beneficio, situacao, classificacao, documentos = [], observacoes = '' }) {
    const benef = beneficio.replace('-', ' ');

    const scripts = {
        abertura: `Olá, ${nome}! 👋\n\nAqui é do escritório especializado em INSS. Recebemos sua solicitação sobre *${benef}* e ficamos felizes em poder ajudar! 🤝\n\nPodemos conversar agora para entender melhor o seu caso?`,

        qualificacao: `${nome}, para que possamos orientá-lo da melhor forma sobre seu processo de *${benef}*, gostaríamos de entender um pouco mais:\n\n1️⃣ Você já deu entrada nesse benefício anteriormente ou será o primeiro pedido?\n\n2️⃣ Você possui todos os seus documentos de contribuição (carteira de trabalho, CNIS)?`,

        documentos: documentos.length
            ? `${nome}, para darmos entrada no seu processo de *${benef}*, precisamos dos seguintes documentos:\n\n${documentos.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\nAssim que reunir, nos envie por aqui ou agende uma visita! 📋`
            : `${nome}, em breve nosso especialista entrará em contato para informar os documentos necessários para o seu caso de *${benef}*. ✅`,

        encerramento: `${nome}, recebemos tudo! 🎉\n\nNosso especialista vai analisar o seu caso e entrará em contato em breve para os próximos passos.\n\nQualquer dúvida, estamos aqui! 😊\n\nConte conosco! ⚖️`,
    };

    return scripts[etapa] || '';
}
