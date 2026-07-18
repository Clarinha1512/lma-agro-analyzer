-- ================================================================
--  LMA Agro Analyzer — Schema do banco de dados (Supabase/Postgres)
--  Cole isto no SQL Editor do Supabase e clique em Run
-- ================================================================

-- Limpa tabelas se já existirem (para reexecução)
drop table if exists analises cascade;
drop table if exists dados_financeiros cascade;
drop table if exists empresas cascade;
drop table if exists benchmarks cascade;

-- ────────────────────────────────────────────────────────────────
--  Tabela: empresas
--  As 32 empresas do IAGRO B3
-- ────────────────────────────────────────────────────────────────
create table empresas (
  id           bigint generated always as identity primary key,
  ticker       text not null unique,
  nome         text not null,
  subsetor     text not null check (subsetor in ('primario','insumos','agroindustria','agroservicos')),
  subsetor_label text,
  cnpj         text,
  descricao    text,
  destaques    jsonb default '[]'::jsonb,
  peso_iagro   numeric(6,3),
  criado_em    timestamptz default now()
);

comment on table empresas is 'Empresas do índice IAGRO da B3';

-- ────────────────────────────────────────────────────────────────
--  Tabela: dados_financeiros
--  Um registro por empresa + período (trimestre ou ano)
-- ────────────────────────────────────────────────────────────────
create table dados_financeiros (
  id             bigint generated always as identity primary key,
  empresa_id     bigint not null references empresas(id) on delete cascade,
  ticker         text not null,
  periodo        text not null,              -- formato "2024-03", "2024-12"
  tipo           text not null check (tipo in ('ITR','DFP','MANUAL','PDF')),
  ano            int,
  trimestre      text,                        -- "1T24", "2T24", etc (opcional)

  -- Dados brutos (em reais)
  receita        numeric,
  lucro          numeric,
  ebitda         numeric,
  resultado_op   numeric,
  divida_bruta   numeric,
  divida_liq     numeric,
  caixa          numeric,
  pl             numeric,                      -- patrimônio líquido
  capex          numeric,

  -- Indicadores calculados (%)
  margem_liq     numeric,
  margem_ebitda  numeric,
  margem_bruta   numeric,
  roe            numeric,
  roic           numeric,
  div_ebitda     numeric,                      -- múltiplo

  -- Metadados
  fonte          text,                         -- 'seed', 'manual', 'pdf'
  arquivo        text,                         -- nome do PDF se veio de upload
  criado_por     text,                         -- nome do membro
  criado_em      timestamptz default now(),

  unique (ticker, periodo)
);

comment on table dados_financeiros is 'Dados financeiros por empresa e período';
create index idx_dados_ticker on dados_financeiros(ticker);
create index idx_dados_periodo on dados_financeiros(periodo);

-- ────────────────────────────────────────────────────────────────
--  Tabela: benchmarks
--  Limites de cada indicador por subsetor (configurável)
-- ────────────────────────────────────────────────────────────────
create table benchmarks (
  id          bigint generated always as identity primary key,
  subsetor    text not null,
  indicador   text not null,                  -- 'pl','pvp','roe','mg','div'
  bom_min     numeric,
  bom_max     numeric,
  ok_min      numeric,
  ok_max      numeric,
  inverso     boolean default false,          -- true = menor é melhor (P/L, dívida)
  atualizado_em timestamptz default now(),
  unique (subsetor, indicador)
);

comment on table benchmarks is 'Limites de avaliação dos indicadores por subsetor';

-- ────────────────────────────────────────────────────────────────
--  Tabela: analises
--  Análises salvas pelos membros (o veredito deles + o do sistema)
-- ────────────────────────────────────────────────────────────────
create table analises (
  id                bigint generated always as identity primary key,
  ticker            text not null,
  periodo           text not null,
  membro            text,                       -- nome de quem fez

  -- Veredito do membro (análise manual pedagógica)
  veredito_membro   text check (veredito_membro in ('COMPRA','MANUTENCAO','VENDA', null)),
  notas_membro      text,

  -- Veredito do sistema (automático)
  veredito_sistema  text,
  score_sistema     int,
  score_max         int,

  criado_em         timestamptz default now()
);

comment on table analises is 'Análises feitas pelos membros para comparação pedagógica';
create index idx_analises_ticker on analises(ticker);

-- ────────────────────────────────────────────────────────────────
--  RLS (Row Level Security) — libera acesso público de leitura/escrita
--  Como é um app interno da liga, deixamos aberto para simplificar.
--  (Pode restringir depois com autenticação.)
-- ────────────────────────────────────────────────────────────────
alter table empresas enable row level security;
alter table dados_financeiros enable row level security;
alter table benchmarks enable row level security;
alter table analises enable row level security;

create policy "leitura publica empresas" on empresas for select using (true);
create policy "leitura publica dados" on dados_financeiros for select using (true);
create policy "escrita publica dados" on dados_financeiros for insert with check (true);
create policy "update publico dados" on dados_financeiros for update using (true);
create policy "leitura publica benchmarks" on benchmarks for select using (true);
create policy "update publico benchmarks" on benchmarks for update using (true);
create policy "leitura publica analises" on analises for select using (true);
create policy "escrita publica analises" on analises for insert with check (true);
create policy "delete publico analises" on analises for delete using (true);
