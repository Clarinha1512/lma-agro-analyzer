# 🌱 LMA Agro Analyzer — Guia de Montagem do Projeto

Este é o guia mestre. Siga os passos **na ordem**. Cada seção tem um objetivo claro e você só avança quando a anterior estiver funcionando.

---

## 📐 Visão geral da arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    VOCÊ (VS Code)                        │
│                                                          │
│   Claude Code  ────escreve────►  Código do app          │
│       │                              │                   │
│       │                              │                   │
└───────┼──────────────────────────────┼──────────────────┘
        │                              │
        ▼                              ▼
   ┌─────────┐                  ┌──────────────┐
   │ GitHub  │◄────push─────────│  Seu código  │
   │ (backup)│                  │   local      │
   └─────────┘                  └──────┬───────┘
                                       │
                                       │ conecta
                                       ▼
                                ┌──────────────┐
                                │   Supabase   │
                                │ (banco Postgres)│
                                │  - empresas  │
                                │  - trimestres│
                                │  - análises  │
                                └──────────────┘
```

**Papel de cada ferramenta:**
- **Claude Code** → escreve e edita o código no seu computador
- **GitHub** → guarda o histórico e backup do código
- **Supabase** → banco de dados online com todas as informações

---

## ✅ ETAPA 1 — Criar as contas (30 min)

Crie nesta ordem. Todas têm plano gratuito suficiente para o projeto.

### 1.1 — GitHub
1. Acesse **github.com** → **Sign up**
2. Use seu email, crie um usuário (ex: `enrico-lma`)
3. Confirme o email
4. **Guarde:** seu usuário e senha

### 1.2 — Supabase
1. Acesse **supabase.com** → **Start your project**
2. Clique em **Sign in with GitHub** (usa a conta que você acabou de criar!)
3. Autorize o Supabase
4. **Pronto** — você entrou no painel

### 1.3 — Claude Code
1. Instale o **Node.js** primeiro: acesse **nodejs.org** → baixe a versão **LTS** → instale
2. Abra o terminal do VS Code e rode:
   ```
   npm install -g @anthropic-ai/claude-code
   ```
3. Depois rode:
   ```
   claude
   ```
4. Ele vai pedir para logar com sua conta Anthropic (a mesma daqui). Siga o link e autorize.

> ⚠️ Se der erro de permissão no Windows, abra o terminal como **Administrador**.

---

## ✅ ETAPA 2 — Criar o banco no Supabase (15 min)

### 2.1 — Criar o projeto
1. No painel do Supabase, clique em **New Project**
2. Nome: `lma-agro-analyzer`
3. Database Password: **crie uma senha forte e GUARDE** (vai precisar depois)
4. Region: **South America (São Paulo)**
5. Clique em **Create new project** e aguarde ~2 min

### 2.2 — Criar as tabelas
1. No menu lateral, clique em **SQL Editor**
2. Clique em **New query**
3. Abra o arquivo `schema.sql` (que está nesta pasta), copie TODO o conteúdo
4. Cole no editor e clique em **Run**
5. Deve aparecer "Success. No rows returned" — as tabelas foram criadas!

### 2.3 — Popular com os dados iniciais
1. Ainda no SQL Editor, clique em **New query**
2. Abra o arquivo `seed.sql`, copie tudo, cole e clique em **Run**
3. Isso insere as 32 empresas e os dados históricos que já temos

### 2.4 — Pegar as chaves de conexão
1. No menu lateral, clique em **Project Settings** (engrenagem) → **API**
2. Copie e guarde estes dois valores:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public key** (uma chave longa)
3. Você vai colar esses valores no app depois

---

## ✅ ETAPA 3 — Criar o repositório no GitHub (5 min)

1. No GitHub, clique no **+** (canto superior direito) → **New repository**
2. Nome: `lma-agro-analyzer`
3. Marque **Private** (só você e quem convidar vê)
4. **NÃO** marque nenhuma opção de inicialização (deixa vazio)
5. Clique em **Create repository**
6. **Guarde** a URL que aparece (algo como `https://github.com/enrico-lma/lma-agro-analyzer.git`)

---

## ✅ ETAPA 4 — Construir o app com Claude Code (o resto do tempo)

Agora vem a parte boa. Você vai usar os **prompts prontos** que preparei.

1. Crie uma pasta nova no seu computador: `LMA-Agro-Analyzer`
2. Abra ela no VS Code (**File → Open Folder**)
3. Abra o terminal e rode `claude`
4. Abra o arquivo `PROMPTS_CLAUDE_CODE.md` desta pasta
5. Cole o **Prompt 1** no Claude Code, espere terminar, teste
6. Cole o **Prompt 2**, e assim por diante

Cada prompt constrói uma parte do sistema, testada antes de seguir para a próxima.

---

## 📋 Checklist de progresso

Marque conforme avança:

- [ ] Conta GitHub criada
- [ ] Conta Supabase criada
- [ ] Node.js instalado
- [ ] Claude Code instalado e logado
- [ ] Projeto Supabase criado
- [ ] Tabelas criadas (schema.sql)
- [ ] Dados inseridos (seed.sql)
- [ ] Chaves de conexão guardadas
- [ ] Repositório GitHub criado
- [ ] Prompt 1 executado (estrutura base)
- [ ] Prompt 2 executado (conexão Supabase)
- [ ] Prompt 3 executado (análise individual)
- [ ] Prompt 4 executado (comparação e ranking)
- [ ] Prompt 5 executado (upload de PDF)
- [ ] Código no GitHub

---

## 🆘 Se algo der errado

- **Claude Code não instala:** confira se o Node.js foi instalado (`node --version` no terminal)
- **Supabase não conecta:** confira se copiou a URL e a chave corretas
- **Tabelas não criam:** confira se colou o schema.sql inteiro

Quando travar, volte aqui no chat comigo com o print do erro e eu te ajudo.
