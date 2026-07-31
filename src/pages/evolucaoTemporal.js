import Chart from 'chart.js/auto'
import { pageHeader, emptyState } from '../components/page-header.js'
import { companyPicker, bindCompanyPicker } from '../components/company-picker.js'
import { listarEmpresas, getDadosFinanceiros, getBenchmarks } from '../lib/database.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { buildIndicators, formatFaixa, interpretar, compararPeriodos } from '../lib/indicators.js'
import { trendBadge } from '../components/trend-badge.js'

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
    const indicadoresPorPeriodo = state.periodos.map((dados, i, arr) => {
      const indicadoresBrutos = buildIndicators(dados, benchmarksSubsetor)
      const indicadores =
        i === 0
          ? indicadoresBrutos
          : compararPeriodos(indicadoresBrutos, buildIndicators(arr[i - 1], benchmarksSubsetor))
      return { periodo: dados.periodo, tipo: dados.tipo, indicadores }
    })

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
              ${r.valor == null ? '—' : `${formatNumero(r.valor)}${r.unidade}`}${trendBadge(r.tendencia)}
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
