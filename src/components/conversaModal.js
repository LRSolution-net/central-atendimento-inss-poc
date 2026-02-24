/* ================================================================
   conversaModal.js
   Modal de conversa em etapas com:
   - Script predefinido por etapa (editável)
   - Botão "✨ Melhorar com IA" (Groq, gratuito)
   - Envio direto via Evolution API ou wa.me (fallback)
   - Histórico visual da conversa
================================================================ */

import { salvarAtendimento, buscarAtendimentos, inscreverMensagens } from '../services/atendimentosService.js';
import { atualizarStatusLead } from '../services/leadsAdminService.js';
import {
    enviarMensagem,
    melhorarComIA,
    gerarScriptEtapa,
    isEvolutionConfigurado,
    isMetaConfigurado,
    isGroqConfigurado,
} from '../services/mensagemService.js';
import { DOCS_POR_BENEFICIO } from './atendentePage.js';

const ETAPAS = [
    { id: 'abertura',      icone: '👋', titulo: 'Abertura',       descricao: 'Saudação inicial e apresentação' },
    { id: 'qualificacao',  icone: '🔍', titulo: 'Qualificação',   descricao: 'Entender a situação do lead' },
    { id: 'documentos',    icone: '📋', titulo: 'Documentos',     descricao: 'Solicitar documentos necessários' },
    { id: 'encerramento',  icone: '✅', titulo: 'Encerramento',   descricao: 'Finalizar e encaminhar ao especialista' },
];

/* Estado interno do modal */
const modal = {
    lead: null,
    profile: null,
    onClose: null,
    onLeadUpdated: null,
    etapaAtual: 0,
    // { etapa?, direcao, texto, canal?, ts }
    // direcao: 'enviado' | 'recebido'
    mensagens: [],
    enviando: false,
    melhorando: false,
    textos: {},     // { abertura: '...', qualificacao: '...', ... }
    docsEscolhidos: [],
    _channel: null, // Supabase Realtime subscription
};

let _root = null;

/* ─── Helpers ────────────────────────────────────────────── */
function benefLabel(b) {
    const map = {
        'aposentadoria': 'Aposentadoria', 'auxilio-doenca': 'Auxílio-doença',
        'bpc-loas': 'BPC/LOAS', 'beneficio-negado': 'Benefício Negado', 'outros': 'Outros',
    };
    return map[b] || b;
}

function chipCls(c) {
    const m = { Alta: 'chip-alta', Média: 'chip-media', Baixa: 'chip-baixa' };
    return `<span class="chip ${m[c] || 'chip-baixa'}">${c}</span>`;
}

function gerarTextoInicial(etapaId) {
    const lead = modal.lead;
    const docs  = modal.docsEscolhidos;
    return gerarScriptEtapa(etapaId, {
        nome:           lead.nome,
        beneficio:      lead.beneficio,
        situacao:       lead.situacao,
        classificacao:  lead.classificacao,
        observacoes:    lead.observacoes || '',
        documentos:     docs,
    });
}

/* ─── Templates ──────────────────────────────────────────── */
function tplCanalBadge() {
    if (isMetaConfigurado()) {
        return `<span class="canal-badge canal-meta">📱 Meta WhatsApp API — envio direto</span>`;
    }
    if (isEvolutionConfigurado()) {
        return `<span class="canal-badge canal-evolution">⚡ Evolution API — envio direto</span>`;
    }
    return `<span class="canal-badge canal-wame">📲 wa.me — abre WhatsApp</span>`;
}

