import Chart from 'chart.js/auto'
import { pageHeader } from '../components/page-header.js'
import { companyPicker, bindCompanyPicker } from '../components/company-picker.js'
import { gaugeSvg } from '../components/gauge.js'
import { trendBadge } from '../components/trend-badge.js'
import { listarEmpresas, getDadosFinanceiros, getBenchmarks, salvarAnalise, listarUltimosDados } from '../lib/database.js'
import { getSession, getProfile } from '../lib/auth.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import {
  buildIndicators,
  computeScore,
  veredictoAutomatico,
  formatFaixa,
  interpretar,
  healthScore,
  compararPeriodos,
  computeMedianasSubsetor,
  comMedianaSubsetor,
  computeDuPont,
  computeCagr,
  computeEvMultiplos,
  computeDcfSimplificado,
} from '../lib/indicators.js'
import { formatMoeda, formatMoedaCompacta } from '../lib/format.js'

const VEREDITOS = ['COMPRA', 'MANUTENÇÃO', 'VENDA']

const CRITERIOS_QUALITATIVOS = [
  { key: 'governanca', label: 'Governança' },
  { key: 'gestao', label: 'Qualidade da gestão' },
  { key: 'posicaoCompetitiva', label: 'Posição competitiva' },
  { key: 'riscos', label: 'Riscos regulatórios/climáticos' },
]

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
  let session
  let ultimosDadosPorTicker
  try {
    ;[empresas, benchmarksPorSubsetor, session, ultimosDadosPorTicker] = await Promise.all([
      listarEmpresas(),
      getBenchmarks(),
      getSession(),
      listarUltimosDados(),
    ])
  } catch (error) {
    container.querySelector('.card').innerHTML = `<p>Erro ao carregar dados: ${error.message}</p>`
    return
  }

  let nomeMembro = session?.user?.email || 'Anônimo'
  if (session?.user) {
    try {
      const perfil = await getProfile(session.user.id)
      nomeMembro = perfil?.nome || nomeMembro
    } catch {
      // mantém o fallback (e-mail) se a busca do perfil falhar
    }
  }

  const state = {
    empresa: null,
    periodos: [],
    periodoSelecionado: null,
    benchmarksSubsetor: null,
    medianasSubsetor: null,
    peersCount: 0,
    membro: nomeMembro,
    veredictoMembro: null,
    justificativa: '',
    scorecard: { governanca: null, gestao: null, posicaoCompetitiva: null, riscos: null, observacoes: '' },
    revelado: false,
    preco: null,
    numAcoes: null,
    dcfCrescimento: null,
    dcfWacc: 12,
    dcfAnos: 5,
    dcfCrescimentoTerminal: 3,
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

  function periodoAnteriorAoSelecionado() {
    const idx = state.periodos.findIndex((d) => d.periodo === state.periodoSelecionado?.periodo)
    return idx > 0 ? state.periodos[idx - 1] : null
  }

  function indicadoresAtuais() {
    const indicadores = buildIndicators(state.periodoSelecionado, state.benchmarksSubsetor, {
      preco: state.preco,
      numAcoes: state.numAcoes,
    })
    const anterior = periodoAnteriorAoSelecionado()
    const comTendencia = anterior
      ? compararPeriodos(indicadores, buildIndicators(anterior, state.benchmarksSubsetor))
      : indicadores
    return comMedianaSubsetor(comTendencia, state.medianasSubsetor)
  }

  function renderSearchSection() {
    return `
      <section class="card no-print">
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
      <section class="card no-print">
        <h2>Antes de ver o veredito do sistema…</h2>
        <p class="muted">Registre sua própria análise. Isso ajuda a comparar seu raciocínio com o modelo quantitativo.</p>
        <p class="muted">Você: <strong>${state.membro}</strong></p>
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
      </section>

      <section class="card no-print">
        <h2>Scorecard qualitativo (opcional)</h2>
        <p class="muted">Notas de 1 (fraco) a 5 (forte) sobre fatores que não aparecem no balanço. Não entra no score automático — fica só como registro do seu julgamento.</p>
        <div class="form-row">
          ${CRITERIOS_QUALITATIVOS.map(
            (c) => `
            <div class="field">
              <label for="qual-${c.key}">${c.label}</label>
              <select id="qual-${c.key}" data-criterio="${c.key}">
                <option value="">—</option>
                ${[1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${state.scorecard[c.key] === n ? 'selected' : ''}>${n}</option>`).join('')}
              </select>
            </div>`
          ).join('')}
        </div>
        <div class="field">
          <label for="qual-observacoes">Observações</label>
          <textarea id="qual-observacoes" rows="2" placeholder="Algo que os números não mostram?">${state.scorecard.observacoes}</textarea>
        </div>
      </section>`
  }

  function scorecardResumoHtml() {
    const preenchidos = CRITERIOS_QUALITATIVOS.filter((c) => state.scorecard[c.key] != null)
    if (!preenchidos.length && !state.scorecard.observacoes.trim()) return ''

    return `
      <section class="card stack-card">
        <h2>Seu scorecard qualitativo</h2>
        <div class="qualitativo-resumo">
          ${preenchidos.map((c) => `<span class="badge badge-neutral">${c.label}: ${state.scorecard[c.key]}/5</span>`).join('')}
        </div>
        ${state.scorecard.observacoes.trim() ? `<p class="muted">"${state.scorecard.observacoes.trim()}"</p>` : ''}
      </section>`
  }

  function medianaTexto(row) {
    if (row.medianaSubsetor == null) return ''
    const classeFavor = row.favoravel === true ? 'mediana-favoravel' : row.favoravel === false ? 'mediana-desfavoravel' : ''
    return `<span class="indicator-mediana muted ${classeFavor}">Mediana do setor: ${formatNumero(row.medianaSubsetor)}${row.unidade}</span>`
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
        <span class="indicator-value">${valorTexto}${trendBadge(row.tendencia)}</span>
        ${medianaTexto(row)}
        <span class="indicator-faixa muted">${formatFaixa(row.benchmark, row.unidade)}</span>
        <span class="indicator-interpretacao muted">${interpretar(row)}</span>
      </div>`
  }

  function dupontHtml(dados) {
    const dupont = computeDuPont(dados)
    if (!dupont) {
      return `
        <section class="card stack-card">
          <h2>Decomposição DuPont</h2>
          <p class="muted">Preencha "Ativos totais" deste período em Adicionar Dados para ver de onde vem o ROE (margem × giro de ativos × alavancagem).</p>
        </section>`
    }

    return `
      <section class="card stack-card">
        <h2>Decomposição DuPont</h2>
        <p class="muted">ROE = Margem líquida × Giro de ativos × Alavancagem financeira.</p>
        <div class="dupont-formula">
          <div class="dupont-fator">
            <span class="dupont-valor">${formatNumero(dupont.margemLiquida)}%</span>
            <span class="muted">Margem líquida</span>
          </div>
          <span class="dupont-op">×</span>
          <div class="dupont-fator">
            <span class="dupont-valor">${formatNumero(dupont.giroAtivos, 2)}x</span>
            <span class="muted">Giro de ativos</span>
          </div>
          <span class="dupont-op">×</span>
          <div class="dupont-fator">
            <span class="dupont-valor">${formatNumero(dupont.alavancagem, 2)}x</span>
            <span class="muted">Alavancagem</span>
          </div>
          <span class="dupont-op">=</span>
          <div class="dupont-fator dupont-resultado">
            <span class="dupont-valor">${formatNumero(dupont.roeCalculado)}%</span>
            <span class="muted">ROE (DuPont)</span>
          </div>
        </div>
        <p class="muted">ROE informado no período: ${formatNumero(dados.roe)}%. Pequenas diferenças em relação ao ROE calculado aqui são normais (ex: patrimônio líquido médio vs. final).</p>
      </section>`
  }

  function crescimentoMultiplosBodyHtml(dados) {
    const cagr = computeCagr(state.periodos)
    const evMultiplos = computeEvMultiplos(dados, { preco: state.preco, numAcoes: state.numAcoes })
    const sufixoCagr = cagr ? ` (${cagr.anos.toFixed(1)} anos)` : ''

    return `
      <div class="stats-grid">
        <div class="card stat-card">
          <span class="stat-label">CAGR Receita${sufixoCagr}</span>
          <span class="stat-value">${cagr?.receita != null ? `${formatNumero(cagr.receita)}%` : '—'}</span>
        </div>
        <div class="card stat-card">
          <span class="stat-label">CAGR Lucro${sufixoCagr}</span>
          <span class="stat-value">${cagr?.lucro != null ? `${formatNumero(cagr.lucro)}%` : '—'}</span>
        </div>
        <div class="card stat-card">
          <span class="stat-label">EV/EBITDA</span>
          <span class="stat-value">${evMultiplos?.evEbitda != null ? `${formatNumero(evMultiplos.evEbitda, 2)}x` : '—'}</span>
        </div>
        <div class="card stat-card">
          <span class="stat-label">EV/Receita</span>
          <span class="stat-value">${evMultiplos?.evReceita != null ? `${formatNumero(evMultiplos.evReceita, 2)}x` : '—'}</span>
        </div>
      </div>
      <p class="muted no-print">
        ${!cagr ? 'CAGR precisa de pelo menos 2 períodos cadastrados (com receita/lucro positivos nos extremos) para esta empresa. ' : ''}
        ${!evMultiplos ? 'Preencha preço da ação e nº de ações (na seção de indicadores acima) para calcular EV/EBITDA e EV/Receita.' : ''}
      </p>`
  }

  function crescimentoMultiplosHtml(dados) {
    return `
      <section class="card stack-card">
        <h2>Crescimento &amp; Múltiplos (EV)</h2>
        <p class="muted">EV (Enterprise Value) = valor de mercado + dívida líquida — diferente do P/L, considera a alavancagem da empresa.</p>
        <div id="crescimento-multiplos-body">${crescimentoMultiplosBodyHtml(dados)}</div>
      </section>`
  }

  function dcfResultadoHtml(dados) {
    const dcf = computeDcfSimplificado(dados, {
      crescimentoAnual: state.dcfCrescimento,
      wacc: state.dcfWacc,
      anos: state.dcfAnos,
      crescimentoTerminal: state.dcfCrescimentoTerminal,
      numAcoes: state.numAcoes,
    })

    const precoAtual = state.preco
    const upside =
      dcf?.precoJusto != null && precoAtual ? ((dcf.precoJusto - precoAtual) / precoAtual) * 100 : null

    if (dcf?.erro) {
      return '<p class="form-error">A taxa de desconto (WACC) precisa ser maior que o crescimento na perpetuidade.</p>'
    }
    if (!dcf) {
      return '<p class="muted">Preencha crescimento, WACC, anos de projeção e crescimento na perpetuidade para calcular.</p>'
    }

    return `
      <div class="stats-grid">
        <div class="card stat-card"><span class="stat-label">Valor da empresa (EV)</span><span class="stat-value" title="${formatMoeda(dcf.valorEmpresa)}">${formatMoedaCompacta(dcf.valorEmpresa)}</span></div>
        <div class="card stat-card"><span class="stat-label">Valor do patrimônio</span><span class="stat-value" title="${formatMoeda(dcf.valorPatrimonio)}">${formatMoedaCompacta(dcf.valorPatrimonio)}</span></div>
        <div class="card stat-card">
          <span class="stat-label">Preço justo (DCF)</span>
          <span class="stat-value">${dcf.precoJusto != null ? `R$ ${formatNumero(dcf.precoJusto, 2)}` : '—'}</span>
        </div>
      </div>
      ${
        upside != null
          ? `<p class="muted">Preço atual informado: R$ ${formatNumero(precoAtual, 2)} → <strong class="${upside >= 0 ? 'mediana-favoravel' : 'mediana-desfavoravel'}">${upside >= 0 ? '+' : ''}${formatNumero(upside)}%</strong> de ${upside >= 0 ? 'potencial de alta' : 'potencial de queda'} segundo este modelo.</p>`
          : '<p class="muted no-print">Preencha o preço da ação (na seção de indicadores acima) para comparar com o valor de mercado atual.</p>'
      }
      ${dcf.precoJusto == null ? '<p class="muted no-print">Preencha o nº de ações em circulação (na seção de indicadores acima) para calcular o preço justo por ação.</p>' : ''}`
  }

  function dcfHtml(dados) {
    return `
      <section class="card stack-card">
        <h2>DCF simplificado (didático)</h2>
        <p class="muted">Projeta o EBITDA do período como proxy de fluxo de caixa (não usa capex/impostos detalhados), traz a valor presente e soma um valor terminal. É uma aproximação pedagógica, não uma recomendação de investimento — o resultado é bem sensível às premissas informadas.</p>
        <div class="form-row no-print">
          <div class="field">
            <label for="dcf-crescimento">Crescimento anual esperado (%)</label>
            <input id="dcf-crescimento" type="number" step="0.1" value="${state.dcfCrescimento ?? ''}" placeholder="Ex: CAGR histórico" />
          </div>
          <div class="field">
            <label for="dcf-wacc">Taxa de desconto / WACC (%)</label>
            <input id="dcf-wacc" type="number" step="0.1" value="${state.dcfWacc ?? ''}" />
          </div>
          <div class="field">
            <label for="dcf-anos">Anos de projeção</label>
            <input id="dcf-anos" type="number" step="1" min="1" max="15" value="${state.dcfAnos ?? ''}" />
          </div>
          <div class="field">
            <label for="dcf-g-terminal">Crescimento na perpetuidade (%)</label>
            <input id="dcf-g-terminal" type="number" step="0.1" value="${state.dcfCrescimentoTerminal ?? ''}" />
          </div>
        </div>
        <div id="dcf-resultado">${dcfResultadoHtml(dados)}</div>
      </section>`
  }

  function printHeaderHtml(dados, veredictoSistema, score, max) {
    const agora = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    return `
      <div class="print-only print-header">
        <h1>LMA Agro Analyzer — Relatório de Análise Fundamentalista</h1>
        <p><strong>${state.empresa.ticker}</strong> — ${state.empresa.nome} · ${state.empresa.subsetor_label}</p>
        <p>Período: ${formatPeriodo(dados.periodo)} (${dados.tipo})</p>
        <p>Veredito do membro (${state.membro || 'Anônimo'}): <strong>${state.veredictoMembro || '—'}</strong>${state.justificativa ? ` — "${state.justificativa}"` : ''}</p>
        <p>Veredito do sistema: <strong>${veredictoSistema}</strong> (score ${score}/${max})</p>
        <p class="muted">Relatório gerado em ${agora}</p>
      </div>`
  }

  function renderResultado() {
    const dados = state.periodoSelecionado
    const indicadores = indicadoresAtuais()
    const { score, max } = computeScore(indicadores)
    const veredictoSistema = veredictoAutomatico(score, max)
    const concorda = state.veredictoMembro === veredictoSistema

    return `
      ${printHeaderHtml(dados, veredictoSistema, score, max)}

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

      ${scorecardResumoHtml()}

      <section class="card">
        <h2>Indicadores fundamentalistas</h2>
        ${state.peersCount > 1 ? `<p class="muted">Mediana calculada com ${state.peersCount} empresas do subsetor ${state.empresa.subsetor_label}.</p>` : ''}
        <div id="indicadores-lista">
          ${indicadores.map(indicatorRowHtml).join('')}
        </div>
        <div class="form-row cotacao-row no-print">
          <div class="field">
            <label for="preco-acao">Preço atual da ação (R$)</label>
            <input id="preco-acao" type="number" step="0.01" min="0" placeholder="Opcional" value="${state.preco ?? ''}" />
          </div>
          <div class="field">
            <label for="num-acoes">Nº de ações em circulação</label>
            <input id="num-acoes" type="number" step="1" min="0" placeholder="Opcional" value="${state.numAcoes ?? ''}" />
          </div>
        </div>
        <p class="muted no-print">Preencha os dois campos acima para calcular P/L e P/VP com base na cotação atual.</p>
      </section>

      ${dupontHtml(dados)}

      ${crescimentoMultiplosHtml(dados)}

      ${dcfHtml(dados)}

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

      <section class="card no-print">
        <button id="salvar-btn" class="btn btn-primary" ${state.salvo ? 'disabled' : ''}>
          ${state.salvo ? 'Análise salva ✓' : state.salvando ? 'Salvando…' : 'Salvar análise'}
        </button>
        <button id="exportar-btn" class="btn btn-primary" style="margin-left: 8px">Exportar PDF</button>
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

    CRITERIOS_QUALITATIVOS.forEach((c) => {
      container.querySelector(`#qual-${c.key}`).addEventListener('change', (e) => {
        state.scorecard[c.key] = e.target.value === '' ? null : parseInt(e.target.value, 10)
      })
    })

    container.querySelector('#qual-observacoes').addEventListener('input', (e) => {
      state.scorecard.observacoes = e.target.value
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

    const crescimentoBody = container.querySelector('#crescimento-multiplos-body')
    if (crescimentoBody) {
      crescimentoBody.innerHTML = crescimentoMultiplosBodyHtml(state.periodoSelecionado)
    }

    atualizarDcfView()

    return { score, max, veredictoSistema }
  }

  function atualizarDcfView() {
    const dcfResultado = container.querySelector('#dcf-resultado')
    if (dcfResultado) {
      dcfResultado.innerHTML = dcfResultadoHtml(state.periodoSelecionado)
    }
  }

  function bindResultado() {
    container.querySelector('#exportar-btn').addEventListener('click', () => window.print())

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

    const camposDcf = [
      ['dcf-crescimento', 'dcfCrescimento'],
      ['dcf-wacc', 'dcfWacc'],
      ['dcf-anos', 'dcfAnos'],
      ['dcf-g-terminal', 'dcfCrescimentoTerminal'],
    ]
    camposDcf.forEach(([id, campo]) => {
      container.querySelector(`#${id}`).addEventListener('input', (e) => {
        state[campo] = e.target.value === '' ? null : parseFloat(e.target.value)
        atualizarDcfView()
      })
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
          scorecard_qualitativo: scorecardParaSalvar(),
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

  function scorecardParaSalvar() {
    const algumPreenchido =
      CRITERIOS_QUALITATIVOS.some((c) => state.scorecard[c.key] != null) || state.scorecard.observacoes.trim()
    if (!algumPreenchido) return null

    const obj = { observacoes: state.scorecard.observacoes.trim() || null }
    CRITERIOS_QUALITATIVOS.forEach((c) => {
      obj[c.key] = state.scorecard[c.key]
    })
    return obj
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

  async function onSelectEmpresa(empresa, periodoPreferido) {
    state.empresa = empresa
    state.benchmarksSubsetor = benchmarksPorSubsetor[empresa.subsetor] || {}
    state.periodoSelecionado = null
    state.revelado = false
    resetVereditoState()

    const peers = empresas.filter((e) => e.subsetor === empresa.subsetor)
    const dadosPeers = peers.map((e) => ultimosDadosPorTicker.get(e.ticker)).filter(Boolean)
    state.peersCount = dadosPeers.length
    state.medianasSubsetor = computeMedianasSubsetor(dadosPeers)

    try {
      state.periodos = await getDadosFinanceiros(empresa.ticker)
    } catch (error) {
      state.periodos = []
    }

    if (state.periodos.length) {
      const preferido = periodoPreferido && state.periodos.find((d) => d.periodo === periodoPreferido)
      state.periodoSelecionado = preferido || state.periodos[state.periodos.length - 1]
    }

    const cagr = computeCagr(state.periodos)
    state.dcfCrescimento = cagr?.receita != null ? Math.round(cagr.receita * 10) / 10 : null

    draw()
  }

  function onSelectPeriodo(periodo) {
    state.periodoSelecionado = state.periodos.find((d) => d.periodo === periodo) || null
    state.revelado = false
    resetVereditoState()
    draw()
  }

  function resetVereditoState() {
    state.membro = nomeMembro
    state.veredictoMembro = null
    state.justificativa = ''
    state.scorecard = { governanca: null, gestao: null, posicaoCompetitiva: null, riscos: null, observacoes: '' }
    state.preco = null
    state.numAcoes = null
    state.salvando = false
    state.salvo = false
  }

  const tickerPreselecionado = query?.get('ticker')
  const periodoPreselecionado = query?.get('periodo')
  if (tickerPreselecionado) {
    const empresa = empresas.find((e) => e.ticker === tickerPreselecionado)
    if (empresa) {
      await onSelectEmpresa(empresa, periodoPreselecionado)
      return
    }
  }

  draw()
}
