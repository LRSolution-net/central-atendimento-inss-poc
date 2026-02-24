-- ================================================================
-- MIGRATION: atendimentos — suporte a mensagens recebidas (webhook)
-- Execute no SQL Editor do Supabase APÓS profiles-schema.sql
-- ================================================================

-- Adiciona coluna de direção (enviado pelo escritório / recebido do lead)
alter table public.atendimentos
  add column if not exists direcao text not null default 'enviado'
    check (direcao in ('enviado', 'recebido'));

-- Adiciona número do lead para lookup no webhook
alter table public.atendimentos
  add column if not exists numero_lead text not null default '';

-- Índice para busca rápida por número (usado pelo webhook)
create index if not exists atendimentos_numero_lead_idx
  on public.atendimentos (numero_lead);

-- Índice para busca por lead + data (usado pelo modal)
create index if not exists atendimentos_lead_data_idx
  on public.atendimentos (lead_id, created_at);

-- ----------------------------------------------------------------
-- Policy: service_role pode inserir (usado pelo webhook/edge function)
-- ----------------------------------------------------------------
drop policy if exists atendimentos_insert_service on public.atendimentos;
create policy atendimentos_insert_service
  on public.atendimentos for insert
  to service_role
  with check (true);

drop policy if exists atendimentos_select_service on public.atendimentos;
create policy atendimentos_select_service
  on public.atendimentos for select
  to service_role
  using (true);

-- Garante grant para service_role
grant insert, select on public.atendimentos to service_role;

-- ----------------------------------------------------------------
-- Habilita Realtime na tabela atendimentos
-- (permite o frontend receber mensagens recebidas em tempo real)
-- ----------------------------------------------------------------
alter publication supabase_realtime add table public.atendimentos;
