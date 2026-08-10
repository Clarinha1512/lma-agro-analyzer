import { pageHeader, emptyState } from '../components/page-header.js'
import { listarEmpresas, listarUltimosDados, getBenchmarks } from '../lib/database.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { buildIndicators, computeScore, veredictoAutomatico } from '../lib/indicators.js'
import { navigateTo } from '../lib/router.js'
import { montarCsv, baixarCsv } from '../lib/csv.js'

const COLUNAS_CSV = [
  { label: 'Ticker', value: (r) => r.ticker },
  { label: 'Nome', value: (r) => r.nome },
  { label: 'Subsetor', value: (r) => r.subsetor },
  { label: 'Período', value: (r) => r.periodo },
  { label: 'ROE (%)', value: (r) => r.roe },
  { label: 'Margem líquida (%)', value: (r) => r.mg },
  { label: 'Dívida/EBITDA (x)', value: (r) => r.div },
  { label: 'Score', value: (r) => (r.score == null ? '' : `${r.score}/${r.max}`) },
  { label: 'Veredito', value: (r) => r.veredito },
]

function formatNumero(valor, casas = 1) {
  if (valor == null) return '—'
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: casas })
}

function veredictoBadgeClasse(veredito) {
  if (veredito === 'COMPRA') return 'ok'
  if (veredito === 'VENDA') return 'danger'
  if (veredito === 'MANUTENÇÃO') return 'warn'
  return 'neutral'
}

function buildRows(empresas, ultimosDados, benchmarksPorSubsetor) {
  return empresas.map((empresa) => {
    const dados = ultimosDados.get(empresa.ticker)
    if (!dados) {
      return {
        empresa,
        ticker: empresa.ticker,
        nome: empresa.nome,
        subsetor: empresa.subsetor_label,
        periodo: null,
        roe: null,
        roeClasse: null,
        mg: null,
        mgClasse: null,
        div: null,
        divClasse: null,
        score: null,
        max: null,
        veredito: null,
      }
    }

    const indicadores = buildIndicators(dados, benchmarksPorSubsetor[empresa.subsetor] || {})
    const { score, max } = computeScore(indicadores)
    const veredito = veredictoAutomatico(score, max)
    const porChave = Object.fromEntries(indicadores.map((row) => [row.key, row]))

    return {
      empresa,
      ticker: empresa.ticker,
      nome: empresa.nome,
      subsetor: empresa.subsetor_label,
      periodo: dados.periodo,
      roe: porChave.roe.valor,
      roeClasse: porChave.roe.classe,
      mg: porChave.mg.valor,
      mgClasse: porChave.mg.classe,
      div: porChave.div.valor,
      divClasse: porChave.div.classe,
      score,
      max,
      veredito,
    }
  })
}

function sortRows(rows, key, dir) {
  const factor = dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const va = a[key]
    const vb = b[key]
    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1
    if (typeof va === 'string') return factor * va.localeCompare(vb, 'pt-BR')
    return factor * (va - vb)
  })
}

const COLUNAS = [
  { key: 'ticker', label: 'Ticker' },
  { key: 'nome', label: 'Nome' },
  { key: 'subsetor', label: 'Subsetor' },
  { key: 'roe', label: 'ROE' },
  { key: 'mg', label: 'Margem' },
  { key: 'div', label: 'Dívida/EBITDA' },
  { key: 'score', label: 'Score' },
  { key: 'veredito', label: 'Veredito' },
]

