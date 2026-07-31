import './styles/main.css'
import { renderSidebar, bindSidebarActiveState } from './components/sidebar.js'
import { registerRoute, startRouter } from './lib/router.js'
import { getSession, onAuthStateChange, signOut, garantirProfile } from './lib/auth.js'
import { isSupabaseConfigured } from './lib/supabase.js'

import { render as renderLogin } from './pages/login.js'
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
let appMontado = false

function montarApp(perfil) {
  appMontado = true
  app.innerHTML = `
    ${renderSidebar('/dashboard', perfil?.nome)}
    <main class="content">
      <div id="outlet"></div>
    </main>`

  const outlet = document.querySelector('#outlet')
  startRouter(outlet, (path) => bindSidebarActiveState(app, path))

  app.querySelector('#sair-btn').addEventListener('click', () => signOut())
}

function mostrarLogin() {
  appMontado = false
  app.innerHTML = ''
  renderLogin(app)
}

function mostrarErro(mensagem) {
  appMontado = false
  app.innerHTML = `
    <div class="auth-screen">
      <div class="card auth-card">
        <h1>Algo deu errado</h1>
        <p class="form-error">${mensagem}</p>
        <button id="tentar-de-novo-btn" class="btn btn-primary">Tentar de novo</button>
      </div>
    </div>`
  app.querySelector('#tentar-de-novo-btn').addEventListener('click', () => window.location.reload())
}

async function tratarSessao(session) {
  if (!session) {
    mostrarLogin()
    return
  }
  if (appMontado) return

  try {
    const perfil = await garantirProfile(session.user)
    montarApp(perfil)
  } catch (error) {
    mostrarErro(error.message)
  }
}

async function bootstrap() {
  if (!isSupabaseConfigured) {
    mostrarLogin()
    return
  }

  try {
    const session = await getSession()
    await tratarSessao(session)
  } catch (error) {
    mostrarErro(error.message)
  }

  onAuthStateChange((session) => {
    tratarSessao(session)
  })
}

bootstrap()
