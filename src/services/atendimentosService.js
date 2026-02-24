import { supabase } from '../config/supabase.js';

export async function salvarAtendimento({
    lead_id,
    tipo        = 'whatsapp',
    direcao     = 'enviado',
    descricao,
    responsavel = '',
    numero_lead = '',
}) {
    if (!supabase) throw new Error('Supabase não configurado.');

    const { error } = await supabase
        .from('atendimentos')
        .insert([{ lead_id, tipo, direcao, descricao, responsavel, numero_lead }]);

    if (error) throw new Error(`Erro ao salvar atendimento: ${error.message}`);
}

export async function buscarAtendimentos(leadId) {
    if (!supabase) throw new Error('Supabase não configurado.');

    const { data, error } = await supabase
        .from('atendimentos')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });  // ascendente para exibição em chat

    if (error) throw new Error(`Erro ao buscar atendimentos: ${error.message}`);
    return data || [];
}

/* Inscreve em tempo real para um lead específico.
   Chama onNovaMensagem(atendimento) sempre que uma nova linha for inserida.
   Retorna a subscription — chame subscription.unsubscribe() ao fechar o modal. */
export function inscreverMensagens(leadId, onNovaMensagem) {
    const channel = supabase
        .channel(`atendimentos:lead:${leadId}`)
        .on(
            'postgres_changes',
            {
                event:  'INSERT',
                schema: 'public',
                table:  'atendimentos',
                filter: `lead_id=eq.${leadId}`,
            },
            (payload) => onNovaMensagem(payload.new)
        )
        .subscribe();

    return channel;
}
