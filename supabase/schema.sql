create extension if not exists pgcrypto;

create table if not exists public.leads (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    nome text not null,
    whatsapp text not null,
    cidade text not null,
    idade int not null,
    contribuicao_anos int not null,
    beneficio text not null,
    situacao text not null,
    score int not null default 0,
    classificacao text not null default 'Baixa',
    observacoes text,
    origem text not null default 'github-pages-poc',
    consentimento boolean not null default false,

    constraint leads_nome_len check (char_length(nome) between 3 and 120),
    constraint leads_cidade_len check (char_length(cidade) between 2 and 120),
    constraint leads_whatsapp_e164 check (whatsapp ~ '^\+[1-9][0-9]{10,14}$'),
    constraint leads_idade_range check (idade between 16 and 120),
    constraint leads_contrib_range check (contribuicao_anos between 0 and 70),
    constraint leads_beneficio_enum check (beneficio in ('aposentadoria', 'auxilio-doenca', 'bpc-loas', 'beneficio-negado', 'outros')),
    constraint leads_situacao_enum check (situacao in ('primeiro-pedido', 'em-analise', 'indeferido', 'cessado')),
    constraint leads_classificacao_enum check (classificacao in ('Alta', 'Média', 'Baixa')),
    constraint leads_score_range check (score between 0 and 100),
    constraint leads_consent_required check (consentimento = true)
);

alter table public.leads enable row level security;

revoke all on public.leads from anon;
revoke all on public.leads from authenticated;

create policy if not exists leads_insert_anon
on public.leads
for insert
to anon
with check (
    consentimento = true
    and char_length(nome) between 3 and 120
    and char_length(cidade) between 2 and 120
    and whatsapp ~ '^\+[1-9][0-9]{10,14}$'
);