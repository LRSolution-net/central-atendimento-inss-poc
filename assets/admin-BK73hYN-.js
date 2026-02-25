import{s as f}from"./supabase-DBx6agDF.js";async function Ae(e,t){const{data:a,error:o}=await f.auth.signInWithPassword({email:e,password:t});if(o)throw new Error(o.message);const s=await Z(a.user.id);return{user:a.user,profile:s}}async function V(){await f.auth.signOut()}async function qe(){const{data:e}=await f.auth.getSession();if(!e.session)return null;const t=await Z(e.session.user.id);return{user:e.session.user,profile:t}}async function Z(e){const{data:t,error:a}=await f.from("profiles").select("*").eq("id",e).single();if(a)throw new Error(`Perfil não encontrado: ${a.message}`);return t}async function Ce({nome:e,email:t,password:a,role:o}){const{data:s}=await f.auth.getSession(),n=s==null?void 0:s.session,{data:l,error:c}=await f.auth.signUp({email:t,password:a,options:{data:{nome:e,role:o}}});if(c)throw c.message.includes("rate limit")||c.message.includes("Email rate limit exceeded")?new Error("⏱️ Limite de criação de usuários excedido. Aguarde 1 minuto e tente novamente. O Supabase limita criação de usuários para prevenir spam."):c.message.includes("already registered")||c.message.includes("already been registered")?new Error("📧 Este e-mail já está cadastrado no sistema."):new Error(`Erro ao criar usuário: ${c.message}`);if(!l.user)throw new Error('Usuário não foi criado. No painel do Supabase, vá em Authentication → Settings e desative "Confirm email".');n!=null&&n.access_token&&await f.auth.setSession({access_token:n.access_token,refresh_token:n.refresh_token});const{error:u}=await f.from("profiles").upsert({id:l.user.id,email:t,nome:e,role:o},{onConflict:"id"});if(u)throw new Error(`Usuário criado, mas erro no perfil: ${u.message}`);return l.user}async function ee({classificacao:e="",status:t="",beneficio:a=""}={}){if(!f)throw new Error("Supabase não configurado.");let o=f.from("leads").select("*").order("created_at",{ascending:!1});e&&(o=o.eq("classificacao",e)),t&&(o=o.eq("status_atendimento",t)),a&&(o=o.eq("beneficio",a));const{data:s,error:n}=await o;if(n)throw new Error(`Erro ao buscar leads: ${n.message}`);return s||[]}async function ae(e,t){if(!f)throw new Error("Supabase não configurado.");const{error:a}=await f.from("leads").update({status_atendimento:t}).eq("id",e);if(a)throw new Error(`Erro ao atualizar lead: ${a.message}`)}async function Le(e){if(!f)throw new Error("Supabase não configurado.");const{error:t}=await f.from("leads").delete().eq("id",e);if(t)throw new Error(`Erro ao deletar lead: ${t.message}`)}async function ke({lead_id:e,tipo:t="whatsapp",direcao:a="enviado",descricao:o,responsavel:s="",numero_lead:n=""}){if(!f)throw new Error("Supabase não configurado.");const{error:l}=await f.from("atendimentos").insert([{lead_id:e,tipo:t,direcao:a,descricao:o,responsavel:s,numero_lead:n}]);if(l)throw new Error(`Erro ao salvar atendimento: ${l.message}`)}async function Te(e){if(!f)throw new Error("Supabase não configurado.");const{data:t,error:a}=await f.from("atendimentos").select("*").eq("lead_id",e).order("created_at",{ascending:!0});if(a)throw new Error(`Erro ao buscar atendimentos: ${a.message}`);return t||[]}function We(e,t){return f.channel(`atendimentos:lead:${e}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"atendimentos",filter:`lead_id=eq.${e}`},o=>t(o.new)).subscribe()}async function Ne(){const{data:e,error:t}=await f.from("profiles").select("*").order("created_at",{ascending:!1});if(t)throw new Error(`Erro ao listar usuários: ${t.message}`);return e||[]}async function Ie(e,t){const{error:a}=await f.from("profiles").update({ativo:t}).eq("id",e);if(a)throw new Error(`Erro ao atualizar usuário: ${a.message}`)}async function Be(e,t){const{error:a}=await f.from("profiles").update({role:t}).eq("id",e);if(a)throw new Error(`Erro ao atualizar perfil: ${a.message}`)}let q=null;function _e(e,t){const a=String(e).replace(/\D/g,""),o=a.startsWith("55")?a:`55${a}`,s=encodeURIComponent(t),n=`https://web.whatsapp.com/send?phone=${o}&text=${s}`,l=600,c=800,u=window.screen.width-l-20,b=(window.screen.height-c)/2,g=`
        width=${l},
        height=${c},
        left=${u},
        top=${b},
        menubar=no,
        toolbar=no,
        location=no,
        status=no,
        resizable=yes,
        scrollbars=yes
    `.replace(/\s/g,"");q&&!q.closed?(q.location.href=n,q.focus()):(q=window.open(n,"WhatsAppWeb",g),!q||q.closed||typeof q.closed>"u"?Pe(n):q.focus())}function Pe(e){const t=document.createElement("div");if(t.className="whatsapp-popup-blocked-modal",t.innerHTML=`
        <div class="whatsapp-popup-blocked-content">
            <div class="whatsapp-popup-blocked-header">
                <h3>⚠️ Popup Bloqueado</h3>
                <button onclick="this.closest('.whatsapp-popup-blocked-modal').remove()">✕</button>
            </div>
            <div class="whatsapp-popup-blocked-body">
                <p>Seu navegador bloqueou o popup do WhatsApp Web.</p>
                <p><strong>Clique no botão abaixo para abrir:</strong></p>
                <a href="${e}" target="WhatsAppWeb" class="whatsapp-open-button">
                    📱 Abrir WhatsApp Web
                </a>
                <p class="whatsapp-hint">
                    💡 Dica: Permita popups neste site para abrir automaticamente
                </p>
            </div>
        </div>
    `,t.addEventListener("click",a=>{a.target===t&&t.remove()}),document.body.appendChild(t),!document.getElementById("whatsapp-popup-blocked-styles")){const a=document.createElement("style");a.id="whatsapp-popup-blocked-styles",a.textContent=`
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
        `,document.head.appendChild(a)}}const te="https://bhargdkruycbrcanfvuz.supabase.co",oe="",Ue="",Me="";function O(){return!!oe}function ze(){return!!te}async function He(e,t){const a=String(e).replace(/\D/g,""),o=a.startsWith("55")?a:`55${a}`,s=`${oe.replace(/\/$/,"")}/message/sendText/${Me}`,n=await fetch(s,{method:"POST",headers:{"Content-Type":"application/json",apikey:Ue},body:JSON.stringify({number:o,textMessage:{text:t}})});if(!n.ok){const l=await n.json().catch(()=>({}));throw new Error(l.message||`Evolution API erro ${n.status}`)}return await n.json()}function Oe(e,t){try{const a=String(e).replace(/\D/g,"");if(!a||a.length<10)throw new Error("Número de WhatsApp inválido");const o=a.startsWith("55")?a:`55${a}`;_e(o,t)}catch(a){throw console.error("Erro ao abrir WhatsApp:",a),alert(`❌ Erro ao abrir WhatsApp: ${a.message}`),a}}async function De(e,t){return O()?(await He(e,t),{canal:"evolution"}):(Oe(e,t),{canal:"wame"})}async function je(e){var E,U,k,B,_;const{etapa:t,nome:a,beneficio:o,situacao:s,classificacao:n,observacoes:l,documentos:c,mensagemAtual:u}=e,b=`Você é um atendente humanizado de um escritório de advocacia especializado em INSS.
Seu tom é acolhedor, respeitoso e profissional.
Escreva em português do Brasil.
Seja direto, evite textos muito longos.
Nunca invente informações jurídicas.
Use o formato WhatsApp para negrito (*texto*).`,g={abertura:`Escreva uma mensagem de abertura calorosa para ${a}, que entrou em contato sobre *${o}* (situação: ${s}). Prioridade: ${n}. ${l?`Observação: ${l}`:""} Apresente o escritório e pergunte se pode atendê-lo agora.`,qualificacao:`Escreva uma mensagem de qualificação para ${a} sobre *${o}*. Faça 2 perguntas objetivas para entender melhor a situação antes de pedir os documentos.`,documentos:`Escreva uma mensagem solicitando os seguintes documentos para ${a}: ${c==null?void 0:c.join(", ")}. Seja gentil e explique resumidamente para que servem.`,encerramento:`Escreva uma mensagem de encerramento para ${a}, informando que os documentos foram recebidos e o especialista entrará em contato em breve. Agradeça e seja encorajador.`,personalizada:`Melhore esta mensagem mantendo tom humanizado, sem alterar informações essenciais:

${u}`},L={model:"llama-3.3-70b-versatile",messages:[{role:"system",content:b},{role:"user",content:g[t]||g.personalizada}],temperature:.7,max_tokens:400};let A;if(A=await fetch(`${te}/functions/v1/groq-proxy`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(L)}),!A.ok){const j=await A.json().catch(()=>({}));throw new Error(((E=j.error)==null?void 0:E.message)||`Groq erro ${A.status}`)}return((_=(B=(k=(U=(await A.json()).choices)==null?void 0:U[0])==null?void 0:k.message)==null?void 0:B.content)==null?void 0:_.trim())||""}function Re(e,{nome:t,beneficio:a,situacao:o,classificacao:s,documentos:n=[],observacoes:l=""}){const c=a.replace("-"," ");return{abertura:`Olá, ${t}! 👋

Aqui é do escritório especializado em INSS. Recebemos sua solicitação sobre *${c}* e ficamos felizes em poder ajudar! 🤝

Podemos conversar agora para entender melhor o seu caso?`,qualificacao:`${t}, para que possamos orientá-lo da melhor forma sobre seu processo de *${c}*, gostaríamos de entender um pouco mais:

1️⃣ Você já deu entrada nesse benefício anteriormente ou será o primeiro pedido?

2️⃣ Você possui todos os seus documentos de contribuição (carteira de trabalho, CNIS)?`,documentos:n.length?`${t}, para darmos entrada no seu processo de *${c}*, precisamos dos seguintes documentos:

${n.map((b,g)=>`${g+1}. ${b}`).join(`
`)}

Assim que reunir, nos envie por aqui ou agende uma visita! 📋`:`${t}, em breve nosso especialista entrará em contato para informar os documentos necessários para o seu caso de *${c}*. ✅`,encerramento:`${t}, recebemos tudo! 🎉

Nosso especialista vai analisar o seu caso e entrará em contato em breve para os próximos passos.

Qualquer dúvida, estamos aqui! 😊

Conte conosco! ⚖️`}[e]||""}async function Fe({leadId:e,usuarioNome:t,usuarioId:a=null,tipoAlteracao:o,campoAlterado:s=null,valorAnterior:n=null,valorNovo:l=null,descricao:c=null}){if(!f)throw new Error("Supabase não configurado.");console.log("Tentando salvar histórico:",{lead_id:e,usuario_nome:t,tipo_alteracao:o,campo_alterado:s});const{data:u,error:b}=await f.from("lead_historico").insert({lead_id:e,usuario_nome:t,usuario_id:a,tipo_alteracao:o,campo_alterado:s,valor_anterior:n?JSON.stringify(n):null,valor_novo:l?JSON.stringify(l):null,descricao:c}).select();if(b)throw console.error("Erro ao salvar histórico:",b),new Error(`Erro ao salvar histórico: ${b.message}`);console.log("Histórico salvo com sucesso:",u)}async function Ve(e){if(!f)throw new Error("Supabase não configurado.");const{data:t,error:a}=await f.from("lead_historico").select("*").eq("lead_id",e).order("created_at",{ascending:!1});if(a)throw new Error(`Erro ao buscar histórico: ${a.message}`);return t||[]}async function Ge(e,t,a,o){const s=[],n=["id","created_at","updated_at","updated_by"];Object.keys(a).forEach(l=>{if(n.includes(l))return;const c=t[l],u=a[l];c!==u&&s.push({leadId:e,usuarioNome:o.nome,usuarioId:o.id,tipoAlteracao:"edicao",campoAlterado:l,valorAnterior:c,valorNovo:u,descricao:`${l}: "${c}" → "${u}"`})});for(const l of s)await Fe(l);return s.length}const Qe={aposentadoria:"Aposentadoria","auxilio-doenca":"Auxílio-doença","bpc-loas":"BPC/LOAS","beneficio-negado":"Benefício negado",outros:"Outros"},Je={"primeiro-pedido":"Primeiro pedido","em-analise":"Em análise no INSS",indeferido:"Indeferido",cessado:"Benefício cessado"};function se({lead:e,profile:t,onSaved:a,onClose:o}){var n,l,c,u;const s=document.createElement("div");s.id="modal-edicao-overlay",s.className="modal-overlay",s.innerHTML=Ye(e),document.body.appendChild(s),document.body.style.overflow="hidden",(n=s.querySelector(".modal-close"))==null||n.addEventListener("click",()=>M(s,o)),(l=s.querySelector("#btn-cancelar-edicao"))==null||l.addEventListener("click",()=>M(s,o)),(c=s.querySelector("#btn-salvar-edicao"))==null||c.addEventListener("click",()=>Ke(e,t,s,a,o)),(u=s.querySelector("#btn-ver-historico"))==null||u.addEventListener("click",()=>Xe(e.id)),s.addEventListener("click",b=>{b.target===s&&M(s,o)})}function Ye(e){return`
        <div class="modal-content modal-edicao">
            <div class="modal-header">
                <h2>📝 Editar Lead</h2>
                <button class="modal-close" title="Fechar">✕</button>
            </div>
            
            <form id="form-edicao-lead" class="modal-body">
                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-nome">Nome completo *</label>
                        <input type="text" id="edit-nome" value="${e.nome}" required />
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-whatsapp">WhatsApp *</label>
                        <input type="text" id="edit-whatsapp" value="${e.whatsapp}" required />
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-idade">Idade *</label>
                        <input type="number" id="edit-idade" value="${e.idade}" min="0" max="120" required />
                    </div>

                    <div class="form-group">
                        <label for="edit-sexo">Sexo *</label>
                        <select id="edit-sexo" required>
                            <option value="">Selecione</option>
                            <option value="masculino" ${e.sexo==="masculino"?"selected":""}>Masculino</option>
                            <option value="feminino" ${e.sexo==="feminino"?"selected":""}>Feminino</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-cidade">Cidade *</label>
                        <input type="text" id="edit-cidade" value="${e.cidade}" required />
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-beneficio">Benefício desejado *</label>
                        <select id="edit-beneficio" required>
                            ${Object.entries(Qe).map(([t,a])=>`<option value="${t}" ${e.beneficio===t?"selected":""}>${a}</option>`).join("")}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-situacao">Situação atual *</label>
                        <select id="edit-situacao" required>
                            ${Object.entries(Je).map(([t,a])=>`<option value="${t}" ${e.situacao===t?"selected":""}>${a}</option>`).join("")}
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="edit-contribuicao">Anos de contribuição</label>
                        <input type="number" id="edit-contribuicao" value="${e.contribuicao_anos||0}" min="0" max="60" />
                    </div>
                    
                    <div class="form-group">
                        <label for="edit-classificacao">Classificação</label>
                        <select id="edit-classificacao">
                            <option value="Alta" ${e.classificacao==="Alta"?"selected":""}>Alta prioridade</option>
                            <option value="Média" ${e.classificacao==="Média"?"selected":""}>Média prioridade</option>
                            <option value="Baixa" ${e.classificacao==="Baixa"?"selected":""}>Baixa prioridade</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="edit-observacoes">Observações</label>
                    <textarea id="edit-observacoes" rows="3" placeholder="Informações adicionais...">${e.observacoes||""}</textarea>
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
    `}async function Ke(e,t,a,o,s){const n=a.querySelector("#btn-salvar-edicao");n.disabled=!0,n.textContent="Salvando...";try{const l={nome:a.querySelector("#edit-nome").value.trim(),whatsapp:a.querySelector("#edit-whatsapp").value.trim(),idade:parseInt(a.querySelector("#edit-idade").value),sexo:a.querySelector("#edit-sexo").value,cidade:a.querySelector("#edit-cidade").value.trim(),beneficio:a.querySelector("#edit-beneficio").value,situacao:a.querySelector("#edit-situacao").value,contribuicao_anos:parseInt(a.querySelector("#edit-contribuicao").value)||0,classificacao:a.querySelector("#edit-classificacao").value,observacoes:a.querySelector("#edit-observacoes").value.trim()},c={};Object.keys(l).forEach(b=>{(e.hasOwnProperty(b)||["nome","whatsapp","idade","cidade","beneficio","situacao","classificacao","observacoes","contribuicao_anos"].includes(b))&&(c[b]=l[b])}),console.log("Salvando lead com dados:",c);const{error:u}=await f.from("leads").update(c).eq("id",e.id);if(u)throw console.error("Erro ao atualizar lead:",u),console.error("Detalhes do erro:",u.details,u.hint,u.code),u.message.includes("unique")||u.code==="23505"?u.message.includes("whatsapp")?new Error("Este WhatsApp já está cadastrado para outro lead"):new Error("Valor duplicado: "+u.message):u.message.includes("check constraint")||u.code==="23514"?u.message.includes("beneficio")?new Error("Valor de benefício inválido. Selecione uma opção válida da lista."):u.message.includes("classificacao")?new Error("Valor de classificação inválido. Selecione uma opção válida da lista."):new Error("Valor inválido para um dos campos. Verifique os dados enviados."):u.message.includes("column")||u.code==="42703"?new Error("Campo não encontrado na tabela. Execute a migration para adicionar o campo sexo."):new Error(u.message);console.log("Lead atualizado com sucesso");try{const b=await Ge(e.id,e,c,t);console.log(`${b} alterações registradas no histórico`)}catch(b){console.warn("Erro ao registrar histórico (não crítico):",b)}o&&o({...e,...c}),M(a,s),Ze("Lead atualizado com sucesso")}catch(l){console.error("Erro crítico ao salvar:",l),alert(`Erro ao salvar: ${l.message}`),n.disabled=!1,n.textContent="💾 Salvar Alterações"}}async function Xe(e){const t=document.querySelector("#historico-container"),a=document.querySelector("#historico-lista");if(t.style.display==="none"){t.style.display="block",a.innerHTML='<div class="loading">Carregando histórico...</div>';try{const o=await Ve(e);if(!o.length){a.innerHTML='<div class="empty">Nenhuma alteração registrada ainda.</div>';return}a.innerHTML=o.map(s=>{const n=new Date(s.created_at).toLocaleString("pt-BR");return`
                    <div class="historico-item">
                        <div class="historico-header">
                            <strong>${s.usuario_nome}</strong>
                            <span class="historico-data">${n}</span>
                        </div>
                        <div class="historico-descricao">
                            ${s.descricao||`${s.tipo_alteracao}: ${s.campo_alterado}`}
                        </div>
                    </div>
                `}).join("")}catch(o){console.error("Erro ao buscar histórico:",o),o.message.includes("lead_historico")?a.innerHTML=`
                    <div class="error">
                        ⚠️ Tabela de histórico não encontrada.<br>
                        Execute a migration SQL para habilitar este recurso.<br>
                        <small style="color:#6b7280">Arquivo: supabase/migration-historico-alteracoes.sql</small>
                    </div>`:a.innerHTML=`<div class="error">Erro ao carregar histórico: ${o.message}</div>`}}else t.style.display="none"}function M(e,t){e.remove(),document.body.style.overflow="",t&&t()}function Ze(e){const t=document.createElement("div");t.className="toast",t.textContent=e,t.style.cssText="position:fixed;top:20px;right:20px;background:#16a34a;color:white;padding:8px 16px;border-radius:6px;z-index:10000;animation:slideIn 0.3s ease-out;font-size:14px",document.body.appendChild(t),setTimeout(()=>t.remove(),3e3)}const N={aposentadoria:["RG e CPF (originais e cópias)","Carteira de Trabalho (CTPS) — todas as folhas utilizadas","Extrato do CNIS (Cadastro Nacional de Informações Sociais)","PIS/PASEP","Comprovante de residência atualizado","Certidão de nascimento ou casamento"],"auxilio-doenca":["RG e CPF","Laudo médico atualizado (com CID, assinado e carimbado)","Atestados e exames recentes","Extrato do CNIS","PIS/PASEP","Comprovante de residência"],"bpc-loas":["RG e CPF de todos os membros da família","Comprovante de residência atualizado","Declaração de composição e renda familiar","Laudo médico (para pessoa com deficiência — com CID)","Certidão de nascimento ou casamento","Número do NIS/CADUNICO (se possuir)"],"beneficio-negado":["RG e CPF","Carta de indeferimento do INSS","Todos os documentos do pedido original","Extrato do CNIS","Laudos ou documentos adicionais que embasem o recurso","Comprovante de residência"],outros:["RG e CPF","Extrato do CNIS","Comprovante de residência","Documentos específicos conforme orientação do especialista"]},ea={aposentadoria:"Aposentadoria","auxilio-doenca":"Auxílio-doença","bpc-loas":"BPC/LOAS","beneficio-negado":"Benefício Negado",outros:"Outros"},d={leads:[],loading:!1,erro:"",filtroStatus:"novo",filtroBeneficio:"",filtroClassificacao:"",busca:"",ordenacao:"created_at",ordem:"desc",modal:null};let v=null,W=null;function aa(e){return e?new Date(e).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"-"}function K(e){return String(e||"").replace(/^\+/,"")}function ta(e){return`<span class="chip ${{Alta:"chip-alta",Média:"chip-media",Baixa:"chip-baixa"}[e]||"chip-baixa"}">${e}</span>`}function ie(){let e=d.leads.filter(t=>{if(d.filtroStatus&&t.status_atendimento!==d.filtroStatus||d.filtroBeneficio&&t.beneficio!==d.filtroBeneficio||d.filtroClassificacao&&t.classificacao!==d.filtroClassificacao)return!1;if(d.busca){const a=d.busca.toLowerCase(),o=(t.nome||"").toLowerCase(),s=(t.whatsapp||"").replace(/\D/g,""),n=a.replace(/\D/g,"");if(!o.includes(a)&&!s.includes(n))return!1}return!0});return e.sort((t,a)=>{let o,s;switch(d.ordenacao){case"nome":o=(t.nome||"").toLowerCase(),s=(a.nome||"").toLowerCase();break;case"classificacao":const n={Alta:3,Média:2,Baixa:1};o=n[t.classificacao]||0,s=n[a.classificacao]||0;break;case"created_at":default:o=new Date(t.created_at||0).getTime(),s=new Date(a.created_at||0).getTime();break}return o<s?d.ordem==="asc"?-1:1:o>s?d.ordem==="asc"?1:-1:0}),e}function oa(){return`
        <header class="ad-header">
            <div class="ad-header-left">
                <span class="ad-icon">📋</span>
                <div>
                    <h1 class="ad-title">Atendimento Inicial</h1>
                    <span class="ad-sub">Olá, ${(W==null?void 0:W.nome)||"Atendente"} · Usuário Comum</span>
                </div>
            </div>
            <button id="btn-logout" class="btn-outline btn-sm">Sair</button>
        </header>`}function sa(){return`
        <div class="ad-filtros">
            <!-- Filtros de Status -->
            <div style="display:flex;gap:8px;flex-wrap:wrap">
                ${[["novo","Novos"],["em-contato","Em contato"],["qualificado","Qualificado"],["","Todos"]].map(([t,a])=>`<button class="tab-pill ${d.filtroStatus===t?"tab-pill-active":""}"
                        data-status="${t}">${a}</button>`).join("")}
            </div>
            
            <!-- Busca -->
            <input 
                type="text" 
                id="input-busca" 
                class="ad-select" 
                placeholder="🔍 Buscar por nome ou WhatsApp..."
                value="${d.busca}"
                style="flex:1;min-width:200px">
            
            <!-- Filtro Benefício -->
            <select id="select-beneficio" class="ad-select">
                <option value="">📋 Todos os benefícios</option>
                <option value="aposentadoria" ${d.filtroBeneficio==="aposentadoria"?"selected":""}>Aposentadoria</option>
                <option value="auxilio-doenca" ${d.filtroBeneficio==="auxilio-doenca"?"selected":""}>Auxílio-doença</option>
                <option value="bpc-loas" ${d.filtroBeneficio==="bpc-loas"?"selected":""}>BPC/LOAS</option>
                <option value="beneficio-negado" ${d.filtroBeneficio==="beneficio-negado"?"selected":""}>Benefício Negado</option>
                <option value="outros" ${d.filtroBeneficio==="outros"?"selected":""}>Outros</option>
            </select>
            
            <!-- Filtro Classificação -->
            <select id="select-classificacao" class="ad-select">
                <option value="">🎯 Todas classificações</option>
                <option value="Alta" ${d.filtroClassificacao==="Alta"?"selected":""}>⚠️ Alta</option>
                <option value="Média" ${d.filtroClassificacao==="Média"?"selected":""}>📊 Média</option>
                <option value="Baixa" ${d.filtroClassificacao==="Baixa"?"selected":""}>📉 Baixa</option>
            </select>
            
            <button id="btn-limpar-filtros" class="btn-outline btn-sm" title="Limpar todos os filtros">✕ Limpar</button>
            <button id="btn-refresh" class="btn-outline btn-sm">↻ Atualizar</button>
        </div>`}function ne(e){if(d.loading)return'<div class="ad-feedback ad-loading">Carregando leads…</div>';if(d.erro)return`<div class="ad-feedback ad-erro">${d.erro}</div>`;if(!e.length)return`<div class="ad-feedback ad-vazio">
            ${d.busca||d.filtroBeneficio||d.filtroClassificacao||d.filtroStatus?'🔍 Nenhum lead encontrado com esses filtros. <button id="btn-limpar-inline" class="btn-outline btn-sm" style="margin-left:8px">Limpar filtros</button>':"Nenhum lead encontrado."}
        </div>`;const t=e.map(a=>{const o=ea[a.beneficio]||a.beneficio,s=["novo","em-contato"].includes(a.status_atendimento);return`
            <tr>
                <td>
                    <div class="lead-nome">${a.nome}</div>
                    <div class="lead-detalhe">${a.cidade} · ${a.idade} anos${a.sexo?` · ${a.sexo==="masculino"?"M":a.sexo==="feminino"?"F":""}`:""}</div>
                    ${a.observacoes?`<div class="lead-obs">${a.observacoes}</div>`:""}
                </td>
                <td>
                    <a class="link-wpp" href="https://wa.me/${K(a.whatsapp)}"
                       target="_blank" rel="noopener noreferrer">
                        ${a.whatsapp}
                    </a>
                </td>
                <td>
                    <div>${o}</div>
                    <div class="lead-detalhe">${a.situacao||""}</div>
                </td>
                <td>${ta(a.classificacao)}</td>
                <td><span class="badge badge-${a.status_atendimento}">${a.status_atendimento.replace("-"," ")}</span></td>
                <td class="td-data">${aa(a.created_at)}</td>
                <td>
                    <div style="display:flex;gap:4px;align-items:center">
                        ${s?`
                            <button class="btn-docs"
                                data-id="${a.id}"
                                data-nome="${a.nome}"
                                data-wpp="${K(a.whatsapp)}"
                                data-beneficio="${a.beneficio}"
                                data-beneflabel="${o}">
                                📄 Docs
                            </button>`:'<span class="score-badge">—</span>'}
                        <button class="btn-icon" data-action="edit-nome" data-id="${a.id}" data-nome="${a.nome}" title="Editar dados do lead">
                            ✏️
                        </button>
                    </div>
                </td>
            </tr>`}).join("");return`
        <div class="table-wrap">
            <table class="leads-table">
                <thead>
                    <tr>
                        <th class="sortable" data-col="nome" title="Clique para ordenar">
                            Nome / Observações
                            ${d.ordenacao==="nome"?d.ordem==="asc"?" ↑":" ↓":""}
                        </th>
                        <th>WhatsApp</th>
                        <th>Benefício / Situação</th>
                        <th class="sortable" data-col="classificacao" title="Clique para ordenar">
                            Classificação
                            ${d.ordenacao==="classificacao"?d.ordem==="asc"?" ↑":" ↓":""}
                        </th>
                        <th>Status</th>
                        <th class="sortable" data-col="created_at" title="Clique para ordenar">
                            Data
                            ${d.ordenacao==="created_at"?d.ordem==="asc"?" ↑":" ↓":""}
                        </th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>${t}</tbody>
            </table>
        </div>`}function ia(){const e=ie();return`
        <div class="ad-layout">
            ${oa()}
            <div class="ad-info-bar">
                <span>👤 Seu perfil permite realizar o atendimento inicial: solicitar documentos e encaminhar leads ao especialista.</span>
            </div>
            ${sa()}
            <section class="ad-table-section">
                <div class="ad-table-head">
                    <h2>Leads <span class="count-badge">${e.length}</span></h2>
                </div>
                ${ne(e)}
            </section>
            
        </div>`}function x(){const e=v==null?void 0:v.querySelector(".ad-table-section");if(!e)return;const t=ie();e.querySelector("h2").innerHTML=`Leads <span class="count-badge">${t.length}</span>`;const a=e.querySelector(".table-wrap, .ad-feedback"),o=ne(t),s=document.createElement("div");s.innerHTML=o;const n=s.firstElementChild;a&&n?a.replaceWith(n):n&&e.appendChild(n),re()}function R(){v&&(v.innerHTML=ia(),na())}function re(){v.querySelectorAll(".btn-docs").forEach(e=>{e.addEventListener("click",()=>{const t=d.leads.find(a=>a.id===e.dataset.id);t&&me({lead:t,profile:W,container:v,onLeadUpdated:a=>{const o=d.leads.findIndex(s=>s.id===a.id);o!==-1&&(d.leads[o]={...d.leads[o],...a}),x()},onClose:()=>x()})})}),v.querySelectorAll('[data-action="edit-nome"]').forEach(e=>{e.addEventListener("click",()=>ra(e.dataset))})}function na(){var a,o,s,n,l;(a=v.querySelector("#btn-logout"))==null||a.addEventListener("click",async()=>{await V(),window.location.reload()}),(o=v.querySelector("#btn-refresh"))==null||o.addEventListener("click",ce),v.querySelectorAll(".tab-pill").forEach(c=>{c.addEventListener("click",()=>{d.filtroStatus=c.dataset.status,v.querySelectorAll(".tab-pill").forEach(u=>u.classList.toggle("tab-pill-active",u.dataset.status===d.filtroStatus)),x()})});const e=v.querySelector("#input-busca");e&&e.addEventListener("input",c=>{d.busca=c.target.value,x()}),(s=v.querySelector("#select-beneficio"))==null||s.addEventListener("change",c=>{d.filtroBeneficio=c.target.value,x()}),(n=v.querySelector("#select-classificacao"))==null||n.addEventListener("change",c=>{d.filtroClassificacao=c.target.value,x()});const t=v.querySelector("#btn-limpar-filtros");t&&t.addEventListener("click",()=>{d.filtroBeneficio="",d.filtroClassificacao="",d.busca="",d.filtroStatus="novo",R()}),v.querySelectorAll("th.sortable").forEach(c=>{c.addEventListener("click",()=>{const u=c.dataset.col;d.ordenacao===u?d.ordem=d.ordem==="asc"?"desc":"asc":(d.ordenacao=u,d.ordem="desc"),x()}),c.style.cursor="pointer",c.style.userSelect="none"}),re(),(l=v.querySelector("#btn-limpar-inline"))==null||l.addEventListener("click",()=>{d.filtroBeneficio="",d.filtroClassificacao="",d.busca="",d.filtroStatus="novo",R()})}async function ra({id:e}){const t=d.leads.find(a=>a.id===e);t&&se({lead:t,profile:W,onSaved:a=>{const o=d.leads.findIndex(s=>s.id===e);o!==-1&&(d.leads[o]=a),x()},onClose:()=>x()})}async function ce(){d.loading=!0,d.erro="",x();try{d.leads=await ee()}catch(e){d.erro=e.message}finally{d.loading=!1,x()}}function ca(e,t){v=e,W=t,R(),ce()}const h=[{id:"abertura",icone:"👋",titulo:"Abertura",descricao:"Saudação inicial e apresentação"},{id:"qualificacao",icone:"🔍",titulo:"Qualificação",descricao:"Entender a situação do lead"},{id:"documentos",icone:"📋",titulo:"Documentos",descricao:"Solicitar documentos necessários"},{id:"encerramento",icone:"✅",titulo:"Encerramento",descricao:"Finalizar e encaminhar ao especialista"}],i={lead:null,profile:null,onClose:null,onLeadUpdated:null,etapaAtual:0,mensagens:[],enviando:!1,melhorando:!1,textos:{},docsEscolhidos:[],_channel:null,mostrarWhatsAppPreview:!1,whatsappWindow:null};let p=null;function I(){return"5511994136335".replace(/\D/g,"")}function de(e){return{aposentadoria:"Aposentadoria","auxilio-doenca":"Auxílio-doença","bpc-loas":"BPC/LOAS","beneficio-negado":"Benefício Negado",outros:"Outros"}[e]||e}function da(e){return`<span class="chip ${{Alta:"chip-alta",Média:"chip-media",Baixa:"chip-baixa"}[e]||"chip-baixa"}">${e}</span>`}function P(e){const t=i.lead,a=i.docsEscolhidos;return Re(e,{nome:t.nome,beneficio:t.beneficio,situacao:t.situacao,classificacao:t.classificacao,observacoes:t.observacoes||"",documentos:a})}function le(){const e=i.whatsappWindow&&!i.whatsappWindow.closed,t=I(),a=t?`+${t.slice(0,2)} (${t.slice(2,4)}) ${t.slice(4,9)}-${t.slice(9)}`:"não configurado";return O()?'<span class="canal-badge canal-evolution">⚡ Evolution API — envio 100% automático</span>':`
        <div style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;align-items:center;gap:8px;justify-content:space-between">
                <span class="canal-badge canal-wame">
                    📲 WhatsApp Web — ${e?"Aberto":"modo manual"}
                    <span style="margin-left:8px;font-size:11px;opacity:0.8">${a}</span>
                </span>
                ${e?"":'<button id="btn-abrir-wpp-persistente" class="btn-outline btn-sm">🔗 Abrir WhatsApp</button>'}
            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:#fef3c7;border:1px solid #fbbf24;border-radius:6px">
                <span style="font-size:12px;color:#92400e">
                    🚀 <strong>Quer envio automático?</strong> Configure Meta WhatsApp API (grátis)
                </span>
                <button id="btn-ver-guia" class="btn-outline btn-sm" style="white-space:nowrap">📖 Ver guia</button>
            </div>
        </div>
    `}function D(){return i.mensagens.length?i.mensagens.map(e=>{var c;const t=e.direcao==="recebido",a=h.find(u=>u.id===e.etapa),o=new Date(e.ts).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),s=e.canal==="evolution"?"⚡":t?"📩":"📲",n=t?"chat-bubble chat-bubble-recebido":"chat-bubble chat-bubble-enviado",l=t?`${((c=i.lead)==null?void 0:c.nome)||"Lead"}`:`${(a==null?void 0:a.icone)||""} ${(a==null?void 0:a.titulo)||"Enviado"}`;return`
            <div class="${n}">
                <div class="chat-bubble-meta">
                    <span>${l}</span>
                    <span class="chat-ts">${s} ${o}</span>
                </div>
                <div class="chat-bubble-text">${e.texto.replace(/\n/g,"<br>")}</div>
            </div>`}).join(""):'<div class="chat-vazio">As mensagens aparecerão aqui.</div>'}function la(){var a;const e=((a=i.lead)==null?void 0:a.beneficio)||"outros";return`
        <div class="docs-seletor">
            <p class="docs-seletor-label">Selecione os documentos para incluir na mensagem:</p>
            <ul class="doc-list">
                ${(N[e]||N.outros).map((o,s)=>`
                    <li class="doc-item">
                        <label>
                            <input type="checkbox" class="doc-check" data-i="${s}"
                                   ${i.docsEscolhidos.includes(o)?"checked":""} />
                            ${o}
                        </label>
                    </li>`).join("")}
            </ul>
        </div>`}function G(){return h.map((e,t)=>{const a=i.mensagens.some(l=>l.etapa===e.id),o=t===i.etapaAtual,s=t<i.etapaAtual;let n="etapa-item";return o&&(n+=" etapa-ativa"),s&&(n+=" etapa-passada"),a&&(n+=" etapa-enviada"),`
            <div class="${n}" data-idx="${t}">
                <span class="etapa-icone">${a?"✅":e.icone}</span>
                <span class="etapa-titulo">${e.titulo}</span>
            </div>`}).join("")}function ua(e){const t=i.lead,a=e.replace(/\*([^*]+)\*/g,"<strong>$1</strong>").replace(/\n/g,"<br>");return`
        <div class="whatsapp-preview-container">
            <div class="whatsapp-header">
                <div class="whatsapp-avatar">👤</div>
                <div class="whatsapp-info">
                    <div class="whatsapp-name">${t.nome}</div>
                    <div class="whatsapp-status">online</div>
                </div>
            </div>
            <div class="whatsapp-chat-bg">
                <div class="whatsapp-message-sent">
                    <div class="whatsapp-message-content">${a}</div>
                    <div class="whatsapp-message-time">${new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</div>
                </div>
            </div>
            <div class="whatsapp-preview-actions">
                <button id="btn-copiar-msg" class="btn-outline btn-sm" title="Copiar mensagem">📋 Copiar</button>
                <button id="btn-wpp-popup" class="btn-outline btn-sm" title="Abrir em popup">🔗 Popup</button>
                <button id="btn-fechar-preview" class="btn-outline btn-sm">← Voltar</button>
            </div>
        </div>
    `}function ue(){const e=h[i.etapaAtual];if(!e)return"";const t=i.textos[e.id]??P(e.id),a=i.mensagens.some(s=>s.etapa===e.id),o=i.etapaAtual===h.length-1;return i.mostrarWhatsAppPreview?ua(t):`
        <div class="etapa-editor">
            <div class="etapa-editor-header">
                <span class="etapa-editor-titulo">${e.icone} ${e.titulo}</span>
                <span class="etapa-editor-desc">${e.descricao}</span>
            </div>

            ${e.id==="documentos"?la():""}

            <div class="editor-toolbar">
                ${ze()?`
                    <button id="btn-ia" class="btn-ia" ${i.melhorando?"disabled":""}>
                        ${i.melhorando?"⏳ Gerando…":"✨ Melhorar com IA"}
                    </button>`:'<span class="ia-hint">Configure VITE_GROQ_API_KEY para usar IA</span>'}
                <button id="btn-regenerar" class="btn-outline btn-sm" title="Restaurar script padrão">↺ Padrão</button>
                <button id="btn-preview-wpp" class="btn-outline btn-sm" title="Ver preview do WhatsApp">👁️ Preview</button>
            </div>

            <textarea id="editor-msg" class="editor-textarea" rows="7"
                      placeholder="Mensagem para enviar…">${t}</textarea>

            <div class="etapa-acoes">
                ${i.etapaAtual>0?'<button id="btn-voltar" class="btn-outline">← Voltar</button>':""}
                <div style="display:flex;gap:8px;margin-left:auto">
                    ${a&&!o?'<button id="btn-proxima" class="btn-outline">Próxima etapa →</button>':""}
                    <button id="btn-enviar" class="btn-enviar" ${i.enviando?"disabled":""}>
                        ${i.enviando?"⏳ Enviando…":a?"↩ Reenviar":O()?"⚡ Enviar agora":"📲 Abrir WhatsApp"}
                    </button>
                    ${o&&a?'<button id="btn-finalizar" class="btn-atender">✅ Encerrar atendimento</button>':""}
                </div>
            </div>
        </div>`}function pa(){const e=i.lead,t=String(e.whatsapp||"").replace(/\D/g,"");return`
        <div class="modal-overlay" id="conversa-modal">
            <div class="modal-box modal-chat">
                <!-- Header -->
                <div class="modal-header">
                    <div>
                        <h3 class="modal-title">💬 Atendimento — ${e.nome}</h3>
                        <p class="modal-sub">
                            ${de(e.beneficio)} ·
                            ${da(e.classificacao)} ·
                            <a class="link-wpp" href="https://wa.me/${t}" target="_blank">+${t}</a>
                        </p>
                    </div>
                    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
                        <button class="modal-close" id="conversa-fechar">✕</button>
                    </div>
                </div>
                
                <!-- Badge de status do canal -->
                <div style="padding:12px 20px;background:#f9fafb;border-bottom:1px solid #e5e7eb">
                    ${le()}
                </div>                
                ${O()?"":`
                <div style="padding:8px 20px;background:#fffbeb;border-bottom:1px solid #fbbf24">
                    <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#92400e">
                        <span>💡</span>
                        <span>
                            <strong>WhatsApp Web:</strong> 
                            ${I()?`Abre com número do ESCRITÓRIO (+${I()}) para conversar com <strong>${e.nome}</strong> (+${t})`:'<span style="color:#dc2626"><strong>ATENÇÃO:</strong> Configure VITE_WHATSAPP_NUMBER no .env</span>'}
                        </span>
                    </div>
                </div>
                `}
                <div class="chat-layout">
                    <!-- Painel esquerdo: etapas + histórico -->
                    <div class="chat-sidebar">
                        <div class="etapas-lista">${G()}</div>
                        <div class="chat-historico" id="chat-hist">${D()}</div>
                    </div>

                    <!-- Painel direito: editor da etapa atual -->
                    <div class="chat-editor" id="chat-editor">
                        ${ue()}
                    </div>
                </div>
            </div>
        </div>`}function w(){var s;const e=p==null?void 0:p.querySelector("#chat-editor");e&&(e.innerHTML=ue(),pe());const t=p==null?void 0:p.querySelector("#chat-hist");t&&(t.innerHTML=D(),t.scrollTop=t.scrollHeight);const a=p==null?void 0:p.querySelector(".etapas-lista");a&&(a.innerHTML=G());const o=p==null?void 0:p.querySelector('[style*="padding:12px 20px"]');o&&(o.innerHTML=le(),(s=o.querySelector("#btn-abrir-wpp-persistente"))==null||s.addEventListener("click",()=>{Q()}))}function pe(){var t,a,o,s,n,l,c,u,b,g,L,A;const e=p==null?void 0:p.querySelector("#chat-editor");e&&((t=e.querySelector("#editor-msg"))==null||t.addEventListener("input",y=>{const E=h[i.etapaAtual];i.textos[E.id]=y.target.value}),(a=e.querySelector("#btn-ia"))==null||a.addEventListener("click",va),(o=e.querySelector("#btn-regenerar"))==null||o.addEventListener("click",()=>{const y=h[i.etapaAtual];delete i.textos[y.id],w()}),(s=e.querySelector("#btn-preview-wpp"))==null||s.addEventListener("click",()=>{const y=h[i.etapaAtual],E=e.querySelector("#editor-msg");E&&(i.textos[y.id]=E.value),i.mostrarWhatsAppPreview=!0,w()}),(n=e.querySelector("#btn-fechar-preview"))==null||n.addEventListener("click",()=>{i.mostrarWhatsAppPreview=!1,w()}),(l=e.querySelector("#btn-copiar-msg"))==null||l.addEventListener("click",()=>{const y=h[i.etapaAtual],E=i.textos[y.id]??P(y.id);navigator.clipboard.writeText(E).then(()=>{alert("✅ Mensagem copiada para a área de transferência!")})}),(c=e.querySelector("#btn-wpp-popup"))==null||c.addEventListener("click",()=>{ma()}),(u=p==null?void 0:p.querySelector("#btn-abrir-wpp-persistente"))==null||u.addEventListener("click",()=>{Q()}),(b=e.querySelector("#btn-enviar"))==null||b.addEventListener("click",ha),(g=e.querySelector("#btn-voltar"))==null||g.addEventListener("click",()=>{i.etapaAtual>0&&(i.etapaAtual--,w())}),(L=e.querySelector("#btn-proxima"))==null||L.addEventListener("click",()=>{i.etapaAtual<h.length-1&&(i.etapaAtual++,w())}),(A=e.querySelector("#btn-finalizar"))==null||A.addEventListener("click",ga),e.querySelectorAll(".doc-check").forEach(y=>{y.addEventListener("change",()=>{var _;const E=((_=i.lead)==null?void 0:_.beneficio)||"outros",U=N[E]||N.outros;i.docsEscolhidos=[...e.querySelectorAll(".doc-check:checked")].map(j=>U[Number(j.dataset.i)]).filter(Boolean);const k=h[i.etapaAtual];i.textos[k.id]=P(k.id);const B=e.querySelector("#editor-msg");B&&(B.value=i.textos[k.id])})}))}function Q(){try{const e=I();if(!e||e.length<10){alert("⚠️ Configure VITE_WHATSAPP_NUMBER no arquivo .env com o número do escritório cadastrado na Meta.");return}const t=e.startsWith("55")?e:`55${e}`,a=`+${t.slice(0,2)} (${t.slice(2,4)}) ${t.slice(4,9)}-${t.slice(9)}`;console.log(`📱 Abrindo WhatsApp Web com número do escritório ${a} para conversar com ${i.lead.nome}`);const o=`https://web.whatsapp.com/send?phone=${t}`,s=500,n=window.screen.height-100,l=window.screen.width-s-20,c=50;if(i.whatsappWindow&&!i.whatsappWindow.closed)i.whatsappWindow.focus();else if(i.whatsappWindow=window.open(o,"WhatsAppWeb",`width=${s},height=${n},left=${l},top=${c},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`),!i.whatsappWindow||i.whatsappWindow.closed||typeof i.whatsappWindow.closed>"u")alert("⚠️ Popup bloqueado! Abrindo em nova aba..."),window.open(o,"_blank","noopener,noreferrer");else{const u=setInterval(()=>{i.whatsappWindow&&i.whatsappWindow.closed&&(clearInterval(u),w())},1e3)}w()}catch(e){console.error("Erro ao abrir WhatsApp:",e),alert(`❌ Erro ao abrir WhatsApp: ${e.message}`)}}function ma(){try{const e=h[i.etapaAtual],t=i.textos[e.id]??P(e.id),a=I();if(!a||a.length<10){alert("⚠️ Configure VITE_WHATSAPP_NUMBER no arquivo .env com o número do escritório cadastrado na Meta.");return}const o=a.startsWith("55")?a:`55${a}`,s=`+${o.slice(0,2)} (${o.slice(2,4)}) ${o.slice(4,9)}-${o.slice(9)}`,l=`+${String(i.lead.whatsapp||"").replace(/\D/g,"")}`;console.log("📱 Abrindo WhatsApp Web:"),console.log(`   → Seu número: ${s}`),console.log(`   → Para falar com: ${i.lead.nome} (${l})`),console.log(`   → Mensagem pré-escrita: "${t.substring(0,50)}..."`);const c=`https://web.whatsapp.com/send?phone=${o}&text=${encodeURIComponent(t)}`,u=500,b=window.screen.height-100,g=window.screen.width-u-20,L=50;if(i.whatsappWindow&&!i.whatsappWindow.closed)try{i.whatsappWindow.location.href=c,i.whatsappWindow.focus()}catch{i.whatsappWindow=window.open(c,"WhatsAppWeb",`width=${u},height=${b},left=${g},top=${L},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`)}else i.whatsappWindow=window.open(c,"WhatsAppWeb",`width=${u},height=${b},left=${g},top=${L},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`),(!i.whatsappWindow||i.whatsappWindow.closed||typeof i.whatsappWindow.closed>"u")&&(alert(`⚠️ Popup bloqueado! Abrindo WhatsApp em nova aba...

Dica: Permita popups para este site para melhor experiência.`),window.open(c,"_blank","noopener,noreferrer"));w()}catch(e){console.error("Erro ao abrir WhatsApp:",e),alert(`❌ Erro ao abrir WhatsApp: ${e.message}

Tentando abrir em nova aba...`);const t=I(),a=t.startsWith("55")?t:`55${t}`,o=h[i.etapaAtual],s=i.textos[o.id]??P(o.id);window.open(`https://wa.me/${a}?text=${encodeURIComponent(s)}`,"_blank")}}function fa(){const e=`
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
    `,t=document.createElement("div");t.innerHTML=e,document.body.appendChild(t.firstElementChild),document.getElementById("fechar-guia").addEventListener("click",()=>{document.getElementById("guia-api-modal").remove()}),document.getElementById("guia-api-modal").addEventListener("click",a=>{a.target.id==="guia-api-modal"&&document.getElementById("guia-api-modal").remove()})}function ba(){var e,t,a,o;(e=p==null?void 0:p.querySelector("#conversa-fechar"))==null||e.addEventListener("click",F),(t=p==null?void 0:p.querySelector("#conversa-modal"))==null||t.addEventListener("click",s=>{s.target.id==="conversa-modal"&&F()}),(a=p==null?void 0:p.querySelector("#btn-abrir-wpp-persistente"))==null||a.addEventListener("click",()=>{Q()}),(o=p==null?void 0:p.querySelector("#btn-ver-guia"))==null||o.addEventListener("click",()=>{fa()}),pe()}async function va(){var o;const e=h[i.etapaAtual],t=p==null?void 0:p.querySelector("#editor-msg"),a=(t==null?void 0:t.value)||"";i.melhorando=!0,w();try{const s=((o=i.lead)==null?void 0:o.beneficio)||"outros",n=i.docsEscolhidos,l=await je({etapa:e.id,nome:i.lead.nome,beneficio:de(i.lead.beneficio),situacao:i.lead.situacao,classificacao:i.lead.classificacao,observacoes:i.lead.observacoes||"",documentos:n,mensagemAtual:a});i.textos[e.id]=l}catch(s){alert(`Erro na IA: ${s.message}`)}finally{i.melhorando=!1,w()}}async function ha(){var o;const e=h[i.etapaAtual],t=p==null?void 0:p.querySelector("#editor-msg"),a=((t==null?void 0:t.value)||"").trim();if(!a){alert("Escreva a mensagem antes de enviar.");return}i.enviando=!0,w();try{const{canal:s}=await De(i.lead.whatsapp,a);i.mensagens.push({etapa:e.id,texto:a,canal:s,sent:!0,ts:new Date().toISOString()});const n=String(i.lead.whatsapp||"").replace(/\D/g,"");if(await ke({lead_id:i.lead.id,tipo:"whatsapp",direcao:"enviado",descricao:`[${e.titulo}] ${a}`,responsavel:((o=i.profile)==null?void 0:o.nome)||"",numero_lead:n}),i.etapaAtual<h.length-1&&i.etapaAtual++,s!=="wame"){const l=s==="meta"?"✅ Enviado via Meta WhatsApp!":"✅ Enviado via Evolution API!",c=document.createElement("div");c.className="toast-success",c.textContent=l,document.body.appendChild(c),setTimeout(()=>c.remove(),3e3)}}catch(s){alert(`Erro ao enviar: ${s.message}`)}finally{i.enviando=!1,w()}}async function ga(){var e;try{await ae(i.lead.id,"qualificado"),i.lead.status_atendimento="qualificado",(e=i.onLeadUpdated)==null||e.call(i,i.lead),F()}catch(t){alert(`Erro ao encerrar: ${t.message}`)}}async function wa(){try{const a=await Te(i.lead.id);i.mensagens=a.map(o=>{var s,n;return{etapa:((s=h.find(l=>{var c;return(c=o.descricao)==null?void 0:c.startsWith(`[${l.titulo}]`)}))==null?void 0:s.id)||null,direcao:o.direcao||"enviado",texto:o.direcao==="recebido"?o.descricao:((n=o.descricao)==null?void 0:n.replace(/^\[.*?\]\s*/,""))||o.descricao,canal:o.tipo==="whatsapp_recebido"?"recebido":"enviado",ts:o.created_at}})}catch{}const e=p==null?void 0:p.querySelector("#chat-hist");e&&(e.innerHTML=D(),e.scrollTop=e.scrollHeight);const t=p==null?void 0:p.querySelector(".etapas-lista");t&&(t.innerHTML=G())}function $a(){i._channel=We(i.lead.id,e=>{if(i.mensagens.some(o=>o.ts===e.created_at&&o.texto===e.descricao))return;i.mensagens.push({etapa:null,direcao:e.direcao||"recebido",texto:e.descricao,canal:e.tipo==="whatsapp_recebido"?"recebido":"enviado",ts:e.created_at});const a=p==null?void 0:p.querySelector("#chat-hist");a&&(a.innerHTML=D(),a.scrollTop=a.scrollHeight)})}function F(){var e,t;i._channel&&(i._channel.unsubscribe(),i._channel=null),(e=p==null?void 0:p.querySelector("#conversa-modal"))==null||e.remove(),p=null,(t=i.onClose)==null||t.call(i)}function me({lead:e,profile:t,container:a,onClose:o,onLeadUpdated:s}){i.lead=e,i.profile=t,i.onClose=o,i.onLeadUpdated=s,i.etapaAtual=0,i.mensagens=[],i.enviando=!1,i.melhorando=!1,i.textos={};const n=N[e.beneficio]||N.outros;i.docsEscolhidos=[...n],p=a;const l=document.createElement("div");l.innerHTML=pa(),a.appendChild(l.firstElementChild),ba(),wa(),$a()}const ya={aposentadoria:"Aposentadoria","auxilio-doenca":"Auxílio-doença","bpc-loas":"BPC/LOAS","beneficio-negado":"Ben. Negado",outros:"Outros"},Ea={"primeiro-pedido":"1º Pedido","em-analise":"Em análise",indeferido:"Indeferido",cessado:"Cessado"},xa={novo:"Novo","em-contato":"Em contato",qualificado:"Qualificado",convertido:"Convertido",descartado:"Descartado"},r={tab:"leads",leads:[],usuarios:[],loading:!1,loadingUsuarios:!1,erro:"",erroUsuarios:"",filtroClassificacao:"",filtroStatus:"novo",filtroBeneficio:"",modalNovoUsuario:!1,salvandoUsuario:!1,erroNovoUsuario:""};let m=null,$=null;function fe(e){return e?new Date(e).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"-"}function Sa(e){return String(e||"").replace(/^\+/,"")}function be(){return r.leads.filter(e=>!(r.filtroClassificacao&&e.classificacao!==r.filtroClassificacao||r.filtroStatus&&e.status_atendimento!==r.filtroStatus||r.filtroBeneficio&&e.beneficio!==r.filtroBeneficio))}function Aa(e){return`<span class="chip ${{Alta:"chip-alta",Média:"chip-media",Baixa:"chip-baixa"}[e]||"chip-baixa"}">${e}</span>`}function qa(e){return`<span class="badge ${{novo:"badge-novo","em-contato":"badge-em-contato",qualificado:"badge-qualificado",convertido:"badge-convertido",descartado:"badge-descartado"}[e]||"badge-novo"}">${xa[e]||e}</span>`}function Ca(){return`
        <header class="ad-header">
            <div class="ad-header-left">
                <span class="ad-icon">⚖️</span>
                <div>
                    <h1 class="ad-title">Painel Administrativo</h1>
                    <span class="ad-sub">Olá, ${($==null?void 0:$.nome)||"Admin"} · Administrador</span>
                </div>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
                <nav class="ad-tabs">
                    <button class="ad-tab ${r.tab==="leads"?"ad-tab-active":""}" data-tab="leads">📊 Leads</button>
                    <button class="ad-tab ${r.tab==="usuarios"?"ad-tab-active":""}" data-tab="usuarios">👥 Usuários</button>
                </nav>
                <button id="btn-logout" class="btn-outline btn-sm">Sair</button>
            </div>
        </header>`}function ve(e){const t=e.length,a=e.filter(n=>n.classificacao==="Alta").length,o=e.filter(n=>n.status_atendimento==="em-contato").length,s=e.filter(n=>n.status_atendimento==="convertido").length;return`
        <div class="ad-stats">
            <div class="stat-card"><span class="stat-n">${t}</span><span class="stat-l">Total de leads</span></div>
            <div class="stat-card sc-alta"><span class="stat-n">${a}</span><span class="stat-l">Prioridade Alta</span></div>
            <div class="stat-card sc-contato"><span class="stat-n">${o}</span><span class="stat-l">Em contato</span></div>
            <div class="stat-card sc-conv"><span class="stat-n">${s}</span><span class="stat-l">Convertidos</span></div>
        </div>`}function La(){const e=(t,a,o)=>`<select id="${t}" class="ad-select">
            ${o.map(([s,n])=>`<option value="${s}" ${a===s?"selected":""}>${n}</option>`).join("")}
        </select>`;return`
        <div class="ad-filtros">
            ${e("f-class",r.filtroClassificacao,[["","Todas as prioridades"],["Alta","Alta"],["Média","Média"],["Baixa","Baixa"]])}
            ${e("f-status",r.filtroStatus,[["","Todos os status"],["novo","Novo"],["em-contato","Em contato"],["qualificado","Qualificado"],["convertido","Convertido"],["descartado","Descartado"]])}
            ${e("f-benef",r.filtroBeneficio,[["","Todos os benefícios"],["aposentadoria","Aposentadoria"],["auxilio-doenca","Auxílio-doença"],["bpc-loas","BPC/LOAS"],["beneficio-negado","Ben. Negado"],["outros","Outros"]])}
            <button id="btn-refresh" class="btn-outline" style="margin-left:auto">↻ Atualizar</button>
        </div>`}function he(e){return r.loading?'<div class="ad-feedback ad-loading">Carregando leads…</div>':r.erro?`<div class="ad-feedback ad-erro">${r.erro}</div>`:e.length?`
        <div class="table-wrap">
            <table class="leads-table">
                <thead><tr>
                    <th>Lead</th><th>WhatsApp</th><th>Benefício / Situação</th>
                    <th>Prioridade</th><th>Status</th><th>Data</th><th>Ações</th>
                </tr></thead>
                <tbody>${e.map(a=>{const o=Sa(a.whatsapp),s=!["convertido","descartado"].includes(a.status_atendimento),n=ya[a.beneficio]||a.beneficio,l=Ea[a.situacao]||a.situacao;return`
            <tr data-id="${a.id}">
                <td>
                    <div class="lead-nome">${a.nome}</div>
                    <div class="lead-detalhe">${a.cidade} · ${a.idade} anos · ${a.contribuicao_anos} anos contrib.${a.sexo?` · ${a.sexo==="masculino"?"M":a.sexo==="feminino"?"F":""}`:""}</div>
                    ${a.observacoes?`<div class="lead-obs">${a.observacoes}</div>`:""}
                </td>
                <td><a class="link-wpp" href="https://wa.me/${o}" target="_blank" rel="noopener noreferrer">+${o}</a></td>
                <td>
                    <div class="td-stack"><span>${n}</span><span class="lead-detalhe">${l}</span></div>
                </td>
                <td>
                    <div class="td-stack">${Aa(a.classificacao)}<span class="score-badge">score ${a.score}</span></div>
                </td>
                <td>
                    <select class="status-select" data-id="${a.id}" data-current="${a.status_atendimento}">
                        <option value="novo"        ${a.status_atendimento==="novo"?"selected":""}>Novo</option>
                        <option value="em-contato"  ${a.status_atendimento==="em-contato"?"selected":""}>Em contato</option>
                        <option value="qualificado" ${a.status_atendimento==="qualificado"?"selected":""}>Qualificado</option>
                        <option value="convertido"  ${a.status_atendimento==="convertido"?"selected":""}>Convertido</option>
                        <option value="descartado"  ${a.status_atendimento==="descartado"?"selected":""}>Descartado</option>
                    </select>
                </td>
                <td class="td-data">${fe(a.created_at)}</td>
                <td class="td-acoes">
                    <div style="display:flex;gap:4px;align-items:center">
                        ${s?`
                            <button class="btn-atender"
                                data-id="${a.id}" data-nome="${a.nome}" data-wpp="${o}"
                                data-beneflabel="${n}" data-classificacao="${a.classificacao}">
                                📲 Atender
                            </button>`:qa(a.status_atendimento)}
                        <button class="btn-icon" data-action="edit-nome" data-id="${a.id}" data-nome="${a.nome}" title="Editar dados do lead">
                            ✏️
                        </button>
                        ${($==null?void 0:$.role)==="admin"?`
                        <button class="btn-icon btn-delete" data-action="delete" data-id="${a.id}" data-nome="${a.nome}" title="Excluir lead (somente admin)">
                            🗑️
                        </button>`:""}
                    </div>
                </td>
            </tr>`}).join("")}</tbody>
            </table>
        </div>`:'<div class="ad-feedback ad-vazio">Nenhum lead encontrado.</div>'}function ka(){const e=be();return`
        ${ve(r.leads)}
        ${La()}
        <section class="ad-table-section" id="leads-section">
            <div class="ad-table-head">
                <h2>Leads <span class="count-badge">${e.length}</span></h2>
            </div>
            ${he(e)}
        </section>`}function ge(){return r.modalNovoUsuario?`
        <div class="modal-overlay" id="modal-usuario">
            <div class="modal-box">
                <div class="modal-header">
                    <h3 class="modal-title">Novo Usuário</h3>
                    <button class="modal-close" id="modal-user-close">✕</button>
                </div>
                ${r.erroNovoUsuario?`<div class="ad-feedback ad-erro" style="margin-bottom:12px;line-height:1.5;white-space:pre-wrap">${r.erroNovoUsuario}</div>`:""}
                <form id="form-novo-usuario">
                    <div class="form-row">
                        <label class="al-label">Nome completo</label>
                        <input id="nu-nome" class="al-input" type="text" required placeholder="João Silva" autocomplete="off" />
                    </div>
                    <div class="form-row">
                        <label class="al-label">E-mail</label>
                        <input id="nu-email" class="al-input" type="email" required placeholder="joao@email.com" autocomplete="off" />
                    </div>
                    <div class="form-row">
                        <label class="al-label">Senha inicial</label>
                        <input id="nu-senha" class="al-input" type="password" required placeholder="Mínimo 6 caracteres" minlength="6" />
                    </div>
                    <div class="form-row">
                        <label class="al-label">Perfil de acesso</label>
                        <select id="nu-role" class="al-input">
                            <option value="comum">Usuário Comum — Atendimento inicial + solicitação de documentos</option>
                            <option value="admin">Administrador — Acesso total + gestão de usuários</option>
                        </select>
                    </div>
                    <div class="modal-footer" style="margin-top:20px">
                        <button type="button" id="modal-user-cancel" class="btn-outline">Cancelar</button>
                        <button type="submit" class="btn-atender" ${r.salvandoUsuario?"disabled":""}>
                            ${r.salvandoUsuario?"Criando…":"✓ Criar usuário"}
                        </button>
                    </div>
                </form>
            </div>
        </div>`:""}function z(){if(r.loadingUsuarios)return'<div class="ad-feedback ad-loading" style="margin:24px">Carregando usuários…</div>';if(r.erroUsuarios)return`<div class="ad-feedback ad-erro" style="margin:24px">${r.erroUsuarios}</div>`;const t=r.usuarios.map(a=>{const o=a.id===($==null?void 0:$.id);return`
            <tr>
                <td>
                    <div class="lead-nome">${a.nome||"—"}</div>
                    <div class="lead-detalhe">${a.email}</div>
                </td>
                <td>
                    <span class="role-badge ${a.role==="admin"?"role-admin":"role-comum"}">
                        ${a.role==="admin"?"🔐 Admin":"👤 Comum"}
                    </span>
                </td>
                <td>
                    <span class="badge ${a.ativo?"badge-qualificado":"badge-descartado"}">
                        ${a.ativo?"Ativo":"Inativo"}
                    </span>
                </td>
                <td class="td-data">${fe(a.created_at)}</td>
                <td class="td-acoes" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
                    ${o?'<span class="score-badge">(você)</span>':`
                        <select class="status-select role-select" data-id="${a.id}" data-current="${a.role}">
                            <option value="comum" ${a.role==="comum"?"selected":""}>Comum</option>
                            <option value="admin" ${a.role==="admin"?"selected":""}>Admin</option>
                        </select>
                        <button class="btn-outline btn-sm ${a.ativo?"btn-desativar":"btn-ativar"}"
                            data-id="${a.id}" data-ativo="${a.ativo}">
                            ${a.ativo?"Desativar":"Ativar"}
                        </button>`}
                </td>
            </tr>`}).join("")||'<tr><td colspan="5"><div class="ad-feedback ad-vazio">Nenhum usuário encontrado.</div></td></tr>';return`
        <section class="ad-table-section" style="margin-top:16px">
            <div class="ad-table-head">
                <h2>Usuários <span class="count-badge">${r.usuarios.length}</span></h2>
                <button id="btn-novo-usuario" class="btn-atender" style="margin-left:auto">+ Novo usuário</button>
            </div>
            <div class="table-wrap">
                <table class="leads-table">
                    <thead><tr>
                        <th>Usuário</th><th>Perfil</th><th>Status</th><th>Cadastro</th><th>Ações</th>
                    </tr></thead>
                    <tbody>${t}</tbody>
                </table>
            </div>
        </section>
        ${ge()}`}function Ta(){return`
        <div class="ad-layout">
            ${Ca()}
            <div class="ad-tab-content">
                ${r.tab==="leads"?ka():z()}
            </div>
        </div>`}function S(){const e=m==null?void 0:m.querySelector("#leads-section");if(!e)return;const t=be();e.querySelector("h2").innerHTML=`Leads <span class="count-badge">${t.length}</span>`;const a=e.querySelector(".table-wrap, .ad-feedback"),o=document.createElement("div");o.innerHTML=he(t);const s=o.firstElementChild;a&&s?a.replaceWith(s):s&&e.appendChild(s),ye()}function we(){const e=m==null?void 0:m.querySelector(".ad-stats");if(!e)return;const t=document.createElement("div");t.innerHTML=ve(r.leads),e.replaceWith(t.firstElementChild)}function T(){var e;if((e=m.querySelector("#modal-usuario"))==null||e.remove(),r.modalNovoUsuario){const t=document.createElement("div");t.innerHTML=ge(),m.querySelector(".ad-layout").appendChild(t.firstElementChild),Wa()}}function $e(){m&&(m.innerHTML=Ta(),Na())}function ye(){m.querySelectorAll(".btn-atender").forEach(e=>e.addEventListener("click",()=>_a(e.dataset))),m.querySelectorAll(".status-select:not(.role-select)").forEach(e=>e.addEventListener("change",()=>Ba(e))),m.querySelectorAll('[data-action="edit-nome"]').forEach(e=>{e.addEventListener("click",()=>Pa(e.dataset))}),m.querySelectorAll('[data-action="delete"]').forEach(e=>{e.addEventListener("click",()=>Ua(e.dataset))})}function J(){var e;(e=m.querySelector("#btn-novo-usuario"))==null||e.addEventListener("click",()=>{r.modalNovoUsuario=!0,r.erroNovoUsuario="",T()}),m.querySelectorAll(".role-select").forEach(t=>t.addEventListener("change",()=>Ma(t))),m.querySelectorAll("[data-ativo]").forEach(t=>t.addEventListener("click",()=>za(t)))}function Wa(){var t,a,o;const e=()=>{r.modalNovoUsuario=!1,r.erroNovoUsuario="",T()};(t=m.querySelector("#modal-user-close"))==null||t.addEventListener("click",e),(a=m.querySelector("#modal-user-cancel"))==null||a.addEventListener("click",e),(o=m.querySelector("#form-novo-usuario"))==null||o.addEventListener("submit",Ha)}function Na(){var e,t,a,o,s;(e=m.querySelector("#btn-logout"))==null||e.addEventListener("click",async()=>{await V(),window.location.reload()}),m.querySelectorAll(".ad-tab").forEach(n=>n.addEventListener("click",()=>Ia(n.dataset.tab))),r.tab==="leads"&&((t=m.querySelector("#btn-refresh"))==null||t.addEventListener("click",Y),(a=m.querySelector("#f-class"))==null||a.addEventListener("change",n=>{r.filtroClassificacao=n.target.value,S()}),(o=m.querySelector("#f-status"))==null||o.addEventListener("change",n=>{r.filtroStatus=n.target.value,S()}),(s=m.querySelector("#f-benef"))==null||s.addEventListener("change",n=>{r.filtroBeneficio=n.target.value,S()}),ye()),r.tab==="usuarios"&&J()}function Ia(e){r.tab=e,$e(),e==="leads"&&Y(),e==="usuarios"&&xe()}async function Ba(e){const{id:t,current:a}=e.dataset,o=e.value;if(o!==a)try{await ae(t,o);const s=r.leads.find(n=>n.id===t);s&&(s.status_atendimento=o),e.dataset.current=o,we()}catch(s){alert(`Erro ao atualizar status: ${s.message}`),e.value=a}}async function _a({id:e}){const t=r.leads.find(a=>a.id===e);t&&me({lead:t,profile:$,container:m,onLeadUpdated:a=>{const o=r.leads.findIndex(s=>s.id===a.id);o!==-1&&(r.leads[o]={...r.leads[o],...a}),S()},onClose:()=>S()})}async function Pa({id:e}){const t=r.leads.find(a=>a.id===e);t&&se({lead:t,profile:$,onSaved:a=>{const o=r.leads.findIndex(s=>s.id===e);o!==-1&&(r.leads[o]=a),S()},onClose:()=>S()})}async function Ua({id:e}){const t=r.leads.find(a=>a.id===e);if(t&&confirm(`Tem certeza que deseja excluir o lead "${t.nome}"?

Esta ação não pode ser desfeita.`))try{await Le(e),r.leads=r.leads.filter(a=>a.id!==e),S(),Ee("Lead excluído")}catch(a){alert(`Erro ao excluir lead: ${a.message}`)}}async function Ma(e){const{id:t,current:a}=e.dataset,o=e.value;if(o!==a){if(!confirm(`Alterar perfil para "${o}"?`)){e.value=a;return}try{await Be(t,o);const s=r.usuarios.find(n=>n.id===t);s&&(s.role=o),e.dataset.current=o}catch(s){alert(`Erro: ${s.message}`),e.value=a}}}async function za(e){const{id:t,ativo:a}=e.dataset,o=a!=="true";if(confirm(`Deseja ${o?"ativar":"desativar"} este usuário?`))try{await Ie(t,o);const s=r.usuarios.find(l=>l.id===t);s&&(s.ativo=o);const n=m.querySelector(".ad-tab-content");n&&(n.innerHTML=z(),J())}catch(s){alert(`Erro: ${s.message}`)}}let X=0;async function Ha(e){if(e.preventDefault(),r.salvandoUsuario)return;const t=Date.now();if(t-X<2e3){r.erroNovoUsuario="⚠️ Aguarde alguns segundos antes de tentar novamente.",T();return}X=t;const a=m.querySelector("#nu-nome").value.trim(),o=m.querySelector("#nu-email").value.trim(),s=m.querySelector("#nu-senha").value,n=m.querySelector("#nu-role").value;if(!a||!o||!s){r.erroNovoUsuario="⚠️ Preencha todos os campos obrigatórios.",T();return}r.salvandoUsuario=!0,r.erroNovoUsuario="",T();try{await Ce({nome:a,email:o,password:s,role:n}),r.modalNovoUsuario=!1,r.salvandoUsuario=!1,await xe(),Ee("✅ Usuário criado com sucesso!","success")}catch(l){r.salvandoUsuario=!1,r.erroNovoUsuario=l.message,T()}}function Ee(e,t="success"){const a=document.createElement("div");a.className=`toast-${t}`,a.textContent=e,document.body.appendChild(a),setTimeout(()=>a.remove(),4e3)}async function Y(){r.loading=!0,r.erro="",S();try{r.leads=await ee()}catch(e){r.erro=e.message}finally{r.loading=!1,we(),S()}}async function xe(){r.loadingUsuarios=!0,r.erroUsuarios="";const e=m==null?void 0:m.querySelector(".ad-tab-content");e&&r.tab==="usuarios"&&(e.innerHTML=z());try{r.usuarios=await Ne()}catch(t){r.erroUsuarios=t.message}finally{r.loadingUsuarios=!1,e&&r.tab==="usuarios"&&(e.innerHTML=z(),J())}}function Oa(e,t){m=e,$=t,$e(),Y()}const C=document.querySelector("#admin-app");function H(e=""){C.innerHTML=`
        <div class="al-wrap">
            <div class="al-card">
                <div class="al-icon">⚖️</div>
                <h1 class="al-title">Central INSS</h1>
                <p class="al-sub">Acesso interno — equipe do escritório</p>
                ${e?`<div class="al-alert">${e}</div>`:""}
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
        </div>`,C.querySelector("#login-form").addEventListener("submit",async t=>{t.preventDefault();const a=C.querySelector("#login-btn"),o=C.querySelector("#login-email").value.trim(),s=C.querySelector("#login-senha").value;a.disabled=!0,a.textContent="Entrando…";try{const{profile:n}=await Ae(o,s);Se(n)}catch(n){H(n.message)}})}function Se(e){if(!(e!=null&&e.ativo)){V(),H("Usuário inativo. Contate o administrador.");return}e.role==="admin"?Oa(C,e):ca(C,e)}async function Da(){if(!f){C.innerHTML=`
            <div class="al-wrap">
                <div class="al-card">
                    <div class="al-icon">⚠️</div>
                    <h2 class="al-title">Supabase não configurado</h2>
                    <p class="al-sub">Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.</p>
                </div>
            </div>`;return}C.innerHTML='<div class="al-wrap"><div class="al-card" style="text-align:center;color:#6b7280">Verificando sessão…</div></div>';try{const e=await qe();e!=null&&e.profile?Se(e.profile):H()}catch{H()}}Da();
