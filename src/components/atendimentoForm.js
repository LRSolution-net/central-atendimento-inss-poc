export function renderAtendimentoForm() {
    return `
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
    `;
}