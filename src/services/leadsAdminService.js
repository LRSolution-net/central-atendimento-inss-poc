import { supabase } from '../config/supabase.js';

export async function buscarLeads({ classificacao = '', status = '', beneficio = '' } = {}) {
    if (!supabase) throw new Error('Supabase não configurado.');

    let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

    if (classificacao) query = query.eq('classificacao', classificacao);
    if (status) query = query.eq('status_atendimento', status);
    if (beneficio) query = query.eq('beneficio', beneficio);

    const { data, error } = await query;
    if (error) throw new Error(`Erro ao buscar leads: ${error.message}`);
    return data || [];
}

export async function atualizarStatusLead(id, status_atendimento) {
    if (!supabase) throw new Error('Supabase não configurado.');

    const { error } = await supabase
        .from('leads')
        .update({ status_atendimento })
        .eq('id', id);

    if (error) throw new Error(`Erro ao atualizar lead: ${error.message}`);
}

export async function atualizarNomeLead(id, nome) {
    if (!supabase) throw new Error('Supabase não configurado.');

    const { error } = await supabase
        .from('leads')
        .update({ nome })
        .eq('id', id);

    if (error) throw new Error(`Erro ao atualizar nome: ${error.message}`);
}

export async function deletarLead(id) {
    if (!supabase) throw new Error('Supabase não configurado.');

    const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

    if (error) throw new Error(`Erro ao deletar lead: ${error.message}`);
}
