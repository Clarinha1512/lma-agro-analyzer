# LMA Agro Analyzer — Handoff completo do projeto

> Documento gerado para dar contexto completo a uma nova sessão do Claude: o que é o projeto, tudo que já foi construído, decisões técnicas tomadas (e por quê), bugs encontrados/corrigidos, limitações conhecidas e acessos. O objetivo é permitir que uma IA analise o estado atual e sugira os próximos prompts/melhorias com base na realidade do código, não em suposições.

---

## 1. O que é o projeto

**LMA Agro Analyzer** é uma ferramenta de análise fundamentalista de 31 empresas de agronegócio listadas na B3 (índice IAGRO), construída para uma liga acadêmica de mercado de ações (LMA). Não é um produto comercial — é uma ferramenta de estudo/prática para os membros da liga.

**Objetivo pedagógico central:** antes de revelar o veredito automático do sistema (COMPRA/MANUTENÇÃO/VENDA baseado em indicadores fundamentalistas), o membro precisa registrar o *seu próprio* veredito e justificativa. Só depois o sistema mostra o cálculo automático, para comparação.

**Stack:** Vite + JavaScript vanilla (sem framework, deliberadamente simples), Supabase (Postgres) como banco, Chart.js para gráficos. Sem TypeScript, sem React/Vue.

---

## 2. Acessos

| Recurso | Valor |
|---|---|
| Repositório GitHub | https://github.com/Clarinha1512/lma-agro-analyzer |
| Branch principal | `main` (1 commit até agora: "Initial commit: LMA Agro Analyzer") |
| Supabase Project URL | `https://sneomemkfkqaqmhuhmlt.supabase.co` |
| Supabase anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuZW9tZW1rZmtxYXFtaHVobWx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzNDczMjIsImV4cCI6MjA5OTkyMzMyMn0.3KX05XAJSeW9zFyxbsfstTxu3qiaR2L1JHkuFPZUVyI` (chave pública, protegida por RLS — segura para compartilhar) |
| Onde essas chaves vivem no projeto | `.env` (git-ignorado) como `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` |

**Nenhum segredo real está exposto aqui.** A anon key do Supabase é projetada para ser pública (client-side), protegida por Row Level Security no banco. Um token pessoal do GitHub (PAT) foi usado uma única vez para o push inicial e **já foi revogado** pelo usuário — não existe mais nenhuma credencial sensível ativa neste projeto.

**Ainda não deployado publicamente** (sem Vercel/Netlify) — roda apenas via `npm run dev` (localhost:5173) até o momento.

---

## 3. Estrutura de pastas

```
LMA-Agro-Analyzer/
├── docs/
│   ├── GUIA_SETUP.md          (guia original de setup do Supabase)
│   ├── PROMPTS_CLAUDE_CODE.md (os 6 prompts originais que guiaram a construção)
│   ├── schema.sql             (schema do banco — ver seção 5)
│   └── seed.sql                (dados iniciais: 31 empresas, benchmarks, financeiros 2022-2024)
├── src/
│   ├── components/
│   │   ├── company-picker.js  (autocomplete reutilizável de empresa)
│   │   ├── gauge.js           (SVG gauge circular de score)
│   │   ├── page-header.js     (título de página + empty-state)
│   │   └── sidebar.js         (nav lateral, 8 itens)
│   ├── lib/
│   │   ├── database.js        (todas as queries Supabase)
│   │   ├── format.js          (formatação de moeda, normal e compacta)
│   │   ├── indicators.js      (lógica de classificação/score/veredito — o "motor" do sistema)
│   │   ├── router.js          (hash router simples, com suporte a query params)
│   │   └── supabase.js        (cliente Supabase)
│   ├── pages/                 (uma página por rota — ver seção 6)
│   ├── styles/main.css        (todo o CSS, ~750 linhas)
│   └── main.js                (entry point: monta layout, registra rotas)
├── .env                       (git-ignorado — credenciais reais)
├── .env.example                (template sem valores)
├── .gitignore
├── README.md
├── package.json
└── index.html
```

Nenhum backend próprio — 100% client-side, falando direto com o Supabase via REST (`@supabase/supabase-js`).

---

## 4. O que foi construído (por prompt/etapa)

O projeto seguiu um roteiro de 6 prompts (`docs/PROMPTS_CLAUDE_CODE.md`), todos concluídos, mais duas páginas que ficaram como placeholder e foram fechadas depois:

1. **Estrutura base** — Vite + sidebar + identidade visual (verde `#1c3d1a` / dourado `#b8860b`, fonte Inter, cards com cantos arredondados).
2. **Conexão Supabase** — `database.js` com todas as queries; Dashboard mostrando dados reais (contagem de empresas, distribuição por subsetor em gráfico de barras, últimas análises).
3. **Análise Individual** — o coração do sistema. Busca empresa (autocomplete) → seleciona período → registra veredito próprio *antes* de ver o do sistema → revela: gauge de score, radar de indicadores, tabela de indicadores com semáforo, gráfico de evolução receita/lucro, cards de métricas brutas → salva análise.
4. **Comparar + Ranking** — duas empresas lado a lado com destaque de quem é melhor em cada indicador + radar sobreposto; tabela de ranking de todas as empresas, ordenável por coluna, filtrável por subsetor, clicável para abrir a Análise Individual daquela empresa.
5. **Adicionar Dados** — formulário manual de entrada de novos períodos financeiros (receita, lucro, EBITDA, dívida, PL → calcula margem/ROE/dívida-EBITDA automaticamente e salva).
6. **Git + GitHub** — repositório inicializado, `.gitignore` correto, README, commit inicial, push para GitHub.

**Depois dos 6 prompts**, duas páginas que ficaram só como esqueleto ("Conecte o Supabase...") foram implementadas de verdade:
- **Histórico** — tabela completa e ordenável de todas as análises salvas (não só as últimas 5 do Dashboard), com filtro por ticker/membro, badge de concordância (veredito do membro bateu com o do sistema?), clicável para reabrir aquela análise exata (empresa + período).
- **Evolução Temporal** — escolhe uma empresa, mostra gráfico de linha com dois eixos (ROE e margem líquida em %, dívida/EBITDA em x) ao longo de todos os períodos cadastrados, mais variação do primeiro ao último período e tabela histórica com semáforos.

### Recurso removido deliberadamente

O Prompt 5 original pedia também upload de PDF com extração via Claude API. Foi **implementado e depois removido** por decisão do usuário: a API da Anthropic é paga (sem tier gratuito contínuo) e não fazia sentido o custo recorrente para um projeto estudantil. A arquitetura correta (function serverless server-side, chave nunca exposta no browser) chegou a ser construída e testada — ficou documentada aqui como referência caso o projeto queira retomar isso no futuro com orçamento. Hoje a página "Adicionar Dados" é **só entrada manual**.

---

## 5. Schema do banco (Supabase/Postgres)

4 tabelas, RLS habilitado com policies públicas de leitura/escrita (app interno, sem autenticação ainda):

**`empresas`** — as 31 empresas do IAGRO B3. Campos-chave: `ticker` (unique), `nome`, `subsetor` (enum: `primario`/`insumos`/`agroindustria`/`agroservicos`), `subsetor_label` (rótulo mais específico, ex: "Proteína animal", "Bebidas"), `destaques` (jsonb), `peso_iagro`.

**`dados_financeiros`** — um registro por empresa+período. Campos-chave: `ticker`, `periodo` (formato `"2024-12"`), `tipo` (ITR/DFP/MANUAL/PDF), `receita`, `lucro`, `ebitda`, `divida_liq`, `pl` (patrimônio líquido — **não confundir com o indicador P/L**), `margem_liq`, `roe`, `div_ebitda`, `fonte` (seed/manual/pdf). Unique em `(ticker, periodo)`.

**`benchmarks`** — limites de avaliação por subsetor. `indicador` ∈ `{'pl','pvp','roe','mg','div'}` (aqui sim, `'pl'` é o múltiplo Preço/Lucro, não confundir com o campo acima). `bom_min/bom_max/ok_min/ok_max` + `inverso` (boolean — `true` quando menor é melhor: dívida/EBITDA, P/L, P/VP).

**`analises`** — vereditos salvos. `veredito_membro` e `veredito_sistema`, `score_sistema`/`score_max`, `notas_membro`, `criado_em`.

⚠️ **Bug encontrado e corrigido nesta sessão:** o `CHECK` constraint de `analises.veredito_membro` no banco só aceitava `'MANUTENCAO'` (sem acento), mas todo o frontend usa `'MANUTENÇÃO'` (com cedilha/til, grafia correta). Isso faria o insert falhar sempre que um membro escolhesse "Manutenção" como seu próprio veredito (só não tinha aparecido ainda porque a única análise salva até agora usou "Compra"). `docs/schema.sql` já foi corrigido no repositório; **falta rodar o ALTER TABLE no banco Supabase real** (ver seção 8 — SQL pronto).

Schema completo e seed (31 empresas + benchmarks por subsetor + histórico financeiro 2022-2024) estão em `docs/schema.sql` e `docs/seed.sql`, incluídos na íntegra no Apêndice A.

---

## 6. Páginas (rotas)

Router é um hash router simples (`#/rota?param=valor`), suporta query params (`ticker`, `periodo`) para deep-linking entre páginas.

| Rota | Página | Status |
|---|---|---|
| `/dashboard` | Visão geral: contadores, distribuição por subsetor, últimas 5 análises | ✅ funcional |
| `/analise` | Análise Individual — o fluxo completo de indicadores + veredito | ✅ funcional |
| `/comparar` | Duas empresas lado a lado | ✅ funcional |
| `/ranking` | Tabela ordenável/filtrável de todas as empresas | ✅ funcional |
| `/evolucao` | Evolução temporal de indicadores de uma empresa | ✅ funcional |
| `/historico` | Todas as análises salvas, com busca | ✅ funcional |
| `/adicionar-dados` | Formulário manual de novos dados financeiros | ✅ funcional |
| `/configuracoes` | Status da conexão Supabase | ✅ funcional (minimalista, por design) |

Todas as 8 páginas do sidebar estão funcionais — não há mais placeholders.

---

## 7. Decisões técnicas e "ideias" importantes (o porquê por trás do código)

Isso é o que uma IA analisando o código não vai deduzir sozinha sem contexto:

1. **`classify()` é direction-aware, não um range check ingênuo.** Indicadores "inverso" (dívida/EBITDA, P/L, P/VP — menor é melhor) só olham o limite superior (`bom_max`/`ok_max`). Isso foi um bug real: a implementação original fazia `value >= bom_min && value <= bom_max`, o que classificava uma empresa com **caixa líquido** (dívida/EBITDA negativa, ex: AGRO3 com -0.24) como "Ruim" porque -0.24 < bom_min (0). Corrigido para: se inverso, só o teto importa; valores bem abaixo (inclusive negativos) são sempre "Bom".

2. **P/L e P/VP não vêm prontos do banco.** O schema de `dados_financeiros` não tem "número de ações" nem LPA/VPA. Para calcular P/L e P/VP a partir do preço da ação, o sistema pede *dois* campos opcionais (preço **e** número de ações em circulação), não só o preço como o prompt original sugeria — sem o número de ações, a conta matematicamente não fecha.

3. **Score = soma de pontos (verde=2, amarelo=1, vermelho=0) só dos indicadores com benchmark E valor disponíveis.** Se P/L e P/VP não têm preço/nº de ações preenchidos, eles são excluídos do score (não contam como 0) — hoje o score "de fábrica" sem cotação é sempre sobre 3 indicadores (ROE, margem, dívida/EBITDA), `score_max = 6`.

