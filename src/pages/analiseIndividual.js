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

  async function onSelectEmpresa(empresa) {
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
      state.periodoSelecionado = state.periodos[state.periodos.length - 1]
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
  if (tickerPreselecionado) {
    const empresa = empresas.find((e) => e.ticker === tickerPreselecionado)
    if (empresa) {
      await onSelectEmpresa(empresa)
      return
    }
  }

  draw()
}
