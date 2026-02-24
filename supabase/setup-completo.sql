-- ================================================================
-- CENTRAL DE ATENDIMENTO INSS - Setup Completo
-- Execute no DBeaver conectado ao Supabase:
--   Host    : aws-1-us-east-2.pooler.supabase.com
--   Port    : 5432
--   Database: postgres
--   User    : postgres.bhargdkruycbrcanfvuz
-- IMPORTANTE: usa schema PUBLIC (exposto por padrao na API Supabase)
-- ================================================================

-- ----------------------------------------------------------------
-- 1. TABELA DE LEADS (possíveis clientes)
-- ----------------------------------------------------------------
drop table if exists public.leads cascade;

create table public.leads (
  id                uuid        primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),

  -- Dados de contato
  nome              text        not null,
  whatsapp          text        not null,
  cidade            text        not null,

  -- Dados de triagem
  idade             int         not null,
  contribuicao_anos int         not null,
  beneficio         text        not null,
  situacao          text        not null,
  observacoes       text,

  -- Resultado da triagem automática
  score             int         not null default 0,
  classificacao     text        not null default 'Baixa',

  -- Controle interno
  status_atendimento text       not null default 'novo',
  responsavel        text,
  anotacoes_internas text,
  origem            text        not null default 'github-pages-poc',
  consentimento     boolean     not null default false,

  -- Constraints de validação
  constraint leads_beneficio_enum check (beneficio in (
    'aposentadoria', 'auxilio-doenca', 'bpc-loas', 'beneficio-negado', 'outros'
  )),
  constraint leads_situacao_enum check (situacao in (
    'primeiro-pedido', 'em-analise', 'indeferido', 'cessado'
  )),
  constraint leads_classificacao_enum check (classificacao in ('Alta', 'Média', 'Baixa')),
  constraint leads_status_enum check (status_atendimento in (
    'novo', 'em-contato', 'qualificado', 'convertido', 'descartado'
  )),
  constraint leads_idade_range check (idade between 16 and 120),
  constraint leads_contrib_range check (contribuicao_anos between 0 and 70),
  constraint leads_consent_required check (consentimento = true)
);

-- ----------------------------------------------------------------
-- 2. TABELA DE ATENDIMENTOS (histórico por lead)
-- ----------------------------------------------------------------
drop table if exists public.atendimentos cascade;

create table public.atendimentos (
  id            uuid        primary key default gen_random_uuid(),
  lead_id       uuid        not null references public.leads(id) on delete cascade,
  created_at    timestamptz not null default now(),
  tipo          text        not null default 'whatsapp',
  descricao     text        not null,
  responsavel   text,
  resultado     text,

  constraint atendimentos_tipo_enum check (tipo in (
    'whatsapp', 'ligacao', 'email', 'presencial', 'outro'
  ))
);

-- ----------------------------------------------------------------
-- 3. TABELA DE ORIENTACOES (FAQ automático de triagem)
-- ----------------------------------------------------------------
drop table if exists public.orientacoes cascade;

