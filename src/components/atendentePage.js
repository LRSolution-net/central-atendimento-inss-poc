import { buscarLeads, atualizarStatusLead } from '../services/leadsAdminService.js';
import { salvarAtendimento } from '../services/atendimentosService.js';
import { logout } from '../services/authService.js';
import { abrirConversaModal } from './conversaModal.js';

export const DOCS_POR_BENEFICIO = {
    'aposentadoria': [
        'RG e CPF (originais e cópias)',
        'Carteira de Trabalho (CTPS) — todas as folhas utilizadas',
        'Extrato do CNIS (Cadastro Nacional de Informações Sociais)',
        'PIS/PASEP',
        'Comprovante de residência atualizado',
        'Certidão de nascimento ou casamento',
    ],
    'auxilio-doenca': [
        'RG e CPF',
        'Laudo médico atualizado (com CID, assinado e carimbado)',
        'Atestados e exames recentes',
        'Extrato do CNIS',
        'PIS/PASEP',
        'Comprovante de residência',
    ],
    'bpc-loas': [
        'RG e CPF de todos os membros da família',
        'Comprovante de residência atualizado',
        'Declaração de composição e renda familiar',
        'Laudo médico (para pessoa com deficiência — com CID)',
        'Certidão de nascimento ou casamento',
        'Número do NIS/CADUNICO (se possuir)',
    ],
    'beneficio-negado': [
        'RG e CPF',
        'Carta de indeferimento do INSS',
        'Todos os documentos do pedido original',
        'Extrato do CNIS',
        'Laudos ou documentos adicionais que embasem o recurso',
        'Comprovante de residência',
    ],
    'outros': [
        'RG e CPF',
        'Extrato do CNIS',
        'Comprovante de residência',
        'Documentos específicos conforme orientação do especialista',
    ],
};

const BENEFICIO_LABELS = {
    'aposentadoria': 'Aposentadoria',
    'auxilio-doenca': 'Auxílio-doença',
    'bpc-loas': 'BPC/LOAS',
    'beneficio-negado': 'Benefício Negado',
    'outros': 'Outros',
};

const state = {
    leads: [],
    loading: false,
    erro: '',
    filtroStatus: 'novo',
    modal: null, // { lead }
};

let _container = null;
let _profile = null;