4. **Veredito automático:** `score/max >= 0.7` → COMPRA, `>= 0.4` → MANUTENÇÃO, senão → VENDA. Limiares arbitrários definidos nesta sessão, nunca validados contra dados reais/backtesting — candidato natural a revisão.

5. **Padrão de re-render:** cada página é uma função `render(container, query)` que reconstrói o HTML inteiro a cada mudança de estado (sem virtual DOM, sem framework). **Isso tem uma armadilha conhecida:** inputs de texto perdem foco a cada re-render completo. Foi corrigido em dois lugares (o `company-picker` perdia o valor exibido ao trocar de período; o filtro de texto do Histórico perdia foco a cada tecla) isolando um `<div id="...">` que é o único trecho re-renderizado, deixando o input intocado. **Esse padrão precisa ser revisado em qualquer nova página com inputs de texto que disparem re-render.**

6. **Deep-linking:** Ranking e Histórico navegam para `/analise?ticker=X&periodo=Y`, e a Análise Individual pré-seleciona a empresa (e o período, se veio na URL) automaticamente ao carregar.

7. **`healthScore()` e `melhorPorValor()` em `indicators.js`** são compartilhados entre Análise Individual e Comparar para não duplicar lógica — vale seguir esse padrão (lib compartilhada, não copiar-colar) em features futuras.

8. **Segurança de API keys:** a Supabase anon key é `VITE_`-prefixed de propósito (é pública por design, protegida por RLS). Qualquer chave secreta futura (ex: se a extração por IA voltar) **não pode** ter prefixo `VITE_`, porque isso a exporia no bundle do browser — precisaria de uma function serverless.

9. **Linguagem:** todo o domínio (nomes de variáveis, veredito, indicadores) está em português — os valores de veredito são literalmente as strings `'COMPRA'`, `'MANUTENÇÃO'`, `'VENDA'` usadas em toda a UI e no banco. Manter essa convenção.

---

## 8. Ação pendente no banco (rodar manualmente no Supabase SQL Editor)

```sql
alter table analises drop constraint analises_veredito_membro_check;
alter table analises add constraint analises_veredito_membro_check
  check (veredito_membro in ('COMPRA','MANUTENÇÃO','VENDA') or veredito_membro is null);
```

---

## 9. O que NÃO existe ainda (gaps conhecidos / ideias para próximos prompts)

Do roadmap original ("depois dos 6 prompts"), nada disso foi feito ainda:

- **Deploy público** (Vercel/Netlify) — hoje só roda local via `npm run dev`.
- **Autenticação** — Supabase Auth não está configurado; qualquer pessoa com a anon key pode ler/escrever tudo (RLS está com policies abertas "para simplificar").
- **Alertas de piora** — nenhuma lógica compara o período atual com o anterior para destacar deterioração.
- **Exportar relatório em PDF** da análise.
- **Painel de administração de benchmarks** — hoje os limites por subsetor só podem ser editados via SQL direto no Supabase, não pela UI.
- **Testes automatizados** — não existe nenhum teste (unit, integração, e2e) no projeto até agora.
- **Mais dados históricos** — o usuário mencionou que vai buscar manualmente mais anos de dados das empresas via a página Adicionar Dados; hoje o seed cobre só 2022-2024 para a maioria.
- Os limiares do veredito automático (0.7/0.4) e os benchmarks por subsetor (seed.sql) foram estimativas iniciais, nunca validados contra desempenho real de mercado.

---

## 10. Apêndice A — Código-fonte completo

### `package.json`
```json
{
  "name": "lma-agro-analyzer",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.45.0",
    "chart.js": "^4.5.1"
  },
  "devDependencies": {
    "vite": "^5.4.0"
  },
  "allowScripts": {
    "esbuild@0.21.5": true
  }
}
```

### `src/lib/supabase.js`
```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
```

### `src/lib/database.js`
```js
import { supabase } from './supabase.js'

function client() {
  if (!supabase) {
    throw new Error('Supabase não configurado. Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.')
  }
  return supabase
}

export async function listarEmpresas() {
  const { data, error } = await client()
    .from('empresas')
    .select('*')
    .order('ticker', { ascending: true })
  if (error) throw error
  return data
}

export async function getEmpresa(ticker) {
  const { data, error } = await client()
    .from('empresas')
    .select('*')
    .eq('ticker', ticker)
    .single()
  if (error) throw error
  return data
}

export async function getDadosFinanceiros(ticker) {
  const { data, error } = await client()
    .from('dados_financeiros')
    .select('*')
    .eq('ticker', ticker)
    .order('periodo', { ascending: true })
  if (error) throw error
  return data
}

export async function getDadosPeriodo(ticker, periodo) {
  const { data, error } = await client()
    .from('dados_financeiros')
    .select('*')
    .eq('ticker', ticker)
    .eq('periodo', periodo)
    .single()
  if (error) throw error
  return data
}

export async function listarUltimosDados() {
  const { data, error } = await client()
    .from('dados_financeiros')
    .select('*')
    .order('periodo', { ascending: false })
  if (error) throw error

  const porTicker = new Map()
  for (const row of data) {
    if (!porTicker.has(row.ticker)) porTicker.set(row.ticker, row)
  }
  return porTicker
}

export async function getBenchmarks() {
  const { data, error } = await client().from('benchmarks').select('*')
  if (error) throw error

  const organizado = {}
  for (const row of data) {
    organizado[row.subsetor] ??= {}
    organizado[row.subsetor][row.indicador] = row
  }
  return organizado
}

export async function salvarAnalise(analise) {
  const { data, error } = await client()
    .from('analises')
    .insert(analise)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listarAnalises() {
  const { data, error } = await client()
    .from('analises')
    .select('*')
    .order('id', { ascending: false })
  if (error) throw error
  return data
}

export async function inserirDadosFinanceiros(dados) {
  const { data, error } = await client()
    .from('dados_financeiros')
    .insert(dados)
    .select()
    .single()
  if (error) throw error
  return data
}
```

### `src/lib/indicators.js`
```js
export const CLASSE_LABEL = { ok: 'Bom', warn: 'Atenção', danger: 'Ruim' }
export const CLASSE_POINTS = { ok: 2, warn: 1, danger: 0 }

export function classify(value, benchmark) {
  if (value == null || Number.isNaN(value) || !benchmark) return null
  const { bom_min, bom_max, ok_min, ok_max, inverso } = benchmark

  // "inverso" = menor é melhor (ex.: dívida/EBITDA, P/L, P/VP). Só o limite superior
  // importa: um valor bem abaixo do teto (inclusive negativo, ex. caixa líquido) é "Bom".
  if (inverso) {
    if (bom_max != null && value <= bom_max) return 'ok'
    if (ok_max != null && value <= ok_max) return 'warn'
    return 'danger'
  }

  if (bom_min != null && value >= bom_min) return 'ok'
  if (ok_min != null && value >= ok_min) return 'warn'
  return 'danger'
}

export function formatFaixa(benchmark, unidade) {
  if (!benchmark) return 'Sem benchmark cadastrado'
  const { bom_min, bom_max, ok_min, ok_max, inverso } = benchmark
  const fmt = (n) => `${n}${unidade}`
  return inverso
    ? `Bom: ≤ ${fmt(bom_max)} · Ok: ≤ ${fmt(ok_max)}`
    : `Bom: ≥ ${fmt(bom_min)} · Ok: ≥ ${fmt(ok_min)}`
}

export function interpretar(row) {
  if (row.requerDados) return 'Informe o preço da ação e o número de ações em circulação para calcular.'
  if (!row.benchmark) return 'Sem benchmark cadastrado para este indicador no subsetor da empresa.'
  if (row.classe === 'ok') return 'Dentro da faixa considerada saudável para o subsetor.'
  if (row.classe === 'warn') return 'Em zona de atenção — vale acompanhar a evolução.'
  return 'Fora da faixa saudável para o subsetor — investigue a causa.'
}

/**
 * Monta a lista de indicadores fundamentalistas de um período.
 * P/L e P/VP dependem de preço da ação e nº de ações (não vêm do banco).
 */
export function buildIndicators(dados, benchmarksSubsetor, { preco, numAcoes } = {}) {
  const benchmarks = benchmarksSubsetor || {}
  const lpa = preco != null && numAcoes ? dados.lucro / numAcoes : null
  const vpa = preco != null && numAcoes ? dados.pl / numAcoes : null
  const precoLucro = preco != null && lpa ? preco / lpa : null
  const precoVp = preco != null && vpa ? preco / vpa : null

  const base = [
    { key: 'roe', label: 'ROE', unidade: '%', valor: dados.roe },
    { key: 'mg', label: 'Margem líquida', unidade: '%', valor: dados.margem_liq },
    { key: 'div', label: 'Dívida/EBITDA', unidade: 'x', valor: dados.div_ebitda },
    { key: 'pl', label: 'P/L', unidade: 'x', valor: precoLucro, requerDados: precoLucro == null },
    { key: 'pvp', label: 'P/VP', unidade: 'x', valor: precoVp, requerDados: precoVp == null },
  ]

  return base.map((row) => {
    const benchmark = benchmarks[row.key]
    const classe = row.requerDados ? null : classify(row.valor, benchmark)
    return { ...row, benchmark, classe }
  })
}

export function computeScore(indicadores) {
  const validos = indicadores.filter((row) => row.classe)
  const score = validos.reduce((soma, row) => soma + CLASSE_POINTS[row.classe], 0)
  const max = validos.length * 2
  return { score, max }
}

export function veredictoAutomatico(score, max) {
  if (max === 0) return 'INDEFINIDO'
  const pct = score / max
  if (pct >= 0.7) return 'COMPRA'
  if (pct >= 0.4) return 'MANUTENÇÃO'
  return 'VENDA'
}

export function healthScore(row) {
  if (row.classe === 'ok') return 100
  if (row.classe === 'warn') return 60
  if (row.classe === 'danger') return 20
  return 0
}

/** Indica qual dos dois valores é melhor para o indicador, respeitando a direção (inverso = menor é melhor). */
export function melhorPorValor(valorA, valorB, inverso) {
  if (valorA == null && valorB == null) return null
  if (valorA == null) return 'B'
  if (valorB == null) return 'A'
  if (valorA === valorB) return null
  if (inverso) return valorA < valorB ? 'A' : 'B'
  return valorA > valorB ? 'A' : 'B'
}
```

