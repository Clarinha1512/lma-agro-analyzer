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
| App em produção | https://lma-agro-analyzer.vercel.app/ (deploy automático a cada push em `main`) |

**Nenhum segredo real está exposto aqui.** A anon key do Supabase é projetada para ser pública (client-side), protegida por Row Level Security no banco. Tokens pessoais do GitHub (PAT) foram usados pontualmente para alguns pushes e **sempre revogados** logo depois pelo usuário — não existe credencial sensível ativa neste projeto.

**Deployado em produção no Vercel.** As env vars (`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`) precisam estar cadastradas no Vercel em escopo Production — se sumirem, o Vite builda com elas `undefined` e o Rollup faz tree-shaking de todo o cliente Supabase do bundle (já aconteceu uma vez; diagnosticado inspecionando o tamanho/conteúdo do bundle publicado). Qualquer mudança de env var no Vercel exige um Redeploy manual pra valer, porque são embutidas em build-time.

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

O Prompt 5 original pedia também upload de PDF com extração via Claude API. Foi **implementado e depois removido** por decisão do usuário: a API da Anthropic é paga (sem tier gratuito contínuo) e não fazia sentido o custo recorrente para um projeto estudantil. A arquitetura correta (function serverless server-side, chave nunca exposta no browser) chegou a ser construída e testada — ficou documentada aqui como referência caso o projeto queira retomar isso no futuro com orçamento. Hoje a página "Adicionar Dados" é **só entrada manual**. Decisão maior por trás disso: o projeto é **deliberadamente 100% client-side**, sem nenhuma function/serverless própria — qualquer feature nova deve respeitar essa restrição, a não ser que o usuário decida abrir mão dela explicitamente.

### Construído depois do HANDOFF original (sessões seguintes)

- **Alertas de piora** no Dashboard: compara o período mais recente de cada empresa com o anterior e destaca indicadores que pioraram.
- **Painel de benchmarks editável** em Configurações: limites por subsetor (bom/ok min/max, direção) agora são editados pela UI, não só via SQL direto.
- **Exportar PDF** da Análise Individual via `window.print()` + CSS `@media print` (sem lib externa).
- **Testes automatizados** (Vitest + jsdom): `src/lib/indicators.test.js`, `src/pages/analiseIndividual.test.js`, `src/pages/dashboard.test.js` — 54 testes passando. Rodar com `npm test`.
- **Deploy em produção no Vercel**, com CI implícito (push em `main` → build → deploy automático).
- **Autenticação completa via Supabase Auth** (login/cadastro em `src/pages/login.js`, sessão gerenciada em `src/main.js`, wrapper em `src/lib/auth.js`). O app inteiro fica atrás de login — sem sessão, mostra a tela de login em vez do dashboard.
- **RLS travado**: as 4 tabelas originais (`empresas`, `dados_financeiros`, `benchmarks`, `analises`) e `profiles` exigem `to authenticated` — anônimo não lê nem escreve mais nada (antes era tudo público).
- **Tabela `profiles`**: um perfil por usuário autenticado (nome, e-mail, nível hierárquico, ativo, data de entrada). O nome exibido em qualquer lugar do app vem de `getProfile()` (fonte da verdade), nunca de `user_metadata` (que fica estático desde o cadastro e não reflete edições posteriores).
- **Hierarquia de níveis**: `treinee` → `analista` → `head` → `diretor` (substituiu um esquema anterior de "membro/coordenador/diretor" + divisão por área, que foi removido — o usuário decidiu não dividir por área, só por nível). Painel **"Gerenciar membros"** em Configurações, visível só para quem é Diretor, lista todos os perfis e permite mudar nível/ativo de qualquer um. Regra de negócio explícita do usuário: **só Diretor edita nível de outra pessoa** — reforçada tanto na UI (card só aparece pra diretor) quanto no banco via RLS (`diretor atualiza qualquer profile`, usando subquery que checa `profiles.nivel = 'diretor'` do próprio `auth.uid()`).

---

## 5. Schema do banco (Supabase/Postgres)

4 tabelas, RLS habilitado com policies públicas de leitura/escrita (app interno, sem autenticação ainda):

**`empresas`** — as 31 empresas do IAGRO B3. Campos-chave: `ticker` (unique), `nome`, `subsetor` (enum: `primario`/`insumos`/`agroindustria`/`agroservicos`), `subsetor_label` (rótulo mais específico, ex: "Proteína animal", "Bebidas"), `destaques` (jsonb), `peso_iagro`.

**`dados_financeiros`** — um registro por empresa+período. Campos-chave: `ticker`, `periodo` (formato `"2024-12"`), `tipo` (ITR/DFP/MANUAL/PDF), `receita`, `lucro`, `ebitda`, `divida_liq`, `pl` (patrimônio líquido — **não confundir com o indicador P/L**), `margem_liq`, `roe`, `div_ebitda`, `fonte` (seed/manual/pdf). Unique em `(ticker, periodo)`.

