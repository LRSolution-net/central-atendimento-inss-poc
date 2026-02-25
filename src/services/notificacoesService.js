/* ================================================================
   notificacoesService.js
   Sistema de notificações em tempo real para mensagens do WhatsApp
   - Monitora atendimentos recebidos via Realtime
   - Notificações desktop (navegador)
   - Notificações sonoras
   - Gerenciamento de mensagens não lidas
================================================================ */

import { supabase } from '../config/supabase.js';

/* Estado das notificações */
const notifState = {
    // { [lead_id]: count }
    naolidas: {},
    // função callback quando nova mensagem chegar
    onNovaMensagem: null,
    // subscription do Realtime
    channel: null,
    // permissão de notificação
    permissaoNotificacao: 'default',
};

/* ─── Audio de notificação ───────────────────────────────── */
// Som simples de notificação (data URL de um beep curto)
const AUDIO_BEEP = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2i78OScTRALUKrj87FiHAU7k9r0yXgqBSl+zPLaizsKGGS58OWhUSQLTKXh8bllHQU3jtT0zHcsBS2A0fPTgjMHHGm98OOYThALT6rj9LJjHAU8lNv1yHYpBSh90PLaizsKGGO48eaoUycLTKPi8bllHQU4jtT0zHcsBS+A0fPTgjMHHGm98OSYThAMT6vj9LFjHAU8lNv1yHYpBSh90PLdizsKGGO48eeoUicLTKPh8bllHQU4jtT0zHYrBDCA0fPTgjMHHWm98OSZThAMT6vj9LFjHAU8lNv1yHYpBSh90PLdizsKGGO48eaoUicLTKPh8bllHQU4jtT0zHYrBDCA0fPTgjMHHWm98OSZThAMT6vj9LFjHAU8lNv1yHYpBSh90PLdizsKGGO48eaoUicLTKPh8bllHQU4jtT0zHYrBDCA0fPUgjMHHWm98OSZThAMT6vj9LFjHAU8lNv1yHYpBSh90PLdizsKGGO48eaoUicLTKPh8bllHQU4jtT0zHYrBDCA0fPUgjMHHWm98OSZThAMT6vj9LFjHAU8lNv1yHYpBSh90PLdizsKGGO48eaoUicLTKPh8bllHQU4jtT0zHYrBDCA0fPTgjMHHWm98OSYThALT6rk9LJjHQU8lNz1yHYpBSl90PLdizsKGGO48eaoUicLTKLh8blkHQU4j9T0zHYrBDCA0fPTgjMHHWi88OSYThALT6rk9LJjHQU8lNz1yHYpBSl+0PLdizsKGGO48eapUicLTKLh8blkHQU4j9T0zHYrBDCA0fPTgjMHHWi88OSYThALT6rk9LJjHQU8lNz1yHYpBSl+0PLdizsKGGO48eapUicLTKLh8blkHQU4j9X0zHYrBDCA0fPTgjMHHWi88OSYThALT6rk9LJjHQU8lNz1yHYpBSl+0PLdizsKGGO48eapUicLTKLh8blkHQU4j9X0zHYrBDCA0fPTgjMHHWi88OSYThALT6rk9LJjHQU8lNz1yHYpBSl+0PLdizsKGGO48eapUicLTKLh8blkHQU4j9X0zHYrBDCA0fPTgjMHHWi88OSYThALT6rk9LJjHQU8lNz1yHYpBSl+0PLdizsKGGO48eapUicLTKLh8blkHQU4j9X0zHYrBDCA0fPTgjMHHWi88OSYThALT6rk9LJjHQU8lNz1yHYpBSl+0PLdizsKGGO48eapUicLTKLh8blkHQU4j9X0zHYrBQ==');

/* ─── Solicitar permissão de notificação ───────────────── */
export async function solicitarPermissaoNotificacao() {
    if (!('Notification' in window)) {
        console.log('Notificações não suportadas neste navegador');
        return false;
    }

    if (Notification.permission === 'granted') {
        notifState.permissaoNotificacao = 'granted';
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        notifState.permissaoNotificacao = permission;
        return permission === 'granted';
    }

    return false;
}

