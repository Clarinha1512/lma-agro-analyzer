import { pageHeader } from '../components/page-header.js'
import { listarEmpresas, listarAnalises, listarDadosFinanceirosAgrupados, getBenchmarks } from '../lib/database.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { buildIndicators, computeScore, compararPeriodos } from '../lib/indicators.js'
import { navigateTo } from '../lib/router.js'

const INDICADORES_ALERTA = ['roe', 'mg', 'div']

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

function formatValor(valor, unidade) {
  if (valor == null) return '—'
  return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}${unidade}`
}

function buildAlertasDePiora(empresas, dadosPorTicker, benchmarksPorSubsetor) {
  const empresaPorTicker = new Map(empresas.map((e) => [e.ticker, e]))
  const alertas = []

  for (const [ticker, periodos] of dadosPorTicker) {
    if (periodos.length < 2) continue
    const empresa = empresaPorTicker.get(ticker)
    if (!empresa) continue

    const benchmarksSubsetor = benchmarksPorSubsetor[empresa.subsetor] || {}
    const atual = periodos[periodos.length - 1]
    const anterior = periodos[periodos.length - 2]

    const indicadoresAtuais = buildIndicators(atual, benchmarksSubsetor)
    const indicadoresAnteriores = buildIndicators(anterior, benchmarksSubsetor)
    const comparados = compararPeriodos(indicadoresAtuais, indicadoresAnteriores)
    const pioraram = comparados.filter((r) => r.tendencia === 'piora' && INDICADORES_ALERTA.includes(r.key))
    if (!pioraram.length) continue

    const scoreAtual = computeScore(indicadoresAtuais)
    const scoreAnterior = computeScore(indicadoresAnteriores)

    alertas.push({
      ticker,
      nome: empresa.nome,
      periodo: atual.periodo,
      pioraram,
      scoreAtual,
      scoreAnterior,
    })
  }

  return alertas.sort(
    (a, b) => a.scoreAtual.score - a.scoreAnterior.score - (b.scoreAtual.score - b.scoreAnterior.score)
  )
}

function alertasDePioraHtml(alertas) {
  if (!alertas.length) {
    return `<p class="muted">Nenhuma piora detectada no período mais recente das empresas cadastradas.</p>`
  }
  return `
    <ul class="alert-list">
      ${alertas
        .slice(0, 8)
        .map(
          (a) => `
        <li class="alert-item alert-clickable" data-ticker="${a.ticker}" data-periodo="${a.periodo}">
          <div class="alert-item-body">
            <strong>${a.ticker}</strong> <span class="muted">· ${a.nome}</span>
            <div class="alert-item-detail">
              ${a.pioraram
                .map((r) => `${r.label} piorou (${formatValor(r.valorAnterior, r.unidade)} → ${formatValor(r.valor, r.unidade)})`)
                .join(' · ')}
            </div>
            <div class="alert-item-detail">Score: ${a.scoreAnterior.score}/${a.scoreAnterior.max} → ${a.scoreAtual.score}/${a.scoreAtual.max}</div>
          </div>
        </li>`
        )
        .join('')}
    </ul>`
}

function content(empresas, analises, alertas) {
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

    <section class="card">
      <h2>Alertas de piora (último período vs. anterior)</h2>
      ${alertasDePioraHtml(alertas)}
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
    const [empresas, analises, dadosPorTicker, benchmarksPorSubsetor] = await Promise.all([
      listarEmpresas(),
      listarAnalises(),
      listarDadosFinanceirosAgrupados(),
      getBenchmarks(),
    ])
    const alertas = buildAlertasDePiora(empresas, dadosPorTicker, benchmarksPorSubsetor)
    const body = container.querySelector('#dashboard-body')
    body.innerHTML = content(empresas, analises, alertas)

    body.querySelectorAll('.alert-clickable').forEach((el) => {
      el.addEventListener('click', () => {
        navigateTo('/analise', { ticker: el.dataset.ticker, periodo: el.dataset.periodo })
      })
    })
  } catch (error) {
    container.querySelector('#dashboard-body').innerHTML = errorCard(error)
  }
}
