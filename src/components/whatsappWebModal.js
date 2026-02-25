/* ================================================================
   whatsappWebModal.js
   Popup controlado do WhatsApp Web
   (WhatsApp bloqueia iframe, então usamos popup pequeno)
================================================================ */

let popupWindow = null;

/* ─── Abrir WhatsApp Web em popup controlado ────────────── */
export function abrirWhatsAppWebModal(numero, mensagem) {
    const digits = String(numero).replace(/\D/g, '');
    const destino = digits.startsWith('55') ? digits : `55${digits}`;
    const textoEncoded = encodeURIComponent(mensagem);
    const url = `https://web.whatsapp.com/send?phone=${destino}&text=${textoEncoded}`;

    // Configurações do popup (janela menor, lateral direita)
    const width = 600;
    const height = 800;
    const left = window.screen.width - width - 20;
    const top = (window.screen.height - height) / 2;
    
    const features = `
        width=${width},
        height=${height},
        left=${left},
        top=${top},
        menubar=no,
        toolbar=no,
        location=no,
        status=no,
        resizable=yes,
        scrollbars=yes
    `.replace(/\s/g, '');

    // Se já existe popup aberto, reutiliza
    if (popupWindow && !popupWindow.closed) {
        popupWindow.location.href = url;
        popupWindow.focus();
    } else {
        popupWindow = window.open(url, 'WhatsAppWeb', features);
        
        if (!popupWindow || popupWindow.closed || typeof popupWindow.closed === 'undefined') {
            // Popup bloqueado, mostra instrução
            mostrarInstrucaoPopup(url);
        } else {
            popupWindow.focus();
        }
    }
}

/* ─── Mostrar instrução se popup bloqueado ─────────────── */
function mostrarInstrucaoPopup(url) {
    const modal = document.createElement('div');
    modal.className = 'whatsapp-popup-blocked-modal';
    modal.innerHTML = `
        <div class="whatsapp-popup-blocked-content">
            <div class="whatsapp-popup-blocked-header">
                <h3>⚠️ Popup Bloqueado</h3>
                <button onclick="this.closest('.whatsapp-popup-blocked-modal').remove()">✕</button>
            </div>
            <div class="whatsapp-popup-blocked-body">
                <p>Seu navegador bloqueou o popup do WhatsApp Web.</p>
                <p><strong>Clique no botão abaixo para abrir:</strong></p>
                <a href="${url}" target="WhatsAppWeb" class="whatsapp-open-button">
                    📱 Abrir WhatsApp Web
                </a>
                <p class="whatsapp-hint">
                    💡 Dica: Permita popups neste site para abrir automaticamente
                </p>
            </div>
        </div>
    `;
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    document.body.appendChild(modal);
    
    // Adicionar estilos
    if (!document.getElementById('whatsapp-popup-blocked-styles')) {
        const styles = document.createElement('style');
        styles.id = 'whatsapp-popup-blocked-styles';
        styles.textContent = `
            .whatsapp-popup-blocked-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.2s;
            }
            
            .whatsapp-popup-blocked-content {
                background: white;
                border-radius: 12px;
                width: 90%;
                max-width: 450px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
            }
            
            .whatsapp-popup-blocked-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid #e0e0e0;
            }
            
            .whatsapp-popup-blocked-header h3 {
                margin: 0;
                font-size: 18px;
                color: #333;
            }
            
            .whatsapp-popup-blocked-header button {
                background: none;
                border: none;
                font-size: 24px;
                color: #999;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.2s;
            }
            
            .whatsapp-popup-blocked-header button:hover {
                background: #f0f0f0;
            }
            
            .whatsapp-popup-blocked-body {
                padding: 24px;
                text-align: center;
            }
            
            .whatsapp-popup-blocked-body p {
                margin: 0 0 16px 0;
                color: #666;
                line-height: 1.5;
            }
            
            .whatsapp-open-button {
                display: inline-block;
                background: #25D366;
                color: white;
                padding: 12px 32px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                margin: 16px 0;
                transition: background 0.2s;
            }
            
            .whatsapp-open-button:hover {
                background: #20BA5A;
            }
            
            .whatsapp-hint {
                font-size: 13px;
                color: #999;
                margin-top: 20px !important;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }
}
