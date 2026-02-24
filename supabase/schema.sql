-- ============================================================
-- Central de Atendimento INSS - Schema
-- Execute no SQL Editor do Supabase (https://supabase.com/dashboard)
-- ============================================================

create table if not exists public.leads (
  id            uuid        primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  nome          text        not null,
  whatsapp      text        not null,
  cidade        text        not null,
  idade         int         not null,
  contribuicao_anos int     not null,
  beneficio     text        not null,
  situacao      text        not null,
  score         int         not null default 0,
  classificacao text        not null default 'Baixa',
  observacoes   text,
  origem        text        not null default 'github-pages-poc',
  consentimento boolean     not null default false
);

-- Habilita RLS
alter table public.leads enable row level security;

-- Remove politicas antigas se existirem
drop policy if exists leads_insert_anon on public.leads;

-- Permite apenas INSERT pelo usuario anonimo com consentimento
create policy leads_insert_anon
  on public.leads
  for insert
  to anon
  with check (consentimento = true);

-- Confirma que anon pode fazer insert via API
grant insert on public.leads to anon;