**`benchmarks`** — limites de avaliação por subsetor. `indicador` ∈ `{'pl','pvp','roe','mg','div'}` (aqui sim, `'pl'` é o múltiplo Preço/Lucro, não confundir com o campo acima). `bom_min/bom_max/ok_min/ok_max` + `inverso` (boolean — `true` quando menor é melhor: dívida/EBITDA, P/L, P/VP).

**`analises`** — vereditos salvos. `veredito_membro` e `veredito_sistema`, `score_sistema`/`score_max`, `notas_membro`, `criado_em`.

**`profiles`** (adicionada depois, junto com a autenticação) — um registro por usuário do Supabase Auth: `id` (FK pra `auth.users`), `nome`, `email`, `nivel` (`treinee`/`analista`/`head`/`diretor`, default `treinee`), `ativo` (boolean), `entrou_em`, `criado_em`. Não tem mais campo de área — foi removido a pedido do usuário.

⚠️ O bug histórico do `CHECK` constraint de `veredito_membro` (sem acento vs. com acento) já foi corrigido tanto no `docs/schema.sql` quanto no banco real — não é mais um problema pendente.

**RLS atual:** todas as tabelas (incluindo `profiles`) exigem `to authenticated` — não existe mais leitura/escrita pública. Em `profiles` especificamente: qualquer autenticado pode ler todos os perfis (necessário pro painel de gerenciar membros e pra exibir nome de quem fez cada análise), mas só pode dar `update` na própria linha (`auth.uid() = id`) **a não ser que seja diretor**, caso em que uma segunda policy (`diretor atualiza qualquer profile`) libera `update` em qualquer linha via subquery `exists (select 1 from profiles p where p.id = auth.uid() and p.nivel = 'diretor')`.

Schema completo e seed (31 empresas + benchmarks por subsetor + histórico financeiro 2022-2024) estão em `docs/schema.sql` e `docs/seed.sql` — consulte os arquivos diretamente; o schema evolui com frequência e uma cópia impressa aqui ficaria desatualizada rápido (ver nota na seção 10).

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
| `/configuracoes` | Status da conexão + "Meu perfil" + "Gerenciar membros" (só diretor) + benchmarks editáveis | ✅ funcional |
| (sem rota, tela de auth) | Login/cadastro (`src/pages/login.js`), exibida em vez do app quando não há sessão | ✅ funcional |

Todas as páginas do sidebar estão funcionais — não há mais placeholders. O app inteiro exige login (Supabase Auth).

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

## 8. Ação pendente no banco

Nenhuma no momento — a última pendência (constraint de acento em `veredito_membro`) já foi resolvida. Sempre que uma sessão futura propuser mudança de schema, o padrão que tem funcionado bem é: editar `docs/schema.sql` primeiro (fonte da verdade versionada), depois dar ao usuário o SQL exato pra rodar manualmente no SQL Editor do Supabase (o Claude não tem acesso direto ao banco de produção).

**Cuidado ao migrar `CHECK` constraints com dados existentes:** o SQL Editor do Supabase roda um bloco colado inteiro como transação única — se qualquer statement falhar, TODOS os anteriores do mesmo bloco são revertidos (inclusive `drop column`/`drop constraint` que pareciam ter "funcionado"). Isso já causou confusão real: um `update` que deveria corrigir uma linha antes de trocar a constraint não encontrou a linha (nome cadastrado era "Enrico Vilaça", não "Enrico") e todo o bloco voltou atrás sem erro aparente até a segunda tentativa. Prefira sempre `where id = '<uuid exato>'` (visto via `select` antes) em vez de casar por nome/e-mail.

---

## 9. O que NÃO existe ainda (gaps conhecidos)

Já feitos desde a versão original deste documento (não são mais gaps): deploy público, autenticação, alertas de piora, exportar PDF, painel de admin de benchmarks, testes automatizados, perfis de membro com hierarquia e painel de gerenciamento.

Ainda em aberto — ver seção 12 para a lista priorizada:
- **Mais dados históricos** — usuário pretende expandir manualmente via "Adicionar Dados"; hoje o seed cobre majoritariamente 2022-2024.
- Os limiares do veredito automático (0.7/0.4) e os benchmarks por subsetor foram estimativas iniciais, nunca validados contra desempenho real de mercado — candidato a calibração futura, não só a mais features.
- Tudo que está listado na seção 12 abaixo e ainda não tem ✅.

---

## 10. Apêndice A — removido (ficava desatualizado)

Esta seção já teve um dump completo do código-fonte de então. Foi removida porque, depois de várias sessões de mudanças reais (autenticação, hierarquia de níveis, painel de admin, alertas de piora, etc.), o dump ficou consistentemente desatualizado e passou a ser mais confuso do que útil — uma sessão futura que confiasse nele acabaria trabalhando com informação errada.

