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
  ativos_totais  numeric,                      -- usado na decomposição DuPont (giro de ativos, alavancagem)
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
  veredito_membro   text check (veredito_membro in ('COMPRA','MANUTENÇÃO','VENDA') or veredito_membro is null),
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
--  Tabela: profiles
--  Perfil de cada membro autenticado (Supabase Auth). O nome vem do
--  cadastro e é usado no lugar do campo de texto livre "membro".
-- ────────────────────────────────────────────────────────────────
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nome       text not null,
  email      text,
  nivel      text check (nivel in ('treinee','analista','head','diretor')) default 'treinee',
  ativo      boolean default true,
  entrou_em  date default current_date,
  criado_em  timestamptz default now()
);

comment on table profiles is 'Perfil de cada membro autenticado (nome, nível hierárquico na liga)';

-- ────────────────────────────────────────────────────────────────
--  RLS (Row Level Security)
--  App exige login (Supabase Auth): leitura e escrita liberadas para
--  qualquer usuário autenticado, mas nunca para o público anônimo.
-- ────────────────────────────────────────────────────────────────
alter table empresas enable row level security;
alter table dados_financeiros enable row level security;
alter table benchmarks enable row level security;
alter table analises enable row level security;
alter table profiles enable row level security;

create policy "leitura autenticada empresas" on empresas for select to authenticated using (true);

create policy "leitura autenticada dados" on dados_financeiros for select to authenticated using (true);
create policy "escrita autenticada dados" on dados_financeiros for insert to authenticated with check (true);
create policy "update autenticado dados" on dados_financeiros for update to authenticated using (true);

create policy "leitura autenticada benchmarks" on benchmarks for select to authenticated using (true);
create policy "update autenticado benchmarks" on benchmarks for update to authenticated using (true);

create policy "leitura autenticada analises" on analises for select to authenticated using (true);
create policy "escrita autenticada analises" on analises for insert to authenticated with check (true);
create policy "delete autenticado analises" on analises for delete to authenticated using (true);

create policy "leitura autenticada profiles" on profiles for select to authenticated using (true);
create policy "inserir proprio profile" on profiles for insert to authenticated with check (auth.uid() = id);
create policy "atualizar proprio profile" on profiles for update to authenticated using (auth.uid() = id);
create policy "diretor atualiza qualquer profile" on profiles for update to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.nivel = 'diretor'));
