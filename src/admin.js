import './styles-admin.css';
import { supabase } from './config/supabase.js';
import { login, logout, getSession } from './services/authService.js';
import { renderAdminApp } from './components/adminApp.js';
import { renderAtendentePage } from './components/atendentePage.js';

const container = document.querySelector('#admin-app');

/* ─── Tela de Login ──────────────────────────────────────── */
function renderLogin(erroMsg = '') {
    container.innerHTML = `
        <div class="al-wrap">
            <div class="al-card">
                <div class="al-icon">⚖️</div>
                <h1 class="al-title">Central INSS</h1>
                <p class="al-sub">Acesso interno — equipe do escritório</p>
                ${erroMsg ? `<div class="al-alert">${erroMsg}</div>` : ''}
                <form id="login-form">
                    <label class="al-label" for="login-email">E-mail</label>
                    <input id="login-email" class="al-input" type="email"
                           placeholder="seu@email.com" required autocomplete="username" />
                    <label class="al-label" for="login-senha">Senha</label>
                    <input id="login-senha" class="al-input" type="password"
                           placeholder="••••••••" required autocomplete="current-password" />
                    <button class="al-btn" type="submit" id="login-btn">Entrar</button>
                </form>
            </div>
        </div>`;

    container.querySelector('#login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn   = container.querySelector('#login-btn');
        const email = container.querySelector('#login-email').value.trim();
        const senha = container.querySelector('#login-senha').value;
        btn.disabled = true; btn.textContent = 'Entrando…';
        try {
            const { profile } = await login(email, senha);
            routeByProfile(profile);
        } catch (err) {
            renderLogin(err.message);
        }
    });
}

/* ─── Roteamento por perfil ──────────────────────────────── */
function routeByProfile(profile) {
    if (!profile?.ativo) {
        logout();
        renderLogin('Usuário inativo. Contate o administrador.');
        return;
    }
    if (profile.role === 'admin') {
        renderAdminApp(container, profile);
    } else {
        renderAtendentePage(container, profile);
    }
}

/* ─── Inicialização ──────────────────────────────────────── */
async function init() {
    if (!supabase) {
        container.innerHTML = `
            <div class="al-wrap">
                <div class="al-card">
                    <div class="al-icon">⚠️</div>
                    <h2 class="al-title">Supabase não configurado</h2>
                    <p class="al-sub">Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.</p>
                </div>
            </div>`;
        return;
    }

    container.innerHTML = `<div class="al-wrap"><div class="al-card" style="text-align:center;color:#6b7280">Verificando sessão…</div></div>`;

    try {
        const session = await getSession();
        if (session?.profile) {
            routeByProfile(session.profile);
        } else {
            renderLogin();
        }
    } catch {
        renderLogin();
    }
}

init();

