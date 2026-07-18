# 🤖 Prompts para o Claude Code — LMA Agro Analyzer

Cole cada prompt **na ordem** no Claude Code. Espere terminar, teste, e só então avance para o próximo. Cada um constrói uma camada do sistema.

> 💡 **Antes de começar:** tenha em mãos a **Project URL** e a **anon key** do Supabase (Etapa 2.4 do guia).

---

## 📦 PROMPT 1 — Estrutura base do projeto

```
Crie a estrutura inicial de um app web chamado "LMA Agro Analyzer" — uma ferramenta de análise fundamentalista de empresas de agronegócio da B3, para uma liga acadêmica.

Requisitos técnicos:
- App web moderno usando Vite + JavaScript vanilla (sem framework pesado, para ser simples de manter)
- Estrutura de pastas organizada: src/ com subpastas para pages, components, lib, styles
- Cliente Supabase configurado em src/lib/supabase.js lendo as chaves de um arquivo .env
- Crie um .env.example com as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
- Configure o .gitignore para não subir .env nem node_modules
- Identidade visual: verde escuro #1C3D1A (primário) e dourado #B8860B (destaque). Fonte Inter.
- Layout com sidebar de navegação à esquerda e área de conteúdo à direita
- Páginas (por enquanto só o esqueleto/navegação): Dashboard, Análise Individual, Comparar, Ranking, Evolução Temporal, Histórico, Configurações
- Design limpo, cards com borda suave, cantos arredondados

Instale as dependências necessárias (vite, @supabase/supabase-js) e deixe o projeto rodando com "npm run dev". Não conecte ao banco ainda, só monte a fundação visual e a estrutura.
```

**Teste:** rode `npm run dev`, abra o navegador. Deve ver a sidebar com as páginas e o visual verde/dourado.

---

## 🔌 PROMPT 2 — Conexão com o Supabase

```
Agora vamos conectar ao Supabase. O banco já está criado com estas tabelas:

- empresas (id, ticker, nome, subsetor, subsetor_label, descricao, destaques jsonb, peso_iagro)
- dados_financeiros (id, empresa_id, ticker, periodo, tipo, ano, receita, lucro, ebitda, divida_liq, pl, margem_liq, margem_ebitda, roe, div_ebitda, fonte)
- benchmarks (id, subsetor, indicador, bom_min, bom_max, ok_min, ok_max, inverso)
- analises (id, ticker, periodo, membro, veredito_membro, notas_membro, veredito_sistema, score_sistema, score_max)

Crie funções em src/lib/database.js para:
- listarEmpresas() → todas as empresas ordenadas por ticker
- getEmpresa(ticker) → uma empresa
- getDadosFinanceiros(ticker) → todos os períodos de uma empresa, ordenados por período
- getDadosPeriodo(ticker, periodo) → dados de um período específico
- getBenchmarks() → todos os benchmarks organizados por subsetor e indicador
- salvarAnalise(analise) → insere uma análise
- listarAnalises() → todas as análises salvas
- inserirDadosFinanceiros(dados) → insere um novo período de dados

No Dashboard, mostre um resumo real vindo do banco: total de empresas, distribuição por subsetor (gráfico), e as últimas análises salvas. Use as chaves do meu .env (vou preencher com minhas credenciais do Supabase).

Me diga exatamente o que preencher no arquivo .env.
```

**Teste:** preencha o `.env` com suas chaves, recarregue. O Dashboard deve mostrar "32 empresas" vindas do banco.

---

## 📊 PROMPT 3 — Análise individual (o coração do sistema)

```
Construa a página de Análise Individual. Fluxo:

1. O membro busca/seleciona uma empresa (campo de busca com autocomplete das 32 empresas)
2. Seleciona o período disponível (dropdown com os períodos que existem no banco para aquela empresa)
3. O sistema calcula e exibe os indicadores fundamentalistas

Indicadores a calcular e avaliar (semáforo verde/amarelo/vermelho conforme os benchmarks do subsetor da empresa):
- ROE (já vem no banco)
- Margem líquida (já vem no banco)
- Dívida/EBITDA (campo div_ebitda no banco)
- P/L e P/VP: deixe campos OPCIONAIS onde o membro digita o preço da ação atual e o sistema calcula (P/L = preço / (lucro/nº ações), P/VP = preço / (PL/nº ações)). Se não preencher, mostra "requer cotação".

Para cada indicador: mostre o valor, o semáforo colorido, a faixa do benchmark, e um texto curto de interpretação.

Calcule um SCORE geral (soma dos pontos: verde=2, amarelo=1, vermelho=0) e um VEREDITO automático (COMPRA/MANUTENÇÃO/VENDA) baseado no score.

Elementos visuais ricos:
- Um gauge circular mostrando o score
- Um gráfico radar com o perfil dos indicadores
- Um gráfico de barras com a evolução histórica de receita e lucro (usando todos os períodos do banco)
- Cards de métricas com os valores brutos (receita, lucro, EBITDA, dívida, PL)

IMPORTANTE — pedagogia: antes de mostrar o veredito do sistema, deixe o membro registrar o veredito DELE (COMPRA/MANUTENÇÃO/VENDA) e uma justificativa. Só depois revele o veredito automático para comparação. Isso é essencial para o objetivo educacional da liga.

Adicione um botão "Salvar análise" que grava na tabela analises (o veredito do membro + o do sistema).

Use Chart.js para os gráficos. NÃO busque nada de APIs externas — tudo vem do Supabase ou do que o membro digita.
```

