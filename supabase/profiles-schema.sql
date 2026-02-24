-- ================================================================
-- TABELA DE USUÁRIOS/PERFIS — Execute no SQL Editor do Supabase
-- ================================================================

-- ----------------------------------------------------------------
-- 1. TABELA DE PERFIS
-- ----------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  nome        text        not null default '',
  email       text        not null default '',
  role        text        not null default 'comum'
                          check (role in ('admin', 'comum')),
  ativo       boolean     not null default true
);

-- ----------------------------------------------------------------
-- 2. TRIGGER: cria perfil automaticamente ao cadastrar usuário
-- ----------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, nome, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'role', 'comum')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------
-- 3. FUNÇÃO AUXILIAR (security definer — lê role sem acionar RLS)
-- ----------------------------------------------------------------
create or replace function public.get_my_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ----------------------------------------------------------------
-- 4. RLS
-- ----------------------------------------------------------------
alter table public.profiles enable row level security;

-- Usuário autenticado vê o próprio perfil
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- Admin vê todos os perfis (usa função para evitar recursão)
drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin
  on public.profiles for select
  to authenticated
  using (public.get_my_role() = 'admin');

-- Admin insere perfis
drop policy if exists profiles_insert_admin on public.profiles;
create policy profiles_insert_admin
  on public.profiles for insert
  to authenticated
  with check (public.get_my_role() = 'admin');

-- Admin atualiza qualquer perfil
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin
  on public.profiles for update
  to authenticated
  using (public.get_my_role() = 'admin');

-- ----------------------------------------------------------------
-- 5. GRANTS
-- ----------------------------------------------------------------
grant usage  on schema public           to authenticated;
grant select, insert, update on public.profiles to authenticated;

-- ----------------------------------------------------------------
-- 6. ATUALIZA POLICIES DE LEADS E ATENDIMENTOS PARA authenticated
-- ----------------------------------------------------------------

-- Leads: usuário autenticado pode ler
drop policy if exists leads_select_authenticated on public.leads;
create policy leads_select_authenticated
  on public.leads for select
  to authenticated
  using (true);

-- Leads: usuário autenticado pode atualizar status
drop policy if exists leads_update_authenticated on public.leads;
create policy leads_update_authenticated
  on public.leads for update
  to authenticated
  using (true) with check (true);

-- Atendimentos: usuário autenticado pode inserir e ler
drop policy if exists atendimentos_insert_authenticated on public.atendimentos;
create policy atendimentos_insert_authenticated
  on public.atendimentos for insert
  to authenticated
  with check (true);

drop policy if exists atendimentos_select_authenticated on public.atendimentos;
create policy atendimentos_select_authenticated
  on public.atendimentos for select
  to authenticated
  using (true);

grant select, update on public.leads to authenticated;
grant insert, select  on public.atendimentos to authenticated;

-- ----------------------------------------------------------------
-- 7. CRIA O PRIMEIRO ADMIN (execute após criar o usuário no painel
--    Auth do Supabase ou via sign up)
--    Substitua o email abaixo pelo email do seu usuário admin.
-- ----------------------------------------------------------------
-- UPDATE public.profiles
-- SET role = 'admin', nome = 'Administrador'
-- WHERE email = 'seu-email@exemplo.com';
