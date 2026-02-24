import { renderAtendimentoForm } from './components/atendimentoForm.js';
import { renderResultadoTriagem } from './components/leadsTable.js';
import { avaliarTriagem } from './services/triagemService.js';
import {
    buildWhatsAppMessage,
    buildWhatsAppUrl,
    formatPhoneToE164BR,
    sanitizeLeadInput,
    saveLead,
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

async function handleSubmit(event) {
    event.preventDefault();

    if (state.carregando) {
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
        const payload = sanitizeLeadInput({
            nome: formData.get('nome'),
            whatsapp: formData.get('whatsapp'),
            cidade: formData.get('cidade'),
            beneficio: formData.get('beneficio'),
            situacao: formData.get('situacao'),
            idade: Number(formData.get('idade')),
            contribuicaoAnos: Number(formData.get('contribuicaoAnos')),
            consentimento: formData.get('consentimento') === 'on',
            observacoes: formData.get('observacoes'),
        });

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
            whatsapp: formatPhoneToE164BR(payload.whatsapp),
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
}