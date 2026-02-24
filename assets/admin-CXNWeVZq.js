import{s as u}from"./supabase-DBx6agDF.js";async function ba(a,t){const{data:e,error:o}=await u.auth.signInWithPassword({email:a,password:t});if(o)throw new Error(o.message);const n=await V(e.user.id);return{user:e.user,profile:n}}async function B(){await u.auth.signOut()}async function ha(){const{data:a}=await u.auth.getSession();if(!a.session)return null;const t=await V(a.session.user.id);return{user:a.session.user,profile:t}}async function V(a){const{data:t,error:e}=await u.from("profiles").select("*").eq("id",a).single();if(e)throw new Error(`Perfil não encontrado: ${e.message}`);return t}async function ga({nome:a,email:t,password:e,role:o}){const{data:n}=await u.auth.getSession(),i=n==null?void 0:n.session,{data:l,error:p}=await u.auth.signUp({email:t,password:e,options:{data:{nome:a,role:o}}});if(p)throw new Error(`Erro ao criar usuário: ${p.message}`);if(!l.user)throw new Error('Usuário não foi criado. No painel do Supabase, vá em Authentication → Settings e desative "Confirm email".');i!=null&&i.access_token&&await u.auth.setSession({access_token:i.access_token,refresh_token:i.refresh_token});const{error:m}=await u.from("profiles").upsert({id:l.user.id,email:t,nome:a,role:o},{onConflict:"id"});if(m)throw new Error(`Usuário criado, mas erro no perfil: ${m.message}`);return l.user}async function W({classificacao:a="",status:t="",beneficio:e=""}={}){if(!u)throw new Error("Supabase não configurado.");let o=u.from("leads").select("*").order("created_at",{ascending:!1});a&&(o=o.eq("classificacao",a)),t&&(o=o.eq("status_atendimento",t)),e&&(o=o.eq("beneficio",e));const{data:n,error:i}=await o;if(i)throw new Error(`Erro ao buscar leads: ${i.message}`);return n||[]}async function G(a,t){if(!u)throw new Error("Supabase não configurado.");const{error:e}=await u.from("leads").update({status_atendimento:t}).eq("id",a);if(e)throw new Error(`Erro ao atualizar lead: ${e.message}`)}async function $a({lead_id:a,tipo:t="whatsapp",direcao:e="enviado",descricao:o,responsavel:n="",numero_lead:i=""}){if(!u)throw new Error("Supabase não configurado.");const{error:l}=await u.from("atendimentos").insert([{lead_id:a,tipo:t,direcao:e,descricao:o,responsavel:n,numero_lead:i}]);if(l)throw new Error(`Erro ao salvar atendimento: ${l.message}`)}async function ya(a){if(!u)throw new Error("Supabase não configurado.");const{data:t,error:e}=await u.from("atendimentos").select("*").eq("lead_id",a).order("created_at",{ascending:!0});if(e)throw new Error(`Erro ao buscar atendimentos: ${e.message}`);return t||[]}function Sa(a,t){return u.channel(`atendimentos:lead:${a}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"atendimentos",filter:`lead_id=eq.${a}`},o=>t(o.new)).subscribe()}async function Ea(){const{data:a,error:t}=await u.from("profiles").select("*").order("created_at",{ascending:!1});if(t)throw new Error(`Erro ao listar usuários: ${t.message}`);return a||[]}async function wa(a,t){const{error:e}=await u.from("profiles").update({ativo:t}).eq("id",a);if(e)throw new Error(`Erro ao atualizar usuário: ${e.message}`)}async function Aa(a,t){const{error:e}=await u.from("profiles").update({role:t}).eq("id",a);if(e)throw new Error(`Erro ao atualizar perfil: ${e.message}`)}const Q="https://bhargdkruycbrcanfvuz.supabase.co",J="",qa="",La="";function M(){return!!J}function Ca(){return!!Q}async function xa(a,t){const e=String(a).replace(/\D/g,""),o=e.startsWith("55")?e:`55${e}`,n=`${J.replace(/\/$/,"")}/message/sendText/${La}`,i=await fetch(n,{method:"POST",headers:{"Content-Type":"application/json",apikey:qa},body:JSON.stringify({number:o,textMessage:{text:t}})});if(!i.ok){const l=await i.json().catch(()=>({}));throw new Error(l.message||`Evolution API erro ${i.status}`)}return await i.json()}function Ua(a,t){const e=String(a).replace(/\D/g,"");window.open(`https://wa.me/${e}?text=${encodeURIComponent(t)}`,"_blank","noopener,noreferrer")}async function Ta(a,t){return M()?(await xa(a,t),{canal:"evolution"}):(Ua(a,t),{canal:"wame"})}async function Na(a){var x,z,H,D,R;const{etapa:t,nome:e,beneficio:o,situacao:n,classificacao:i,observacoes:l,documentos:p,mensagemAtual:m}=a,y=`Você é um atendente humanizado de um escritório de advocacia especializado em INSS.
Seu tom é acolhedor, respeitoso e profissional.
Escreva em português do Brasil.
Seja direto, evite textos muito longos.
Nunca invente informações jurídicas.
Use o formato WhatsApp para negrito (*texto*).`,w={abertura:`Escreva uma mensagem de abertura calorosa para ${e}, que entrou em contato sobre *${o}* (situação: ${n}). Prioridade: ${i}. ${l?`Observação: ${l}`:""} Apresente o escritório e pergunte se pode atendê-lo agora.`,qualificacao:`Escreva uma mensagem de qualificação para ${e} sobre *${o}*. Faça 2 perguntas objetivas para entender melhor a situação antes de pedir os documentos.`,documentos:`Escreva uma mensagem solicitando os seguintes documentos para ${e}: ${p==null?void 0:p.join(", ")}. Seja gentil e explique resumidamente para que servem.`,encerramento:`Escreva uma mensagem de encerramento para ${e}, informando que os documentos foram recebidos e o especialista entrará em contato em breve. Agradeça e seja encorajador.`,personalizada:`Melhore esta mensagem mantendo tom humanizado, sem alterar informações essenciais:

${m}`},q={model:"llama-3.3-70b-versatile",messages:[{role:"system",content:y},{role:"user",content:w[t]||w.personalizada}],temperature:.7,max_tokens:400};let g;if(g=await fetch(`${Q}/functions/v1/groq-proxy`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(q)}),!g.ok){const va=await g.json().catch(()=>({}));throw new Error(((x=va.error)==null?void 0:x.message)||`Groq erro ${g.status}`)}return((R=(D=(H=(z=(await g.json()).choices)==null?void 0:z[0])==null?void 0:H.message)==null?void 0:D.content)==null?void 0:R.trim())||""}function ka(a,{nome:t,beneficio:e,situacao:o,classificacao:n,documentos:i=[],observacoes:l=""}){const p=e.replace("-"," ");return{abertura:`Olá, ${t}! 👋

Aqui é do escritório especializado em INSS. Recebemos sua solicitação sobre *${p}* e ficamos felizes em poder ajudar! 🤝

Podemos conversar agora para entender melhor o seu caso?`,qualificacao:`${t}, para que possamos orientá-lo da melhor forma sobre seu processo de *${p}*, gostaríamos de entender um pouco mais:

1️⃣ Você já deu entrada nesse benefício anteriormente ou será o primeiro pedido?

2️⃣ Você possui todos os seus documentos de contribuição (carteira de trabalho, CNIS)?`,documentos:i.length?`${t}, para darmos entrada no seu processo de *${p}*, precisamos dos seguintes documentos:

${i.map((y,w)=>`${w+1}. ${y}`).join(`
`)}

Assim que reunir, nos envie por aqui ou agende uma visita! 📋`:`${t}, em breve nosso especialista entrará em contato para informar os documentos necessários para o seu caso de *${p}*. ✅`,encerramento:`${t}, recebemos tudo! 🎉

Nosso especialista vai analisar o seu caso e entrará em contato em breve para os próximos passos.

Qualquer dúvida, estamos aqui! 😊

Conte conosco! ⚖️`}[a]||""}const A={aposentadoria:["RG e CPF (originais e cópias)","Carteira de Trabalho (CTPS) — todas as folhas utilizadas","Extrato do CNIS (Cadastro Nacional de Informações Sociais)","PIS/PASEP","Comprovante de residência atualizado","Certidão de nascimento ou casamento"],"auxilio-doenca":["RG e CPF","Laudo médico atualizado (com CID, assinado e carimbado)","Atestados e exames recentes","Extrato do CNIS","PIS/PASEP","Comprovante de residência"],"bpc-loas":["RG e CPF de todos os membros da família","Comprovante de residência atualizado","Declaração de composição e renda familiar","Laudo médico (para pessoa com deficiência — com CID)","Certidão de nascimento ou casamento","Número do NIS/CADUNICO (se possuir)"],"beneficio-negado":["RG e CPF","Carta de indeferimento do INSS","Todos os documentos do pedido original","Extrato do CNIS","Laudos ou documentos adicionais que embasem o recurso","Comprovante de residência"],outros:["RG e CPF","Extrato do CNIS","Comprovante de residência","Documentos específicos conforme orientação do especialista"]},Ia={aposentadoria:"Aposentadoria","auxilio-doenca":"Auxílio-doença","bpc-loas":"BPC/LOAS","beneficio-negado":"Benefício Negado",outros:"Outros"},f={leads:[],loading:!1,erro:"",filtroStatus:"novo",modal:null};let v=null,L=null;function Pa(a){return a?new Date(a).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"-"}function F(a){return String(a||"").replace(/^\+/,"")}function Ba(a){return`<span class="chip ${{Alta:"chip-alta",Média:"chip-media",Baixa:"chip-baixa"}[a]||"chip-baixa"}">${a}</span>`}function K(){return f.leads.filter(a=>!(f.filtroStatus&&a.status_atendimento!==f.filtroStatus))}function Ma(){return`
        <header class="ad-header">
            <div class="ad-header-left">
                <span class="ad-icon">📋</span>
                <div>
                    <h1 class="ad-title">Atendimento Inicial</h1>
                    <span class="ad-sub">Olá, ${(L==null?void 0:L.nome)||"Atendente"} · Usuário Comum</span>
                </div>
            </div>
            <button id="btn-logout" class="btn-outline btn-sm">Sair</button>
        </header>`}function _a(){return`
        <div class="ad-filtros">
            ${[["novo","Novos"],["em-contato","Em contato"],["qualificado","Qualificado"],["","Todos"]].map(([t,e])=>`<button class="tab-pill ${f.filtroStatus===t?"tab-pill-active":""}"
                    data-status="${t}">${e}</button>`).join("")}
            <button id="btn-refresh" class="btn-outline" style="margin-left:auto">↻ Atualizar</button>
        </div>`}function Y(a){return f.loading?'<div class="ad-feedback ad-loading">Carregando leads…</div>':f.erro?`<div class="ad-feedback ad-erro">${f.erro}</div>`:a.length?`
        <div class="table-wrap">
            <table class="leads-table">
                <thead><tr>
                    <th>Lead</th><th>WhatsApp</th><th>Benefício</th>
                    <th>Prioridade</th><th>Status</th><th>Data</th><th>Ação</th>
                </tr></thead>
                <tbody>${a.map(e=>{const o=Ia[e.beneficio]||e.beneficio,n=["novo","em-contato"].includes(e.status_atendimento);return`
            <tr>
                <td>
                    <div class="lead-nome">${e.nome}</div>
                    <div class="lead-detalhe">${e.cidade} · ${e.idade} anos</div>
                    ${e.observacoes?`<div class="lead-obs">${e.observacoes}</div>`:""}
                </td>
                <td>
                    <a class="link-wpp" href="https://wa.me/${F(e.whatsapp)}"
                       target="_blank" rel="noopener noreferrer">
                        ${e.whatsapp}
                    </a>
                </td>
                <td>${o}</td>
                <td>${Ba(e.classificacao)}</td>
                <td><span class="badge badge-${e.status_atendimento}">${e.status_atendimento.replace("-"," ")}</span></td>
                <td class="td-data">${Pa(e.created_at)}</td>
                <td>
                    ${n?`
                        <button class="btn-docs"
                            data-id="${e.id}"
                            data-nome="${e.nome}"
                            data-wpp="${F(e.whatsapp)}"
                            data-beneficio="${e.beneficio}"
                            data-beneflabel="${o}">
                            📄 Solicitar docs
                        </button>`:'<span class="score-badge">—</span>'}
                </td>
            </tr>`}).join("")}</tbody>
            </table>
        </div>`:'<div class="ad-feedback ad-vazio">Nenhum lead encontrado.</div>'}function Oa(){const a=K();return`
        <div class="ad-layout">
            ${Ma()}
            <div class="ad-info-bar">
                <span>👤 Seu perfil permite realizar o atendimento inicial: solicitar documentos e encaminhar leads ao especialista.</span>
            </div>
            ${_a()}
            <section class="ad-table-section">
                <div class="ad-table-head">
                    <h2>Leads <span class="count-badge">${a.length}</span></h2>
                </div>
                ${Y(a)}
            </section>
            
        </div>`}function C(){const a=v==null?void 0:v.querySelector(".ad-table-section");if(!a)return;const t=K();a.querySelector("h2").innerHTML=`Leads <span class="count-badge">${t.length}</span>`;const e=a.querySelector(".table-wrap, .ad-feedback"),o=Y(t),n=document.createElement("div");n.innerHTML=o;const i=n.firstElementChild;e&&i?e.replaceWith(i):i&&a.appendChild(i),X()}function ja(){v&&(v.innerHTML=Oa(),za())}function X(){v.querySelectorAll(".btn-docs").forEach(a=>{a.addEventListener("click",()=>{const t=f.leads.find(e=>e.id===a.dataset.id);t&&sa({lead:t,profile:L,container:v,onLeadUpdated:e=>{const o=f.leads.findIndex(n=>n.id===e.id);o!==-1&&(f.leads[o]={...f.leads[o],...e}),C()},onClose:()=>C()})})})}function za(){var a,t;(a=v.querySelector("#btn-logout"))==null||a.addEventListener("click",async()=>{await B(),window.location.reload()}),(t=v.querySelector("#btn-refresh"))==null||t.addEventListener("click",Z),v.querySelectorAll(".tab-pill").forEach(e=>{e.addEventListener("click",()=>{f.filtroStatus=e.dataset.status,v.querySelectorAll(".tab-pill").forEach(o=>o.classList.toggle("tab-pill-active",o.dataset.status===f.filtroStatus)),C()})}),X()}async function Z(){f.loading=!0,f.erro="",C();try{f.leads=await W()}catch(a){f.erro=a.message}finally{f.loading=!1,C()}}function Ha(a,t){v=a,L=t,ja(),Z()}const b=[{id:"abertura",icone:"👋",titulo:"Abertura",descricao:"Saudação inicial e apresentação"},{id:"qualificacao",icone:"🔍",titulo:"Qualificação",descricao:"Entender a situação do lead"},{id:"documentos",icone:"📋",titulo:"Documentos",descricao:"Solicitar documentos necessários"},{id:"encerramento",icone:"✅",titulo:"Encerramento",descricao:"Finalizar e encaminhar ao especialista"}],s={lead:null,profile:null,onClose:null,onLeadUpdated:null,etapaAtual:0,mensagens:[],enviando:!1,melhorando:!1,textos:{},docsEscolhidos:[],_channel:null};let c=null;function aa(a){return{aposentadoria:"Aposentadoria","auxilio-doenca":"Auxílio-doença","bpc-loas":"BPC/LOAS","beneficio-negado":"Benefício Negado",outros:"Outros"}[a]||a}function Da(a){return`<span class="chip ${{Alta:"chip-alta",Média:"chip-media",Baixa:"chip-baixa"}[a]||"chip-baixa"}">${a}</span>`}function ea(a){const t=s.lead,e=s.docsEscolhidos;return ka(a,{nome:t.nome,beneficio:t.beneficio,situacao:t.situacao,classificacao:t.classificacao,observacoes:t.observacoes||"",documentos:e})}function Ra(){return M()?'<span class="canal-badge canal-evolution">⚡ Evolution API — envio direto</span>':'<span class="canal-badge canal-wame">📲 wa.me — abre WhatsApp</span>'}function k(){return s.mensagens.length?s.mensagens.map(a=>{var p;const t=a.direcao==="recebido",e=b.find(m=>m.id===a.etapa),o=new Date(a.ts).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}),n=a.canal==="evolution"?"⚡":t?"📩":"📲",i=t?"chat-bubble chat-bubble-recebido":"chat-bubble chat-bubble-enviado",l=t?`${((p=s.lead)==null?void 0:p.nome)||"Lead"}`:`${(e==null?void 0:e.icone)||""} ${(e==null?void 0:e.titulo)||"Enviado"}`;return`
            <div class="${i}">
                <div class="chat-bubble-meta">
                    <span>${l}</span>
                    <span class="chat-ts">${n} ${o}</span>
                </div>
                <div class="chat-bubble-text">${a.texto.replace(/\n/g,"<br>")}</div>
            </div>`}).join(""):'<div class="chat-vazio">As mensagens aparecerão aqui.</div>'}function Fa(){var e;const a=((e=s.lead)==null?void 0:e.beneficio)||"outros";return`
        <div class="docs-seletor">
            <p class="docs-seletor-label">Selecione os documentos para incluir na mensagem:</p>
            <ul class="doc-list">
                ${(A[a]||A.outros).map((o,n)=>`
                    <li class="doc-item">
                        <label>
                            <input type="checkbox" class="doc-check" data-i="${n}"
                                   ${s.docsEscolhidos.includes(o)?"checked":""} />
                            ${o}
                        </label>
                    </li>`).join("")}
            </ul>
        </div>`}function _(){return b.map((a,t)=>{const e=s.mensagens.some(l=>l.etapa===a.id),o=t===s.etapaAtual,n=t<s.etapaAtual;let i="etapa-item";return o&&(i+=" etapa-ativa"),n&&(i+=" etapa-passada"),e&&(i+=" etapa-enviada"),`
            <div class="${i}" data-idx="${t}">
                <span class="etapa-icone">${e?"✅":a.icone}</span>
                <span class="etapa-titulo">${a.titulo}</span>
            </div>`}).join("")}function ta(){const a=b[s.etapaAtual];if(!a)return"";const t=s.textos[a.id]??ea(a.id),e=s.mensagens.some(n=>n.etapa===a.id),o=s.etapaAtual===b.length-1;return`
        <div class="etapa-editor">
            <div class="etapa-editor-header">
                <span class="etapa-editor-titulo">${a.icone} ${a.titulo}</span>
                <span class="etapa-editor-desc">${a.descricao}</span>
            </div>

            ${a.id==="documentos"?Fa():""}

            <div class="editor-toolbar">
                ${Ca()?`
                    <button id="btn-ia" class="btn-ia" ${s.melhorando?"disabled":""}>
                        ${s.melhorando?"⏳ Gerando…":"✨ Melhorar com IA"}
                    </button>`:'<span class="ia-hint">Configure VITE_GROQ_API_KEY para usar IA</span>'}
                <button id="btn-regenerar" class="btn-outline btn-sm" title="Restaurar script padrão">↺ Padrão</button>
            </div>

            <textarea id="editor-msg" class="editor-textarea" rows="7"
                      placeholder="Mensagem para enviar…">${t}</textarea>

            <div class="etapa-acoes">
                ${s.etapaAtual>0?'<button id="btn-voltar" class="btn-outline">← Voltar</button>':""}
                <div style="display:flex;gap:8px;margin-left:auto">
                    ${e&&!o?'<button id="btn-proxima" class="btn-outline">Próxima etapa →</button>':""}
                    <button id="btn-enviar" class="btn-enviar" ${s.enviando?"disabled":""}>
                        ${s.enviando?"⏳ Enviando…":e?"↩ Reenviar":M()?"⚡ Enviar agora":"📲 Abrir WhatsApp"}
                    </button>
                    ${o&&e?'<button id="btn-finalizar" class="btn-atender">✅ Encerrar atendimento</button>':""}
                </div>
            </div>
        </div>`}function Va(){const a=s.lead,t=String(a.whatsapp||"").replace(/\D/g,"");return`
        <div class="modal-overlay" id="conversa-modal">
            <div class="modal-box modal-chat">
                <!-- Header -->
                <div class="modal-header">
                    <div>
                        <h3 class="modal-title">💬 Atendimento — ${a.nome}</h3>
                        <p class="modal-sub">
                            ${aa(a.beneficio)} ·
                            ${Da(a.classificacao)} ·
                            <a class="link-wpp" href="https://wa.me/${t}" target="_blank">+${t}</a>
                        </p>
                    </div>
                    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
                        ${Ra()}
                        <button class="modal-close" id="conversa-fechar">✕</button>
                    </div>
                </div>

                <div class="chat-layout">
                    <!-- Painel esquerdo: etapas + histórico -->
                    <div class="chat-sidebar">
                        <div class="etapas-lista">${_()}</div>
                        <div class="chat-historico" id="chat-hist">${k()}</div>
                    </div>

                    <!-- Painel direito: editor da etapa atual -->
                    <div class="chat-editor" id="chat-editor">
                        ${ta()}
                    </div>
                </div>
            </div>
        </div>`}function S(){const a=c==null?void 0:c.querySelector("#chat-editor");a&&(a.innerHTML=ta(),oa());const t=c==null?void 0:c.querySelector("#chat-hist");t&&(t.innerHTML=k(),t.scrollTop=t.scrollHeight);const e=c==null?void 0:c.querySelector(".etapas-lista");e&&(e.innerHTML=_())}function oa(){var t,e,o,n,i,l,p;const a=c==null?void 0:c.querySelector("#chat-editor");a&&((t=a.querySelector("#editor-msg"))==null||t.addEventListener("input",m=>{const y=b[s.etapaAtual];s.textos[y.id]=m.target.value}),(e=a.querySelector("#btn-ia"))==null||e.addEventListener("click",Ga),(o=a.querySelector("#btn-regenerar"))==null||o.addEventListener("click",()=>{const m=b[s.etapaAtual];delete s.textos[m.id],S()}),(n=a.querySelector("#btn-enviar"))==null||n.addEventListener("click",Qa),(i=a.querySelector("#btn-voltar"))==null||i.addEventListener("click",()=>{s.etapaAtual>0&&(s.etapaAtual--,S())}),(l=a.querySelector("#btn-proxima"))==null||l.addEventListener("click",()=>{s.etapaAtual<b.length-1&&(s.etapaAtual++,S())}),(p=a.querySelector("#btn-finalizar"))==null||p.addEventListener("click",Ja),a.querySelectorAll(".doc-check").forEach(m=>{m.addEventListener("change",()=>{var I;const y=((I=s.lead)==null?void 0:I.beneficio)||"outros",w=A[y]||A.outros;s.docsEscolhidos=[...a.querySelectorAll(".doc-check:checked")].map(x=>w[Number(x.dataset.i)]).filter(Boolean);const q=b[s.etapaAtual];s.textos[q.id]=ea(q.id);const g=a.querySelector("#editor-msg");g&&(g.value=s.textos[q.id])})}))}function Wa(){var a,t;(a=c==null?void 0:c.querySelector("#conversa-fechar"))==null||a.addEventListener("click",P),(t=c==null?void 0:c.querySelector("#conversa-modal"))==null||t.addEventListener("click",e=>{e.target.id==="conversa-modal"&&P()}),oa()}async function Ga(){var o;const a=b[s.etapaAtual],t=c==null?void 0:c.querySelector("#editor-msg"),e=(t==null?void 0:t.value)||"";s.melhorando=!0,S();try{const n=((o=s.lead)==null?void 0:o.beneficio)||"outros",i=s.docsEscolhidos,l=await Na({etapa:a.id,nome:s.lead.nome,beneficio:aa(s.lead.beneficio),situacao:s.lead.situacao,classificacao:s.lead.classificacao,observacoes:s.lead.observacoes||"",documentos:i,mensagemAtual:e});s.textos[a.id]=l}catch(n){alert(`Erro na IA: ${n.message}`)}finally{s.melhorando=!1,S()}}async function Qa(){var o;const a=b[s.etapaAtual],t=c==null?void 0:c.querySelector("#editor-msg"),e=((t==null?void 0:t.value)||"").trim();if(!e){alert("Escreva a mensagem antes de enviar.");return}s.enviando=!0,S();try{const{canal:n}=await Ta(s.lead.whatsapp,e);s.mensagens.push({etapa:a.id,texto:e,canal:n,sent:!0,ts:new Date().toISOString()});const i=String(s.lead.whatsapp||"").replace(/\D/g,"");await $a({lead_id:s.lead.id,tipo:"whatsapp",direcao:"enviado",descricao:`[${a.titulo}] ${e}`,responsavel:((o=s.profile)==null?void 0:o.nome)||"",numero_lead:i}),s.etapaAtual<b.length-1&&s.etapaAtual++}catch(n){alert(`Erro ao enviar: ${n.message}`)}finally{s.enviando=!1,S()}}async function Ja(){var a;try{await G(s.lead.id,"qualificado"),s.lead.status_atendimento="qualificado",(a=s.onLeadUpdated)==null||a.call(s,s.lead),P()}catch(t){alert(`Erro ao encerrar: ${t.message}`)}}async function Ka(){try{const e=await ya(s.lead.id);s.mensagens=e.map(o=>{var n,i;return{etapa:((n=b.find(l=>{var p;return(p=o.descricao)==null?void 0:p.startsWith(`[${l.titulo}]`)}))==null?void 0:n.id)||null,direcao:o.direcao||"enviado",texto:o.direcao==="recebido"?o.descricao:((i=o.descricao)==null?void 0:i.replace(/^\[.*?\]\s*/,""))||o.descricao,canal:o.tipo==="whatsapp_recebido"?"recebido":"enviado",ts:o.created_at}})}catch{}const a=c==null?void 0:c.querySelector("#chat-hist");a&&(a.innerHTML=k(),a.scrollTop=a.scrollHeight);const t=c==null?void 0:c.querySelector(".etapas-lista");t&&(t.innerHTML=_())}function Ya(){s._channel=Sa(s.lead.id,a=>{if(s.mensagens.some(o=>o.ts===a.created_at&&o.texto===a.descricao))return;s.mensagens.push({etapa:null,direcao:a.direcao||"recebido",texto:a.descricao,canal:a.tipo==="whatsapp_recebido"?"recebido":"enviado",ts:a.created_at});const e=c==null?void 0:c.querySelector("#chat-hist");e&&(e.innerHTML=k(),e.scrollTop=e.scrollHeight)})}function P(){var a,t;s._channel&&(s._channel.unsubscribe(),s._channel=null),(a=c==null?void 0:c.querySelector("#conversa-modal"))==null||a.remove(),c=null,(t=s.onClose)==null||t.call(s)}function sa({lead:a,profile:t,container:e,onClose:o,onLeadUpdated:n}){s.lead=a,s.profile=t,s.onClose=o,s.onLeadUpdated=n,s.etapaAtual=0,s.mensagens=[],s.enviando=!1,s.melhorando=!1,s.textos={};const i=A[a.beneficio]||A.outros;s.docsEscolhidos=[...i],c=e;const l=document.createElement("div");l.innerHTML=Va(),e.appendChild(l.firstElementChild),Wa(),Ka(),Ya()}const Xa={aposentadoria:"Aposentadoria","auxilio-doenca":"Auxílio-doença","bpc-loas":"BPC/LOAS","beneficio-negado":"Ben. Negado",outros:"Outros"},Za={"primeiro-pedido":"1º Pedido","em-analise":"Em análise",indeferido:"Indeferido",cessado:"Cessado"},ae={novo:"Novo","em-contato":"Em contato",qualificado:"Qualificado",convertido:"Convertido",descartado:"Descartado"},r={tab:"leads",leads:[],usuarios:[],loading:!1,loadingUsuarios:!1,erro:"",erroUsuarios:"",filtroClassificacao:"",filtroStatus:"novo",filtroBeneficio:"",modalNovoUsuario:!1,salvandoUsuario:!1,erroNovoUsuario:""};let d=null,$=null;function na(a){return a?new Date(a).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"-"}function ee(a){return String(a||"").replace(/^\+/,"")}function ia(){return r.leads.filter(a=>!(r.filtroClassificacao&&a.classificacao!==r.filtroClassificacao||r.filtroStatus&&a.status_atendimento!==r.filtroStatus||r.filtroBeneficio&&a.beneficio!==r.filtroBeneficio))}function te(a){return`<span class="chip ${{Alta:"chip-alta",Média:"chip-media",Baixa:"chip-baixa"}[a]||"chip-baixa"}">${a}</span>`}function oe(a){return`<span class="badge ${{novo:"badge-novo","em-contato":"badge-em-contato",qualificado:"badge-qualificado",convertido:"badge-convertido",descartado:"badge-descartado"}[a]||"badge-novo"}">${ae[a]||a}</span>`}function se(){return`
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
        </header>`}function ra(a){const t=a.length,e=a.filter(i=>i.classificacao==="Alta").length,o=a.filter(i=>i.status_atendimento==="em-contato").length,n=a.filter(i=>i.status_atendimento==="convertido").length;return`
        <div class="ad-stats">
            <div class="stat-card"><span class="stat-n">${t}</span><span class="stat-l">Total de leads</span></div>
            <div class="stat-card sc-alta"><span class="stat-n">${e}</span><span class="stat-l">Prioridade Alta</span></div>
            <div class="stat-card sc-contato"><span class="stat-n">${o}</span><span class="stat-l">Em contato</span></div>
            <div class="stat-card sc-conv"><span class="stat-n">${n}</span><span class="stat-l">Convertidos</span></div>
        </div>`}function ne(){const a=(t,e,o)=>`<select id="${t}" class="ad-select">
            ${o.map(([n,i])=>`<option value="${n}" ${e===n?"selected":""}>${i}</option>`).join("")}
        </select>`;return`
        <div class="ad-filtros">
            ${a("f-class",r.filtroClassificacao,[["","Todas as prioridades"],["Alta","Alta"],["Média","Média"],["Baixa","Baixa"]])}
            ${a("f-status",r.filtroStatus,[["","Todos os status"],["novo","Novo"],["em-contato","Em contato"],["qualificado","Qualificado"],["convertido","Convertido"],["descartado","Descartado"]])}
            ${a("f-benef",r.filtroBeneficio,[["","Todos os benefícios"],["aposentadoria","Aposentadoria"],["auxilio-doenca","Auxílio-doença"],["bpc-loas","BPC/LOAS"],["beneficio-negado","Ben. Negado"],["outros","Outros"]])}
            <button id="btn-refresh" class="btn-outline" style="margin-left:auto">↻ Atualizar</button>
        </div>`}function ca(a){return r.loading?'<div class="ad-feedback ad-loading">Carregando leads…</div>':r.erro?`<div class="ad-feedback ad-erro">${r.erro}</div>`:a.length?`
        <div class="table-wrap">
            <table class="leads-table">
                <thead><tr>
                    <th>Lead</th><th>WhatsApp</th><th>Benefício / Situação</th>
                    <th>Prioridade</th><th>Status</th><th>Data</th><th>Ações</th>
                </tr></thead>
                <tbody>${a.map(e=>{const o=ee(e.whatsapp),n=!["convertido","descartado"].includes(e.status_atendimento),i=Xa[e.beneficio]||e.beneficio,l=Za[e.situacao]||e.situacao;return`
            <tr data-id="${e.id}">
                <td>
                    <div class="lead-nome">${e.nome}</div>
                    <div class="lead-detalhe">${e.cidade} · ${e.idade} anos · ${e.contribuicao_anos} anos contrib.</div>
                    ${e.observacoes?`<div class="lead-obs">${e.observacoes}</div>`:""}
                </td>
                <td><a class="link-wpp" href="https://wa.me/${o}" target="_blank" rel="noopener noreferrer">+${o}</a></td>
                <td>
                    <div class="td-stack"><span>${i}</span><span class="lead-detalhe">${l}</span></div>
                </td>
                <td>
                    <div class="td-stack">${te(e.classificacao)}<span class="score-badge">score ${e.score}</span></div>
                </td>
                <td>
                    <select class="status-select" data-id="${e.id}" data-current="${e.status_atendimento}">
                        <option value="novo"        ${e.status_atendimento==="novo"?"selected":""}>Novo</option>
                        <option value="em-contato"  ${e.status_atendimento==="em-contato"?"selected":""}>Em contato</option>
                        <option value="qualificado" ${e.status_atendimento==="qualificado"?"selected":""}>Qualificado</option>
                        <option value="convertido"  ${e.status_atendimento==="convertido"?"selected":""}>Convertido</option>
                        <option value="descartado"  ${e.status_atendimento==="descartado"?"selected":""}>Descartado</option>
                    </select>
                </td>
                <td class="td-data">${na(e.created_at)}</td>
                <td class="td-acoes">
                    ${n?`
                        <button class="btn-atender"
                            data-id="${e.id}" data-nome="${e.nome}" data-wpp="${o}"
                            data-beneflabel="${i}" data-classificacao="${e.classificacao}">
                            📲 Atender
                        </button>`:oe(e.status_atendimento)}
                </td>
            </tr>`}).join("")}</tbody>
            </table>
        </div>`:'<div class="ad-feedback ad-vazio">Nenhum lead encontrado.</div>'}function ie(){const a=ia();return`
        ${ra(r.leads)}
        ${ne()}
        <section class="ad-table-section" id="leads-section">
            <div class="ad-table-head">
                <h2>Leads <span class="count-badge">${a.length}</span></h2>
            </div>
            ${ca(a)}
        </section>`}function da(){return r.modalNovoUsuario?`
        <div class="modal-overlay" id="modal-usuario">
            <div class="modal-box">
                <div class="modal-header">
                    <h3 class="modal-title">Novo Usuário</h3>
                    <button class="modal-close" id="modal-user-close">✕</button>
                </div>
                ${r.erroNovoUsuario?`<div class="ad-feedback ad-erro" style="margin-bottom:12px">${r.erroNovoUsuario}</div>`:""}
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
        </div>`:""}function U(){if(r.loadingUsuarios)return'<div class="ad-feedback ad-loading" style="margin:24px">Carregando usuários…</div>';if(r.erroUsuarios)return`<div class="ad-feedback ad-erro" style="margin:24px">${r.erroUsuarios}</div>`;const t=r.usuarios.map(e=>{const o=e.id===($==null?void 0:$.id);return`
            <tr>
                <td>
                    <div class="lead-nome">${e.nome||"—"}</div>
                    <div class="lead-detalhe">${e.email}</div>
                </td>
                <td>
                    <span class="role-badge ${e.role==="admin"?"role-admin":"role-comum"}">
                        ${e.role==="admin"?"🔐 Admin":"👤 Comum"}
                    </span>
                </td>
                <td>
                    <span class="badge ${e.ativo?"badge-qualificado":"badge-descartado"}">
                        ${e.ativo?"Ativo":"Inativo"}
                    </span>
                </td>
                <td class="td-data">${na(e.created_at)}</td>
                <td class="td-acoes" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
                    ${o?'<span class="score-badge">(você)</span>':`
                        <select class="status-select role-select" data-id="${e.id}" data-current="${e.role}">
                            <option value="comum" ${e.role==="comum"?"selected":""}>Comum</option>
                            <option value="admin" ${e.role==="admin"?"selected":""}>Admin</option>
                        </select>
                        <button class="btn-outline btn-sm ${e.ativo?"btn-desativar":"btn-ativar"}"
                            data-id="${e.id}" data-ativo="${e.ativo}">
                            ${e.ativo?"Desativar":"Ativar"}
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
        ${da()}`}function re(){return`
        <div class="ad-layout">
            ${se()}
            <div class="ad-tab-content">
                ${r.tab==="leads"?ie():U()}
            </div>
        </div>`}function E(){const a=d==null?void 0:d.querySelector("#leads-section");if(!a)return;const t=ia();a.querySelector("h2").innerHTML=`Leads <span class="count-badge">${t.length}</span>`;const e=a.querySelector(".table-wrap, .ad-feedback"),o=document.createElement("div");o.innerHTML=ca(t);const n=o.firstElementChild;e&&n?e.replaceWith(n):n&&a.appendChild(n),pa()}function la(){const a=d==null?void 0:d.querySelector(".ad-stats");if(!a)return;const t=document.createElement("div");t.innerHTML=ra(r.leads),a.replaceWith(t.firstElementChild)}function T(){var a;if((a=d.querySelector("#modal-usuario"))==null||a.remove(),r.modalNovoUsuario){const t=document.createElement("div");t.innerHTML=da(),d.querySelector(".ad-layout").appendChild(t.firstElementChild),ce()}}function ua(){d&&(d.innerHTML=re(),de())}function pa(){d.querySelectorAll(".btn-atender").forEach(a=>a.addEventListener("click",()=>pe(a.dataset))),d.querySelectorAll(".status-select:not(.role-select)").forEach(a=>a.addEventListener("change",()=>ue(a)))}function O(){var a;(a=d.querySelector("#btn-novo-usuario"))==null||a.addEventListener("click",()=>{r.modalNovoUsuario=!0,r.erroNovoUsuario="",T()}),d.querySelectorAll(".role-select").forEach(t=>t.addEventListener("change",()=>fe(t))),d.querySelectorAll("[data-ativo]").forEach(t=>t.addEventListener("click",()=>me(t)))}function ce(){var t,e,o;const a=()=>{r.modalNovoUsuario=!1,r.erroNovoUsuario="",T()};(t=d.querySelector("#modal-user-close"))==null||t.addEventListener("click",a),(e=d.querySelector("#modal-user-cancel"))==null||e.addEventListener("click",a),(o=d.querySelector("#form-novo-usuario"))==null||o.addEventListener("submit",ve)}function de(){var a,t,e,o,n;(a=d.querySelector("#btn-logout"))==null||a.addEventListener("click",async()=>{await B(),window.location.reload()}),d.querySelectorAll(".ad-tab").forEach(i=>i.addEventListener("click",()=>le(i.dataset.tab))),r.tab==="leads"&&((t=d.querySelector("#btn-refresh"))==null||t.addEventListener("click",j),(e=d.querySelector("#f-class"))==null||e.addEventListener("change",i=>{r.filtroClassificacao=i.target.value,E()}),(o=d.querySelector("#f-status"))==null||o.addEventListener("change",i=>{r.filtroStatus=i.target.value,E()}),(n=d.querySelector("#f-benef"))==null||n.addEventListener("change",i=>{r.filtroBeneficio=i.target.value,E()}),pa()),r.tab==="usuarios"&&O()}function le(a){r.tab=a,ua(),a==="leads"&&j(),a==="usuarios"&&fa()}async function ue(a){const{id:t,current:e}=a.dataset,o=a.value;if(o!==e)try{await G(t,o);const n=r.leads.find(i=>i.id===t);n&&(n.status_atendimento=o),a.dataset.current=o,la()}catch(n){alert(`Erro ao atualizar status: ${n.message}`),a.value=e}}async function pe({id:a}){const t=r.leads.find(e=>e.id===a);t&&sa({lead:t,profile:$,container:d,onLeadUpdated:e=>{const o=r.leads.findIndex(n=>n.id===e.id);o!==-1&&(r.leads[o]={...r.leads[o],...e}),E()},onClose:()=>E()})}async function fe(a){const{id:t,current:e}=a.dataset,o=a.value;if(o!==e){if(!confirm(`Alterar perfil para "${o}"?`)){a.value=e;return}try{await Aa(t,o);const n=r.usuarios.find(i=>i.id===t);n&&(n.role=o),a.dataset.current=o}catch(n){alert(`Erro: ${n.message}`),a.value=e}}}async function me(a){const{id:t,ativo:e}=a.dataset,o=e!=="true";if(confirm(`Deseja ${o?"ativar":"desativar"} este usuário?`))try{await wa(t,o);const n=r.usuarios.find(l=>l.id===t);n&&(n.ativo=o);const i=d.querySelector(".ad-tab-content");i&&(i.innerHTML=U(),O())}catch(n){alert(`Erro: ${n.message}`)}}async function ve(a){if(a.preventDefault(),r.salvandoUsuario)return;const t=d.querySelector("#nu-nome").value.trim(),e=d.querySelector("#nu-email").value.trim(),o=d.querySelector("#nu-senha").value,n=d.querySelector("#nu-role").value;r.salvandoUsuario=!0,r.erroNovoUsuario="",T();try{await ga({nome:t,email:e,password:o,role:n}),r.modalNovoUsuario=!1,r.salvandoUsuario=!1,await fa()}catch(i){r.salvandoUsuario=!1,r.erroNovoUsuario=i.message,T()}}async function j(){r.loading=!0,r.erro="",E();try{r.leads=await W()}catch(a){r.erro=a.message}finally{r.loading=!1,la(),E()}}async function fa(){r.loadingUsuarios=!0,r.erroUsuarios="";const a=d==null?void 0:d.querySelector(".ad-tab-content");a&&r.tab==="usuarios"&&(a.innerHTML=U());try{r.usuarios=await Ea()}catch(t){r.erroUsuarios=t.message}finally{r.loadingUsuarios=!1,a&&r.tab==="usuarios"&&(a.innerHTML=U(),O())}}function be(a,t){d=a,$=t,ua(),j()}const h=document.querySelector("#admin-app");function N(a=""){h.innerHTML=`
        <div class="al-wrap">
            <div class="al-card">
                <div class="al-icon">⚖️</div>
                <h1 class="al-title">Central INSS</h1>
                <p class="al-sub">Acesso interno — equipe do escritório</p>
                ${a?`<div class="al-alert">${a}</div>`:""}
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
        </div>`,h.querySelector("#login-form").addEventListener("submit",async t=>{t.preventDefault();const e=h.querySelector("#login-btn"),o=h.querySelector("#login-email").value.trim(),n=h.querySelector("#login-senha").value;e.disabled=!0,e.textContent="Entrando…";try{const{profile:i}=await ba(o,n);ma(i)}catch(i){N(i.message)}})}function ma(a){if(!(a!=null&&a.ativo)){B(),N("Usuário inativo. Contate o administrador.");return}a.role==="admin"?be(h,a):Ha(h,a)}async function he(){if(!u){h.innerHTML=`
            <div class="al-wrap">
                <div class="al-card">
                    <div class="al-icon">⚠️</div>
                    <h2 class="al-title">Supabase não configurado</h2>
                    <p class="al-sub">Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.</p>
                </div>
            </div>`;return}h.innerHTML='<div class="al-wrap"><div class="al-card" style="text-align:center;color:#6b7280">Verificando sessão…</div></div>';try{const a=await ha();a!=null&&a.profile?ma(a.profile):N()}catch{N()}}he();
