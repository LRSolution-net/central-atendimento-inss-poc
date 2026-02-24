import { supabase } from '../config/supabase.js';

export async function listarUsuarios() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw new Error(`Erro ao listar usuários: ${error.message}`);
    return data || [];
}

export async function toggleAtivoUsuario(id, ativo) {
    const { error } = await supabase
        .from('profiles')
        .update({ ativo })
        .eq('id', id);

    if (error) throw new Error(`Erro ao atualizar usuário: ${error.message}`);
}

export async function atualizarRoleUsuario(id, role) {
    const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', id);

    if (error) throw new Error(`Erro ao atualizar perfil: ${error.message}`);
}