### `src/lib/format.js`
```js
export function formatMoeda(valor) {
  if (valor == null) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(valor)
}

export function formatMoedaCompacta(valor) {
  if (valor == null) return '—'
  const abs = Math.abs(valor)
  const sinal = valor < 0 ? '-' : ''
  const escala = (divisor, sufixo) =>
    `${sinal}R$ ${(abs / divisor).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ${sufixo}`

  if (abs >= 1e12) return escala(1e12, 'tri')
  if (abs >= 1e9) return escala(1e9, 'bi')
  if (abs >= 1e6) return escala(1e6, 'mi')
  if (abs >= 1e3) return escala(1e3, 'mil')
  return formatMoeda(valor)
}
```

### `src/lib/router.js`
```js
const routes = new Map()

export function registerRoute(path, render) {
  routes.set(path, render)
}

export function getCurrentPath() {
  const hash = window.location.hash.replace(/^#/, '')
  const [path] = hash.split('?')
  return path || '/dashboard'
}

export function getCurrentQuery() {
  const hash = window.location.hash.replace(/^#/, '')
  const [, query] = hash.split('?')
  return new URLSearchParams(query || '')
}

export function navigateTo(path, params) {
  const query = params ? `?${new URLSearchParams(params).toString()}` : ''
  window.location.hash = `${path}${query}`
}

export function startRouter(outlet, onNavigate) {
  const resolve = () => {
    const path = getCurrentPath()
    const query = getCurrentQuery()
    const render = routes.get(path) || routes.get('/dashboard')
    outlet.innerHTML = ''
    render(outlet, query)
    onNavigate?.(path)
  }

  window.addEventListener('hashchange', resolve)
  resolve()
}
```

### `src/components/company-picker.js`
```js
export function companyPicker(id, placeholder) {
  return `
    <div class="company-picker" data-picker="${id}">
      <input type="text" class="picker-input" placeholder="${placeholder}" autocomplete="off" />
      <div class="picker-dropdown hidden"></div>
    </div>`
}

export function bindCompanyPicker(root, id, empresas, onSelect) {
  const wrapper = root.querySelector(`[data-picker="${id}"]`)
  const input = wrapper.querySelector('.picker-input')
  const dropdown = wrapper.querySelector('.picker-dropdown')

  function showResults(query) {
    const q = query.trim().toLowerCase()
    const results = (
      q
        ? empresas.filter(
            (e) => e.ticker.toLowerCase().includes(q) || e.nome.toLowerCase().includes(q)
          )
        : empresas
    ).slice(0, 8)

    dropdown.innerHTML = results.length
      ? results
          .map(
            (e) => `
        <button type="button" class="picker-option" data-ticker="${e.ticker}">
          <strong>${e.ticker}</strong>
          <span class="muted">${e.nome}</span>
        </button>`
          )
          .join('')
      : `<div class="picker-empty muted">Nenhuma empresa encontrada</div>`

    dropdown.classList.remove('hidden')
  }

  input.addEventListener('focus', () => showResults(input.value))
  input.addEventListener('input', () => showResults(input.value))
  input.addEventListener('blur', () => {
    setTimeout(() => dropdown.classList.add('hidden'), 150)
  })

  dropdown.addEventListener('mousedown', (event) => {
    const option = event.target.closest('.picker-option')
    if (!option) return
    const empresa = empresas.find((e) => e.ticker === option.dataset.ticker)
    if (!empresa) return
    input.value = `${empresa.ticker} — ${empresa.nome}`
    dropdown.classList.add('hidden')
    onSelect(empresa)
  })

  return { setValue: (text) => { input.value = text } }
}
```

### `src/components/gauge.js`
```js
const VEREDICTO_COR = {
  COMPRA: 'var(--color-ok)',
  'MANUTENÇÃO': 'var(--color-warn)',
  VENDA: 'var(--color-danger)',
  INDEFINIDO: 'var(--color-text-muted)',
}

export function gaugeSvg({ score, max, veredicto }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, score / max)) : 0
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const dash = circumference * pct
  const cor = VEREDICTO_COR[veredicto] || VEREDICTO_COR.INDEFINIDO

  return `
    <svg viewBox="0 0 130 130" class="gauge-svg">
      <circle cx="65" cy="65" r="${radius}" class="gauge-track" />
      <circle
        cx="65" cy="65" r="${radius}"
        class="gauge-fill"
        style="stroke:${cor}; stroke-dasharray:${dash} ${circumference};"
        transform="rotate(-90 65 65)"
      />
      <text x="65" y="60" text-anchor="middle" class="gauge-score">${score}</text>
      <text x="65" y="78" text-anchor="middle" class="gauge-max">de ${max}</text>
    </svg>`
}
```

### `src/components/page-header.js`
```js
export function pageHeader(title, subtitle) {
  return `
    <header class="page-header">
      <h1>${title}</h1>
      ${subtitle ? `<p>${subtitle}</p>` : ''}
    </header>`
}

export function emptyState(message) {
  return `
    <div class="card empty-state">
      <p>${message}</p>
    </div>`
}
```

### `src/components/sidebar.js`
```js
export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'grid' },
  { path: '/analise', label: 'Análise Individual', icon: 'search' },
  { path: '/comparar', label: 'Comparar', icon: 'columns' },
  { path: '/ranking', label: 'Ranking', icon: 'trophy' },
  { path: '/evolucao', label: 'Evolução Temporal', icon: 'trending' },
  { path: '/historico', label: 'Histórico', icon: 'clock' },
  { path: '/adicionar-dados', label: 'Adicionar Dados', icon: 'upload' },
  { path: '/configuracoes', label: 'Configurações', icon: 'settings' },
]

const ICONS = {
  grid: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
  search:
    '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.35-4.35"/>',
  columns: '<path d="M4 4h7v16H4zM13 4h7v16h-7z"/>',
  trophy:
    '<path d="M8 4h8v4a4 4 0 0 1-8 0V4z"/><path d="M8 5H5a2 2 0 0 0 2 4M16 5h3a2 2 0 0 1-2 4"/><path d="M10 14h4v3h-4z"/><path d="M8 20h8"/>',
  trending: '<path d="M4 16l5-5 4 4 7-8"/><path d="M15 7h6v6"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  upload:
    '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
}

function icon(name) {
  return `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`
}

export function renderSidebar(activePath) {
  const items = NAV_ITEMS.map(
    (item) => `
      <a href="#${item.path}" class="nav-item${item.path === activePath ? ' active' : ''}">
        ${icon(item.icon)}
        <span>${item.label}</span>
      </a>`
  ).join('')

  return `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">LMA</div>
        <div class="brand-text">
          <strong>Agro Analyzer</strong>
          <span>Liga de Mercado de Ações</span>
        </div>
      </div>
      <nav class="nav">${items}</nav>
      <div class="sidebar-footer">
        <span>v0.1.0</span>
      </div>
    </aside>`
}

export function bindSidebarActiveState(root, activePath) {
  root.querySelectorAll('.nav-item').forEach((el) => {
    el.classList.toggle('active', el.getAttribute('href') === `#${activePath}`)
  })
}
```

### `src/main.js`
```js
import './styles/main.css'
import { renderSidebar, bindSidebarActiveState } from './components/sidebar.js'
import { registerRoute, startRouter } from './lib/router.js'

import { render as renderDashboard } from './pages/dashboard.js'
import { render as renderAnaliseIndividual } from './pages/analiseIndividual.js'
import { render as renderComparar } from './pages/comparar.js'
import { render as renderRanking } from './pages/ranking.js'
import { render as renderEvolucaoTemporal } from './pages/evolucaoTemporal.js'
import { render as renderHistorico } from './pages/historico.js'
import { render as renderAdicionarDados } from './pages/adicionarDados.js'
import { render as renderConfiguracoes } from './pages/configuracoes.js'

registerRoute('/dashboard', renderDashboard)
registerRoute('/analise', renderAnaliseIndividual)
registerRoute('/comparar', renderComparar)
registerRoute('/ranking', renderRanking)
registerRoute('/evolucao', renderEvolucaoTemporal)
registerRoute('/historico', renderHistorico)
registerRoute('/adicionar-dados', renderAdicionarDados)
registerRoute('/configuracoes', renderConfiguracoes)

const app = document.querySelector('#app')

app.innerHTML = `
  ${renderSidebar('/dashboard')}
  <main class="content">
    <div id="outlet"></div>
  </main>`

const outlet = document.querySelector('#outlet')

startRouter(outlet, (path) => bindSidebarActiveState(app, path))
```

### `src/pages/dashboard.js`
```js
import { pageHeader } from '../components/page-header.js'
import { listarEmpresas, listarAnalises } from '../lib/database.js'
import { isSupabaseConfigured } from '../lib/supabase.js'

function skeleton() {
  return `
    ${pageHeader('Dashboard', 'Visão geral das empresas de agronegócio acompanhadas pela liga.')}
    <div id="dashboard-body">
      <p class="muted">Carregando dados do Supabase…</p>
    </div>`
}

function notConfiguredCard() {
  return `
    <div class="card empty-state">
      <p>Supabase ainda não configurado. Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env e reinicie o servidor.</p>
    </div>`
}

function errorCard(error) {
  return `
    <div class="card empty-state">
      <p>Não foi possível carregar os dados do Supabase.</p>
      <p class="muted">${error.message || error}</p>
    </div>`
}

function statCard(label, value) {
  return `
    <div class="card stat-card">
      <span class="stat-label">${label}</span>
      <span class="stat-value">${value}</span>
    </div>`
}

function subsetorChart(empresas) {
  const counts = new Map()
  for (const empresa of empresas) {
    const label = empresa.subsetor_label || empresa.subsetor || 'Outro'
    counts.set(label, (counts.get(label) || 0) + 1)
  }
  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1])
  const max = Math.max(...entries.map(([, count]) => count), 1)

  if (!entries.length) {
    return `<p class="muted">Nenhuma empresa cadastrada ainda.</p>`
  }

  return `
    <div class="bar-chart">
      ${entries
        .map(
          ([label, count]) => `
        <div class="bar-row">
          <span class="bar-label">${label}</span>
          <div class="bar-track">
            <div class="bar-fill" style="width:${(count / max) * 100}%"></div>
          </div>
          <span class="bar-value">${count}</span>
        </div>`
        )
        .join('')}
    </div>`
}

function veredictoClass(veredito) {
  if (!veredito) return 'neutral'
  const v = veredito.toLowerCase()
  if (v.includes('compra')) return 'ok'
  if (v.includes('venda')) return 'danger'
  return 'warn'
}

function ultimasAnalises(analises) {
  if (!analises.length) {
    return `<p class="muted">Nenhuma análise registrada ainda.</p>`
  }
  return `
    <ul class="analysis-list">
      ${analises
        .slice(0, 5)
        .map(
          (analise) => `
        <li class="analysis-item">
          <div>
            <strong>${analise.ticker}</strong>
            <span class="muted"> · ${analise.periodo}</span>
          </div>
          <div class="analysis-meta">
            <span class="badge badge-${veredictoClass(analise.veredito_sistema)}">${analise.veredito_sistema || '—'}</span>
            <span class="muted">${analise.membro || 'Anônimo'}</span>
          </div>
        </li>`
        )
        .join('')}
    </ul>`
}

function content(empresas, analises) {
  const subsetores = new Set(empresas.map((e) => e.subsetor_label || e.subsetor)).size
  const ultima = analises[0]
    ? `${analises[0].ticker} · ${analises[0].membro || 'Anônimo'}`
    : '—'

  return `
    <section class="stats-grid">
      ${statCard('Empresas', empresas.length)}
      ${statCard('Subsetores', subsetores)}
      ${statCard('Análises salvas', analises.length)}
      ${statCard('Última análise', ultima)}
    </section>

    <section class="grid-2">
      <div class="card">
        <h2>Distribuição por subsetor</h2>
        ${subsetorChart(empresas)}
      </div>
      <div class="card">
        <h2>Últimas análises</h2>
        ${ultimasAnalises(analises)}
      </div>
    </section>`
}