/* ─── Mostrar notificação desktop ────────────────────────── */
function mostrarNotificacaoDesktop(lead_nome, mensagem) {
    if (notifState.permissaoNotificacao !== 'granted') return;

    const notif = new Notification(`💬 Nova mensagem de ${lead_nome}`, {
        body: mensagem.slice(0, 100) + (mensagem.length > 100 ? '...' : ''),
        icon: '/icon-whatsapp.png', // Opcional: adicione um ícone
        badge: '/badge-whatsapp.png', // Opcional
        tag: `whatsapp-${Date.now()}`,
        requireInteraction: false,
    });

    // Auto-fecha após 5 segundos
    setTimeout(() => notif.close(), 5000);
}

/* ─── Tocar som de notificação ───────────────────────────── */
function tocarSomNotificacao() {
    try {
        // Clona o áudio para permitir múltiplos toques simultâneos
        const audio = AUDIO_BEEP.cloneNode();
        audio.volume = 0.5;
        audio.play().catch(err => console.log('Não foi possível tocar o som:', err));
    } catch (err) {
        console.log('Erro ao tocar som:', err);
    }
}

/* ─── Incrementar contador de não lidas ──────────────────── */
export function marcarComoNaoLida(leadId) {
    if (!notifState.naolidas[leadId]) {
        notifState.naolidas[leadId] = 0;
    }
    notifState.naolidas[leadId]++;
}

/* ─── Marcar como lida (zerar contador) ──────────────────── */
export function marcarComoLida(leadId) {
    delete notifState.naolidas[leadId];
}

/* ─── Obter contador de não lidas ────────────────────────── */
export function getContadorNaoLidas(leadId) {
    return notifState.naolidas[leadId] || 0;
}

/* ─── Obter total de mensagens não lidas ─────────────────── */
export function getTotalNaoLidas() {
    return Object.values(notifState.naolidas).reduce((sum, count) => sum + count, 0);
}

/* ─── Iniciar monitoramento de mensagens recebidas ────────── */
export function iniciarMonitoramento(onNovaMensagem) {
    if (!supabase) {
        console.error('Supabase não configurado');
        return null;
    }

    // Armazena callback
    notifState.onNovaMensagem = onNovaMensagem;

    // Inscreve em todas as mensagens recebidas
    const channel = supabase
        .channel('notificacoes-whatsapp')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'atendimentos',
                filter: 'direcao=eq.recebido',
            },
            async (payload) => {
                const atendimento = payload.new;
                console.log('📩 Nova mensagem recebida:', atendimento);

                // Incrementa contador
                marcarComoNaoLida(atendimento.lead_id);

                // Busca info do lead para a notificação
                const { data: leadData } = await supabase
                    .from('leads')
                    .select('nome')
                    .eq('id', atendimento.lead_id)
                    .single();

                const leadNome = leadData?.nome || 'Lead';

                // Mostra notificação desktop
                mostrarNotificacaoDesktop(leadNome, atendimento.descricao);

                // Toca som
                tocarSomNotificacao();

                // Chama callback personalizado
                if (notifState.onNovaMensagem) {
                    notifState.onNovaMensagem({
                        ...atendimento,
                        lead_nome: leadNome,
                    });
                }
            }
        )
        .subscribe((status) => {
            console.log('📡 Status do monitoramento:', status);
        });

    notifState.channel = channel;
    return channel;
}

/* ─── Parar monitoramento ────────────────────────────────── */
export function pararMonitoramento() {
    if (notifState.channel) {
        notifState.channel.unsubscribe();
        notifState.channel = null;
    }
}

/* ─── Obter todos os contadores (para debug) ─────────────── */
export function getEstadoNotificacoes() {
    return {
        naolidas: { ...notifState.naolidas },
        total: getTotalNaoLidas(),
        permissao: notifState.permissaoNotificacao,
    };
}