create table public.orientacoes (
  id            serial      primary key,
  beneficio     text        not null,
  situacao      text        not null,
  titulo        text        not null,
  texto         text        not null,
  ativo         boolean     not null default true,
  created_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- 4. ÍNDICES DE PERFORMANCE
-- ----------------------------------------------------------------
create index if not exists idx_leads_created_at     on public.leads(created_at desc);
create index if not exists idx_leads_classificacao  on public.leads(classificacao);
create index if not exists idx_leads_status         on public.leads(status_atendimento);
create index if not exists idx_leads_beneficio      on public.leads(beneficio);
create index if not exists idx_leads_whatsapp       on public.leads(whatsapp);
create index if not exists idx_atendimentos_lead_id on public.atendimentos(lead_id);

-- ----------------------------------------------------------------
-- 5. VIEW DE DASHBOARD (resumo de leads por classificação e mês)
-- ----------------------------------------------------------------
create or replace view public.v_dashboard as
select
  date_trunc('month', created_at)  as mes,
  beneficio,
  classificacao,
  status_atendimento,
  count(*)                         as total,
  avg(score)::int                  as score_medio
from public.leads
group by 1, 2, 3, 4
order by 1 desc, total desc;

-- ----------------------------------------------------------------
-- 6. VIEW DE LEADS NOVOS (fila de atendimento)
-- ----------------------------------------------------------------
create or replace view public.v_fila_atendimento as
select
  l.id,
  l.created_at,
  l.nome,
  l.whatsapp,
  l.cidade,
  l.beneficio,
  l.situacao,
  l.classificacao,
  l.score,
  l.status_atendimento,
  l.observacoes,
  count(a.id) as total_atendimentos
from public.leads l
left join public.atendimentos a on a.lead_id = l.id
where l.status_atendimento in ('novo', 'em-contato')
group by l.id
order by
  case l.classificacao
    when 'Alta'  then 1
    when 'Média' then 2
    else 3
  end,
  l.created_at asc;

-- ----------------------------------------------------------------
-- 7. SEGURANÇA - RLS e permissões (LGPD)
-- ----------------------------------------------------------------

-- Habilita RLS nas tabelas
alter table public.leads        enable row level security;
alter table public.atendimentos enable row level security;
alter table public.orientacoes  enable row level security;

-- Remove policies antigas se existirem
drop policy if exists leads_insert_anon on public.leads;
drop policy if exists leads_select_anon on public.leads;
drop policy if exists orientacoes_select_anon on public.orientacoes;

-- Frontend (anon): pode inserir leads com consentimento
create policy leads_insert_anon
  on public.leads
  for insert
  to anon
  with check (consentimento = true);

-- Frontend (anon): pode ler o proprio lead que acabou de inserir (para pegar id)
create policy leads_select_anon
  on public.leads
  for select
  to anon
  using (true);

-- Frontend (anon): pode ler orientacoes publicas
create policy orientacoes_select_anon
  on public.orientacoes
  for select
  to anon
  using (ativo = true);

-- Garante grants no schema public
grant usage  on schema public to anon;
grant insert on public.leads       to anon;
grant select on public.leads       to anon;
grant select on public.orientacoes to anon;

-- ----------------------------------------------------------------
-- 8. ORIENTAÇÕES INICIAIS (FAQ padrão)
-- ----------------------------------------------------------------
insert into public.orientacoes (beneficio, situacao, titulo, texto) values
('aposentadoria', 'primeiro-pedido',
 'Como dar entrada na aposentadoria?',
 'Acesse o Meu INSS (meu.inss.gov.br) ou ligue 135. Separe documentos: CPF, RG, carteira de trabalho e comprovantes de contribuição. Um advogado pode verificar se você já atingiu os requisitos mínimos.'),

('aposentadoria', 'indeferido',
 'Minha aposentadoria foi negada. E agora?',
 'Você pode entrar com recurso administrativo em até 30 dias ou ajuizar ação judicial. É importante revisar o motivo do indeferimento com um advogado especialista em INSS.'),

('auxilio-doenca', 'primeiro-pedido',
 'Como solicitar auxílio-doença?',
 'Agende perícia pelo Meu INSS ou 135. Você precisará de laudo médico atualizado e ter no mínimo 12 meses de contribuição (carência), salvo acidentes.'),

('auxilio-doenca', 'indeferido',
 'Auxílio-doença negado na perícia.',
 'É possível recorrer com novos laudos ou aguardar e reagendar. Um advogado pode avaliar se há base para ação judicial com pedido de tutela de urgência.'),

('bpc-loas', 'primeiro-pedido',
 'Como solicitar BPC/LOAS?',
 'O BPC não exige contribuição. Requisitos: deficiência grave ou ter 65+ anos, com renda familiar per capita até 1/4 do salário mínimo. Agende no CRAS ou Meu INSS.'),

('bpc-loas', 'indeferido',
 'BPC foi negado. Posso recorrer?',
 'Sim. Muitos indeferimentos são revertidos judicialmente, especialmente em casos de deficiência e vulnerabilidade comprovada. Consulte um advogado.'),

('beneficio-negado', 'indeferido',
 'Meu benefício foi negado. Quais os prazos?',
 'Para recurso administrativo: 30 dias do indeferimento. Para ação judicial: até 5 anos. Quanto antes agir, maiores as chances de êxito e recebimento de atrasados.'),

('beneficio-negado', 'cessado',
 'Meu benefício foi cancelado pelo INSS.',
 'Você pode recorrer administrativamente ou judicialmente. Guarde todos os documentos médicos e de contribuição. Um advogado pode pedir a suspensão do cancelamento.');

-- ----------------------------------------------------------------
-- 9. DADOS DE EXEMPLO PARA TESTES
-- ----------------------------------------------------------------
insert into public.leads (
  nome, whatsapp, cidade, idade, contribuicao_anos,
  beneficio, situacao, score, classificacao, consentimento, observacoes
) values
('João Silva',    '+5511987654321', 'São Paulo/SP',  62, 35, 'aposentadoria',    'em-analise',    80, 'Alta',  true, 'Processo em fase final de análise.'),
('Maria Oliveira','+5511976543210', 'Campinas/SP',   55, 20, 'auxilio-doenca',   'indeferido',    65, 'Média', true, 'Perícia negada, quer recorrer.'),
('Carlos Pereira','+5511965432109', 'Santos/SP',     70,  0, 'bpc-loas',        'primeiro-pedido',58,'Média', true, 'Idoso sem contribuição, baixa renda.'),
('Ana Costa',     '+5511954321098', 'Guarulhos/SP',  45, 12, 'beneficio-negado', 'cessado',       72, 'Alta',  true, 'Benefício cessado sem justificativa.');

-- ----------------------------------------------------------------
-- FIM DO SCRIPT
-- ----------------------------------------------------------------
select 'Setup concluido com sucesso!' as status,
       (select count(*) from public.leads)       as leads_inseridos,
       (select count(*) from public.orientacoes) as orientacoes_inseridas;