export async function render(container) {
  container.innerHTML = skeleton()

  if (!isSupabaseConfigured) {
    container.querySelector('#dashboard-body').innerHTML = notConfiguredCard()
    return
  }

  try {
    const [empresas, analises] = await Promise.all([listarEmpresas(), listarAnalises()])
    container.querySelector('#dashboard-body').innerHTML = content(empresas, analises)
  } catch (error) {
    container.querySelector('#dashboard-body').innerHTML = errorCard(error)
  }
}
```

### `src/pages/analiseIndividual.js`
```js
import Chart from 'chart.js/auto'
import { pageHeader } from '../components/page-header.js'
import { companyPicker, bindCompanyPicker } from '../components/company-picker.js'
import { gaugeSvg } from '../components/gauge.js'
import { listarEmpresas, getDadosFinanceiros, getBenchmarks, salvarAnalise } from '../lib/database.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { buildIndicators, computeScore, veredictoAutomatico, formatFaixa, interpretar, healthScore } from '../lib/indicators.js'
import { formatMoeda, formatMoedaCompacta } from '../lib/format.js'

const VEREDITOS = ['COMPRA', 'MANUTENÇÃO', 'VENDA']

function formatPeriodo(periodo) {
  const [ano, mes] = periodo.split('-')
  return `${mes}/${ano}`
}

function formatNumero(valor, casas = 1) {
  if (valor == null) return '—'
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: casas })
}

export async function render(container, query) {
  if (!isSupabaseConfigured) {
    container.innerHTML = `
      ${pageHeader('Análise Individual', 'Busque uma empresa e um período para ver os indicadores fundamentalistas.')}
      <div class="card empty-state"><p>Configure o Supabase (.env) para usar esta página.</p></div>`
    return
  }

  container.innerHTML = `
    ${pageHeader('Análise Individual', 'Busque uma empresa e um período para ver os indicadores fundamentalistas.')}
    <div class="card"><p class="muted">Carregando empresas…</p></div>`

  let empresas
  let benchmarksPorSubsetor
  try {
    ;[empresas, benchmarksPorSubsetor] = await Promise.all([listarEmpresas(), getBenchmarks()])
  } catch (error) {
    container.querySelector('.card').innerHTML = `<p>Erro ao carregar dados: ${error.message}</p>`
    return
  }

  const state = {
    empresa: null,
    periodos: [],
    periodoSelecionado: null,
    benchmarksSubsetor: null,
    membro: '',
    veredictoMembro: null,
    justificativa: '',
    revelado: false,
    preco: null,
    numAcoes: null,
    salvando: false,
    salvo: false,
  }

  let radarChart = null
  let evolucaoChart = null

  function destroyCharts() {
    radarChart?.destroy()
    evolucaoChart?.destroy()
    radarChart = null
    evolucaoChart = null
  }

  function indicadoresAtuais() {
    return buildIndicators(state.periodoSelecionado, state.benchmarksSubsetor, {
      preco: state.preco,
      numAcoes: state.numAcoes,
    })
  }

  function renderSearchSection() {
    return `
      <section class="card">
        <div class="form-row">
          <div class="field">
            <label>Empresa</label>
            ${companyPicker('empresa-analise', 'Buscar por ticker ou nome...')}
          </div>
          <div class="field">
            <label for="period-select">Período</label>
            <select id="period-select" ${state.periodos.length ? '' : 'disabled'}>
              ${
                state.periodos.length
                  ? state.periodos
                      .slice()
                      .reverse()
                      .map(
                        (d) =>
                          `<option value="${d.periodo}" ${d.periodo === state.periodoSelecionado?.periodo ? 'selected' : ''}>${formatPeriodo(d.periodo)} · ${d.tipo}</option>`
                      )
                      .join('')
                  : '<option>Selecione uma empresa primeiro</option>'
              }
            </select>
          </div>
        </div>
        ${
          state.empresa
            ? `<p class="muted company-meta">${state.empresa.nome} · ${state.empresa.subsetor_label}</p>`
            : ''
        }
      </section>`
  }

  function renderVeredictoForm() {
    return `
      <section class="card">
        <h2>Antes de ver o veredito do sistema…</h2>
        <p class="muted">Registre sua própria análise. Isso ajuda a comparar seu raciocínio com o modelo quantitativo.</p>
        <div class="form-row">
          <div class="field">
            <label for="membro-nome">Seu nome (opcional)</label>
            <input id="membro-nome" type="text" value="${state.membro}" placeholder="Ex: Enrico" />
          </div>
        </div>
        <div class="field">
          <label>Seu veredito</label>
          <div class="veredito-options">
            ${VEREDITOS.map(
              (v) => `
              <label class="veredito-option">
                <input type="radio" name="veredito-membro" value="${v}" ${state.veredictoMembro === v ? 'checked' : ''} />
                <span>${v}</span>
              </label>`
            ).join('')}
          </div>
        </div>
        <div class="field">
          <label for="justificativa">Justificativa</label>
          <textarea id="justificativa" rows="3" placeholder="Por que você chegou a esse veredito?">${state.justificativa}</textarea>
        </div>
        <button id="revelar-btn" class="btn btn-primary" ${state.veredictoMembro ? '' : 'disabled'}>
          Revelar veredito do sistema
        </button>
      </section>`
  }

  function indicatorRowHtml(row) {
    const classe = row.classe || 'neutral'
    const valorTexto = row.valor == null ? '—' : `${formatNumero(row.valor)}${row.unidade}`
    return `
      <div class="indicator-row">
        <div class="indicator-main">
          <span class="dot dot-${classe}"></span>
          <span class="indicator-label">${row.label}</span>
        </div>
        <span class="indicator-value">${valorTexto}</span>
        <span class="indicator-faixa muted">${formatFaixa(row.benchmark, row.unidade)}</span>
        <span class="indicator-interpretacao muted">${interpretar(row)}</span>
      </div>`
  }

  function renderResultado() {
    const dados = state.periodoSelecionado
    const indicadores = indicadoresAtuais()
    const { score, max } = computeScore(indicadores)
    const veredictoSistema = veredictoAutomatico(score, max)
    const concorda = state.veredictoMembro === veredictoSistema

    return `
      <section class="grid-2">
        <div class="card gauge-card">
          <h2>Score do sistema</h2>
          <div id="gauge-container">${gaugeSvg({ score, max, veredicto: veredictoSistema })}</div>
          <div class="veredicto-comparacao">
            <span class="badge badge-${veredictoSistema === 'COMPRA' ? 'ok' : veredictoSistema === 'VENDA' ? 'danger' : 'warn'}">Sistema: ${veredictoSistema}</span>
            <span class="badge badge-neutral">Você: ${state.veredictoMembro || '—'}</span>
          </div>
          <p class="muted">${concorda ? 'Seu veredito coincide com o do sistema.' : 'Seu veredito diverge do sistema — vale revisar a justificativa.'}</p>
        </div>
        <div class="card">
          <h2>Perfil dos indicadores</h2>
          <canvas id="radar-chart"></canvas>
        </div>
      </section>

      <section class="card">
        <h2>Indicadores fundamentalistas</h2>
        <div id="indicadores-lista">
          ${indicadores.map(indicatorRowHtml).join('')}
        </div>
        <div class="form-row cotacao-row">
          <div class="field">
            <label for="preco-acao">Preço atual da ação (R$)</label>
            <input id="preco-acao" type="number" step="0.01" min="0" placeholder="Opcional" value="${state.preco ?? ''}" />
          </div>
          <div class="field">
            <label for="num-acoes">Nº de ações em circulação</label>
            <input id="num-acoes" type="number" step="1" min="0" placeholder="Opcional" value="${state.numAcoes ?? ''}" />
          </div>
        </div>
        <p class="muted">Preencha os dois campos acima para calcular P/L e P/VP com base na cotação atual.</p>
      </section>

      <section class="stats-grid">
        <div class="card stat-card"><span class="stat-label">Receita</span><span class="stat-value" title="${formatMoeda(dados.receita)}">${formatMoedaCompacta(dados.receita)}</span></div>
        <div class="card stat-card"><span class="stat-label">Lucro</span><span class="stat-value" title="${formatMoeda(dados.lucro)}">${formatMoedaCompacta(dados.lucro)}</span></div>
        <div class="card stat-card"><span class="stat-label">EBITDA</span><span class="stat-value" title="${formatMoeda(dados.ebitda)}">${formatMoedaCompacta(dados.ebitda)}</span></div>
        <div class="card stat-card"><span class="stat-label">Dívida líquida</span><span class="stat-value" title="${formatMoeda(dados.divida_liq)}">${formatMoedaCompacta(dados.divida_liq)}</span></div>
        <div class="card stat-card"><span class="stat-label">Patrimônio líquido</span><span class="stat-value" title="${formatMoeda(dados.pl)}">${formatMoedaCompacta(dados.pl)}</span></div>
      </section>

      <section class="card">
        <h2>Evolução histórica</h2>
        <canvas id="evolucao-chart"></canvas>
      </section>

      <section class="card">
        <button id="salvar-btn" class="btn btn-primary" ${state.salvo ? 'disabled' : ''}>
          ${state.salvo ? 'Análise salva ✓' : state.salvando ? 'Salvando…' : 'Salvar análise'}
        </button>
        <span id="salvar-status" class="muted"></span>
      </section>`
  }

  function draw() {
    destroyCharts()
    container.innerHTML = `
      ${pageHeader('Análise Individual', 'Busque uma empresa e um período para ver os indicadores fundamentalistas.')}
      ${renderSearchSection()}
      ${state.periodoSelecionado ? (state.revelado ? renderResultado() : renderVeredictoForm()) : ''}`

    const pickerApi = bindCompanyPicker(container, 'empresa-analise', empresas, onSelectEmpresa)
    if (state.empresa) pickerApi.setValue(`${state.empresa.ticker} — ${state.empresa.nome}`)

    const periodSelect = container.querySelector('#period-select')
    periodSelect?.addEventListener('change', (event) => onSelectPeriodo(event.target.value))

    if (!state.periodoSelecionado) return

    if (!state.revelado) {
      bindVeredictoForm()
    } else {
      bindResultado()
      initCharts()
    }
  }

  function bindVeredictoForm() {
    const nomeInput = container.querySelector('#membro-nome')
    nomeInput.addEventListener('input', (e) => {
      state.membro = e.target.value
    })

    const justificativaInput = container.querySelector('#justificativa')
    justificativaInput.addEventListener('input', (e) => {
      state.justificativa = e.target.value
    })

    const revelarBtn = container.querySelector('#revelar-btn')
    container.querySelectorAll('input[name="veredito-membro"]').forEach((radio) => {
      radio.addEventListener('change', (e) => {
        state.veredictoMembro = e.target.value
        revelarBtn.disabled = false
      })
    })

    revelarBtn.addEventListener('click', () => {
      state.revelado = true
      draw()
    })
  }

  function atualizarIndicadoresView() {
    const indicadores = indicadoresAtuais()
    const { score, max } = computeScore(indicadores)
    const veredictoSistema = veredictoAutomatico(score, max)

    container.querySelector('#indicadores-lista').innerHTML = indicadores.map(indicatorRowHtml).join('')
    container.querySelector('#gauge-container').innerHTML = gaugeSvg({ score, max, veredicto: veredictoSistema })

    const comparacao = container.querySelector('.veredicto-comparacao')
    if (comparacao) {
      const concorda = state.veredictoMembro === veredictoSistema
      comparacao.innerHTML = `
        <span class="badge badge-${veredictoSistema === 'COMPRA' ? 'ok' : veredictoSistema === 'VENDA' ? 'danger' : 'warn'}">Sistema: ${veredictoSistema}</span>
        <span class="badge badge-neutral">Você: ${state.veredictoMembro || '—'}</span>`
      comparacao.nextElementSibling.textContent = concorda
        ? 'Seu veredito coincide com o do sistema.'
        : 'Seu veredito diverge do sistema — vale revisar a justificativa.'
    }

    if (radarChart) {
      radarChart.data.datasets[0].data = indicadores.map(healthScore)
      radarChart.update()
    }

    return { score, max, veredictoSistema }
  }

  function bindResultado() {
    const precoInput = container.querySelector('#preco-acao')
    precoInput.addEventListener('input', (e) => {
      state.preco = e.target.value === '' ? null : parseFloat(e.target.value)
      atualizarIndicadoresView()
    })

    const numAcoesInput = container.querySelector('#num-acoes')
    numAcoesInput.addEventListener('input', (e) => {
      state.numAcoes = e.target.value === '' ? null : parseFloat(e.target.value)
      atualizarIndicadoresView()
    })

    const salvarBtn = container.querySelector('#salvar-btn')
    const statusEl = container.querySelector('#salvar-status')
    salvarBtn.addEventListener('click', async () => {
      const { score, max, veredictoSistema } = atualizarIndicadoresView()
      state.salvando = true
      salvarBtn.disabled = true
      salvarBtn.textContent = 'Salvando…'
      try {
        await salvarAnalise({
          ticker: state.empresa.ticker,
          periodo: state.periodoSelecionado.periodo,
          membro: state.membro || 'Anônimo',
          veredito_membro: state.veredictoMembro,
          notas_membro: state.justificativa,
          veredito_sistema: veredictoSistema,
          score_sistema: score,
          score_max: max,
        })
        state.salvando = false
        state.salvo = true
        salvarBtn.textContent = 'Análise salva ✓'
        statusEl.textContent = ''
      } catch (error) {
        state.salvando = false
        salvarBtn.disabled = false
        salvarBtn.textContent = 'Salvar análise'
        statusEl.textContent = `Erro: ${error.message}`
      }
    })
  }

  function initCharts() {
    const indicadores = indicadoresAtuais()
    const radarCanvas = container.querySelector('#radar-chart')
    radarChart = new Chart(radarCanvas, {
      type: 'radar',
      data: {
        labels: indicadores.map((r) => r.label),
        datasets: [
          {
            label: 'Perfil (0–100)',
            data: indicadores.map(healthScore),
            backgroundColor: 'rgba(184, 134, 11, 0.2)',
            borderColor: '#b8860b',
            pointBackgroundColor: '#1c3d1a',
          },
        ],
      },
      options: {
        scales: { r: { min: 0, max: 100, ticks: { stepSize: 20 } } },
        plugins: { legend: { display: false } },
      },
    })

    const evolucaoCanvas = container.querySelector('#evolucao-chart')
    evolucaoChart = new Chart(evolucaoCanvas, {
      type: 'bar',
      data: {
        labels: state.periodos.map((d) => formatPeriodo(d.periodo)),
        datasets: [
          {
            label: 'Receita',
            data: state.periodos.map((d) => d.receita),
            backgroundColor: '#28531f',
          },
          {
            label: 'Lucro',
            data: state.periodos.map((d) => d.lucro),
            backgroundColor: '#b8860b',
          },
        ],
      },
      options: {
        scales: { y: { beginAtZero: true } },
      },
    })
  }

  async function onSelectEmpresa(empresa, periodoPreferido) {
    state.empresa = empresa
    state.benchmarksSubsetor = benchmarksPorSubsetor[empresa.subsetor] || {}
    state.periodoSelecionado = null
    state.revelado = false
    resetVereditoState()

    try {
      state.periodos = await getDadosFinanceiros(empresa.ticker)
    } catch (error) {
      state.periodos = []
    }

    if (state.periodos.length) {
      const preferido = periodoPreferido && state.periodos.find((d) => d.periodo === periodoPreferido)
      state.periodoSelecionado = preferido || state.periodos[state.periodos.length - 1]
    }

    draw()
  }

  function onSelectPeriodo(periodo) {
    state.periodoSelecionado = state.periodos.find((d) => d.periodo === periodo) || null
    state.revelado = false
    resetVereditoState()
    draw()
  }

  function resetVereditoState() {
    state.membro = ''
    state.veredictoMembro = null
    state.justificativa = ''
    state.preco = null
    state.numAcoes = null
    state.salvando = false
    state.salvo = false
  }

  const tickerPreselecionado = query?.get('ticker')
  const periodoPreselecionado = query?.get('periodo')
  if (tickerPreselecionado) {
    const empresa = empresas.find((e) => e.ticker === tickerPreselecionado)
    if (empresa) {
      await onSelectEmpresa(empresa, periodoPreselecionado)
      return
    }
  }

  draw()
}
```

### `src/pages/comparar.js`
```js
import Chart from 'chart.js/auto'
import { pageHeader } from '../components/page-header.js'
import { companyPicker, bindCompanyPicker } from '../components/company-picker.js'
import { listarEmpresas, getDadosFinanceiros, getBenchmarks } from '../lib/database.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import {
  buildIndicators,
  computeScore,
  veredictoAutomatico,
  healthScore,
  melhorPorValor,
} from '../lib/indicators.js'

