import { renderAtendimentoForm } from './components/atendimentoForm.js';
import { renderResultadoTriagem } from './components/leadsTable.js';
import { avaliarTriagem } from './services/triagemService.js';
import {
    buildWhatsAppMessage,
    buildWhatsAppUrl,
    sanitizeLeadInput,
    saveLead,
    verificarWhatsAppExistente,
} from './services/leadsService.js';
import { isSupabaseConfigured } from './config/supabase.js';

const state = {
    carregando: false,
    erro: '',
    sucesso: '',
    resultado: null,
};

function getWhatsAppNumber() {
    return (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '');
}

function updateStatus() {
    const status = document.querySelector('#status');
    if (!status) {
        return;
    }

    if (state.carregando) {
        status.className = 'status loading';
        status.textContent = 'Enviando dados da triagem...';
        return;
    }

    if (state.erro) {
        status.className = 'status error';
        status.textContent = state.erro;
        return;
    }

    if (state.sucesso) {
        status.className = 'status success';
        status.textContent = state.sucesso;
        return;
    }

    status.className = 'status';
    status.textContent = '';
}

function renderResultado() {
    const container = document.querySelector('#resultado-triagem');
    if (!container) {
        return;
    }

    container.innerHTML = state.resultado ? renderResultadoTriagem(state.resultado) : '';
}

let whatsappValidado = false;
let whatsappDuplicado = false;

async function validarWhatsAppTempoReal(numero) {
    const validationDiv = document.querySelector('#whatsapp-validation');
    if (!validationDiv) return;
    
    try {
        validationDiv.style.display = 'block';
        validationDiv.className = 'field-validation validating';
        validationDiv.innerHTML = '<span style="color:#6b7280">⏳ Verificando número...</span>';
        
        const resultado = await verificarWhatsAppExistente(numero);
        
        if (resultado.existe) {
            validationDiv.className = 'field-validation error';
            validationDiv.innerHTML = `
                <span style="color:#dc2626;font-weight:500">⚠️ WhatsApp já cadastrado</span>
                <span style="display:block;font-size:12px;margin-top:4px;color:#6b7280">
                    Pertence a: <strong>${resultado.nome}</strong> · 
                    Cadastro: ${new Date(resultado.created_at).toLocaleDateString('pt-BR')}
                </span>
            `;
            whatsappValidado = false;
            whatsappDuplicado = true;
        } else {
            validationDiv.className = 'field-validation success';
            validationDiv.innerHTML = '<span style="color:#16a34a;font-weight:500">✅ Número disponível</span>';
            whatsappValidado = true;
            whatsappDuplicado = false;
        }
    } catch (err) {
        console.error('Erro ao validar WhatsApp:', err);
        validationDiv.className = 'field-validation error';
        validationDiv.innerHTML = '<span style="color:#dc2626">❌ Erro ao verificar número</span>';
        whatsappValidado = false;
        whatsappDuplicado = false;
    }
}

function esconderValidacaoWhatsApp() {
    const validationDiv = document.querySelector('#whatsapp-validation');
    if (validationDiv) {
        validationDiv.style.display = 'none';
        validationDiv.innerHTML = '';
    }
    whatsappValidado = false;
    whatsappDuplicado = false;
}

