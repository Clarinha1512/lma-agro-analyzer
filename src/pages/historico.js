import { pageHeader, emptyState } from '../components/page-header.js'
import { listarAnalises, listarEmpresas } from '../lib/database.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { navigateTo } from '../lib/router.js'

function veredictoBadgeClasse(veredito) {
  if (veredito === 'COMPRA') return 'ok'
  if (veredito === 'VENDA') return 'danger'
  if (veredito === 'MANUTENÇÃO') return 'warn'
  return 'neutral'
}

function formatDataHora(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const COLUNAS = [
  { key: 'criado_em', label: 'Data' },
  { key: 'ticker', label: 'Ticker' },
  { key: 'nome', label: 'Empresa' },
  { key: 'periodo', label: 'Período' },
  { key: 'membro', label: 'Membro' },
  { key: 'veredito_membro', label: 'Veredito (membro)' },
  { key: 'veredito_sistema', label: 'Veredito (sistema)' },
  { key: 'score_sistema', label: 'Score' },
  { key: 'concorda', label: 'Concordância' },
]

/**
 * Agrupa análises por empresa+período e mantém só os grupos com 2+ membros
 * diferentes — é aí que faz sentido comparar vereditos ("batalha de análises").
 */
function agruparBatalhas(rows) {
  const grupos = new Map()
  for (const row of rows) {
    const chave = `${row.ticker}__${row.periodo}`
    if (!grupos.has(chave)) grupos.set(chave, [])
    grupos.get(chave).push(row)
  }

  return [...grupos.values()]
    .filter((grupo) => new Set(grupo.map((r) => r.membro || 'Anônimo')).size >= 2)
    .map((grupo) => {
      const maisRecentePrimeiro = sortRows(grupo, 'criado_em', 'desc')
      const divergencia = new Set(grupo.map((r) => r.veredito_membro)).size > 1
      return {
        ticker: grupo[0].ticker,
        nome: grupo[0].nome,
        periodo: grupo[0].periodo,
        veredictoSistema: grupo[0].veredito_sistema,
        divergencia,
        analises: maisRecentePrimeiro,
        ultimaAtividade: maisRecentePrimeiro[0].criado_em,
      }
    })
    .sort((a, b) => new Date(b.ultimaAtividade) - new Date(a.ultimaAtividade))
}

function battleCardHtml(grupo) {
  return `
    <div class="card battle-card" data-ticker="${grupo.ticker}" data-periodo="${grupo.periodo}">
      <div class="battle-header">
        <span><strong>${grupo.ticker}</strong> — ${grupo.nome} · ${grupo.periodo}</span>
        <span class="badge badge-neutral">Sistema: ${grupo.veredictoSistema || '—'}</span>
        <span class="badge badge-${grupo.divergencia ? 'warn' : 'ok'}">${grupo.divergencia ? 'Divergência entre membros' : 'Consenso'}</span>
      </div>
      <div class="battle-membros">
        ${grupo.analises
          .map(
            (a) => `
          <div class="battle-membro">
            <span class="membro-nome">${a.membro || 'Anônimo'}</span>
            <span class="badge badge-${veredictoBadgeClasse(a.veredito_membro)}">${a.veredito_membro || '—'}</span>
            <span class="trend ${a.concorda ? 'trend-melhora' : 'trend-piora'}">${a.concorda ? '✓ bateu com o sistema' : '✗ divergiu do sistema'}</span>
          </div>`
          )
          .join('')}
      </div>
    </div>`
}

function renderBatalhas(batalhas) {
  if (!batalhas.length) {
    return `
      <section class="card">
        <h2>Batalha de análises</h2>
        <p class="muted">Ainda não há duas análises de membros diferentes para a mesma empresa/período. Assim que isso acontecer, a comparação aparece aqui.</p>
      </section>`
  }

  return `
    <section class="card">
      <h2>Batalha de análises</h2>
      <p class="muted">Empresas/períodos analisados por mais de um membro — compare quem concordou com o sistema e entre si.</p>
      <div class="battle-list">
        ${batalhas.map(battleCardHtml).join('')}
      </div>
    </section>`
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

export async function render(container) {
  if (!isSupabaseConfigured) {
    container.innerHTML = `
      ${pageHeader('Histórico', 'Análises registradas pelos membros da liga.')}
      <div class="card empty-state"><p>Configure o Supabase (.env) para usar esta página.</p></div>`
    return
  }

  container.innerHTML = `
    ${pageHeader('Histórico', 'Análises registradas pelos membros da liga.')}
    <div class="card"><p class="muted">Carregando análises…</p></div>`

  let analises
  let empresas
  try {
    ;[analises, empresas] = await Promise.all([listarAnalises(), listarEmpresas()])
  } catch (error) {
    container.querySelector('.card').innerHTML = `<p>Erro ao carregar histórico: ${error.message}</p>`
    return
  }

  const nomePorTicker = new Map(empresas.map((e) => [e.ticker, e.nome]))
  const rows = analises.map((a) => ({
    ...a,
    nome: nomePorTicker.get(a.ticker) || a.ticker,
    concorda: a.veredito_membro === a.veredito_sistema,
  }))

  const batalhas = agruparBatalhas(rows)

  const state = {
    filtro: '',
    sortKey: 'criado_em',
    sortDir: 'desc',
  }

  function renderTable() {
    const termo = state.filtro.trim().toLowerCase()
    const filtradas = termo
      ? rows.filter(
          (r) => r.ticker.toLowerCase().includes(termo) || (r.membro || '').toLowerCase().includes(termo)
        )
      : rows
    const ordenadas = sortRows(filtradas, state.sortKey, state.sortDir)

    if (!ordenadas.length) {
      return emptyState('Nenhuma análise encontrada.')
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
                <tr class="ranking-row" data-ticker="${row.ticker}" data-periodo="${row.periodo}">
                  <td>${formatDataHora(row.criado_em)}</td>
                  <td><strong>${row.ticker}</strong></td>
                  <td>${row.nome}</td>
                  <td>${row.periodo}</td>
                  <td>${row.membro || 'Anônimo'}</td>
                  <td><span class="badge badge-${veredictoBadgeClasse(row.veredito_membro)}">${row.veredito_membro || '—'}</span></td>
                  <td><span class="badge badge-${veredictoBadgeClasse(row.veredito_sistema)}">${row.veredito_sistema || '—'}</span></td>
                  <td>${row.score_sistema}/${row.score_max}</td>
                  <td><span class="badge badge-${row.concorda ? 'ok' : 'danger'}">${row.concorda ? 'Sim' : 'Não'}</span></td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </section>`
  }

  function bindTabelaEvents() {
    container.querySelectorAll('th.sortable').forEach((th) => {
      th.addEventListener('click', () => {
        const key = th.dataset.key
        if (state.sortKey === key) {
          state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc'
        } else {
          state.sortKey = key
          state.sortDir = 'asc'
        }
        atualizarTabela()
      })
    })

    container.querySelectorAll('.ranking-row').forEach((tr) => {
      tr.addEventListener('click', () => {
        navigateTo('/analise', { ticker: tr.dataset.ticker, periodo: tr.dataset.periodo })
      })
    })
  }

  function bindBatalhaEvents() {
    container.querySelectorAll('.battle-card').forEach((card) => {
      card.addEventListener('click', () => {
        navigateTo('/analise', { ticker: card.dataset.ticker, periodo: card.dataset.periodo })
      })
    })
  }

  function atualizarTabela() {
    container.querySelector('#tabela-container').innerHTML = renderTable()
    bindTabelaEvents()
  }

  function draw() {
    container.innerHTML = `
      ${pageHeader('Histórico', 'Análises registradas pelos membros da liga.')}
      ${renderBatalhas(batalhas)}
      <section class="card table-toolbar">
        <div class="field">
          <label for="filtro-input">Buscar por ticker ou membro</label>
          <input id="filtro-input" type="text" placeholder="Ex: SLCE3 ou Enrico" value="${state.filtro}" />
        </div>
      </section>
      <div id="tabela-container">${renderTable()}</div>`

    container.querySelector('#filtro-input').addEventListener('input', (e) => {
      state.filtro = e.target.value
      atualizarTabela()
    })

    bindTabelaEvents()
    bindBatalhaEvents()
  }

  draw()
}