**Em vez de um dump estático, leia os arquivos-fonte diretamente** (eles são a única fonte da verdade):

```
src/
├── main.js                 — entry point, gate de autenticação, registro de rotas
├── lib/
│   ├── auth.js              — signUp/signIn/signOut/getSession/getProfile/updateProfile/listarProfiles
│   ├── perfil.js             — NIVEIS e NIVEL_LABEL (hierarquia treinee/analista/head/diretor)
│   ├── database.js           — todas as queries Supabase (empresas, dados_financeiros, benchmarks, analises)
│   ├── indicators.js          — classify/buildIndicators/computeScore/veredictoAutomatico/melhorPorValor (o "motor")
│   ├── format.js              — formatação de moeda
│   ├── router.js              — hash router simples
│   └── supabase.js            — cliente Supabase
├── components/
│   ├── company-picker.js, gauge.js, page-header.js, sidebar.js, trend-badge.js
├── pages/
│   ├── login.js               — tela de login/cadastro
│   ├── dashboard.js           — visão geral + alertas de piora
│   ├── analiseIndividual.js   — fluxo veredito-primeiro (o coração do sistema)
│   ├── comparar.js, ranking.js, evolucaoTemporal.js, historico.js, adicionarDados.js
│   └── configuracoes.js       — perfil próprio, gerenciar membros (diretor), benchmarks editáveis
└── *.test.js                  — testes Vitest ao lado dos módulos que cobrem
```

`docs/schema.sql` continua sendo a fonte da verdade do schema (versionado, sempre mantido atualizado a cada mudança de banco).

## 11. Sugestão de como usar este documento

Para gerar próximos prompts de melhoria, vale considerar:
- A seção 9 (gaps conhecidos) e a seção 12 (backlog priorizado) como lista de candidatos.
- A seção 7 (decisões técnicas) para não repetir os mesmos erros (ex: o padrão de perda de foco em re-render) em features novas.
- Os limiares de veredito e benchmarks (seção 4/5) são hipóteses de design, não verdades absolutas — uma melhoria de alto valor seria validar/calibrar esses números com dados reais de mercado, não só adicionar features novas.

---

## 12. Backlog priorizado (status em 2026-07-31)

O usuário colou um documento pessoal de backlog com duas partes ("1.x" = pedidos diretos do Enrico, "2.x" = sugestões adicionais). Depois de avaliar o que é gratuito/factível na arquitetura atual (client-side, sem backend próprio, Supabase free tier), chegamos a uma lista única priorizada. Status:

- [x] **1.1 — Perfis dos membros.** Feito nesta sessão: tabela `profiles` estendida, hierarquia de 4 níveis (Treinee/Analista/Head/Diretor — substituiu "membro/coordenador/diretor" + área, removida a pedido do usuário), painel "Gerenciar membros" em Configurações restrito a Diretor (RLS + UI), deploy em produção confirmado.
- [x] **2.2 — Comparação com peer group** (mediana do subsetor). Feito: `computeMedianasSubsetor`/`comMedianaSubsetor` em `indicators.js`, cada indicador na Análise Individual mostra a mediana do subsetor com destaque favorável/desfavorável. Deployado e verificado em produção.
- [ ] **2.6 — Batalha de análises** (comparar vereditos de dois membros na mesma empresa/período). Próximo item — ainda não iniciado.
- [ ] 2.12 — Exportar CSV (dados financeiros e/ou análises)
- [ ] 2.3 — Decomposição DuPont (ROE = margem × giro × alavancagem)
- [ ] 2.5 — Scorecard qualitativo (critérios não-numéricos, preenchidos manualmente)
- [ ] 1.2 (parcial) — CAGR, EV/EBITDA, EV/Receita
- [ ] 2.1 — DCF simplificado
- [ ] 1.3 — Expandir número de empresas cobertas
- [ ] 1.6 — Relatório PDF institucional (além do `window.print()` atual, algo com identidade visual própria)
- [ ] 2.8 — Dashboard de câmbio/juros (contexto macro)
- [ ] 1.2 (completo) — demais indicadores pendentes do pedido original
- [ ] 2.7 — Timeline de eventos por empresa
- [ ] 2.11 — Backtesting dos vereditos do sistema vs. desempenho real
- [ ] 1.4 — Histórico financeiro desde o IPO de cada empresa
- [ ] 1.5 — Cobertura de empresas internacionais

**Itens do backlog original descartados:** nenhum — a lista acima é a ordem combinada com o usuário; qualquer reordenação futura deve ser perguntada a ele antes de mudar a sequência, não decidida unilateralmente (padrão já estabelecido nesta sessão: confirmar escopo antes de construir features de decisão de produto/prioridade).

**Ao retomar:** pergunte ao usuário se a ordem acima ainda reflete o que ele quer antes de simplesmente seguir a lista — prioridades de negócio mudam mais rápido que backlogs técnicos.
