import{s as b,i as S}from"./supabase-DBx6agDF.js";function E(){return`
        <form id="triagem-form">
            <input class="honeypot" type="text" name="website" autocomplete="off" tabindex="-1" />

            <div class="form-grid">
                <div class="field">
                    <label for="nome">Nome completo</label>
                    <input id="nome" name="nome" type="text" minlength="3" maxlength="120" required />
                </div>

                <div class="field">
                    <label for="whatsapp">WhatsApp</label>
                    <input id="whatsapp" name="whatsapp" type="tel" maxlength="16" placeholder="(11) 99999-9999" required />
                </div>

                <div class="field">
                    <label for="cidade">Cidade/UF</label>
                    <input id="cidade" name="cidade" type="text" maxlength="120" required />
                </div>

                <div class="field">
                    <label for="idade">Idade</label>
                    <input id="idade" name="idade" type="number" min="16" max="120" required />
                </div>

                <div class="field">
                    <label for="sexo">Sexo</label>
                    <select id="sexo" name="sexo" required>
                        <option value="">Selecione</option>
                        <option value="masculino">Masculino</option>
                        <option value="feminino">Feminino</option>
                    </select>
                </div>

                <div class="field">
                    <label for="contribuicaoAnos">Anos de contribuição</label>
                    <input id="contribuicaoAnos" name="contribuicaoAnos" type="number" min="0" max="70" required />
                </div>

                <div class="field">
                    <label for="beneficio">Tipo de benefício</label>
                    <select id="beneficio" name="beneficio" required>
                        <option value="">Selecione</option>
                        <option value="aposentadoria">Aposentadoria</option>
                        <option value="auxilio-doenca">Auxílio-doença</option>
                        <option value="bpc-loas">BPC/LOAS</option>
                        <option value="beneficio-negado">Benefício negado</option>
                        <option value="outros">Outros</option>
                    </select>
                </div>

                <div class="field">
                    <label for="situacao">Situação atual</label>
                    <select id="situacao" name="situacao" required>
                        <option value="">Selecione</option>
                        <option value="primeiro-pedido">Primeiro pedido</option>
                        <option value="em-analise">Em análise no INSS</option>
                        <option value="indeferido">Indeferido</option>
                        <option value="cessado">Benefício cessado</option>
                    </select>
                </div>

                <div class="field full">
                    <label for="observacoes">Resumo do caso (opcional)</label>
                    <textarea id="observacoes" name="observacoes" rows="3" maxlength="450"></textarea>
                </div>
            </div>

            <label class="consent" for="consentimento">
                <input id="consentimento" name="consentimento" type="checkbox" required />
                <span>Autorizo o uso dos dados para triagem inicial e contato do escritório, conforme LGPD.</span>
            </label>

            <div class="actions">
                <button type="submit">Enviar triagem e continuar no WhatsApp</button>
            </div>
        </form>
    `}function w(e){return`
        <div class="resultado-card" role="status">
            <h3>Resultado da triagem</h3>
            <p>
                Prioridade: <span class="chip ${e.classificacao==="Alta"?"chip-alta":e.classificacao==="Média"?"chip-media":"chip-baixa"}">${e.classificacao}</span>
            </p>
            <p>Score: <strong>${e.score}</strong></p>
            <p>${e.recomendacao}</p>
        </div>
    `}const A={aposentadoria:25,"auxilio-doenca":20,"bpc-loas":24,"beneficio-negado":35,outros:12},x={"primeiro-pedido":10,"em-analise":15,indeferido:30,cessado:26};function y(e){return e>=30?18:e>=15?12:6}function N(e,o){const a=o==="feminino"?57:62,t=o==="feminino"?40:45;return e>=a?18:e>=t?11:6}function I(e){return e>=70?"Alta":e>=45?"Média":"Baixa"}function D({beneficio:e,situacao:o,idade:a,sexo:t,contribuicao_anos:i}){const n=(A[e]||8)+(x[o]||8)+N(a,t)+y(i),s=I(n);return{score:n,classificacao:s,recomendacao:s==="Alta"?"Atendimento prioritário no mesmo dia.":s==="Média"?"Contato recomendado em até 24h.":"Contato recomendado em até 48h."}}const C=["aposentadoria","auxilio-doenca","bpc-loas","beneficio-negado","outros"],B=["primeiro-pedido","em-analise","indeferido","cessado"],T=["masculino","feminino"];function p(e,o=180){return String(e||"").trim().replace(/\s+/g," ").slice(0,o)}function L(e){const o=String(e||"").replace(/\D/g,"");if(o.length<10||o.length>13)throw new Error("WhatsApp inválido. Informe DDD + número.");return o.startsWith("55")?`+${o}`:`+55${o}`}function P(e){console.log("[DEBUG  sanitize] Input recebido:",e);const o=p(e.nome,120),a=p(e.cidade,120),t=p(e.beneficio,40),i=p(e.situacao,40),n=p(e.sexo,20),s=p(e.observacoes,450),c=Number(e.idade),l=Number(e.contribuicaoAnos),d=!!e.consentimento;if(console.log("[DEBUG sanitize] consentimento raw:",e.consentimento,"tipo:",typeof e.consentimento),console.log("[DEBUG sanitize] consentimento convertido:",d,"tipo:",typeof d),o.length<3)throw new Error("Informe o nome completo.");if(!C.includes(t))throw new Error("Selecione um tipo de benefício válido.");if(!B.includes(i))throw new Error("Selecione uma situação válida.");if(!T.includes(n))throw new Error("Selecione o sexo.");if(!Number.isFinite(c)||c<16||c>120)throw new Error("Idade inválida para triagem.");if(!Number.isFinite(l)||l<0||l>70)throw new Error("Tempo de contribuição inválido.");if(!d)throw new Error("É obrigatório aceitar o uso de dados para continuar.");const u={nome:o,whatsapp:L(e.whatsapp),cidade:a,beneficio:t,situacao:i,sexo:n,idade:c,contribuicao_anos:l,observacoes:s,consentimento:d};return console.log("[DEBUG sanitize] Resultado final:",u),console.log("[DEBUG sanitize] Consentimento no resultado:",u.consentimento,"tipo:",typeof u.consentimento),u}async function v(e){if(!b)throw new Error("Supabase não configurado.");const o=e.startsWith("55")?`+${e}`:`+55${e}`,{data:a,error:t}=await b.from("leads").select("id, nome, created_at").eq("whatsapp",o).limit(1);if(t)throw console.error("[INSS] Erro ao verificar WhatsApp:",t),t;return a&&a.length>0?{existe:!0,nome:a[0].nome,created_at:a[0].created_at}:{existe:!1}}async function U(e){if(!b)throw new Error("Supabase não configurado.");const o={...e,consentimento:!!e.consentimento};if(!o.consentimento)throw new Error("Consentimento obrigatório não foi fornecido.");const a=await v(o.whatsapp.replace(/\D/g,""));if(a.existe)throw new Error(`Este WhatsApp já está cadastrado para ${a.nome}. Entre em contato pelo número registrado.`);console.log("[INSS] Enviando lead ao Supabase:",JSON.stringify(o,null,2));const{data:t,error:i}=await b.from("leads").insert([o]).select();if(i)throw console.error("[INSS] Erro Supabase:",i),console.error("[INSS] Dados tentados:",o),new Error(`Não foi possível salvar o lead: ${i.message}`);return console.log("[INSS] Lead salvo com sucesso!",t),(t==null?void 0:t[0])||{id:null}}function W({nome:e,beneficio:o,situacao:a,classificacao:t,protocolo:i}){const n=o.replace("-"," "),s=a.replace("-"," "),c=i?`Protocolo: ${i}`:"Protocolo: em processamento";return["Olá! Acabei de preencher a triagem INSS.",`Nome: ${e}`,`Benefício: ${n}`,`Situação: ${s}`,`Prioridade: ${t}`,c].join(`
`)}function $(e,o){return`https://wa.me/${e}?text=${encodeURIComponent(o)}`}const r={carregando:!1,erro:"",sucesso:"",resultado:null};function q(){return"5511994136335".replace(/\D/g,"")}function g(){const e=document.querySelector("#status");if(e){if(r.carregando){e.className="status loading",e.textContent="Enviando dados da triagem...";return}if(r.erro){e.className="status error",e.textContent=r.erro;return}if(r.sucesso){e.className="status success",e.textContent=r.sucesso;return}e.className="status",e.textContent=""}}function _(){const e=document.querySelector("#resultado-triagem");e&&(e.innerHTML=r.resultado?w(r.resultado):"")}let f=!1,m=!1;async function h(e){const o=document.querySelector("#whatsapp-validation");if(o)try{o.style.display="block",o.className="field-validation validating",o.innerHTML='<span style="color:#6b7280">⏳ Verificando número...</span>';const a=await v(e);a.existe?(o.className="field-validation error",o.innerHTML=`
                <span style="color:#dc2626;font-weight:500">⚠️ WhatsApp já cadastrado</span>
                <span style="display:block;font-size:12px;margin-top:4px;color:#6b7280">
                    Pertence a: <strong>${a.nome}</strong> · 
                    Cadastro: ${new Date(a.created_at).toLocaleDateString("pt-BR")}
                </span>
            `,f=!1,m=!0):(o.className="field-validation success",o.innerHTML='<span style="color:#16a34a;font-weight:500">✅ Número disponível</span>',f=!0,m=!1)}catch(a){console.error("Erro ao validar WhatsApp:",a),o.className="field-validation error",o.innerHTML='<span style="color:#dc2626">❌ Erro ao verificar número</span>',f=!1,m=!1}}function M(){const e=document.querySelector("#whatsapp-validation");e&&(e.style.display="none",e.innerHTML=""),f=!1,m=!1}async function O(e){var t;if(e.preventDefault(),r.carregando)return;if(m){r.erro="Este WhatsApp já está cadastrado. Use outro número ou entre em contato conosco.",g(),(t=document.querySelector("#whatsapp"))==null||t.focus();return}const o=e.currentTarget,a=new FormData(o);if(!a.get("website")){r.carregando=!0,r.erro="",r.sucesso="",g();try{const i=a.get("consentimento");console.log("[DEBUG] Consentimento checkbox value:",i),console.log("[DEBUG] Consentimento convertido:",i==="on");const n=P({nome:a.get("nome"),whatsapp:a.get("whatsapp"),cidade:a.get("cidade"),beneficio:a.get("beneficio"),situacao:a.get("situacao"),idade:Number(a.get("idade")),sexo:a.get("sexo"),contribuicaoAnos:Number(a.get("contribuicaoAnos")),consentimento:i==="on",observacoes:a.get("observacoes")});console.log("[DEBUG] Payload após sanitize:",n);const s=D(n),c=q();if(!c)throw new Error("Configure VITE_WHATSAPP_NUMBER para habilitar o contato via WhatsApp.");if(!S())throw new Error("Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para salvar os leads.");const l=await U({...n,score:s.score,classificacao:s.classificacao,origem:"github-pages-poc"}),d=W({nome:n.nome,beneficio:n.beneficio,situacao:n.situacao,classificacao:s.classificacao,protocolo:l==null?void 0:l.id}),u=$(c,d);r.resultado=s,r.sucesso="Triagem enviada com sucesso. Você será redirecionado para o WhatsApp.",o.reset(),setTimeout(()=>{window.open(u,"_blank","noopener,noreferrer")},450)}catch(i){console.error("[INSS] Erro ao salvar lead:",i),r.erro=i.message||"Não foi possível concluir a triagem."}finally{r.carregando=!1,g(),_()}}}function R(e){if(!e)return;e.innerHTML=`
        <main class="container">
            <section class="hero">
                <h1>Central de Atendimento INSS</h1>
                <p>Triagem inicial gratuita para aposentadoria, BPC/LOAS, auxílio-doença e benefício negado.</p>
            </section>

            <section class="card">
                <h2>Pré-atendimento</h2>
                <p class="muted">Preencha os dados abaixo para receber uma orientação inicial e seguir para o WhatsApp.</p>
                ${E()}
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
    `;const o=e.querySelector("#triagem-form");o==null||o.addEventListener("submit",O);const a=e.querySelector("#whatsapp");if(a){let i;a.addEventListener("input",n=>{clearTimeout(i);const s=n.target.value.replace(/\D/g,"");s.length>=10?i=setTimeout(()=>h(s),800):M()}),a.addEventListener("blur",n=>{const s=n.target.value.replace(/\D/g,"");s.length>=10&&h(s)})}const t=e.querySelector("#consentimento");t&&(t.addEventListener("change",i=>{console.log("[DEBUG] Checkbox mudou:",i.target.checked)}),console.log("[DEBUG] Checkbox inicial:",t.checked))}R(document.querySelector("#app"));
