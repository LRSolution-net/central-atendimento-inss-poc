# Central de Atendimento INSS (POC)

POC simples para escritório de advocacia INSS com:

- triagem inicial no frontend;
- captação de leads no Supabase;
- redirecionamento para atendimento via WhatsApp;
- publicação gratuita no GitHub Pages.

## Stack

- Frontend: Vite + JavaScript
- Banco: Supabase (PostgreSQL)
- Deploy: GitHub Pages (GitHub Actions)

## Funcionalidades da POC

- Formulário de pré-atendimento com campos de triagem INSS.
- Cálculo de score e classificação automática (`Alta`, `Média`, `Baixa`).
- Armazenamento de possíveis clientes na tabela `public.leads`.
- Botão/fluxo de continuidade no WhatsApp com mensagem pré-preenchida.

## Proteção de dados (LGPD)

- Coleta mínima de dados para triagem e contato.
- Consentimento obrigatório (`checkbox`) antes do envio.
- Honeypot simples contra envio automatizado no frontend.
- RLS no Supabase permitindo somente `INSERT` para usuário `anon`.
- Sem política de `SELECT` para `anon` (evita leitura pública dos leads).

> Importante: como é frontend público com chave anon, o ideal para produção é adicionar backend/edge function para controles adicionais (rate limit, antifraude avançado e auditoria).

## Configuração local

1. Instale dependências:

```bash
npm install
```

2. Crie o arquivo `.env` com base no `.env.example`:

```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_publica
VITE_WHATSAPP_NUMBER=5511999999999
```

3. Rode em desenvolvimento:

```bash
npm run dev
```

## 📱 Integração com WhatsApp

O sistema oferece **3 opções** de integração com WhatsApp:

### 🔥 Opção 1: Meta WhatsApp Business API (RECOMENDADO)

- ✅ **GRÁTIS**: 1000 conversas/mês
- ✅ **100% Automático**: Envia direto do sistema sem abrir navegador
- ✅ **Já implementado**: Edge Function pronta
- 📖 **[Ver guia completo de configuração →](CONFIGURAR_WHATSAPP.md)**

Configure no `.env`:
```bash
VITE_META_WA_ENABLED=true
```

E adicione os secrets no Supabase (Edge Functions → Secrets):
```bash
META_WA_TOKEN=seu_token
META_WA_PHONE_ID=seu_phone_id
```

### ⚡ Opção 2: Evolution API (Self-hosted)

Para quem já tem Evolution API rodando:

```bash
VITE_EVOLUTION_API_URL=https://sua-api.com
VITE_EVOLUTION_API_KEY=sua_key
VITE_EVOLUTION_INSTANCE=instancia
```

### 📲 Opção 3: WhatsApp Web (Manual)

Sem configuração! Abre popup lado a lado:
- Modal fica à esquerda
- WhatsApp Web abre à direita
- Mensagem já vem pré-preenchida

---

## Configuração do Supabase

1. Crie um projeto no Supabase.
2. No SQL Editor, execute [supabase/schema.sql](supabase/schema.sql).
3. (Opcional) execute [supabase/seed.sql](supabase/seed.sql) para dados de teste.
4. Copie `Project URL` e `anon public key` para o `.env`.

## Publicar no GitHub Pages

1. Suba o projeto para um repositório GitHub.
2. Em `Settings > Secrets and variables > Actions`, crie os secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_WHATSAPP_NUMBER`
3. Garanta que a branch principal seja `main`.
4. Faça push na `main`. O workflow [deploy-pages.yml](.github/workflows/deploy-pages.yml) fará build e deploy.
5. Em `Settings > Pages`, confirme `Build and deployment: GitHub Actions`.

URL final padrão:

```text
https://SEU_USUARIO.github.io/NOME_DO_REPOSITORIO/
```

## Estrutura

```text
.
├── .github/workflows/deploy-pages.yml
├── index.html
├── src/
│   ├── app.js
│   ├── main.js
│   ├── styles.css
│   ├── components/
│   │   ├── atendimentoForm.js
│   │   └── leadsTable.js
│   ├── config/
│   │   └── supabase.js
│   └── services/
│       ├── leadsService.js
│       └── triagemService.js
├── supabase/
│   ├── schema.sql
│   └── seed.sql
└── vite.config.js
```