function formatPeriodo(periodo) {
  const [ano, mes] = periodo.split('-')
  return `${mes}/${ano}`
}

function formatNumero(valor, casas = 1) {
  if (valor == null) return '—'
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: casas })
}

export async function render(container) {
  if (!isSupabaseConfigured) {
    container.innerHTML = `
      ${pageHeader('Comparar', 'Compare duas empresas lado a lado no mesmo período.')}
      <div class="card empty-state"><p>Configure o Supabase (.env) para usar esta página.</p></div>`
    return
  }

  container.innerHTML = `
    ${pageHeader('Comparar', 'Compare duas empresas lado a lado no mesmo período.')}
    <div class="card"><p class="muted">Carregando empresas…</p></div>`

  let empresas
  let benchmarksPorSubsetor
  try {
    ;[empresas, benchmarksPorSubsetor] = await Promise.all([listarEmpresas(), getBenchmarks()])
  } catch (error) {
    container.querySelector('.card').innerHTML = `<p>Erro ao carregar dados: ${error.message}</p>`
    return
  }

  const state = {
    empresaA: null,
    empresaB: null,
    periodosA: [],
    periodosB: [],
    periodosComuns: [],
    periodoSelecionado: null,
  }

  let radarChart = null

  function destroyChart() {
    radarChart?.destroy()
    radarChart = null
  }

  function renderSelectSection() {
    return `
      <section class="card">
        <div class="form-row">
          <div class="field">
            <label>Empresa A</label>
            ${companyPicker('empresa-a', 'Buscar por ticker ou nome...')}
          </div>
          <div class="field">
            <label>Empresa B</label>
            ${companyPicker('empresa-b', 'Buscar por ticker ou nome...')}
          </div>
          <div class="field">
            <label for="compare-period">Período</label>
            <select id="compare-period" ${state.periodosComuns.length ? '' : 'disabled'}>
              ${
                state.periodosComuns.length
                  ? state.periodosComuns
                      .map(
                        (p) =>
                          `<option value="${p}" ${p === state.periodoSelecionado ? 'selected' : ''}>${formatPeriodo(p)}</option>`
                      )
                      .join('')
                  : '<option>Escolha as duas empresas</option>'
              }
            </select>
          </div>
        </div>
        ${
          state.empresaA && state.empresaB && !state.periodosComuns.length
            ? '<p class="muted" style="margin-top:12px">Nenhum período em comum entre as duas empresas.</p>'
            : ''
        }
      </section>`
  }

  function valorTexto(row) {
    return row.valor == null ? '—' : `${formatNumero(row.valor)}${row.unidade}`
  }

  function renderResultado() {
    const dadosA = state.periodosA.find((d) => d.periodo === state.periodoSelecionado)
    const dadosB = state.periodosB.find((d) => d.periodo === state.periodoSelecionado)

    const indicadoresA = buildIndicators(dadosA, benchmarksPorSubsetor[state.empresaA.subsetor] || {})
    const indicadoresB = buildIndicators(dadosB, benchmarksPorSubsetor[state.empresaB.subsetor] || {})

    const scoreA = computeScore(indicadoresA)
    const scoreB = computeScore(indicadoresB)
    const veredictoA = veredictoAutomatico(scoreA.score, scoreA.max)
    const veredictoB = veredictoAutomatico(scoreB.score, scoreB.max)

    const vencedora =
      scoreA.score === scoreB.score ? null : scoreA.score > scoreB.score ? 'A' : 'B'

    const linhas = indicadoresA.map((rowA, i) => {
      const rowB = indicadoresB[i]
      const inverso = rowA.benchmark?.inverso ?? rowB.benchmark?.inverso ?? false
      const melhor = melhorPorValor(rowA.valor, rowB.valor, inverso)
      return `
        <div class="compare-row">
          <span class="compare-label">${rowA.label}</span>
          <div class="compare-cell ${melhor === 'A' ? 'compare-better' : ''}">
            <span class="dot dot-${rowA.classe || 'neutral'}"></span> ${valorTexto(rowA)}
          </div>
          <div class="compare-cell ${melhor === 'B' ? 'compare-better' : ''}">
            <span class="dot dot-${rowB.classe || 'neutral'}"></span> ${valorTexto(rowB)}
          </div>
        </div>`
    })

    return `
      <section class="grid-2">
        <div class="card">
          <h2>${state.empresaA.ticker}</h2>
          <p class="muted">${state.empresaA.nome}</p>
          <div class="veredicto-comparacao" style="justify-content:flex-start">
            <span class="badge badge-${veredictoA === 'COMPRA' ? 'ok' : veredictoA === 'VENDA' ? 'danger' : 'warn'}">${veredictoA}</span>
            <span class="muted">Score ${scoreA.score}/${scoreA.max}</span>
          </div>
        </div>
        <div class="card">
          <h2>${state.empresaB.ticker}</h2>
          <p class="muted">${state.empresaB.nome}</p>
          <div class="veredicto-comparacao" style="justify-content:flex-start">
            <span class="badge badge-${veredictoB === 'COMPRA' ? 'ok' : veredictoB === 'VENDA' ? 'danger' : 'warn'}">${veredictoB}</span>
            <span class="muted">Score ${scoreB.score}/${scoreB.max}</span>
          </div>
        </div>
      </section>

      <section class="card">
        <h2>Quem tem fundamentos mais sólidos?</h2>
        <p class="muted">
          ${
            vencedora === null
              ? 'As duas empresas têm score equivalente neste período.'
              : `<strong>${vencedora === 'A' ? state.empresaA.ticker : state.empresaB.ticker}</strong> tem o score mais alto neste período (${vencedora === 'A' ? scoreA.score : scoreB.score}/${vencedora === 'A' ? scoreA.max : scoreB.max}).`
          }
        </p>
      </section>

      <section class="grid-2">
        <div class="card">
          <h2>Indicadores lado a lado</h2>
          <div class="compare-header">
            <span></span>
            <span>${state.empresaA.ticker}</span>
            <span>${state.empresaB.ticker}</span>
          </div>
          ${linhas.join('')}
        </div>
        <div class="card">
          <h2>Perfil comparado</h2>
          <canvas id="radar-comparar"></canvas>
        </div>
      </section>`
  }

  function draw() {
    destroyChart()
    container.innerHTML = `
      ${pageHeader('Comparar', 'Compare duas empresas lado a lado no mesmo período.')}
      ${renderSelectSection()}
      ${state.empresaA && state.empresaB && state.periodoSelecionado ? renderResultado() : ''}`

    const pickerA = bindCompanyPicker(container, 'empresa-a', empresas, onSelectEmpresaA)
    if (state.empresaA) pickerA.setValue(`${state.empresaA.ticker} — ${state.empresaA.nome}`)

    const pickerB = bindCompanyPicker(container, 'empresa-b', empresas, onSelectEmpresaB)
    if (state.empresaB) pickerB.setValue(`${state.empresaB.ticker} — ${state.empresaB.nome}`)

    const periodSelect = container.querySelector('#compare-period')
    periodSelect?.addEventListener('change', (event) => {
      state.periodoSelecionado = event.target.value
      draw()
    })

    if (state.empresaA && state.empresaB && state.periodoSelecionado) {
      initChart()
    }
  }

  function initChart() {
    const dadosA = state.periodosA.find((d) => d.periodo === state.periodoSelecionado)
    const dadosB = state.periodosB.find((d) => d.periodo === state.periodoSelecionado)
    const indicadoresA = buildIndicators(dadosA, benchmarksPorSubsetor[state.empresaA.subsetor] || {})
    const indicadoresB = buildIndicators(dadosB, benchmarksPorSubsetor[state.empresaB.subsetor] || {})

    const canvas = container.querySelector('#radar-comparar')
    radarChart = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: indicadoresA.map((r) => r.label),
        datasets: [
          {
            label: state.empresaA.ticker,
            data: indicadoresA.map(healthScore),
            backgroundColor: 'rgba(28, 61, 26, 0.2)',
            borderColor: '#1c3d1a',
            pointBackgroundColor: '#1c3d1a',
          },
          {
            label: state.empresaB.ticker,
            data: indicadoresB.map(healthScore),
            backgroundColor: 'rgba(184, 134, 11, 0.2)',
            borderColor: '#b8860b',
            pointBackgroundColor: '#b8860b',
          },
        ],
      },
      options: {
        scales: { r: { min: 0, max: 100, ticks: { stepSize: 20 } } },
      },
    })
  }

  function atualizarPeriodosComuns() {
    if (!state.periodosA.length || !state.periodosB.length) {
      state.periodosComuns = []
      state.periodoSelecionado = null
      return
    }
    const periodosB = new Set(state.periodosB.map((d) => d.periodo))
    state.periodosComuns = state.periodosA
      .map((d) => d.periodo)
      .filter((p) => periodosB.has(p))
      .sort()
      .reverse()
    state.periodoSelecionado = state.periodosComuns[0] || null
  }

  async function onSelectEmpresaA(empresa) {
    state.empresaA = empresa
    try {
      state.periodosA = await getDadosFinanceiros(empresa.ticker)
    } catch (error) {
      state.periodosA = []
    }
    atualizarPeriodosComuns()
    draw()
  }

  async function onSelectEmpresaB(empresa) {
    state.empresaB = empresa
    try {
      state.periodosB = await getDadosFinanceiros(empresa.ticker)
    } catch (error) {
      state.periodosB = []
    }
    atualizarPeriodosComuns()
    draw()
  }

  draw()
}
```

### `src/pages/ranking.js`
```js
import { pageHeader, emptyState } from '../components/page-header.js'
import { listarEmpresas, listarUltimosDados, getBenchmarks } from '../lib/database.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { buildIndicators, computeScore, veredictoAutomatico } from '../lib/indicators.js'
import { navigateTo } from '../lib/router.js'

