import{s as u,i as f}from"./supabase-DBx6agDF.js";function b(){return`
        <form id="triagem-form" novalidate>
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
    `}function g(e){return`
        <div class="resultado-card" role="status">
            <h3>Resultado da triagem</h3>
            <p>
                Prioridade: <span class="chip ${e.classificacao==="Alta"?"chip-alta":e.classificacao==="Média"?"chip-media":"chip-baixa"}">${e.classificacao}</span>
            </p>
            <p>Score: <strong>${e.score}</strong></p>
            <p>${e.recomendacao}</p>
        </div>
    `}const h={aposentadoria:25,"auxilio-doenca":20,"bpc-loas":24,"beneficio-negado":35,outros:12},v={"primeiro-pedido":10,"em-analise":15,indeferido:30,cessado:26};function S(e){return e>=30?18:e>=15?12:6}function A(e){return e>=60?18:e>=45?11:6}function w(e){return e>=70?"Alta":e>=45?"Média":"Baixa"}function E({beneficio:e,situacao:o,idade:a,contribuicao_anos:i}){const t=(h[e]||8)+(v[o]||8)+A(a)+S(i),r=w(t);return{score:t,classificacao:r,recomendacao:r==="Alta"?"Atendimento prioritário no mesmo dia.":r==="Média"?"Contato recomendado em até 24h.":"Contato recomendado em até 48h."}}const x=["aposentadoria","auxilio-doenca","bpc-loas","beneficio-negado","outros"],N=["primeiro-pedido","em-analise","indeferido","cessado"];function d(e,o=180){return String(e||"").trim().replace(/\s+/g," ").slice(0,o)}function m(e){const o=String(e||"").replace(/\D/g,"");if(o.length<10||o.length>13)throw new Error("WhatsApp inválido. Informe DDD + número.");return o.startsWith("55")?`+${o}`:`+55${o}`}function I(e){const o=d(e.nome,120),a=d(e.cidade,120),i=d(e.beneficio,40),t=d(e.situacao,40),r=d(e.observacoes,450),s=Number(e.idade),c=Number(e.contribuicaoAnos),l=!!e.consentimento;if(o.length<3)throw new Error("Informe o nome completo.");if(!x.includes(i))throw new Error("Selecione um tipo de benefício válido.");if(!N.includes(t))throw new Error("Selecione uma situação válida.");if(!Number.isFinite(s)||s<16||s>120)throw new Error("Idade inválida para triagem.");if(!Number.isFinite(c)||c<0||c>70)throw new Error("Tempo de contribuição inválido.");if(!l)throw new Error("É obrigatório aceitar o uso de dados para continuar.");return{nome:o,whatsapp:m(e.whatsapp),cidade:a,beneficio:i,situacao:t,idade:s,contribuicao_anos:c,observacoes:r,consentimento:l}}async function y(e){if(!u)throw new Error("Supabase não configurado.");console.log("[INSS] Enviando lead ao Supabase:",JSON.stringify(e,null,2));const{error:o}=await u.from("leads").insert([e]);if(o)throw console.error("[INSS] Erro Supabase:",o),new Error(`Não foi possível salvar o lead: ${o.message}`);return console.log("[INSS] Lead salvo com sucesso!"),{id:null}}function C({nome:e,beneficio:o,situacao:a,classificacao:i,protocolo:t}){const r=o.replace("-"," "),s=a.replace("-"," "),c=t?`Protocolo: ${t}`:"Protocolo: em processamento";return["Olá! Acabei de preencher a triagem INSS.",`Nome: ${e}`,`Benefício: ${r}`,`Situação: ${s}`,`Prioridade: ${i}`,c].join(`
`)}function P(e,o){return`https://wa.me/${e}?text=${encodeURIComponent(o)}`}const n={carregando:!1,erro:"",sucesso:"",resultado:null};function T(){return"5511994136335".replace(/\D/g,"")}function p(){const e=document.querySelector("#status");if(e){if(n.carregando){e.className="status loading",e.textContent="Enviando dados da triagem...";return}if(n.erro){e.className="status error",e.textContent=n.erro;return}if(n.sucesso){e.className="status success",e.textContent=n.sucesso;return}e.className="status",e.textContent=""}}function L(){const e=document.querySelector("#resultado-triagem");e&&(e.innerHTML=n.resultado?g(n.resultado):"")}async function B(e){if(e.preventDefault(),n.carregando)return;const o=e.currentTarget,a=new FormData(o);if(!a.get("website")){n.carregando=!0,n.erro="",n.sucesso="",p();try{const i=I({nome:a.get("nome"),whatsapp:a.get("whatsapp"),cidade:a.get("cidade"),beneficio:a.get("beneficio"),situacao:a.get("situacao"),idade:Number(a.get("idade")),contribuicaoAnos:Number(a.get("contribuicaoAnos")),consentimento:a.get("consentimento")==="on",observacoes:a.get("observacoes")}),t=E(i),r=T();if(!r)throw new Error("Configure VITE_WHATSAPP_NUMBER para habilitar o contato via WhatsApp.");if(!f())throw new Error("Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para salvar os leads.");const s=await y({...i,whatsapp:m(i.whatsapp),score:t.score,classificacao:t.classificacao,origem:"github-pages-poc"}),c=C({nome:i.nome,beneficio:i.beneficio,situacao:i.situacao,classificacao:t.classificacao,protocolo:s==null?void 0:s.id}),l=P(r,c);n.resultado=t,n.sucesso="Triagem enviada com sucesso. Você será redirecionado para o WhatsApp.",o.reset(),setTimeout(()=>{window.open(l,"_blank","noopener,noreferrer")},450)}catch(i){console.error("[INSS] Erro ao salvar lead:",i),n.erro=i.message||"Não foi possível concluir a triagem."}finally{n.carregando=!1,p(),L()}}}function $(e){if(!e)return;e.innerHTML=`
        <main class="container">
            <section class="hero">
                <h1>Central de Atendimento INSS</h1>
                <p>Triagem inicial gratuita para aposentadoria, BPC/LOAS, auxílio-doença e benefício negado.</p>
            </section>

            <section class="card">
                <h2>Pré-atendimento</h2>
                <p class="muted">Preencha os dados abaixo para receber uma orientação inicial e seguir para o WhatsApp.</p>
                ${b()}
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
    `;const o=e.querySelector("#triagem-form");o==null||o.addEventListener("submit",B)}$(document.querySelector("#app"));
