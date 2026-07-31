# LMA Agro Analyzer

Ferramenta de análise fundamentalista de empresas de agronegócio listadas na B3, desenvolvida para a Liga de Mercado de Ações (LMA).

O sistema busca dados financeiros de uma empresa (receita, lucro, EBITDA, dívida, patrimônio líquido), calcula indicadores fundamentalistas (ROE, margem líquida, dívida/EBITDA, P/L, P/VP) e os compara com benchmarks por subsetor, gerando um score e um veredito automático (COMPRA/MANUTENÇÃO/VENDA). O objetivo é pedagógico: antes de ver o veredito do sistema, o membro registra sua própria análise, para depois comparar seu raciocínio com o modelo quantitativo.

## Funcionalidades

- **Dashboard** — visão geral das empresas, distribuição por subsetor e últimas análises registradas.
- **Análise Individual** — indicadores, gauge de score, radar de perfil, evolução histórica de receita/lucro e registro de veredito (membro vs. sistema).
- **Comparar** — duas empresas lado a lado, com destaque de qual está melhor em cada indicador.
- **Ranking** — todas as empresas ordenadas por indicador, com filtro por subsetor.
- **Evolução Temporal** e **Histórico** — acompanhamento ao longo do tempo e análises salvas pela equipe.
- **Adicionar Dados** — formulário para registrar manualmente novos períodos financeiros.

## Stack técnica

- [Vite](https://vitejs.dev/) + JavaScript vanilla (sem framework) — front-end simples e sem build complexo.
- [Supabase](https://supabase.com/) (Postgres) como banco de dados.
- [Chart.js](https://www.chartjs.org/) para os gráficos.

## Como rodar localmente

Pré-requisitos: [Node.js](https://nodejs.org/) 18+ e uma conta no [Supabase](https://supabase.com/) com o banco já criado (ver `docs/schema.sql` e `docs/seed.sql`).

```bash
npm install
cp .env.example .env
# preencha o .env com suas credenciais (veja abaixo)
npm run dev
```

O app abre em `http://localhost:5173`.

## Testes

```bash
npm test
```

Testes unitários da lógica de indicadores (`src/lib/indicators.test.js`) e testes de integração das páginas (`src/pages/*.test.js`), usando [Vitest](https://vitest.dev/) + jsdom. Não precisam de `.env` nem de conexão real com o Supabase — as chamadas ao banco são mockadas.

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase (Project Settings → API). |
| `VITE_SUPABASE_ANON_KEY` | Chave pública **anon/public** do Supabase (não a `service_role`). |

Essas variáveis são prefixadas com `VITE_` porque são lidas pelo próprio navegador — a chave `anon` do Supabase é feita para ser pública, protegida por Row Level Security no banco.

`.env` nunca deve ser commitado (já está no `.gitignore`).

## Estrutura de pastas

```
src/
  components/   componentes reutilizáveis de UI (sidebar, seletor de empresa, gauge, cabeçalho de página)
  lib/          lógica de negócio e infraestrutura (cliente Supabase, queries, cálculo de indicadores, roteador)
  pages/        uma página por rota, cada uma com sua própria função render()
  styles/       CSS global (identidade visual, cards, formulários, tabelas)
  main.js       ponto de entrada: monta o layout e registra as rotas
docs/           schema e seed do banco, guia de setup
```
