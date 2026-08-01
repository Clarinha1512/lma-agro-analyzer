import { signIn, signUp } from '../lib/auth.js'
import { isSupabaseConfigured } from '../lib/supabase.js'

export function render(container) {
  if (!isSupabaseConfigured) {
    container.innerHTML = `
      <div class="auth-screen">
        <div class="card auth-card">
          <p>Configure o Supabase (.env) para usar o login.</p>
        </div>
      </div>`
    return
  }

  const state = {
    modo: 'login',
    email: '',
    senha: '',
    nome: '',
    carregando: false,
    erro: null,
    mensagem: null,
  }

  function draw() {
    container.innerHTML = `
      <div class="auth-screen">
        <div class="card auth-card">
          <div class="brand-mark" style="margin: 0 auto 16px;">LMA</div>
          <h1>LMA Agro Analyzer</h1>
          <p class="muted">${state.modo === 'login' ? 'Entre com sua conta da liga.' : 'Crie sua conta para começar.'}</p>

          ${
            state.modo === 'cadastro'
              ? `<div class="field">
                  <label for="auth-nome">Seu nome</label>
                  <input id="auth-nome" type="text" value="${state.nome}" placeholder="Ex: Enrico" />
                </div>`
              : ''
          }
          <div class="field">
            <label for="auth-email">E-mail</label>
            <input id="auth-email" type="email" value="${state.email}" placeholder="voce@exemplo.com" />
          </div>
          <div class="field">
            <label for="auth-senha">Senha</label>
            <input id="auth-senha" type="password" value="${state.senha}" placeholder="••••••••" />
          </div>
          ${state.erro ? `<p class="form-error">${state.erro}</p>` : ''}
          ${state.mensagem ? `<p class="muted">${state.mensagem}</p>` : ''}
          <button id="auth-submit" class="btn btn-primary" ${state.carregando ? 'disabled' : ''}>
            ${state.carregando ? 'Aguarde…' : state.modo === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
          <p class="auth-toggle">
            ${state.modo === 'login' ? 'Não tem conta?' : 'Já tem conta?'}
            <a href="#" id="auth-toggle-link">${state.modo === 'login' ? 'Criar conta' : 'Entrar'}</a>
          </p>
        </div>
      </div>`

    container.querySelector('#auth-email').addEventListener('input', (e) => {
      state.email = e.target.value
    })
    container.querySelector('#auth-senha').addEventListener('input', (e) => {
      state.senha = e.target.value
    })
    container.querySelector('#auth-nome')?.addEventListener('input', (e) => {
      state.nome = e.target.value
    })
    container.querySelector('#auth-toggle-link').addEventListener('click', (e) => {
      e.preventDefault()
      state.modo = state.modo === 'login' ? 'cadastro' : 'login'
      state.erro = null
      state.mensagem = null
      draw()
    })
    container.querySelector('#auth-submit').addEventListener('click', handleSubmit)
  }

  async function handleSubmit() {
    if (!state.email || !state.senha) {
      state.erro = 'Preencha e-mail e senha.'
      draw()
      return
    }
    if (state.modo === 'cadastro' && !state.nome) {
      state.erro = 'Preencha seu nome.'
      draw()
      return
    }

    state.carregando = true
    state.erro = null
    state.mensagem = null
    draw()

    try {
      if (state.modo === 'login') {
        await signIn(state.email, state.senha)
        // main.js escuta a mudança de sessão e monta o app — nada a fazer aqui.
      } else {
        const { session } = await signUp(state.email, state.senha, state.nome)
        if (!session) {
          state.mensagem = 'Conta criada! Confira seu e-mail para confirmar antes de entrar.'
          state.modo = 'login'
        }
      }
    } catch (error) {
      state.erro = error.message
    }

    state.carregando = false
    draw()
  }

  draw()
}