function formatNumero(valor, casas = 1) {
  if (valor == null) return '—'
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: casas })
}

function veredictoBadgeClasse(veredito) {
  if (veredito === 'COMPRA') return 'ok'
  if (veredito === 'VENDA') return 'danger'
  if (veredito === 'MANUTENÇÃO') return 'warn'
  return 'neutral'
}

function buildRows(empresas, ultimosDados, benchmarksPorSubsetor) {
  return empresas.map((empresa) => {
    const dados = ultimosDados.get(empresa.ticker)
    if (!dados) {
      return {
        empresa,
        ticker: empresa.ticker,
        nome: empresa.nome,
        subsetor: empresa.subsetor_label,
        periodo: null,
        roe: null,
        roeClasse: null,
        mg: null,
        mgClasse: null,
        div: null,
        divClasse: null,
        score: null,
        max: null,
        veredito: null,
      }
    }

    const indicadores = buildIndicators(dados, benchmarksPorSubsetor[empresa.subsetor] || {})
    const { score, max } = computeScore(indicadores)
    const veredito = veredictoAutomatico(score, max)
    const porChave = Object.fromEntries(indicadores.map((row) => [row.key, row]))

    return {
      empresa,
      ticker: empresa.ticker,
      nome: empresa.nome,
      subsetor: empresa.subsetor_label,
      periodo: dados.periodo,
      roe: porChave.roe.valor,
      roeClasse: porChave.roe.classe,
      mg: porChave.mg.valor,
      mgClasse: porChave.mg.classe,
      div: porChave.div.valor,
      divClasse: porChave.div.classe,
      score,
      max,
      veredito,
    }
  })
}

function sortRows(rows, key, dir) {
  const factor = dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const va = a[key]
    const vb = b[key]
    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1
    if (typeof va === 'string') return factor * va.localeCompare(vb, 'pt-BR')
    return factor * (va - vb)
  })
}

const COLUNAS = [
  { key: 'ticker', label: 'Ticker' },
  { key: 'nome', label: 'Nome' },
  { key: 'subsetor', label: 'Subsetor' },
  { key: 'roe', label: 'ROE' },
  { key: 'mg', label: 'Margem' },
  { key: 'div', label: 'Dívida/EBITDA' },
  { key: 'score', label: 'Score' },
  { key: 'veredito', label: 'Veredito' },
]