**Teste:** selecione SLCE3, veja os indicadores, registre um veredito, compare com o do sistema.

---

## ⚖️ PROMPT 4 — Comparação e Ranking

```
Construa duas páginas:

PÁGINA COMPARAR:
- O membro escolhe 2 empresas e um período
- Mostra os indicadores lado a lado, com destaque visual (cor/ícone) para qual empresa está melhor em cada indicador
- Um gráfico radar sobreposto das duas empresas
- Score de cada uma e um veredito de qual tem fundamentos mais sólidos
- Tabela comparativa clara

PÁGINA RANKING:
- Tabela com todas as 32 empresas (ou filtradas por subsetor)
- Colunas: ticker, nome, subsetor, ROE, margem, dívida/EBITDA, score, veredito
- Cada indicador com seu semáforo colorido
- Clicável em qualquer coluna para ordenar (ascendente/descendente)
- Filtro por subsetor (dropdown)
- Usa o período mais recente disponível de cada empresa
- Clicar numa empresa leva para a análise individual dela

Ambas usam os dados do Supabase e os benchmarks para os semáforos.
```

**Teste:** compare SLCE3 vs AGRO3; no ranking, ordene por ROE.

---

## 📄 PROMPT 5 — Entrada de dados (manual + PDF)

```
Construa a funcionalidade de adicionar novos dados financeiros, com duas formas:

FORMA 1 — Manual:
- Um formulário onde o membro escolhe a empresa, informa o período (ex: 2025-03), o tipo (ITR/DFP), e digita: receita, lucro, EBITDA, dívida líquida, patrimônio líquido
- O sistema calcula automaticamente margem líquida, ROE e dívida/EBITDA
- Salva na tabela dados_financeiros com fonte='manual'
- Valida os campos antes de salvar

FORMA 2 — Upload de PDF:
- O membro faz upload do PDF do release/ITR de resultados
- Use a API da Anthropic (Claude) para extrair os dados do PDF automaticamente
- A chamada deve pedir ao Claude para retornar um JSON com: empresa, ticker, periodo, receita, lucro, ebitda, divida_liquida, patrimonio_liquido, etc.
- Mostre os dados extraídos para o membro CONFERIR e editar antes de salvar
- Ao confirmar, salva na tabela dados_financeiros com fonte='pdf'

Para a API da Anthropic: crie uma função que recebe o PDF em base64 e faz a chamada. A chave da API deve vir do .env (VITE_ANTHROPIC_API_KEY). Avise que essa chave não deve ir para o GitHub.

Adicione essas opções numa página "Adicionar Dados" acessível pela sidebar.
```

**Teste:** adicione um trimestre manualmente; teste o upload de um PDF de resultado.

---

## 🚀 PROMPT 6 — Subir para o GitHub

```
Prepare o projeto para versionamento e faça o primeiro commit:

1. Confira que o .gitignore está ignorando .env e node_modules
2. Crie um README.md explicando o projeto: o que é, como rodar localmente, a estrutura de pastas, e as variáveis de ambiente necessárias (sem expor valores)
3. Inicialize o git, faça o primeiro commit com uma mensagem descritiva
4. Me guie para conectar ao meu repositório do GitHub (vou fornecer a URL) e fazer o push

Liste os comandos exatos que devo rodar.
```

**Teste:** confira no GitHub que o código subiu (sem o `.env`!).

---

## 🎯 Depois dos 6 prompts

Você terá um sistema completo e profissional. Melhorias futuras que dá para pedir ao Claude Code:

- **Publicar online:** "Configure o deploy na Vercel conectado ao meu GitHub"
- **Alertas de piora:** "Destaque quando um indicador piorou vs. o período anterior"
- **Exportar relatório:** "Gere um PDF da análise para o membro baixar"
- **Autenticação:** "Adicione login para os membros com Supabase Auth"
- **Painel de benchmarks:** "Página para o diretor ajustar os benchmarks salvos no banco"

---

## 💡 Dicas de uso do Claude Code

- Se algo quebrar, cole o erro no Claude Code e peça para corrigir
- Peça para ele "testar" e "rodar" — ele consegue executar comandos
- A cada funcionalidade que funcionar, peça para fazer um commit: "faça commit dessa etapa"
- Se quiser mudar algo visual, descreva o que quer — ele edita direto
