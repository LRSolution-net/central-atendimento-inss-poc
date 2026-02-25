import { supabase } from '../config/supabase.js';

/**
 * Salva uma entrada no histórico de alterações
 */
export async function salvarHistorico({
    leadId,
    usuarioNome,
    usuarioId = null,
    tipoAlteracao,
    campoAlterado = null,
    valorAnterior = null,
    valorNovo = null,
    descricao = null
}) {
    if (!supabase) throw new Error('Supabase não configurado.');

    console.log('Tentando salvar histórico:', {
        lead_id: leadId,
        usuario_nome: usuarioNome,
        tipo_alteracao: tipoAlteracao,
        campo_alterado: campoAlterado
    });

    const { data, error } = await supabase
        .from('lead_historico')
        .insert({
            lead_id: leadId,
            usuario_nome: usuarioNome,
            usuario_id: usuarioId,
            tipo_alteracao: tipoAlteracao,
            campo_alterado: campoAlterado,
            valor_anterior: valorAnterior ? JSON.stringify(valorAnterior) : null,
            valor_novo: valorNovo ? JSON.stringify(valorNovo) : null,
            descricao
        })
        .select();

    if (error) {
        console.error('Erro ao salvar histórico:', error);
        throw new Error(`Erro ao salvar histórico: ${error.message}`);
    }

    console.log('Histórico salvo com sucesso:', data);
}

/**
 * Busca o histórico de um lead
 */
export async function buscarHistoricoLead(leadId) {
    if (!supabase) throw new Error('Supabase não configurado.');

    const { data, error } = await supabase
        .from('lead_historico')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(`Erro ao buscar histórico: ${error.message}`);
    return data || [];
}

/**
 * Registra alterações múltiplas de campos
 */
export async function registrarAlteracoes(leadId, dadosAntigos, dadosNovos, usuario) {
    const alteracoes = [];
    const camposIgnorados = ['id', 'created_at', 'updated_at', 'updated_by'];

    Object.keys(dadosNovos).forEach(campo => {
        if (camposIgnorados.includes(campo)) return;
        
        const valorAntigo = dadosAntigos[campo];
        const valorNovo = dadosNovos[campo];

        if (valorAntigo !== valorNovo) {
            alteracoes.push({
                leadId,
                usuarioNome: usuario.nome,
                usuarioId: usuario.id,
                tipoAlteracao: 'edicao',
                campoAlterado: campo,
                valorAnterior: valorAntigo,
                valorNovo: valorNovo,
                descricao: `${campo}: "${valorAntigo}" → "${valorNovo}"`
            });
        }
    });

    // Salvar todas as alterações
    for (const alteracao of alteracoes) {
        await salvarHistorico(alteracao);
    }

    return alteracoes.length;
}