function tplHistorico() {
    if (!modal.mensagens.length) {
        return `<div class="chat-vazio">As mensagens aparecerão aqui.</div>`;
    }
    return modal.mensagens.map(m => {
        const recebido  = m.direcao === 'recebido';
        const etapa     = ETAPAS.find(e => e.id === m.etapa);
        const hora      = new Date(m.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const canalIcon = m.canal === 'evolution' ? '⚡' : recebido ? '📩' : '📲';
        const cls       = recebido ? 'chat-bubble chat-bubble-recebido' : 'chat-bubble chat-bubble-enviado';
        const label     = recebido
            ? `${modal.lead?.nome || 'Lead'}`
            : `${etapa?.icone || ''} ${etapa?.titulo || 'Enviado'}`;
        return `
            <div class="${cls}">
                <div class="chat-bubble-meta">
                    <span>${label}</span>
                    <span class="chat-ts">${canalIcon} ${hora}</span>
                </div>
                <div class="chat-bubble-text">${m.texto.replace(/\n/g, '<br>')}</div>
            </div>`;
    }).join('');
}

function tplDocsSeletor() {
    const beneficio = modal.lead?.beneficio || 'outros';
    const lista = DOCS_POR_BENEFICIO[beneficio] || DOCS_POR_BENEFICIO['outros'];
    return `
        <div class="docs-seletor">
            <p class="docs-seletor-label">Selecione os documentos para incluir na mensagem:</p>
            <ul class="doc-list">
                ${lista.map((d, i) => `
                    <li class="doc-item">
                        <label>
                            <input type="checkbox" class="doc-check" data-i="${i}"
                                   ${modal.docsEscolhidos.includes(d) ? 'checked' : ''} />
                            ${d}
                        </label>
                    </li>`).join('')}
            </ul>
        </div>`;
}

function tplEtapas() {
    return ETAPAS.map((e, i) => {
        const enviada   = modal.mensagens.some(m => m.etapa === e.id);
        const ativa     = i === modal.etapaAtual;
        const passada   = i < modal.etapaAtual;
        let cls = 'etapa-item';
        if (ativa)   cls += ' etapa-ativa';
        if (passada) cls += ' etapa-passada';
        if (enviada) cls += ' etapa-enviada';

        return `
            <div class="${cls}" data-idx="${i}">
                <span class="etapa-icone">${enviada ? '✅' : e.icone}</span>
                <span class="etapa-titulo">${e.titulo}</span>
            </div>`;
    }).join('');
}

function tplEtapaAtual() {
    const etapa = ETAPAS[modal.etapaAtual];
    if (!etapa) return '';

    const texto  = modal.textos[etapa.id] ?? gerarTextoInicial(etapa.id);
    const jaEnv  = modal.mensagens.some(m => m.etapa === etapa.id);
    const ultimo = modal.etapaAtual === ETAPAS.length - 1;

    return `
        <div class="etapa-editor">
            <div class="etapa-editor-header">
                <span class="etapa-editor-titulo">${etapa.icone} ${etapa.titulo}</span>
                <span class="etapa-editor-desc">${etapa.descricao}</span>
            </div>

            ${etapa.id === 'documentos' ? tplDocsSeletor() : ''}

            <div class="editor-toolbar">
                ${isGroqConfigurado() ? `
                    <button id="btn-ia" class="btn-ia" ${modal.melhorando ? 'disabled' : ''}>
                        ${modal.melhorando ? '⏳ Gerando…' : '✨ Melhorar com IA'}
                    </button>` : `<span class="ia-hint">Configure VITE_GROQ_API_KEY para usar IA</span>`}
                <button id="btn-regenerar" class="btn-outline btn-sm" title="Restaurar script padrão">↺ Padrão</button>
            </div>

            <textarea id="editor-msg" class="editor-textarea" rows="7"
                      placeholder="Mensagem para enviar…">${texto}</textarea>

            <div class="etapa-acoes">
                ${modal.etapaAtual > 0 ? `<button id="btn-voltar" class="btn-outline">← Voltar</button>` : ''}
                <div style="display:flex;gap:8px;margin-left:auto">
                    ${jaEnv && !ultimo ? `<button id="btn-proxima" class="btn-outline">Próxima etapa →</button>` : ''}
                    <button id="btn-enviar" class="btn-enviar" ${modal.enviando ? 'disabled' : ''}>
                        ${modal.enviando ? '⏳ Enviando…' : jaEnv ? '↩ Reenviar' : isEvolutionConfigurado() ? '⚡ Enviar agora' : '📲 Abrir WhatsApp'}
                    </button>
                    ${ultimo && jaEnv ? `<button id="btn-finalizar" class="btn-atender">✅ Encerrar atendimento</button>` : ''}
                </div>
            </div>
        </div>`;
}

function tplModal() {
    const lead = modal.lead;
    const wpp  = String(lead.whatsapp || '').replace(/\D/g, '');

    return `
        <div class="modal-overlay" id="conversa-modal">
            <div class="modal-box modal-chat">
                <!-- Header -->
                <div class="modal-header">
                    <div>
                        <h3 class="modal-title">💬 Atendimento — ${lead.nome}</h3>
                        <p class="modal-sub">
                            ${benefLabel(lead.beneficio)} ·
                            ${chipCls(lead.classificacao)} ·
                            <a class="link-wpp" href="https://wa.me/${wpp}" target="_blank">+${wpp}</a>
                        </p>
                    </div>
                    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
                        ${tplCanalBadge()}
                        <button class="modal-close" id="conversa-fechar">✕</button>
                    </div>
                </div>

                <div class="chat-layout">
                    <!-- Painel esquerdo: etapas + histórico -->
                    <div class="chat-sidebar">
                        <div class="etapas-lista">${tplEtapas()}</div>
                        <div class="chat-historico" id="chat-hist">${tplHistorico()}</div>
                    </div>

                    <!-- Painel direito: editor da etapa atual -->
                    <div class="chat-editor" id="chat-editor">
                        ${tplEtapaAtual()}
                    </div>
                </div>
            </div>
        </div>`;
}

/* ─── Re-renders parciais ────────────────────────────────── */
function rerenderEditor() {
    const ed = _root?.querySelector('#chat-editor');
    if (ed) { ed.innerHTML = tplEtapaAtual(); bindEditorEvents(); }
    const hist = _root?.querySelector('#chat-hist');
    if (hist) { hist.innerHTML = tplHistorico(); hist.scrollTop = hist.scrollHeight; }
    const etapas = _root?.querySelector('.etapas-lista');
    if (etapas) etapas.innerHTML = tplEtapas();
}

/* ─── Event binding ──────────────────────────────────────── */
function bindEditorEvents() {
    const ed = _root?.querySelector('#chat-editor');
    if (!ed) return;

    ed.querySelector('#editor-msg')?.addEventListener('input', e => {
        const etapa = ETAPAS[modal.etapaAtual];
        modal.textos[etapa.id] = e.target.value;
    });

    ed.querySelector('#btn-ia')?.addEventListener('click', handleMelhorarIA);
    ed.querySelector('#btn-regenerar')?.addEventListener('click', () => {
        const etapa = ETAPAS[modal.etapaAtual];
        delete modal.textos[etapa.id];
        rerenderEditor();
    });

    ed.querySelector('#btn-enviar')?.addEventListener('click', handleEnviar);
    ed.querySelector('#btn-voltar')?.addEventListener('click', () => {
        if (modal.etapaAtual > 0) { modal.etapaAtual--; rerenderEditor(); }
    });
    ed.querySelector('#btn-proxima')?.addEventListener('click', () => {
        if (modal.etapaAtual < ETAPAS.length - 1) { modal.etapaAtual++; rerenderEditor(); }
    });
    ed.querySelector('#btn-finalizar')?.addEventListener('click', handleFinalizar);

    // Atualiza docs quando checks mudam (etapa documentos)
    ed.querySelectorAll('.doc-check').forEach(chk => {
        chk.addEventListener('change', () => {
            const beneficio = modal.lead?.beneficio || 'outros';
            const lista     = DOCS_POR_BENEFICIO[beneficio] || DOCS_POR_BENEFICIO['outros'];
            modal.docsEscolhidos = [...ed.querySelectorAll('.doc-check:checked')]
                .map(c => lista[Number(c.dataset.i)])
                .filter(Boolean);
            // Regenera texto com docs atualizados
            const etapa = ETAPAS[modal.etapaAtual];
            modal.textos[etapa.id] = gerarTextoInicial(etapa.id);
            const ta = ed.querySelector('#editor-msg');
            if (ta) ta.value = modal.textos[etapa.id];
        });
    });
}

function bindEvents() {
    _root?.querySelector('#conversa-fechar')?.addEventListener('click', fechar);
    _root?.querySelector('#conversa-modal')?.addEventListener('click', e => {
        if (e.target.id === 'conversa-modal') fechar();
    });
    bindEditorEvents();
}

/* ─── Handlers ───────────────────────────────────────────── */
async function handleMelhorarIA() {
    const etapa = ETAPAS[modal.etapaAtual];
    const ta    = _root?.querySelector('#editor-msg');
    const texto = ta?.value || '';

    modal.melhorando = true;
    rerenderEditor();

    try {
        const beneficio = modal.lead?.beneficio || 'outros';
        const docs = modal.docsEscolhidos;

        const resultado = await melhorarComIA({
            etapa:          etapa.id,
            nome:           modal.lead.nome,
            beneficio:      benefLabel(modal.lead.beneficio),
            situacao:       modal.lead.situacao,
            classificacao:  modal.lead.classificacao,
            observacoes:    modal.lead.observacoes || '',
            documentos:     docs,
            mensagemAtual:  texto,
        });

        modal.textos[etapa.id] = resultado;
    } catch (err) {
        alert(`Erro na IA: ${err.message}`);
    } finally {
        modal.melhorando = false;
        rerenderEditor();
    }
}

async function handleEnviar() {
    const etapa = ETAPAS[modal.etapaAtual];
    const ta    = _root?.querySelector('#editor-msg');
    const texto = (ta?.value || '').trim();

    if (!texto) { alert('Escreva a mensagem antes de enviar.'); return; }

    modal.enviando = true;
    rerenderEditor();

    try {
        const { canal } = await enviarMensagem(modal.lead.whatsapp, texto);

        modal.mensagens.push({
            etapa: etapa.id,
            texto,
            canal,
            sent: true,
            ts: new Date().toISOString(),
        });

        const numLead = String(modal.lead.whatsapp || '').replace(/\D/g, '');
        await salvarAtendimento({
            lead_id:     modal.lead.id,
            tipo:        'whatsapp',
            direcao:     'enviado',
            descricao:   `[${etapa.titulo}] ${texto}`,
            responsavel: modal.profile?.nome || '',
            numero_lead: numLead,
        });

        // Avança para próxima etapa automaticamente (se não for a última)
        if (modal.etapaAtual < ETAPAS.length - 1) {
            modal.etapaAtual++;
        }

    } catch (err) {
        alert(`Erro ao enviar: ${err.message}`);
    } finally {
        modal.enviando = false;
        rerenderEditor();
    }
}

async function handleFinalizar() {
    try {
        await atualizarStatusLead(modal.lead.id, 'qualificado');
        modal.lead.status_atendimento = 'qualificado';
        modal.onLeadUpdated?.(modal.lead);
        fechar();
    } catch (err) {
        alert(`Erro ao encerrar: ${err.message}`);
    }
}

/* ─── Histórico do banco ────────────────────────────────── */
async function carregarHistorico() {
    try {
        const rows = await buscarAtendimentos(modal.lead.id);
        modal.mensagens = rows.map(r => ({
            etapa:    ETAPAS.find(e => r.descricao?.startsWith(`[${e.titulo}]`))?.id || null,
            direcao:  r.direcao || 'enviado',
            texto:    r.direcao === 'recebido'
                        ? r.descricao
                        : r.descricao?.replace(/^\[.*?\]\s*/, '') || r.descricao,
            canal:    r.tipo === 'whatsapp_recebido' ? 'recebido' : 'enviado',
            ts:       r.created_at,
        }));
    } catch (_) {
        // Falha silenciosa — não bloqueia o modal
    }
    const hist = _root?.querySelector('#chat-hist');
    if (hist) { hist.innerHTML = tplHistorico(); hist.scrollTop = hist.scrollHeight; }
    const etapas = _root?.querySelector('.etapas-lista');
    if (etapas) etapas.innerHTML = tplEtapas();
}

/* ─── Realtime ───────────────────────────────────────────── */
function iniciarRealtime() {
    modal._channel = inscreverMensagens(modal.lead.id, (row) => {
        // Só adiciona se ainda não estiver na lista (evita duplicar o próprio envio)
        const jaExiste = modal.mensagens.some(
            m => m.ts === row.created_at && m.texto === row.descricao
        );
        if (jaExiste) return;

        modal.mensagens.push({
            etapa:    null,
            direcao:  row.direcao || 'recebido',
            texto:    row.descricao,
            canal:    row.tipo === 'whatsapp_recebido' ? 'recebido' : 'enviado',
            ts:       row.created_at,
        });

        const hist = _root?.querySelector('#chat-hist');
        if (hist) { hist.innerHTML = tplHistorico(); hist.scrollTop = hist.scrollHeight; }
    });
}

/* ─── Abrir / Fechar ─────────────────────────────────────── */
function fechar() {
    // Cancela subscription realtime
    if (modal._channel) {
        modal._channel.unsubscribe();
        modal._channel = null;
    }
    _root?.querySelector('#conversa-modal')?.remove();
    _root = null;
    modal.onClose?.();
}

export function abrirConversaModal({ lead, profile, container, onClose, onLeadUpdated }) {
    // Inicializa estado
    modal.lead           = lead;
    modal.profile        = profile;
    modal.onClose        = onClose;
    modal.onLeadUpdated  = onLeadUpdated;
    modal.etapaAtual     = 0;
    modal.mensagens      = [];
    modal.enviando       = false;
    modal.melhorando     = false;
    modal.textos         = {};

    // Pré-seleciona todos os docs da etapa documentos
    const docs = DOCS_POR_BENEFICIO[lead.beneficio] || DOCS_POR_BENEFICIO['outros'];
    modal.docsEscolhidos = [...docs];

    // Renderiza
    _root = container;
    const tmp = document.createElement('div');
    tmp.innerHTML = tplModal();
    container.appendChild(tmp.firstElementChild);

    bindEvents();

    // Carrega histórico do banco e inicia realtime em paralelo
    carregarHistorico();
    iniciarRealtime();
}