/* ─── Helpers ────────────────────────────────────────────── */
function formatDate(iso) {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function stripPlus(w) { return String(w || '').replace(/^\+/, ''); }

function chipClass(c) {
    const map = { Alta: 'chip-alta', Média: 'chip-media', Baixa: 'chip-baixa' };
    return `<span class="chip ${map[c] || 'chip-baixa'}">${c}</span>`;
}

function getFiltered() {
    return state.leads.filter(l => {
        if (state.filtroStatus && l.status_atendimento !== state.filtroStatus) return false;
        return true;
    });
}

/* ─── Templates ──────────────────────────────────────────── */
function tplHeader() {
    return `
        <header class="ad-header">
            <div class="ad-header-left">
                <span class="ad-icon">📋</span>
                <div>
                    <h1 class="ad-title">Atendimento Inicial</h1>
                    <span class="ad-sub">Olá, ${_profile?.nome || 'Atendente'} · Usuário Comum</span>
                </div>
            </div>
            <button id="btn-logout" class="btn-outline btn-sm">Sair</button>
        </header>`;
}

function tplFiltros() {
    const opts = [
        ['novo', 'Novos'],
        ['em-contato', 'Em contato'],
        ['qualificado', 'Qualificado'],
        ['', 'Todos'],
    ];
    return `
        <div class="ad-filtros">
            ${opts.map(([v, l]) =>
                `<button class="tab-pill ${state.filtroStatus === v ? 'tab-pill-active' : ''}"
                    data-status="${v}">${l}</button>`
            ).join('')}
            <button id="btn-refresh" class="btn-outline" style="margin-left:auto">↻ Atualizar</button>
        </div>`;
}

function tplLeadsComum(leads) {
    if (state.loading) return `<div class="ad-feedback ad-loading">Carregando leads…</div>`;
    if (state.erro)    return `<div class="ad-feedback ad-erro">${state.erro}</div>`;
    if (!leads.length) return `<div class="ad-feedback ad-vazio">Nenhum lead encontrado.</div>`;

    const rows = leads.map(lead => {
        const benefLabel = BENEFICIO_LABELS[lead.beneficio] || lead.beneficio;
        const pode = ['novo', 'em-contato'].includes(lead.status_atendimento);

        return `
            <tr>
                <td>
                    <div class="lead-nome">${lead.nome}</div>
                    <div class="lead-detalhe">${lead.cidade} · ${lead.idade} anos</div>
                    ${lead.observacoes ? `<div class="lead-obs">${lead.observacoes}</div>` : ''}
                </td>
                <td>
                    <a class="link-wpp" href="https://wa.me/${stripPlus(lead.whatsapp)}"
                       target="_blank" rel="noopener noreferrer">
                        ${lead.whatsapp}
                    </a>
                </td>
                <td>${benefLabel}</td>
                <td>${chipClass(lead.classificacao)}</td>
                <td><span class="badge badge-${lead.status_atendimento}">${lead.status_atendimento.replace('-',' ')}</span></td>
                <td class="td-data">${formatDate(lead.created_at)}</td>
                <td>
                    ${pode ? `
                        <button class="btn-docs"
                            data-id="${lead.id}"
                            data-nome="${lead.nome}"
                            data-wpp="${stripPlus(lead.whatsapp)}"
                            data-beneficio="${lead.beneficio}"
                            data-beneflabel="${benefLabel}">
                            📄 Solicitar docs
                        </button>` : '<span class="score-badge">—</span>'}
                </td>
            </tr>`;
    }).join('');

    return `
        <div class="table-wrap">
            <table class="leads-table">
                <thead><tr>
                    <th>Lead</th><th>WhatsApp</th><th>Benefício</th>
                    <th>Prioridade</th><th>Status</th><th>Data</th><th>Ação</th>
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
}

function tplModal(lead) {
    const docs = DOCS_POR_BENEFICIO[lead.beneficio] || DOCS_POR_BENEFICIO['outros'];
    const benefLabel = BENEFICIO_LABELS[lead.beneficio] || lead.beneficio;
    const docList = docs.map((d, i) =>
        `<li class="doc-item">
            <label><input type="checkbox" class="doc-check" data-i="${i}" checked /> ${d}</label>
        </li>`
    ).join('');

    return `
        <div class="modal-overlay" id="modal-docs">
            <div class="modal-box">
                <div class="modal-header">
                    <div>
                        <h3 class="modal-title">Solicitar Documentos</h3>
                        <p class="modal-sub">${lead.nome} · ${benefLabel}</p>
                    </div>
                    <button class="modal-close" id="modal-close">✕</button>
                </div>

                <p class="modal-info">
                    Selecione os documentos necessários. Será enviada uma mensagem no WhatsApp
                    e o lead será encaminhado ao especialista.
                </p>

                <ul class="doc-list" id="doc-list">${docList}</ul>

                <div class="modal-footer">
                    <button id="modal-cancelar" class="btn-outline">Cancelar</button>
                    <button id="modal-confirmar" class="btn-atender"
                        data-id="${lead.id}"
                        data-nome="${lead.nome}"
                        data-wpp="${stripPlus(lead.whatsapp)}"
                        data-beneflabel="${benefLabel}">
                        📲 Enviar por WhatsApp e encaminhar ao especialista
                    </button>
                </div>
            </div>
        </div>`;
}

function tplPage() {
    const leads = getFiltered();
    return `
        <div class="ad-layout">
            ${tplHeader()}
            <div class="ad-info-bar">
                <span>👤 Seu perfil permite realizar o atendimento inicial: solicitar documentos e encaminhar leads ao especialista.</span>
            </div>
            ${tplFiltros()}
            <section class="ad-table-section">
                <div class="ad-table-head">
                    <h2>Leads <span class="count-badge">${leads.length}</span></h2>
                </div>
                ${tplLeadsComum(leads)}
            </section>
            ${state.modal ? tplModal(state.modal) : ''}
        </div>`;
}

/* ─── Re-render ──────────────────────────────────────────── */
function rerenderTable() {
    const section = _container?.querySelector('.ad-table-section');
    if (!section) return;
    const leads = getFiltered();
    section.querySelector('h2').innerHTML = `Leads <span class="count-badge">${leads.length}</span>`;
    const old = section.querySelector('.table-wrap, .ad-feedback');
    const html = tplLeadsComum(leads);
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const novo = tmp.firstElementChild;
    if (old && novo) old.replaceWith(novo);
    else if (novo) section.appendChild(novo);
    bindTableEvents();
}

function rerenderModal() {
    let existing = _container.querySelector('#modal-docs');
    if (existing) existing.remove();
    if (state.modal) {
        const tmp = document.createElement('div');
        tmp.innerHTML = tplModal(state.modal);
        _container.querySelector('.ad-layout').appendChild(tmp.firstElementChild);
        bindModalEvents();
    }
}

function rerender() {
    if (!_container) return;
    _container.innerHTML = tplPage();
    bindEvents();
}

/* ─── Events ─────────────────────────────────────────────── */
function bindTableEvents() {
    _container.querySelectorAll('.btn-docs').forEach(btn => {
        btn.addEventListener('click', () => {
            const lead = state.leads.find(l => l.id === btn.dataset.id);
            if (!lead) return;
            abrirConversaModal({
                lead,
                profile: _profile,
                container: _container,
                onLeadUpdated: (updated) => {
                    const idx = state.leads.findIndex(l => l.id === updated.id);
                    if (idx !== -1) state.leads[idx] = { ...state.leads[idx], ...updated };
                    rerenderTable();
                },
                onClose: () => rerenderTable(),
            });
        });
    });
}

function bindModalEvents() {
    _container.querySelector('#modal-close')?.addEventListener('click', fecharModal);
    _container.querySelector('#modal-cancelar')?.addEventListener('click', fecharModal);
    _container.querySelector('#modal-overlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'modal-docs') fecharModal();
    });
    _container.querySelector('#modal-confirmar')?.addEventListener('click', handleConfirmarDocs);
}

function fecharModal() {
    state.modal = null;
    rerenderModal();
}

function bindEvents() {
    _container.querySelector('#btn-logout')?.addEventListener('click', async () => {
        await logout();
        window.location.reload();
    });

    _container.querySelector('#btn-refresh')?.addEventListener('click', loadLeads);

    _container.querySelectorAll('.tab-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            state.filtroStatus = btn.dataset.status;
            _container.querySelectorAll('.tab-pill').forEach(b =>
                b.classList.toggle('tab-pill-active', b.dataset.status === state.filtroStatus)
            );
            rerenderTable();
        });
    });

    bindTableEvents();
}

/* ─── Handlers ───────────────────────────────────────────── */
async function handleConfirmarDocs(e) {
    const btn = e.currentTarget;
    const { id, nome, wpp, beneflabel } = btn.dataset;

    const checks = [..._container.querySelectorAll('.doc-check:checked')];
    const docsParaEnviar = checks.map(c => {
        const i = Number(c.dataset.i);
        const beneficio = state.modal?.beneficio || 'outros';
        return (DOCS_POR_BENEFICIO[beneficio] || DOCS_POR_BENEFICIO['outros'])[i];
    }).filter(Boolean);

    if (!docsParaEnviar.length) {
        alert('Selecione ao menos um documento.'); return;
    }

    btn.disabled = true; btn.textContent = 'Aguarde…';

    const msg = [
        `Olá, ${nome}! 👋`,
        `Aqui é do escritório especializado em INSS.`,
        `Para dar entrada no seu processo de *${beneflabel}*, precisamos dos seguintes documentos:`,
        '',
        ...docsParaEnviar.map((d, i) => `${i + 1}. ${d}`),
        '',
        `Assim que reunir os documentos, entre em contato para agendar o atendimento com nosso especialista. 📋`,
    ].join('\n');

    try {
        await salvarAtendimento({
            lead_id: id,
            tipo: 'whatsapp',
            descricao: `Documentos solicitados: ${docsParaEnviar.join(', ')}. Lead encaminhado para especialista.`,
            responsavel: _profile?.nome || '',
        });

        await atualizarStatusLead(id, 'qualificado');

        const lead = state.leads.find(l => l.id === id);
        if (lead) lead.status_atendimento = 'qualificado';

        state.modal = null;

        window.open(`https://wa.me/${wpp}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');

        rerenderModal();
        rerenderTable();
    } catch (err) {
        alert(`Erro: ${err.message}`);
        btn.disabled = false;
        btn.textContent = '📲 Enviar por WhatsApp e encaminhar ao especialista';
    }
}

async function loadLeads() {
    state.loading = true;
    state.erro = '';
    rerenderTable();
    try {
        state.leads = await buscarLeads();
    } catch (err) {
        state.erro = err.message;
    } finally {
        state.loading = false;
        rerenderTable();
    }
}

/* ─── Entry point ────────────────────────────────────────── */
export function renderAtendentePage(container, profile) {
    _container = container;
    _profile = profile;
    rerender();
    loadLeads();
}
