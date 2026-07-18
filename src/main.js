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
