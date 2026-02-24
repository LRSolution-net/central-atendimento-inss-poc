-- ================================================================
-- POLÍTICAS ADMIN — Execute no SQL Editor do Supabase
-- Necessário para o painel de leads funcionar corretamente
-- ================================================================

-- Permite anon ler leads (para listar no painel)
drop policy if exists leads_select_anon on public.leads;
create policy leads_select_anon
    on public.leads for select to anon
    using (true);

-- Permite anon atualizar status do lead (ação do painel)
drop policy if exists leads_update_anon on public.leads;
create policy leads_update_anon
    on public.leads for update to anon
    using (true) with check (true);

-- Permite anon inserir atendimentos (ao clicar em "Atender")
drop policy if exists atendimentos_insert_anon on public.atendimentos;
create policy atendimentos_insert_anon
    on public.atendimentos for insert to anon
    with check (true);

-- Permite anon ler atendimentos
drop policy if exists atendimentos_select_anon on public.atendimentos;
create policy atendimentos_select_anon
    on public.atendimentos for select to anon
    using (true);

-- Grants no schema
grant usage  on schema public             to anon;
grant insert, select on public.leads      to anon;
grant update (status_atendimento, responsavel, anotacoes_internas) on public.leads to anon;
grant insert, select on public.atendimentos to anon;
