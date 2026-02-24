/* ================================================================
   mensagemService.js
   Suporte a dois canais:
   1. Evolution API  — envia direto, sem abrir o WhatsApp Web
   2. wa.me (fallback) — abre link no navegador

   IA (opcional):
   - Groq API (gratuita) — melhora / gera mensagens humanizadas
================================================================ */

const EVOLUTION_URL      = import.meta.env.VITE_EVOLUTION_API_URL  || '';
const EVOLUTION_KEY      = import.meta.env.VITE_EVOLUTION_API_KEY  || '';
const EVOLUTION_INSTANCE = import.meta.env.VITE_EVOLUTION_INSTANCE || '';
const GROQ_KEY           = import.meta.env.VITE_GROQ_API_KEY       || '';

/* ─── Checagens de configuração ──────────────────────────── */
export function isEvolutionConfigurado() {
    return Boolean(EVOLUTION_URL && EVOLUTION_KEY && EVOLUTION_INSTANCE);
}

export function isGroqConfigurado() {
    return Boolean(GROQ_KEY);
}

/* ─── Envio via Evolution API ────────────────────────────── */
export async function enviarViaEvolution(numero, mensagem) {
    // Remove tudo que não for dígito e garante código do país
    const digits = String(numero).replace(/\D/g, '');
    const destino = digits.startsWith('55') ? digits : `55${digits}`;

    const url = `${EVOLUTION_URL.replace(/\/$/, '')}/message/sendText/${EVOLUTION_INSTANCE}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_KEY,
        },
        body: JSON.stringify({
            number: destino,
            textMessage: { text: mensagem },
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Evolution API retornou status ${res.status}`);
    }

    return await res.json();
}

/* ─── Fallback wa.me ─────────────────────────────────────── */
export function enviarViaWaMe(numero, mensagem) {
    const digits = String(numero).replace(/\D/g, '');
    window.open(
        `https://wa.me/${digits}?text=${encodeURIComponent(mensagem)}`,
        '_blank',
        'noopener,noreferrer',
    );
}

/* ─── Envio unificado (tenta Evolution, cai em wa.me) ───── */
export async function enviarMensagem(numero, mensagem) {
    if (isEvolutionConfigurado()) {
        await enviarViaEvolution(numero, mensagem);
        return { canal: 'evolution' };
    }
    enviarViaWaMe(numero, mensagem);
    return { canal: 'wame' };
}

/* ─── Groq AI: melhorar / gerar mensagem humanizada ─────── */
export async function melhorarComIA(contexto) {
    if (!isGroqConfigurado()) throw new Error('Chave Groq não configurada.');

    const {
        etapa,
        nome,
        beneficio,
        situacao,
        classificacao,
        observacoes,
        documentos,
        mensagemAtual,
    } = contexto;

    const sistema = `Você é um atendente humanizado de um escritório de advocacia especializado em INSS.
Seu tom é acolhedor, respeitoso e profissional.
Escreva em português do Brasil.
Seja direto, evite textos muito longos.
Nunca invente informações jurídicas.
Nunca use asteriscos para negrito — use o formato WhatsApp (*texto*).`;

    const instrucoes = {
        abertura: `Escreva uma mensagem de abertura calorosa para ${nome}, que entrou em contato sobre *${beneficio}* (situação: ${situacao}). Prioridade: ${classificacao}. ${observacoes ? `Observação do lead: ${observacoes}` : ''}. Apresente o escritório e pergunte se pode atendê-la agora.`,
        qualificacao: `Escreva uma mensagem de qualificação para ${nome} sobre *${beneficio}*. Faça 2 perguntas objetivas para entender melhor a situação antes de pedir os documentos.`,
        documentos: `Escreva uma mensagem solicitando os seguintes documentos para ${nome}: ${documentos?.join(', ')}. Seja gentil e explique para que servem de forma resumida.`,
        encerramento: `Escreva uma mensagem de encerramento para ${nome}, informando que os documentos foram recebidos e que o especialista entrará em contato em breve. Agradeça e seja encorajador.`,
        personalizada: `Melhore esta mensagem mantendo o tom humanizado, sem alterar informações essenciais:\n\n${mensagemAtual}`,
    };

    const userMessage = instrucoes[etapa] || instrucoes.personalizada;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: sistema },
                { role: 'user',   content: userMessage },
            ],
            temperature: 0.7,
            max_tokens: 400,
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Groq retornou status ${res.status}`);
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
