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
