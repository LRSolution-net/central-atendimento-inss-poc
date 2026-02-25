import { supabase } from '../config/supabase.js';

const BENEFICIOS_VALIDOS = ['aposentadoria', 'auxilio-doenca', 'bpc-loas', 'beneficio-negado', 'outros'];
const SITUACOES_VALIDAS = ['primeiro-pedido', 'em-analise', 'indeferido', 'cessado'];
const SEXOS_VALIDOS = ['masculino', 'feminino'];

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
    console.log('[DEBUG  sanitize] Input recebido:', raw);
    
    const nome = normalizeText(raw.nome, 120);
    const cidade = normalizeText(raw.cidade, 120);
    const beneficio = normalizeText(raw.beneficio, 40);
    const situacao = normalizeText(raw.situacao, 40);
    const sexo = normalizeText(raw.sexo, 20);
    const observacoes = normalizeText(raw.observacoes, 450);
    const idade = Number(raw.idade);
    const contribuicaoAnos = Number(raw.contribuicaoAnos);
    const consentimento = Boolean(raw.consentimento);
    
    console.log('[DEBUG sanitize] consentimento raw:', raw.consentimento, 'tipo:', typeof raw.consentimento);
    console.log('[DEBUG sanitize] consentimento convertido:', consentimento, 'tipo:', typeof consentimento);

    if (nome.length < 3) {
        throw new Error('Informe o nome completo.');
    }

    if (!BENEFICIOS_VALIDOS.includes(beneficio)) {
        throw new Error('Selecione um tipo de benefício válido.');
    }

    if (!SITUACOES_VALIDAS.includes(situacao)) {
        throw new Error('Selecione uma situação válida.');
    }

    if (!SEXOS_VALIDOS.includes(sexo)) {
        throw new Error('Selecione o sexo.');
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

    const resultado = {
        nome,
        whatsapp: formatPhoneToE164BR(raw.whatsapp),
        cidade,
        beneficio,
        situacao,
        sexo,
        idade,
        contribuicao_anos: contribuicaoAnos,
        observacoes,
        consentimento,
    };
    
    console.log('[DEBUG sanitize] Resultado final:', resultado);
    console.log('[DEBUG sanitize] Consentimento no resultado:', resultado.consentimento, 'tipo:', typeof resultado.consentimento);
    
    return resultado;
}

export async function verificarWhatsAppExistente(numero) {
    if (!supabase) {
        throw new Error('Supabase não configurado.');
    }

    // Normaliza número para formato E.164
    const numeroFormatado = numero.startsWith('55') ? `+${numero}` : `+55${numero}`;

    const { data, error } = await supabase
        .from('leads')
        .select('id, nome, created_at')
        .eq('whatsapp', numeroFormatado)
        .limit(1);

    if (error) {
        console.error('[INSS] Erro ao verificar WhatsApp:', error);
        throw error;
    }

    if (data && data.length > 0) {
        return {
            existe: true,
            nome: data[0].nome,
            created_at: data[0].created_at,
        };
    }

    return { existe: false };
}

export async function saveLead(leadData) {
    if (!supabase) {
        throw new Error('Supabase não configurado.');
    }

    // Garante que consentimento seja sempre booleano
    const dadosParaInserir = {
        ...leadData,
        consentimento: Boolean(leadData.consentimento),
    };

    // Validação final de segurança
    if (!dadosParaInserir.consentimento) {
        throw new Error('Consentimento obrigatório não foi fornecido.');
    }

    // Dupla verificação (segurança)
    const resultado = await verificarWhatsAppExistente(dadosParaInserir.whatsapp.replace(/\D/g, ''));
    if (resultado.existe) {
        throw new Error(`Este WhatsApp já está cadastrado para ${resultado.nome}. Entre em contato pelo número registrado.`);
    }

    console.log('[INSS] Enviando lead ao Supabase:', JSON.stringify(dadosParaInserir, null, 2));

    const { data, error } = await supabase
        .from('leads')
        .insert([dadosParaInserir])
        .select();

    if (error) {
        console.error('[INSS] Erro Supabase:', error);
        console.error('[INSS] Dados tentados:', dadosParaInserir);
        throw new Error(`Não foi possível salvar o lead: ${error.message}`);
    }

    console.log('[INSS] Lead salvo com sucesso!', data);
    return data?.[0] || { id: null };
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