export async function render(container) {
  if (!isSupabaseConfigured) {
    container.innerHTML = `
      ${pageHeader('Ranking', 'Todas as empresas ordenadas por indicadores fundamentalistas.')}
      <div class="card empty-state"><p>Configure o Supabase (.env) para usar esta página.</p></div>`
    return
  }

  container.innerHTML = `
    ${pageHeader('Ranking', 'Todas as empresas ordenadas por indicadores fundamentalistas.')}
    <div class="card"><p class="muted">Carregando ranking…</p></div>`

  let empresas
  let ultimosDados
  let benchmarksPorSubsetor
  try {
    ;[empresas, ultimosDados, benchmarksPorSubsetor] = await Promise.all([
      listarEmpresas(),
      listarUltimosDados(),
      getBenchmarks(),
    ])
  } catch (error) {
    container.querySelector('.card').innerHTML = `<p>Erro ao carregar dados: ${error.message}</p>`
    return
  }

  const rows = buildRows(empresas, ultimosDados, benchmarksPorSubsetor)
  const subsetores = [...new Set(empresas.map((e) => e.subsetor_label))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR')
  )

  const state = {
    subsetorFiltro: 'todos',
    sortKey: 'ticker',
    sortDir: 'asc',
  }

  function indicatorCell(valor, classe, unidade) {
    return `<span class="dot dot-${classe || 'neutral'}"></span> ${valor == null ? '—' : `${formatNumero(valor)}${unidade}`}`
  }

  function renderTable() {
    const filtradas =
      state.subsetorFiltro === 'todos'
        ? rows
        : rows.filter((r) => r.subsetor === state.subsetorFiltro)
    const ordenadas = sortRows(filtradas, state.sortKey, state.sortDir)

    if (!ordenadas.length) {
      return emptyState('Nenhuma empresa encontrada para este filtro.')
    }

    return `
      <section class="card table-card">
        <div class="table-scroll">
          <table class="ranking-table">
            <thead>
              <tr>
                ${COLUNAS.map(
                  (col) => `
                  <th data-key="${col.key}" class="sortable ${state.sortKey === col.key ? 'sorted' : ''}">
                    ${col.label} ${state.sortKey === col.key ? (state.sortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>`
                ).join('')}
              </tr>
            </thead>
            <tbody>
              ${ordenadas
                .map(
                  (row) => `
                <tr class="ranking-row" data-ticker="${row.ticker}">
                  <td><strong>${row.ticker}</strong></td>
                  <td>${row.nome}</td>
                  <td>${row.subsetor}</td>
                  <td>${indicatorCell(row.roe, row.roeClasse, '%')}</td>
                  <td>${indicatorCell(row.mg, row.mgClasse, '%')}</td>
                  <td>${indicatorCell(row.div, row.divClasse, 'x')}</td>
                  <td>${row.score == null ? '—' : `${row.score}/${row.max}`}</td>
                  <td>${row.veredito ? `<span class="badge badge-${veredictoBadgeClasse(row.veredito)}">${row.veredito}</span>` : '—'}</td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </section>`
  }

  function draw() {
    container.innerHTML = `
      ${pageHeader('Ranking', 'Todas as empresas ordenadas por indicadores fundamentalistas.')}
      <section class="card table-toolbar">
        <div class="field">
          <label for="subsetor-filtro">Subsetor</label>
          <select id="subsetor-filtro">
            <option value="todos">Todos os subsetores</option>
            ${subsetores
              .map(
                (s) =>
                  `<option value="${s}" ${state.subsetorFiltro === s ? 'selected' : ''}>${s}</option>`
              )
              .join('')}
          </select>
        </div>
      </section>
      ${renderTable()}`

    container.querySelector('#subsetor-filtro').addEventListener('change', (event) => {
      state.subsetorFiltro = event.target.value
      draw()
    })

    container.querySelectorAll('th.sortable').forEach((th) => {
      th.addEventListener('click', () => {
        const key = th.dataset.key
        if (state.sortKey === key) {
          state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc'
        } else {
          state.sortKey = key
          state.sortDir = 'asc'
        }
        draw()
      })
    })

    container.querySelectorAll('.ranking-row').forEach((tr) => {
      tr.addEventListener('click', () => {
        navigateTo('/analise', { ticker: tr.dataset.ticker })
      })
    })
  }

  draw()
}
```

### `src/pages/evolucaoTemporal.js`
```js
import Chart from 'chart.js/auto'
import { pageHeader, emptyState } from '../components/page-header.js'
import { companyPicker, bindCompanyPicker } from '../components/company-picker.js'
import { listarEmpresas, getDadosFinanceiros, getBenchmarks } from '../lib/database.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { buildIndicators, formatFaixa, interpretar } from '../lib/indicators.js'

function formatPeriodo(periodo) {
  const [ano, mes] = periodo.split('-')
  return `${mes}/${ano}`
}

function formatNumero(valor, casas = 1) {
  if (valor == null) return '—'
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: casas })
}

function formatDelta(atual, anterior, unidade) {
  if (atual == null || anterior == null) return '—'
  const delta = atual - anterior
  const sinal = delta > 0 ? '+' : ''
  return `${sinal}${formatNumero(delta)}${unidade}`
}

export async function render(container) {
  if (!isSupabaseConfigured) {
    container.innerHTML = `
      ${pageHeader('Evolução Temporal', 'Acompanhe a trajetória dos indicadores de uma empresa ao longo dos períodos.')}
      <div class="card empty-state"><p>Configure o Supabase (.env) para usar esta página.</p></div>`
    return
  }

  container.innerHTML = `
    ${pageHeader('Evolução Temporal', 'Acompanhe a trajetória dos indicadores de uma empresa ao longo dos períodos.')}
    <div class="card"><p class="muted">Carregando empresas…</p></div>`

  let empresas
  let benchmarksPorSubsetor
  try {
    ;[empresas, benchmarksPorSubsetor] = await Promise.all([listarEmpresas(), getBenchmarks()])
  } catch (error) {
    container.querySelector('.card').innerHTML = `<p>Erro ao carregar dados: ${error.message}</p>`
    return
  }

  const state = {
    empresa: null,
    periodos: [],
  }

  let chart = null

  function destroyChart() {
    chart?.destroy()
    chart = null
  }

  function renderSearchSection() {
    return `
      <section class="card">
        <div class="form-row">
          <div class="field">
            <label>Empresa</label>
            ${companyPicker('empresa-evolucao', 'Buscar por ticker ou nome...')}
          </div>
        </div>
        ${
          state.empresa
            ? `<p class="muted company-meta">${state.empresa.nome} · ${state.empresa.subsetor_label}</p>`
            : ''
        }
      </section>`
  }

  function indicatorRowHtml(row) {
    const classe = row.classe || 'neutral'
    const valorTexto = row.valor == null ? '—' : `${formatNumero(row.valor)}${row.unidade}`
    return `
      <div class="indicator-row">
        <div class="indicator-main">
          <span class="dot dot-${classe}"></span>
          <span class="indicator-label">${row.label}</span>
        </div>
        <span class="indicator-value">${valorTexto}</span>
        <span class="indicator-faixa muted">${formatFaixa(row.benchmark, row.unidade)}</span>
        <span class="indicator-interpretacao muted">${interpretar(row)}</span>
      </div>`
  }

  function renderResultado() {
    if (!state.periodos.length) {
      return emptyState('Nenhum dado financeiro cadastrado para esta empresa ainda.')
    }

    const benchmarksSubsetor = benchmarksPorSubsetor[state.empresa.subsetor] || {}
    const indicadoresPorPeriodo = state.periodos.map((dados) => ({
      periodo: dados.periodo,
      tipo: dados.tipo,
      indicadores: buildIndicators(dados, benchmarksSubsetor),
    }))

    const maisRecente = indicadoresPorPeriodo[indicadoresPorPeriodo.length - 1].indicadores
    const maisAntigo = indicadoresPorPeriodo[0].indicadores
    const porChaveRecente = Object.fromEntries(maisRecente.map((r) => [r.key, r]))
    const porChaveAntigo = Object.fromEntries(maisAntigo.map((r) => [r.key, r]))

    const linhasTabela = indicadoresPorPeriodo
      .slice()
      .reverse()
      .map(
        ({ periodo, tipo, indicadores }) => `
        <div class="compare-row" style="grid-template-columns: 0.8fr 0.6fr 1fr 1fr 1fr;">
          <span class="compare-label">${formatPeriodo(periodo)}</span>
          <span class="muted">${tipo}</span>
          ${indicadores
            .filter((r) => ['roe', 'mg', 'div'].includes(r.key))
            .map(
              (r) => `
            <div class="compare-cell">
              <span class="dot dot-${r.classe || 'neutral'}"></span>
              ${r.valor == null ? '—' : `${formatNumero(r.valor)}${r.unidade}`}
            </div>`
            )
            .join('')}
        </div>`
      )
      .join('')

    return `
      <section class="grid-2">
        <div class="card stat-card">
          <span class="stat-label">Variação do ROE (1º → último período)</span>
          <span class="stat-value">${formatDelta(porChaveRecente.roe?.valor, porChaveAntigo.roe?.valor, '%')}</span>
        </div>
        <div class="card stat-card">
          <span class="stat-label">Variação da margem líquida</span>
          <span class="stat-value">${formatDelta(porChaveRecente.mg?.valor, porChaveAntigo.mg?.valor, '%')}</span>
        </div>
      </section>

      <section class="card">
        <h2>ROE, margem líquida e dívida/EBITDA ao longo do tempo</h2>
        <canvas id="evolucao-indicadores-chart"></canvas>
      </section>

      <section class="card">
        <h2>Indicador mais recente (${formatPeriodo(state.periodos[state.periodos.length - 1].periodo)})</h2>
        ${maisRecente.map(indicatorRowHtml).join('')}
      </section>

      <section class="card">
        <h2>Histórico por período</h2>
        <div class="compare-header" style="grid-template-columns: 0.8fr 0.6fr 1fr 1fr 1fr;">
          <span>Período</span>
          <span>Tipo</span>
          <span>ROE</span>
          <span>Margem</span>
          <span>Dívida/EBITDA</span>
        </div>
        ${linhasTabela}
      </section>`
  }

  function draw() {
    destroyChart()
    container.innerHTML = `
      ${pageHeader('Evolução Temporal', 'Acompanhe a trajetória dos indicadores de uma empresa ao longo dos períodos.')}
      ${renderSearchSection()}
      ${state.empresa ? renderResultado() : ''}`

    const pickerApi = bindCompanyPicker(container, 'empresa-evolucao', empresas, onSelectEmpresa)
    if (state.empresa) pickerApi.setValue(`${state.empresa.ticker} — ${state.empresa.nome}`)

    if (state.empresa && state.periodos.length) {
      initChart()
    }
  }

  function initChart() {
    const benchmarksSubsetor = benchmarksPorSubsetor[state.empresa.subsetor] || {}
    const indicadoresPorPeriodo = state.periodos.map((dados) => buildIndicators(dados, benchmarksSubsetor))

    const canvas = container.querySelector('#evolucao-indicadores-chart')
    chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: state.periodos.map((d) => formatPeriodo(d.periodo)),
        datasets: [
          {
            label: 'ROE (%)',
            data: indicadoresPorPeriodo.map((ind) => ind.find((r) => r.key === 'roe')?.valor ?? null),
            borderColor: '#1c3d1a',
            backgroundColor: '#1c3d1a',
            yAxisID: 'y',
            tension: 0.2,
          },
          {
            label: 'Margem líquida (%)',
            data: indicadoresPorPeriodo.map((ind) => ind.find((r) => r.key === 'mg')?.valor ?? null),
            borderColor: '#b8860b',
            backgroundColor: '#b8860b',
            yAxisID: 'y',
            tension: 0.2,
          },
          {
            label: 'Dívida/EBITDA (x)',
            data: indicadoresPorPeriodo.map((ind) => ind.find((r) => r.key === 'div')?.valor ?? null),
            borderColor: '#c0392b',
            backgroundColor: '#c0392b',
            yAxisID: 'y1',
            borderDash: [6, 4],
            tension: 0.2,
          },
        ],
      },
      options: {
        scales: {
          y: { type: 'linear', position: 'left', title: { display: true, text: '%' } },
          y1: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: 'x' },
            grid: { drawOnChartArea: false },
          },
        },
      },
    })
  }

  async function onSelectEmpresa(empresa) {
    state.empresa = empresa
    try {
      state.periodos = await getDadosFinanceiros(empresa.ticker)
    } catch (error) {
      state.periodos = []
    }
    draw()
  }

  draw()
}
```

### `src/pages/historico.js`
```js
import { pageHeader, emptyState } from '../components/page-header.js'
import { listarAnalises, listarEmpresas } from '../lib/database.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { navigateTo } from '../lib/router.js'

function veredictoBadgeClasse(veredito) {
  if (veredito === 'COMPRA') return 'ok'
  if (veredito === 'VENDA') return 'danger'
  if (veredito === 'MANUTENÇÃO') return 'warn'
  return 'neutral'
}

function formatDataHora(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const COLUNAS = [
  { key: 'criado_em', label: 'Data' },
  { key: 'ticker', label: 'Ticker' },
  { key: 'nome', label: 'Empresa' },
  { key: 'periodo', label: 'Período' },
  { key: 'membro', label: 'Membro' },
  { key: 'veredito_membro', label: 'Veredito (membro)' },
  { key: 'veredito_sistema', label: 'Veredito (sistema)' },
  { key: 'score_sistema', label: 'Score' },
  { key: 'concorda', label: 'Concordância' },
]

function sortRows(rows, key, dir) {
  const factor = dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const va = a[key]
    const vb = b[key]
    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1
    if (typeof va === 'string') return factor * va.localeCompare(vb, 'pt-BR')
    return factor * (va - vb)
  })
}

export async function render(container) {
  if (!isSupabaseConfigured) {
    container.innerHTML = `
      ${pageHeader('Histórico', 'Análises registradas pelos membros da liga.')}
      <div class="card empty-state"><p>Configure o Supabase (.env) para usar esta página.</p></div>`
    return
  }

  container.innerHTML = `
    ${pageHeader('Histórico', 'Análises registradas pelos membros da liga.')}
    <div class="card"><p class="muted">Carregando análises…</p></div>`

  let analises
  let empresas
  try {
    ;[analises, empresas] = await Promise.all([listarAnalises(), listarEmpresas()])
  } catch (error) {
    container.querySelector('.card').innerHTML = `<p>Erro ao carregar histórico: ${error.message}</p>`
    return
  }

  const nomePorTicker = new Map(empresas.map((e) => [e.ticker, e.nome]))
  const rows = analises.map((a) => ({
    ...a,
    nome: nomePorTicker.get(a.ticker) || a.ticker,
    concorda: a.veredito_membro === a.veredito_sistema,
  }))

  const state = {
    filtro: '',
    sortKey: 'criado_em',
    sortDir: 'desc',
  }

  function renderTable() {
    const termo = state.filtro.trim().toLowerCase()
    const filtradas = termo
      ? rows.filter(
          (r) => r.ticker.toLowerCase().includes(termo) || (r.membro || '').toLowerCase().includes(termo)
        )
      : rows
    const ordenadas = sortRows(filtradas, state.sortKey, state.sortDir)

    if (!ordenadas.length) {
      return emptyState('Nenhuma análise encontrada.')
    }

    return `
      <section class="card table-card">
        <div class="table-scroll">
          <table class="ranking-table">
            <thead>
              <tr>
                ${COLUNAS.map(
                  (col) => `
                  <th data-key="${col.key}" class="sortable ${state.sortKey === col.key ? 'sorted' : ''}">
                    ${col.label} ${state.sortKey === col.key ? (state.sortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>`
                ).join('')}
              </tr>
            </thead>
            <tbody>
              ${ordenadas
                .map(
                  (row) => `
                <tr class="ranking-row" data-ticker="${row.ticker}" data-periodo="${row.periodo}">
                  <td>${formatDataHora(row.criado_em)}</td>
                  <td><strong>${row.ticker}</strong></td>
                  <td>${row.nome}</td>
                  <td>${row.periodo}</td>
                  <td>${row.membro || 'Anônimo'}</td>
                  <td><span class="badge badge-${veredictoBadgeClasse(row.veredito_membro)}">${row.veredito_membro || '—'}</span></td>
                  <td><span class="badge badge-${veredictoBadgeClasse(row.veredito_sistema)}">${row.veredito_sistema || '—'}</span></td>
                  <td>${row.score_sistema}/${row.score_max}</td>
                  <td><span class="badge badge-${row.concorda ? 'ok' : 'danger'}">${row.concorda ? 'Sim' : 'Não'}</span></td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </section>`
  }

  function bindTabelaEvents() {
    container.querySelectorAll('th.sortable').forEach((th) => {
      th.addEventListener('click', () => {
        const key = th.dataset.key
        if (state.sortKey === key) {
          state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc'
        } else {
          state.sortKey = key
          state.sortDir = 'asc'
        }
        atualizarTabela()
      })
    })

    container.querySelectorAll('.ranking-row').forEach((tr) => {
      tr.addEventListener('click', () => {
        navigateTo('/analise', { ticker: tr.dataset.ticker, periodo: tr.dataset.periodo })
      })
    })
  }

  function atualizarTabela() {
    container.querySelector('#tabela-container').innerHTML = renderTable()
    bindTabelaEvents()
  }

  function draw() {
    container.innerHTML = `
      ${pageHeader('Histórico', 'Análises registradas pelos membros da liga.')}
      <section class="card table-toolbar">
        <div class="field">
          <label for="filtro-input">Buscar por ticker ou membro</label>
          <input id="filtro-input" type="text" placeholder="Ex: SLCE3 ou Enrico" value="${state.filtro}" />
        </div>
      </section>
      <div id="tabela-container">${renderTable()}</div>`

    container.querySelector('#filtro-input').addEventListener('input', (e) => {
      state.filtro = e.target.value
      atualizarTabela()
    })

    bindTabelaEvents()
  }

  draw()
}
```

### `src/pages/adicionarDados.js`
```js
import { pageHeader } from '../components/page-header.js'
import { companyPicker, bindCompanyPicker } from '../components/company-picker.js'
import { listarEmpresas, inserirDadosFinanceiros } from '../lib/database.js'
import { isSupabaseConfigured } from '../lib/supabase.js'

const PERIODO_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/

function calcularDerivados({ receita, lucro, ebitda, dividaLiquida, patrimonioLiquido }) {
  const margemLiq = receita ? (lucro / receita) * 100 : null
  const roe = patrimonioLiquido ? (lucro / patrimonioLiquido) * 100 : null
  const divEbitda = ebitda ? dividaLiquida / ebitda : null
  return { margemLiq, roe, divEbitda }
}

function formatDerivado(valor, unidade) {
  return valor == null || Number.isNaN(valor) ? '—' : `${valor.toFixed(2)}${unidade}`
}

function validar(state) {
  const erros = []
  if (!state.empresa) erros.push('Selecione uma empresa.')
  if (!PERIODO_REGEX.test(state.periodo)) erros.push('Período deve estar no formato AAAA-MM (ex: 2025-03).')
  if (!['ITR', 'DFP'].includes(state.tipo)) erros.push('Selecione o tipo (ITR ou DFP).')
  ;['receita', 'lucro', 'ebitda', 'dividaLiquida', 'patrimonioLiquido'].forEach((campo) => {
    if (state[campo] === null || Number.isNaN(state[campo])) erros.push(`Preencha o campo "${campo}" com um número válido.`)
  })
  return erros
}

export async function render(container) {
  if (!isSupabaseConfigured) {
    container.innerHTML = `
      ${pageHeader('Adicionar Dados', 'Registre manualmente um novo período financeiro.')}
      <div class="card empty-state"><p>Configure o Supabase (.env) para usar esta página.</p></div>`
    return
  }

  container.innerHTML = `
    ${pageHeader('Adicionar Dados', 'Registre manualmente um novo período financeiro.')}
    <div class="card"><p class="muted">Carregando empresas…</p></div>`

  let empresas
  try {
    empresas = await listarEmpresas()
  } catch (error) {
    container.querySelector('.card').innerHTML = `<p>Erro ao carregar empresas: ${error.message}</p>`
    return
  }

  const state = {
    empresa: null,
    periodo: '',
    tipo: 'ITR',
    receita: null,
    lucro: null,
    ebitda: null,
    dividaLiquida: null,
    patrimonioLiquido: null,
    salvando: false,
    salvo: false,
    erroSalvar: null,
  }

  function renderFormCard() {
    const derivados = calcularDerivados(state)
    return `
      <section class="card">
        <h2>Dados do período</h2>
        <div class="form-row">
          <div class="field">
            <label>Empresa</label>
            ${companyPicker('empresa-dados', 'Buscar por ticker ou nome...')}
          </div>
          <div class="field">
            <label for="periodo-input">Período (AAAA-MM)</label>
            <input id="periodo-input" type="text" placeholder="2025-03" value="${state.periodo}" />
          </div>
          <div class="field">
            <label for="tipo-select">Tipo</label>
            <select id="tipo-select">
              <option value="ITR" ${state.tipo === 'ITR' ? 'selected' : ''}>ITR</option>
              <option value="DFP" ${state.tipo === 'DFP' ? 'selected' : ''}>DFP</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="field">
            <label for="receita-input">Receita (R$)</label>
            <input id="receita-input" type="number" step="0.01" value="${state.receita ?? ''}" />
          </div>
          <div class="field">
            <label for="lucro-input">Lucro (R$)</label>
            <input id="lucro-input" type="number" step="0.01" value="${state.lucro ?? ''}" />
          </div>
          <div class="field">
            <label for="ebitda-input">EBITDA (R$)</label>
            <input id="ebitda-input" type="number" step="0.01" value="${state.ebitda ?? ''}" />
          </div>
          <div class="field">
            <label for="divida-input">Dívida líquida (R$)</label>
            <input id="divida-input" type="number" step="0.01" value="${state.dividaLiquida ?? ''}" />
          </div>
          <div class="field">
            <label for="pl-input">Patrimônio líquido (R$)</label>
            <input id="pl-input" type="number" step="0.01" value="${state.patrimonioLiquido ?? ''}" />
          </div>
        </div>

        <div class="stats-grid">
          <div class="card stat-card"><span class="stat-label">Margem líquida</span><span class="stat-value">${formatDerivado(derivados.margemLiq, '%')}</span></div>
          <div class="card stat-card"><span class="stat-label">ROE</span><span class="stat-value">${formatDerivado(derivados.roe, '%')}</span></div>
          <div class="card stat-card"><span class="stat-label">Dívida/EBITDA</span><span class="stat-value">${formatDerivado(derivados.divEbitda, 'x')}</span></div>
        </div>

        <button id="salvar-btn" class="btn btn-primary" ${state.salvo ? 'disabled' : ''}>
          ${state.salvo ? 'Dados salvos ✓' : state.salvando ? 'Salvando…' : 'Salvar dados'}
        </button>
        <span id="salvar-status" class="muted">${state.erroSalvar ? `Erro: ${state.erroSalvar}` : ''}</span>
      </section>`
  }

  function draw() {
    container.innerHTML = `
      ${pageHeader('Adicionar Dados', 'Registre manualmente um novo período financeiro.')}
      ${renderFormCard()}`

    const pickerApi = bindCompanyPicker(container, 'empresa-dados', empresas, (empresa) => {
      state.empresa = empresa
      draw()
    })
    if (state.empresa) pickerApi.setValue(`${state.empresa.ticker} — ${state.empresa.nome}`)

    container.querySelector('#periodo-input').addEventListener('input', (e) => {
      state.periodo = e.target.value
    })
    container.querySelector('#tipo-select').addEventListener('change', (e) => {
      state.tipo = e.target.value
    })

    const camposNumericos = [
      ['receita-input', 'receita'],
      ['lucro-input', 'lucro'],
      ['ebitda-input', 'ebitda'],
      ['divida-input', 'dividaLiquida'],
      ['pl-input', 'patrimonioLiquido'],
    ]
    camposNumericos.forEach(([id, campo]) => {
      container.querySelector(`#${id}`).addEventListener('input', (e) => {
        state[campo] = e.target.value === '' ? null : parseFloat(e.target.value)
        atualizarDerivados()
      })
    })

    container.querySelector('#salvar-btn').addEventListener('click', handleSalvar)
  }

  function atualizarDerivados() {
    const derivados = calcularDerivados(state)
    const cards = container.querySelectorAll('.stats-grid .stat-value')
    cards[0].textContent = formatDerivado(derivados.margemLiq, '%')
    cards[1].textContent = formatDerivado(derivados.roe, '%')
    cards[2].textContent = formatDerivado(derivados.divEbitda, 'x')
  }

  async function handleSalvar() {
    const erros = validar(state)
    if (erros.length) {
      state.erroSalvar = erros.join(' ')
      draw()
      return
    }

    const derivados = calcularDerivados(state)
    state.salvando = true
    state.erroSalvar = null
    draw()

    try {
      await inserirDadosFinanceiros({
        empresa_id: state.empresa.id,
        ticker: state.empresa.ticker,
        periodo: state.periodo,
        tipo: state.tipo,
        ano: parseInt(state.periodo.slice(0, 4), 10),
        receita: state.receita,
        lucro: state.lucro,
        ebitda: state.ebitda,
        divida_liq: state.dividaLiquida,
        pl: state.patrimonioLiquido,
        margem_liq: derivados.margemLiq,
        roe: derivados.roe,
        div_ebitda: derivados.divEbitda,
        fonte: 'manual',
      })
      state.salvando = false
      state.salvo = true
    } catch (error) {
      state.salvando = false
      state.erroSalvar = error.message
    }

    draw()
  }

  draw()
}
```

### `src/pages/configuracoes.js`
```js
import { pageHeader } from '../components/page-header.js'
import { isSupabaseConfigured } from '../lib/supabase.js'

export function render(container) {
  container.innerHTML = `
    ${pageHeader('Configurações', 'Status da conexão e preferências do sistema.')}

    <section class="card">
      <h2>Conexão com o Supabase</h2>
      <div class="status-row">
        <span class="status-dot ${isSupabaseConfigured ? 'ok' : 'pending'}"></span>
        <span>${isSupabaseConfigured ? 'Variáveis de ambiente detectadas' : 'Aguardando configuração do arquivo .env'}</span>
      </div>
      <p class="muted">Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env para conectar ao banco.</p>
    </section>`
}
```

### `src/styles/main.css`

CSS completo (~750 linhas) — variáveis de tema (`--color-primary: #1c3d1a`, `--color-accent: #b8860b`), layout de sidebar fixa + conteúdo, sistema de cards, grids de estatísticas, gráfico de barras do dashboard, badges de veredito, formulários, indicadores com semáforo (dots), gauge SVG, tabelas ordenáveis (ranking/histórico), comparação lado a lado. Arquivo completo disponível em `src/styles/main.css` no repositório — omitido aqui por tamanho, mas todas as classes usadas nos componentes acima estão definidas lá (`.card`, `.stat-card`, `.bar-chart`, `.badge-*`, `.indicator-row`, `.dot-*`, `.gauge-*`, `.compare-*`, `.ranking-table`, `.picker-*`, `.veredito-option`, `.btn-*`, etc.)

### `docs/schema.sql`
```sql
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
```

> **Nota:** o `veredito_membro` check acima já está com a correção (`'MANUTENÇÃO'` com acento). O banco Supabase real ainda tem a versão antiga sem acento — rodar o ALTER TABLE da seção 8 para sincronizar.

### `docs/seed.sql`

Contém: insert das 31 empresas (ticker, nome, subsetor, subsetor_label, descrição, destaques, peso_iagro), insert dos benchmarks por subsetor (4 subsetores × 5 indicadores = 20 linhas), e insert de `dados_financeiros` com histórico 2022-2024 para a maioria das empresas (algumas com menos anos, ex: MRFG3 só tem 2022-2023). Arquivo completo tem ~200 linhas — disponível em `docs/seed.sql` no repositório, omitido aqui por ser majoritariamente dados tabulares repetitivos sem lógica de código.

---

## 11. Sugestão de como usar este documento

Para gerar próximos prompts de melhoria, vale considerar:
- A seção 9 (gaps conhecidos) como lista de candidatos óbvios.
- A seção 7 (decisões técnicas) para não repetir os mesmos erros (ex: o padrão de perda de foco em re-render) em features novas.
- Os limiares de veredito e benchmarks (seção 4/5) são hipóteses de design, não verdades absolutas — uma melhoria de alto valor seria validar/calibrar esses números com dados reais de mercado, não só adicionar features novas.
