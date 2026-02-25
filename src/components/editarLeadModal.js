import { registrarAlteracoes, buscarHistoricoLead } from '../services/historicoService.js';
import { supabase } from '../config/supabase.js';

const BENEFICIOS = {
    'aposentadoria': 'Aposentadoria',
    'auxilio-doenca': 'Auxílio-doença',
    'bpc-loas': 'BPC/LOAS',
    'beneficio-negado': 'Benefício negado',
    'outros': 'Outros'
};

const SITUACOES = {
    'primeiro-pedido': 'Primeiro pedido',
    'em-analise': 'Em análise no INSS',
    'indeferido': 'Indeferido',
    'cessado': 'Benefício cessado'
};

/**
 * Abre modal de edição de lead
 */
export function abrirModalEdicao({ lead, profile, onSaved, onClose }) {
    const overlay = document.createElement('div');
    overlay.id = 'modal-edicao-overlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = renderModalEdicao(lead);
    
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // Event listeners
    overlay.querySelector('.modal-close')?.addEventListener('click', () => fecharModal(overlay, onClose));
    overlay.querySelector('#btn-cancelar-edicao')?.addEventListener('click', () => fecharModal(overlay, onClose));
    overlay.querySelector('#btn-salvar-edicao')?.addEventListener('click', () => salvarEdicao(lead, profile, overlay, onSaved, onClose));
    overlay.querySelector('#btn-ver-historico')?.addEventListener('click', () => toggleHistorico(lead.id));
    
    // Fechar ao clicar fora
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) fecharModal(overlay, onClose);
    });
}

