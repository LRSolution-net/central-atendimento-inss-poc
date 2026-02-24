import { supabase } from '../config/supabase.js';

const BENEFICIOS_VALIDOS = ['aposentadoria', 'auxilio-doenca', 'bpc-loas', 'beneficio-negado', 'outros'];
const SITUACOES_VALIDAS = ['primeiro-pedido', 'em-analise', 'indeferido', 'cessado'];

export function normalizeText(value, maxLength = 180) {
    return String(value || '')
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, maxLength);
}

export function formatPhoneToE164BR(value) {
    const digits = String(value || '').replace(/\D/g, '');

    if (digits.length < 10 || digits.length > 13) {
        throw new Error('WhatsApp inválido. Informe DDD + número.');
    }

    if (digits.startsWith('55')) {
        return `+${digits}`;
    }

    return `+55${digits}`;
}

export function sanitizeLeadInput(raw) {
    const nome = normalizeText(raw.nome, 120);
    const cidade = normalizeText(raw.cidade, 120);
    const beneficio = normalizeText(raw.beneficio, 40);
    const situacao = normalizeText(raw.situacao, 40);
    const observacoes = normalizeText(raw.observacoes, 450);
    const idade = Number(raw.idade);
    const contribuicaoAnos = Number(raw.contribuicaoAnos);
    const consentimento = Boolean(raw.consentimento);

    if (nome.length < 3) {
        throw new Error('Informe o nome completo.');
    }

    if (!BENEFICIOS_VALIDOS.includes(beneficio)) {
        throw new Error('Selecione um tipo de benefício válido.');
    }

    if (!SITUACOES_VALIDAS.includes(situacao)) {
        throw new Error('Selecione uma situação válida.');
    }

    if (!Number.isFinite(idade) || idade < 16 || idade > 120) {
        throw new Error('Idade inválida para triagem.');
    }

    if (!Number.isFinite(contribuicaoAnos) || contribuicaoAnos < 0 || contribuicaoAnos > 70) {
        throw new Error('Tempo de contribuição inválido.');
    }

    if (!consentimento) {
        throw new Error('É obrigatório aceitar o uso de dados para continuar.');
    }

    return {
        nome,
        whatsapp: formatPhoneToE164BR(raw.whatsapp),
        cidade,
        beneficio,
        situacao,
        idade,
        contribuicao_anos: contribuicaoAnos,
        observacoes,
        consentimento,
    };
}

export async function saveLead(leadData) {
    if (!supabase) {
        throw new Error('Supabase não configurado.');
    }

    const { data, error } = await supabase
        .from('leads')
        .insert([leadData])
        .select('id, created_at')
        .single();

    if (error) {
        throw new Error('Não foi possível salvar o lead. Revise as políticas no Supabase.');
    }

    return data;
}

export function buildWhatsAppMessage({ nome, beneficio, situacao, classificacao, protocolo }) {
    const beneficioLabel = beneficio.replace('-', ' ');
    const situacaoLabel = situacao.replace('-', ' ');
    const protocoloTexto = protocolo ? `Protocolo: ${protocolo}` : 'Protocolo: em processamento';

    return [
        'Olá! Acabei de preencher a triagem INSS.',
        `Nome: ${nome}`,
        `Benefício: ${beneficioLabel}`,
        `Situação: ${situacaoLabel}`,
        `Prioridade: ${classificacao}`,
        protocoloTexto,
    ].join('\n');
}

export function buildWhatsAppUrl(phoneNumber, message) {
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}