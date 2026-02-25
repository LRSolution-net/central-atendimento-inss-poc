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
    mostrarWhatsAppPreview: false, // Toggle para preview do WhatsApp
    whatsappWindow: null, // Referência à janela popup do WhatsApp
};

let _root = null;

/* ─── Helpers ────────────────────────────────────────────── */
function getNumeroEscritorio() {
    return (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '');
}

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
    const wppAberto = modal.whatsappWindow && !modal.whatsappWindow.closed;
    const numeroEscritorio = getNumeroEscritorio();
    const numeroFormatado = numeroEscritorio 
        ? `+${numeroEscritorio.slice(0,2)} (${numeroEscritorio.slice(2,4)}) ${numeroEscritorio.slice(4,9)}-${numeroEscritorio.slice(9)}`
        : 'não configurado';
    
    if (isMetaConfigurado()) {
        return `
            <span class="canal-badge canal-meta">
                📱 Meta WhatsApp API — envio 100% automático
                <span style="margin-left:8px;font-size:11px;opacity:0.8">${numeroFormatado}</span>
            </span>`;
    }
    if (isEvolutionConfigurado()) {
        return `<span class="canal-badge canal-evolution">⚡ Evolution API — envio 100% automático</span>`;
    }
    return `
        <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;align-items:center;gap:8px;justify-content:space-between">
                <span class="canal-badge canal-wame">
                    📲 WhatsApp Web — ${wppAberto ? 'Aberto' : 'modo manual'}
                    <span style="margin-left:8px;font-size:11px;opacity:0.8">${numeroFormatado}</span>
                </span>
                ${!wppAberto ? `<button id="btn-abrir-wpp-persistente" class="btn-outline btn-sm">🔗 Abrir WhatsApp</button>` : ''}
            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#fef3c7;border:1px solid #fbbf24;border-radius:6px">
                <span style="font-size:12px;color:#92400e">
                    🚀 <strong>Quer envio automático?</strong> Configure Meta WhatsApp API (grátis)
                </span>
                <button id="btn-ver-guia" class="btn-outline btn-sm" style="white-space:nowrap">📖 Ver guia</button>
            </div>
        </div>
    `;
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