export async function render(container) {
  if (!isSupabaseConfigured) {
    container.innerHTML = `
      ${pageHeader('Ranking', 'Todas as empresas ordenadas por indicadores fundamentalistas.')}
      <div class="card empty-state"><p>Configure o Supabase (.env) para usar esta página.</p></div>`
    return
  }

  container.innerHTML = `
    ${pageHeader('Ranking', 'Todas as empresas ordenadas por indicadores fundamentalistas.')}
    <div class="card"><p class="muted">Carregando ranking…</p></div>`

  let empresas
  let ultimosDados
  let benchmarksPorSubsetor
  try {
    ;[empresas, ultimosDados, benchmarksPorSubsetor] = await Promise.all([
      listarEmpresas(),
      listarUltimosDados(),
      getBenchmarks(),
    ])
  } catch (error) {
    container.querySelector('.card').innerHTML = `<p>Erro ao carregar dados: ${error.message}</p>`
    return
  }

  const rows = buildRows(empresas, ultimosDados, benchmarksPorSubsetor)
  const subsetores = [...new Set(empresas.map((e) => e.subsetor_label))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR')
  )

  const state = {
    subsetorFiltro: 'todos',
    sortKey: 'ticker',
    sortDir: 'asc',
  }

  function indicatorCell(valor, classe, unidade) {
    return `<span class="dot dot-${classe || 'neutral'}"></span> ${valor == null ? '—' : `${formatNumero(valor)}${unidade}`}`
  }

  function linhasFiltradasOrdenadas() {
    const filtradas =
      state.subsetorFiltro === 'todos'
        ? rows
        : rows.filter((r) => r.subsetor === state.subsetorFiltro)
    return sortRows(filtradas, state.sortKey, state.sortDir)
  }

  function renderTable() {
    const ordenadas = linhasFiltradasOrdenadas()

    if (!ordenadas.length) {
      return emptyState('Nenhuma empresa encontrada para este filtro.')
    }

    return `
      <section class="card table-card">
        <div class="table-scroll">
          <table class="ranking-table">
            <thead>
              <tr>
                ${COLUNAS.map(
                  (col) => `
                  <th data-key="${col.key}" class="sortable ${state.sortKey === col.key ? 'sorted' : ''}">
                    ${col.label} ${state.sortKey === col.key ? (state.sortDir === 'asc' ? '▲' : '▼') : ''}
                  </th>`
                ).join('')}
              </tr>
            </thead>
            <tbody>
              ${ordenadas
                .map(
                  (row) => `
                <tr class="ranking-row" data-ticker="${row.ticker}">
                  <td><strong>${row.ticker}</strong></td>
                  <td>${row.nome}</td>
                  <td>${row.subsetor}</td>
                  <td>${indicatorCell(row.roe, row.roeClasse, '%')}</td>
                  <td>${indicatorCell(row.mg, row.mgClasse, '%')}</td>
                  <td>${indicatorCell(row.div, row.divClasse, 'x')}</td>
                  <td>${row.score == null ? '—' : `${row.score}/${row.max}`}</td>
                  <td>${row.veredito ? `<span class="badge badge-${veredictoBadgeClasse(row.veredito)}">${row.veredito}</span>` : '—'}</td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </section>`
  }

  function draw() {
    container.innerHTML = `
      ${pageHeader('Ranking', 'Todas as empresas ordenadas por indicadores fundamentalistas.')}
      <section class="card table-toolbar">
        <div class="field">
          <label for="subsetor-filtro">Subsetor</label>
          <select id="subsetor-filtro">
            <option value="todos">Todos os subsetores</option>
            ${subsetores
              .map(
                (s) =>
                  `<option value="${s}" ${state.subsetorFiltro === s ? 'selected' : ''}>${s}</option>`
              )
              .join('')}
          </select>
        </div>
        <button id="exportar-csv-btn" class="btn btn-primary" style="margin-top: 12px">Exportar CSV</button>
      </section>
      ${renderTable()}`

    container.querySelector('#subsetor-filtro').addEventListener('change', (event) => {
      state.subsetorFiltro = event.target.value
      draw()
    })

    container.querySelector('#exportar-csv-btn').addEventListener('click', () => {
      const csv = montarCsv(COLUNAS_CSV, linhasFiltradasOrdenadas())
      baixarCsv('ranking-empresas.csv', csv)
    })

    container.querySelectorAll('th.sortable').forEach((th) => {
      th.addEventListener('click', () => {
        const key = th.dataset.key
        if (state.sortKey === key) {
          state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc'
        } else {
          state.sortKey = key
          state.sortDir = 'asc'
        }
        draw()
      })
    })

    container.querySelectorAll('.ranking-row').forEach((tr) => {
      tr.addEventListener('click', () => {
        navigateTo('/analise', { ticker: tr.dataset.ticker })
      })
    })
  }

  draw()
}
