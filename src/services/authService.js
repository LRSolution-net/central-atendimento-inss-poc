import { supabase } from '../config/supabase.js';

/* ─── Login ──────────────────────────────────────────────── */
export async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    const profile = await getProfile(data.user.id);
    return { user: data.user, profile };
}

/* ─── Logout ─────────────────────────────────────────────── */
export async function logout() {
    await supabase.auth.signOut();
}

/* ─── Sessão atual ───────────────────────────────────────── */
export async function getSession() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return null;

    const profile = await getProfile(data.session.user.id);
    return { user: data.session.user, profile };
}

/* ─── Perfil ─────────────────────────────────────────────── */
export async function getProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw new Error(`Perfil não encontrado: ${error.message}`);
    return data;
}

/* ─── Criar usuário (somente admin) ─────────────────────── */
export async function createUser({ nome, email, password, role }) {
    // Salva sessão atual do admin antes do signUp
    // (signUp pode substituir a sessão se confirmação de e-mail estiver desativada)
    const { data: sessionData } = await supabase.auth.getSession();
    const adminSession = sessionData?.session;

    // Cria usuário no Supabase Auth
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nome, role } },
    });

    if (error) {
        // Tratamento específico para rate limit
        if (error.message.includes('rate limit') || error.message.includes('Email rate limit exceeded')) {
            throw new Error(
                '⏱️ Limite de criação de usuários excedido. Aguarde 1 minuto e tente novamente. '
                + 'O Supabase limita criação de usuários para prevenir spam.'
            );
        }
        // Tratamento para email já existente
        if (error.message.includes('already registered') || error.message.includes('already been registered')) {
            throw new Error('📧 Este e-mail já está cadastrado no sistema.');
        }
        throw new Error(`Erro ao criar usuário: ${error.message}`);
    }
    if (!data.user) throw new Error(
        'Usuário não foi criado. No painel do Supabase, vá em Authentication → Settings e desative "Confirm email".'
    );

    // Restaura sessão do admin (pode ter sido trocada pelo signUp)
    if (adminSession?.access_token) {
        await supabase.auth.setSession({
            access_token:  adminSession.access_token,
            refresh_token: adminSession.refresh_token,
        });
    }

    // O trigger handle_new_user() criou o perfil, mas garantimos nome e role via upsert
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: data.user.id, email, nome, role }, { onConflict: 'id' });

    if (profileError) throw new Error(`Usuário criado, mas erro no perfil: ${profileError.message}`);

    return data.user;
}