async function handleSubmit(event) {
    event.preventDefault();

    if (state.carregando) {
        return;
    }
    
    // Bloqueia se WhatsApp está duplicado
    if (whatsappDuplicado) {
        state.erro = 'Este WhatsApp já está cadastrado. Use outro número ou entre em contato conosco.';
        updateStatus();
        document.querySelector('#whatsapp')?.focus();
        return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    if (formData.get('website')) {
        return;
    }

    state.carregando = true;
    state.erro = '';
    state.sucesso = '';
    updateStatus();

    try {
        const consentimentoRaw = formData.get('consentimento');
        console.log('[DEBUG] Consentimento checkbox value:', consentimentoRaw);
        console.log('[DEBUG] Consentimento convertido:', consentimentoRaw === 'on');
        
        const payload = sanitizeLeadInput({
            nome: formData.get('nome'),
            whatsapp: formData.get('whatsapp'),
            cidade: formData.get('cidade'),
            beneficio: formData.get('beneficio'),
            situacao: formData.get('situacao'),
            idade: Number(formData.get('idade')),
            sexo: formData.get('sexo'),
            contribuicaoAnos: Number(formData.get('contribuicaoAnos')),
            consentimento: consentimentoRaw === 'on',
            observacoes: formData.get('observacoes'),
        });
        
        console.log('[DEBUG] Payload após sanitize:', payload);

        const resultado = avaliarTriagem(payload);
        const telefoneAtendimento = getWhatsAppNumber();

        if (!telefoneAtendimento) {
            throw new Error('Configure VITE_WHATSAPP_NUMBER para habilitar o contato via WhatsApp.');
        }

        if (!isSupabaseConfigured()) {
            throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para salvar os leads.');
        }

        const registro = await saveLead({
            ...payload,
            score: resultado.score,
            classificacao: resultado.classificacao,
            origem: 'github-pages-poc',
        });

        const whatsappMessage = buildWhatsAppMessage({
            nome: payload.nome,
            beneficio: payload.beneficio,
            situacao: payload.situacao,
            classificacao: resultado.classificacao,
            protocolo: registro?.id,
        });

        const whatsappUrl = buildWhatsAppUrl(telefoneAtendimento, whatsappMessage);

        state.resultado = resultado;
        state.sucesso = 'Triagem enviada com sucesso. Você será redirecionado para o WhatsApp.';
        form.reset();

        setTimeout(() => {
            window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        }, 450);
    } catch (error) {
        console.error('[INSS] Erro ao salvar lead:', error);
        state.erro = error.message || 'Não foi possível concluir a triagem.';
    } finally {
        state.carregando = false;
        updateStatus();
        renderResultado();
    }
}

export function renderApp(container) {
    if (!container) {
        return;
    }

    container.innerHTML = `
        <main class="container">
            <section class="hero">
                <h1>Central de Atendimento INSS</h1>
                <p>Triagem inicial gratuita para aposentadoria, BPC/LOAS, auxílio-doença e benefício negado.</p>
            </section>

            <section class="card">
                <h2>Pré-atendimento</h2>
                <p class="muted">Preencha os dados abaixo para receber uma orientação inicial e seguir para o WhatsApp.</p>
                ${renderAtendimentoForm()}
                <div id="whatsapp-validation" class="field-validation" style="display:none;margin-top:-10px;margin-bottom:10px"></div>
                <div id="status" class="status" aria-live="polite"></div>
            </section>

            <section id="resultado-triagem" class="resultado"></section>

            <section class="card privacy">
                <h3>Privacidade e LGPD</h3>
                <ul>
                    <li>Coletamos apenas dados necessários para triagem inicial e contato.</li>
                    <li>Os dados são armazenados no Supabase com política de inserção segura (RLS).</li>
                    <li>Este canal fornece orientação inicial e não substitui consulta jurídica individual.</li>
                </ul>
            </section>
        </main>
    `;

    const form = container.querySelector('#triagem-form');
    form?.addEventListener('submit', handleSubmit);
    
    // Validação em tempo real do WhatsApp
    const whatsappInput = container.querySelector('#whatsapp');
    if (whatsappInput) {
        let timeoutId;
        whatsappInput.addEventListener('input', (e) => {
            clearTimeout(timeoutId);
            const valor = e.target.value.replace(/\D/g, '');
            
            // Só valida se tiver pelo menos 10 dígitos
            if (valor.length >= 10) {
                timeoutId = setTimeout(() => validarWhatsAppTempoReal(valor), 800);
            } else {
                esconderValidacaoWhatsApp();
            }
        });
        
        whatsappInput.addEventListener('blur', (e) => {
            const valor = e.target.value.replace(/\D/g, '');
            if (valor.length >= 10) {
                validarWhatsAppTempoReal(valor);
            }
        });
    }
    
    // Debug: verificar estado do checkbox
    const checkbox = container.querySelector('#consentimento');
    if (checkbox) {
        checkbox.addEventListener('change', (e) => {
            console.log('[DEBUG] Checkbox mudou:', e.target.checked);
        });
        console.log('[DEBUG] Checkbox inicial:', checkbox.checked);
    }
}