function tplWhatsAppPreview(texto) {
    const lead = modal.lead;
    const formatado = texto.replace(/\*([^*]+)\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
    return `
        <div class="whatsapp-preview-container">
            <div class="whatsapp-header">
                <div class="whatsapp-avatar">👤</div>
                <div class="whatsapp-info">
                    <div class="whatsapp-name">${lead.nome}</div>
                    <div class="whatsapp-status">online</div>
                </div>
            </div>
            <div class="whatsapp-chat-bg">
                <div class="whatsapp-message-sent">
                    <div class="whatsapp-message-content">${formatado}</div>
                    <div class="whatsapp-message-time">${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</div>
                </div>
            </div>
            <div class="whatsapp-preview-actions">
                <button id="btn-copiar-msg" class="btn-outline btn-sm" title="Copiar mensagem">📋 Copiar</button>
                <button id="btn-wpp-popup" class="btn-outline btn-sm" title="Abrir em popup">🔗 Popup</button>
                <button id="btn-fechar-preview" class="btn-outline btn-sm">← Voltar</button>
            </div>
        </div>
    `;
}

function tplEtapaAtual() {
    const etapa = ETAPAS[modal.etapaAtual];
    if (!etapa) return '';

    const texto  = modal.textos[etapa.id] ?? gerarTextoInicial(etapa.id);
    const jaEnv  = modal.mensagens.some(m => m.etapa === etapa.id);
    const ultimo = modal.etapaAtual === ETAPAS.length - 1;

    // Se preview ativo, mostra apenas o preview
    if (modal.mostrarWhatsAppPreview) {
        return tplWhatsAppPreview(texto);
    }

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
                <button id="btn-preview-wpp" class="btn-outline btn-sm" title="Ver preview do WhatsApp">👁️ Preview</button>
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
                        <button class="modal-close" id="conversa-fechar">✕</button>
                    </div>
                </div>
                
                <!-- Badge de status do canal -->
                <div style="padding:12px 20px;background:#f9fafb;border-bottom:1px solid #e5e7eb">
                    ${tplCanalBadge()}
                </div>                
                ${!isMetaConfigurado() && !isEvolutionConfigurado() ? `
                <div style="padding:8px 20px;background:#fffbeb;border-bottom:1px solid #fbbf24">
                    <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#92400e">
                        <span>💡</span>
                        <span>
                            <strong>WhatsApp Web:</strong> 
                            ${getNumeroEscritorio() 
                                ? `Abre com número do ESCRITÓRIO (+${getNumeroEscritorio()}) para conversar com <strong>${lead.nome}</strong> (+${wpp})` 
                                : '<span style="color:#dc2626"><strong>ATENÇÃO:</strong> Configure VITE_WHATSAPP_NUMBER no .env</span>'}
                        </span>
                    </div>
                </div>
                ` : ''}
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
    // Atualiza badge do canal
    const badgeContainer = _root?.querySelector('[style*="padding:12px 20px"]');
    if (badgeContainer) {
        badgeContainer.innerHTML = tplCanalBadge();
        // Re-bind evento do botão de abrir WhatsApp persistente
        badgeContainer.querySelector('#btn-abrir-wpp-persistente')?.addEventListener('click', () => {
            abrirWhatsAppPersistente();
        });
    }
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
    
    // Preview do WhatsApp
    ed.querySelector('#btn-preview-wpp')?.addEventListener('click', () => {
        const etapa = ETAPAS[modal.etapaAtual];
        const ta = ed.querySelector('#editor-msg');
        if (ta) modal.textos[etapa.id] = ta.value;
        modal.mostrarWhatsAppPreview = true;
        rerenderEditor();
    });
    
    ed.querySelector('#btn-fechar-preview')?.addEventListener('click', () => {
        modal.mostrarWhatsAppPreview = false;
        rerenderEditor();
    });
    
    ed.querySelector('#btn-copiar-msg')?.addEventListener('click', () => {
        const etapa = ETAPAS[modal.etapaAtual];
        const texto = modal.textos[etapa.id] ?? gerarTextoInicial(etapa.id);
        navigator.clipboard.writeText(texto).then(() => {
            alert('✅ Mensagem copiada para a área de transferência!');
        });
    });
    
    ed.querySelector('#btn-wpp-popup')?.addEventListener('click', () => {
        abrirWhatsAppLadoALado();
    });
    
    _root?.querySelector('#btn-abrir-wpp-persistente')?.addEventListener('click', () => {
        abrirWhatsAppPersistente();
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

function abrirWhatsAppPersistente() {
    try {
        // Usa o número do escritório (Meta WhatsApp Business)
        const numero = getNumeroEscritorio();
        
        if (!numero || numero.length < 10) {
            alert('⚠️ Configure VITE_WHATSAPP_NUMBER no arquivo .env com o número do escritório cadastrado na Meta.');
            return;
        }
        
        // Garante código do país (55 para Brasil)
        const numeroCompleto = numero.startsWith('55') ? numero : `55${numero}`;
        const numeroFormatado = `+${numeroCompleto.slice(0,2)} (${numeroCompleto.slice(2,4)}) ${numeroCompleto.slice(4,9)}-${numeroCompleto.slice(9)}`;
        
        // Info: Mostra que vai usar número do escritório
        console.log(`📱 Abrindo WhatsApp Web com número do escritório ${numeroFormatado} para conversar com ${modal.lead.nome}`);
        
        const url = `https://web.whatsapp.com/send?phone=${numeroCompleto}`;
        
        // Calcula posição: lado direito da tela
        const largura = 500;
        const altura = window.screen.height - 100;
        const esquerda = window.screen.width - largura - 20;
        const topo = 50;
        
        if (modal.whatsappWindow && !modal.whatsappWindow.closed) {
            modal.whatsappWindow.focus();
        } else {
            modal.whatsappWindow = window.open(
                url,
                'WhatsAppWeb',
                `width=${largura},height=${altura},left=${esquerda},top=${topo},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
            );
            
            // Detecta se popup foi bloqueado
            if (!modal.whatsappWindow || modal.whatsappWindow.closed || typeof modal.whatsappWindow.closed === 'undefined') {
                // Popup bloqueado - abre em nova aba
                alert('⚠️ Popup bloqueado! Abrindo em nova aba...');
                window.open(url, '_blank', 'noopener,noreferrer');
            } else {
                // Atualiza badge quando janela fechar
                const checkClosed = setInterval(() => {
                    if (modal.whatsappWindow && modal.whatsappWindow.closed) {
                        clearInterval(checkClosed);
                        rerenderEditor();
                    }
                }, 1000);
            }
        }
        
        rerenderEditor();
    } catch (err) {
        console.error('Erro ao abrir WhatsApp:', err);
        alert(`❌ Erro ao abrir WhatsApp: ${err.message}`);
    }
}

function abrirWhatsAppLadoALado() {
    try {
        const etapa = ETAPAS[modal.etapaAtual];
        const texto = modal.textos[etapa.id] ?? gerarTextoInicial(etapa.id);
        
        // Usa o número do escritório (Meta WhatsApp Business)
        const numero = getNumeroEscritorio();
        
        if (!numero || numero.length < 10) {
            alert('⚠️ Configure VITE_WHATSAPP_NUMBER no arquivo .env com o número do escritório cadastrado na Meta.');
            return;
        }
        
        // Garante código do país (55 para Brasil)
        const numeroCompleto = numero.startsWith('55') ? numero : `55${numero}`;
        const numeroFormatado = `+${numeroCompleto.slice(0,2)} (${numeroCompleto.slice(2,4)}) ${numeroCompleto.slice(4,9)}-${numeroCompleto.slice(9)}`;
        const leadWpp = String(modal.lead.whatsapp || '').replace(/\D/g, '');
        const leadFormatado = `+${leadWpp}`;
        
        // Info: Explica o fluxo
        console.log(`📱 Abrindo WhatsApp Web:`);
        console.log(`   → Seu número: ${numeroFormatado}`);
        console.log(`   → Para falar com: ${modal.lead.nome} (${leadFormatado})`);
        console.log(`   → Mensagem pré-escrita: "${texto.substring(0, 50)}..."`);
        
        const url = `https://web.whatsapp.com/send?phone=${numeroCompleto}&text=${encodeURIComponent(texto)}`;
        
        // Mesmas dimensões do persistente
        const largura = 500;
        const altura = window.screen.height - 100;
        const esquerda = window.screen.width - largura - 20;
        const topo = 50;
        
        if (modal.whatsappWindow && !modal.whatsappWindow.closed) {
            try {
                modal.whatsappWindow.location.href = url;
                modal.whatsappWindow.focus();
            } catch (err) {
                // Janela foi fechada ou bloqueada - abre nova
                modal.whatsappWindow = window.open(url, 'WhatsAppWeb', 
                    `width=${largura},height=${altura},left=${esquerda},top=${topo},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`);
            }
        } else {
            modal.whatsappWindow = window.open(
                url,
                'WhatsAppWeb',
                `width=${largura},height=${altura},left=${esquerda},top=${topo},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
            );
            
            // Detecta se popup foi bloqueado
            if (!modal.whatsappWindow || modal.whatsappWindow.closed || typeof modal.whatsappWindow.closed === 'undefined') {
                // Popup bloqueado - abre em nova aba
                alert('⚠️ Popup bloqueado! Abrindo WhatsApp em nova aba...\n\nDica: Permita popups para este site para melhor experiência.');
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        }
        
        rerenderEditor();
    } catch (err) {
        console.error('Erro ao abrir WhatsApp:', err);
        alert(`❌ Erro ao abrir WhatsApp: ${err.message}\n\nTentando abrir em nova aba...`);
        // Fallback: abre em nova aba
        const numero = getNumeroEscritorio();
        const numeroCompleto = numero.startsWith('55') ? numero : `55${numero}`;
        const etapa = ETAPAS[modal.etapaAtual];
        const texto = modal.textos[etapa.id] ?? gerarTextoInicial(etapa.id);
        window.open(`https://wa.me/${numeroCompleto}?text=${encodeURIComponent(texto)}`, '_blank');
    }
}

function mostrarGuiaAPI() {
    const guiaHTML = `
        <div class="modal-overlay" id="guia-api-modal" style="z-index:10000">
            <div class="modal-box" style="max-width:700px;max-height:90vh;overflow-y:auto">
                <div class="modal-header">
                    <h3 class="modal-title">🚀 Como Configurar WhatsApp Business API (Grátis)</h3>
                    <button class="modal-close" id="fechar-guia">✕</button>
                </div>
                <div style="padding:20px">
                    <div style="background:#dbeafe;border-left:4px solid #3b82f6;padding:12px;border-radius:6px;margin-bottom:20px">
                        <strong>✅ Por que usar?</strong>
                        <ul style="margin:8px 0 0 20px;font-size:13px">
                            <li>GRÁTIS: 1000 conversas/mês</li>
                            <li>100% Automático: sem abrir navegador</li>
                            <li>API Oficial da Meta/Facebook</li>
                        </ul>
                    </div>
                    
                    <h4 style="margin:16px 0 8px">1️⃣ Crie App no Facebook</h4>
                    <ol style="margin:0 0 16px 20px;font-size:13px;line-height:1.6">
                        <li>Acesse: <a href="https://developers.facebook.com/apps/create" target="_blank" style="color:#3b82f6">developers.facebook.com/apps/create</a></li>
                        <li>Clique em <strong>"Create App"</strong> → tipo <strong>"Business"</strong></li>
                        <li>Nome: "Central Atendimento INSS"</li>
                    </ol>
                    
                    <h4 style="margin:16px 0 8px">2️⃣ Adicione WhatsApp</h4>
                    <ol style="margin:0 0 16px 20px;font-size:13px;line-height:1.6">
                        <li>No dashboard do app, procure <strong>"WhatsApp"</strong></li>
                        <li>Clique em <strong>"Set Up"</strong></li>
                    </ol>
                    
                    <h4 style="margin:16px 0 8px">3️⃣ Copie as Credenciais</h4>
                    <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:12px;border-radius:6px;margin-bottom:16px;font-family:monospace;font-size:12px">
                        <div>📞 <strong>Phone Number ID</strong>: 123456789012345</div>
                        <div style="margin-top:8px">🔑 <strong>Access Token</strong>: EAABsbCS1iHg...</div>
                    </div>
                    
                    <h4 style="margin:16px 0 8px">4️⃣ Configure no Supabase</h4>
                    <ol style="margin:0 0 16px 20px;font-size:13px;line-height:1.6">
                        <li>Acesse: <a href="https://supabase.com/dashboard" target="_blank" style="color:#3b82f6">supabase.com/dashboard</a></li>
                        <li>Vá em <strong>Edge Functions → Secrets</strong></li>
                        <li>Adicione:
                            <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:8px;border-radius:4px;margin-top:6px;font-family:monospace;font-size:11px">
                                META_WA_TOKEN=seu_token_aqui<br>
                                META_WA_PHONE_ID=seu_phone_id_aqui
                            </div>
                        </li>
                    </ol>
                    
                    <h4 style="margin:16px 0 8px">5️⃣ Ative no Sistema</h4>
                    <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:12px;border-radius:6px;margin-bottom:16px;font-family:monospace;font-size:12px">
                        No arquivo <strong>.env</strong>, mude:<br>
                        <span style="color:#dc2626">VITE_META_WA_ENABLED=false</span> →
                        <span style="color:#16a34a">VITE_META_WA_ENABLED=true</span>
                    </div>
                    
                    <div style="background:#dcfce7;border-left:4px solid #16a34a;padding:12px;border-radius:6px;margin-top:20px">
                        <strong>✨ Pronto!</strong> Reinicie com <code>npm run dev</code> e clique em "⚡ Enviar agora"
                    </div>
                    
                    <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
                        📚 Documentação completa: <strong>CONFIGURAR_WHATSAPP.md</strong> na raiz do projeto
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const tmp = document.createElement('div');
    tmp.innerHTML = guiaHTML;
    document.body.appendChild(tmp.firstElementChild);
    
    document.getElementById('fechar-guia').addEventListener('click', () => {
        document.getElementById('guia-api-modal').remove();
    });
    
    document.getElementById('guia-api-modal').addEventListener('click', (e) => {
        if (e.target.id === 'guia-api-modal') {
            document.getElementById('guia-api-modal').remove();
        }
    });
}

function bindEvents() {
    _root?.querySelector('#conversa-fechar')?.addEventListener('click', fechar);
    _root?.querySelector('#conversa-modal')?.addEventListener('click', e => {
        if (e.target.id === 'conversa-modal') fechar();
    });
    _root?.querySelector('#btn-abrir-wpp-persistente')?.addEventListener('click', () => {
        abrirWhatsAppPersistente();
    });
    _root?.querySelector('#btn-ver-guia')?.addEventListener('click', () => {
        mostrarGuiaAPI();
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

        // Modal WhatsApp Web abre automaticamente quando canal é wame/wame-fallback
        // (não precisa mais chamar abrirWhatsAppLadoALado)

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
        
        // Se enviou via Evolution/Meta, mostra feedback
        if (canal !== 'wame') {
            const msg = canal === 'meta' ? '✅ Enviado via Meta WhatsApp!' : '✅ Enviado via Evolution API!';
            const toast = document.createElement('div');
            toast.className = 'toast-success';
            toast.textContent = msg;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
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