function renderModalEdicao(lead) {
    return `
        <div class="modal-content modal-edicao">
            <div class="modal-header">
                <h2>📝 Editar Lead</h2>
                <button class="modal-close" title="Fechar">✕</button>
            </div>
            
            <form id="form-edicao-lead" class="modal-body">
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-nome">Nome completo *</label>
                        <input type="text" id="edit-nome" value="${lead.nome}" required />
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-whatsapp">WhatsApp *</label>
                        <input type="text" id="edit-whatsapp" value="${lead.whatsapp}" required />
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-idade">Idade *</label>
                        <input type="number" id="edit-idade" value="${lead.idade}" min="0" max="120" required />
                    </div>

                    <div class="form-group">
                        <label for="edit-sexo">Sexo *</label>
                        <select id="edit-sexo" required>
                            <option value="">Selecione</option>
                            <option value="masculino" ${lead.sexo === 'masculino' ? 'selected' : ''}>Masculino</option>
                            <option value="feminino" ${lead.sexo === 'feminino' ? 'selected' : ''}>Feminino</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-cidade">Cidade *</label>
                        <input type="text" id="edit-cidade" value="${lead.cidade}" required />
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-beneficio">Benefício desejado *</label>
                        <select id="edit-beneficio" required>
                            ${Object.entries(BENEFICIOS).map(([val, label]) => 
                                `<option value="${val}" ${lead.beneficio === val ? 'selected' : ''}>${label}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-situacao">Situação atual *</label>
                        <select id="edit-situacao" required>
                            ${Object.entries(SITUACOES).map(([val, label]) => 
                                `<option value="${val}" ${lead.situacao === val ? 'selected' : ''}>${label}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-contribuicao">Anos de contribuição</label>
                        <input type="number" id="edit-contribuicao" value="${lead.contribuicao_anos || 0}" min="0" max="60" />
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-classificacao">Classificação</label>
                        <select id="edit-classificacao">
                            <option value="Alta" ${lead.classificacao === 'Alta' ? 'selected' : ''}>Alta prioridade</option>
                            <option value="Média" ${lead.classificacao === 'Média' ? 'selected' : ''}>Média prioridade</option>
                            <option value="Baixa" ${lead.classificacao === 'Baixa' ? 'selected' : ''}>Baixa prioridade</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="edit-observacoes">Observações</label>
                    <textarea id="edit-observacoes" rows="3" placeholder="Informações adicionais...">${lead.observacoes || ''}</textarea>
                </div>

                <div id="historico-container" style="display:none; margin-top: 20px;">
                    <h3>📜 Histórico de Alterações</h3>
                    <div id="historico-lista" class="historico-lista">
                        <div class="loading">Carregando histórico...</div>
                    </div>
                </div>
            </form>

            <div class="modal-footer">
                <button type="button" id="btn-ver-historico" class="btn-outline">
                    📜 Ver Histórico
                </button>
                <div style="flex:1"></div>
                <button type="button" id="btn-cancelar-edicao" class="btn-outline">
                    Cancelar
                </button>
                <button type="button" id="btn-salvar-edicao" class="btn-primary">
                    💾 Salvar Alterações
                </button>
            </div>
        </div>
    `;
}

async function salvarEdicao(leadOriginal, profile, overlay, onSaved, onClose) {
    const btn = overlay.querySelector('#btn-salvar-edicao');
    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
        // Coletar todos os dados do formulário
        const dadosFormulario = {
            nome: overlay.querySelector('#edit-nome').value.trim(),
            whatsapp: overlay.querySelector('#edit-whatsapp').value.trim(),
            idade: parseInt(overlay.querySelector('#edit-idade').value),
            sexo: overlay.querySelector('#edit-sexo').value,
            cidade: overlay.querySelector('#edit-cidade').value.trim(),
            beneficio: overlay.querySelector('#edit-beneficio').value,
            situacao: overlay.querySelector('#edit-situacao').value,
            contribuicao_anos: parseInt(overlay.querySelector('#edit-contribuicao').value) || 0,
            classificacao: overlay.querySelector('#edit-classificacao').value,
            observacoes: overlay.querySelector('#edit-observacoes').value.trim()
        };

        // Filtrar apenas campos que existem no lead original (evita erro de constraint)
        const dadosNovos = {};
        Object.keys(dadosFormulario).forEach(campo => {
            // Sempre inclui campos básicos, ignora campos que não existem no schema
            if (leadOriginal.hasOwnProperty(campo) || ['nome', 'whatsapp', 'idade', 'cidade', 'beneficio', 'situacao', 'classificacao', 'observacoes', 'contribuicao_anos'].includes(campo)) {
                dadosNovos[campo] = dadosFormulario[campo];
            }
        });

        console.log('Salvando lead com dados:', dadosNovos);

        // Atualizar no Supabase
        const { error } = await supabase
            .from('leads')
            .update(dadosNovos)
            .eq('id', leadOriginal.id);

        if (error) {
            console.error('Erro ao atualizar lead:', error);
            console.error('Detalhes do erro:', error.details, error.hint, error.code);
            
            // Mensagens de erro específicas
            if (error.message.includes('unique') || error.code === '23505') {
                if (error.message.includes('whatsapp')) {
                    throw new Error('Este WhatsApp já está cadastrado para outro lead');
                }
                throw new Error('Valor duplicado: ' + error.message);
            }
            
            if (error.message.includes('check constraint') || error.code === '23514') {
                if (error.message.includes('beneficio')) {
                    throw new Error('Valor de benefício inválido. Selecione uma opção válida da lista.');
                }
                if (error.message.includes('classificacao')) {
                    throw new Error('Valor de classificação inválido. Selecione uma opção válida da lista.');
                }
                throw new Error('Valor inválido para um dos campos. Verifique os dados enviados.');
            }
            
            if (error.message.includes('column') || error.code === '42703') {
                throw new Error('Campo não encontrado na tabela. Execute a migration para adicionar o campo sexo.');
            }
            
            throw new Error(error.message);
        }

        console.log('Lead atualizado com sucesso');

        // Tentar registrar histórico (não bloqueia se falhar)
        try {
            const numAlteracoes = await registrarAlteracoes(
                leadOriginal.id,
                leadOriginal,
                dadosNovos,
                profile
            );
            console.log(`${numAlteracoes} alterações registradas no histórico`);
        } catch (errHistorico) {
            console.warn('Erro ao registrar histórico (não crítico):', errHistorico);
            // Continua mesmo se o histórico falhar
        }

        // Callback de sucesso
        if (onSaved) onSaved({ ...leadOriginal, ...dadosNovos });

        // Fechar modal
        fecharModal(overlay, onClose);

        // Mostrar toast
        mostrarToast('Lead atualizado com sucesso');

    } catch (err) {
        console.error('Erro crítico ao salvar:', err);
        alert(`Erro ao salvar: ${err.message}`);
        btn.disabled = false;
        btn.textContent = '💾 Salvar Alterações';
    }
}

async function toggleHistorico(leadId) {
    const container = document.querySelector('#historico-container');
    const lista = document.querySelector('#historico-lista');
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        lista.innerHTML = '<div class="loading">Carregando histórico...</div>';
        
        try {
            const historico = await buscarHistoricoLead(leadId);
            
            if (!historico.length) {
                lista.innerHTML = '<div class="empty">Nenhuma alteração registrada ainda.</div>';
                return;
            }

            lista.innerHTML = historico.map(h => {
                const data = new Date(h.created_at).toLocaleString('pt-BR');
                return `
                    <div class="historico-item">
                        <div class="historico-header">
                            <strong>${h.usuario_nome}</strong>
                            <span class="historico-data">${data}</span>
                        </div>
                        <div class="historico-descricao">
                            ${h.descricao || `${h.tipo_alteracao}: ${h.campo_alterado}`}
                        </div>
                    </div>
                `;
            }).join('');

        } catch (err) {
            console.error('Erro ao buscar histórico:', err);
            if (err.message.includes('lead_historico')) {
                lista.innerHTML = `
                    <div class="error">
                        ⚠️ Tabela de histórico não encontrada.<br>
                        Execute a migration SQL para habilitar este recurso.<br>
                        <small style="color:#6b7280">Arquivo: supabase/migration-historico-alteracoes.sql</small>
                    </div>`;
            } else {
                lista.innerHTML = `<div class="error">Erro ao carregar histórico: ${err.message}</div>`;
            }
        }
    } else {
        container.style.display = 'none';
    }
}

function fecharModal(overlay, onClose) {
    overlay.remove();
    document.body.style.overflow = '';
    if (onClose) onClose();
}

function mostrarToast(mensagem) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = mensagem;
    toast.style.cssText = 'position:fixed;top:20px;right:20px;background:#16a34a;color:white;padding:8px 16px;border-radius:6px;z-index:10000;animation:slideIn 0.3s ease-out;font-size:14px';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
