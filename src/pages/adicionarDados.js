import { pageHeader } from '../components/page-header.js'
import { companyPicker, bindCompanyPicker } from '../components/company-picker.js'
import { listarEmpresas, inserirDadosFinanceiros } from '../lib/database.js'
import { isSupabaseConfigured } from '../lib/supabase.js'

const PERIODO_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/

function calcularDerivados({ receita, lucro, ebitda, dividaLiquida, patrimonioLiquido }) {
  const margemLiq = receita ? (lucro / receita) * 100 : null
  const roe = patrimonioLiquido ? (lucro / patrimonioLiquido) * 100 : null
  const divEbitda = ebitda ? dividaLiquida / ebitda : null
  return { margemLiq, roe, divEbitda }
}

function formatDerivado(valor, unidade) {
  return valor == null || Number.isNaN(valor) ? '—' : `${valor.toFixed(2)}${unidade}`
}

function validar(state) {
  const erros = []
  if (!state.empresa) erros.push('Selecione uma empresa.')
  if (!PERIODO_REGEX.test(state.periodo)) erros.push('Período deve estar no formato AAAA-MM (ex: 2025-03).')
  if (!['ITR', 'DFP'].includes(state.tipo)) erros.push('Selecione o tipo (ITR ou DFP).')
  ;['receita', 'lucro', 'ebitda', 'dividaLiquida', 'patrimonioLiquido'].forEach((campo) => {
    if (state[campo] === null || Number.isNaN(state[campo])) erros.push(`Preencha o campo "${campo}" com um número válido.`)
  })
  return erros
}

export async function render(container) {
  if (!isSupabaseConfigured) {
    container.innerHTML = `
      ${pageHeader('Adicionar Dados', 'Registre manualmente um novo período financeiro.')}
      <div class="card empty-state"><p>Configure o Supabase (.env) para usar esta página.</p></div>`
    return
  }

  container.innerHTML = `
    ${pageHeader('Adicionar Dados', 'Registre manualmente um novo período financeiro.')}
    <div class="card"><p class="muted">Carregando empresas…</p></div>`

  let empresas
  try {
    empresas = await listarEmpresas()
  } catch (error) {
    container.querySelector('.card').innerHTML = `<p>Erro ao carregar empresas: ${error.message}</p>`
    return
  }

  const state = {
    empresa: null,
    periodo: '',
    tipo: 'ITR',
    receita: null,
    lucro: null,
    ebitda: null,
    dividaLiquida: null,
    patrimonioLiquido: null,
    ativosTotais: null,
    salvando: false,
    salvo: false,
    erroSalvar: null,
  }

  function renderFormCard() {
    const derivados = calcularDerivados(state)
    return `
      <section class="card">
        <h2>Dados do período</h2>
        <div class="form-row">
          <div class="field">
            <label>Empresa</label>
            ${companyPicker('empresa-dados', 'Buscar por ticker ou nome...')}
          </div>
          <div class="field">
            <label for="periodo-input">Período (AAAA-MM)</label>
            <input id="periodo-input" type="text" placeholder="2025-03" value="${state.periodo}" />
          </div>
          <div class="field">
            <label for="tipo-select">Tipo</label>
            <select id="tipo-select">
              <option value="ITR" ${state.tipo === 'ITR' ? 'selected' : ''}>ITR</option>
              <option value="DFP" ${state.tipo === 'DFP' ? 'selected' : ''}>DFP</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="field">
            <label for="receita-input">Receita (R$)</label>
            <input id="receita-input" type="number" step="0.01" value="${state.receita ?? ''}" />
          </div>
          <div class="field">
            <label for="lucro-input">Lucro (R$)</label>
            <input id="lucro-input" type="number" step="0.01" value="${state.lucro ?? ''}" />
          </div>
          <div class="field">
            <label for="ebitda-input">EBITDA (R$)</label>
            <input id="ebitda-input" type="number" step="0.01" value="${state.ebitda ?? ''}" />
          </div>
          <div class="field">
            <label for="divida-input">Dívida líquida (R$)</label>
            <input id="divida-input" type="number" step="0.01" value="${state.dividaLiquida ?? ''}" />
          </div>
          <div class="field">
            <label for="pl-input">Patrimônio líquido (R$)</label>
            <input id="pl-input" type="number" step="0.01" value="${state.patrimonioLiquido ?? ''}" />
          </div>
          <div class="field">
            <label for="ativos-input">Ativos totais (R$) — opcional</label>
            <input id="ativos-input" type="number" step="0.01" value="${state.ativosTotais ?? ''}" />
          </div>
        </div>
        <p class="muted">Ativos totais é usado só na decomposição DuPont (Análise Individual). Sem esse campo, o resto dos indicadores funciona normalmente.</p>

        <div class="stats-grid">
          <div class="card stat-card"><span class="stat-label">Margem líquida</span><span class="stat-value">${formatDerivado(derivados.margemLiq, '%')}</span></div>
          <div class="card stat-card"><span class="stat-label">ROE</span><span class="stat-value">${formatDerivado(derivados.roe, '%')}</span></div>
          <div class="card stat-card"><span class="stat-label">Dívida/EBITDA</span><span class="stat-value">${formatDerivado(derivados.divEbitda, 'x')}</span></div>
        </div>

        <button id="salvar-btn" class="btn btn-primary" ${state.salvo ? 'disabled' : ''}>
          ${state.salvo ? 'Dados salvos ✓' : state.salvando ? 'Salvando…' : 'Salvar dados'}
        </button>
        <span id="salvar-status" class="muted">${state.erroSalvar ? `Erro: ${state.erroSalvar}` : ''}</span>
      </section>`
  }

  function draw() {
    container.innerHTML = `
      ${pageHeader('Adicionar Dados', 'Registre manualmente um novo período financeiro.')}
      ${renderFormCard()}`

    const pickerApi = bindCompanyPicker(container, 'empresa-dados', empresas, (empresa) => {
      state.empresa = empresa
      draw()
    })
    if (state.empresa) pickerApi.setValue(`${state.empresa.ticker} — ${state.empresa.nome}`)

    container.querySelector('#periodo-input').addEventListener('input', (e) => {
      state.periodo = e.target.value
    })
    container.querySelector('#tipo-select').addEventListener('change', (e) => {
      state.tipo = e.target.value
    })

    const camposNumericos = [
      ['receita-input', 'receita'],
      ['lucro-input', 'lucro'],
      ['ebitda-input', 'ebitda'],
      ['divida-input', 'dividaLiquida'],
      ['pl-input', 'patrimonioLiquido'],
      ['ativos-input', 'ativosTotais'],
    ]
    camposNumericos.forEach(([id, campo]) => {
      container.querySelector(`#${id}`).addEventListener('input', (e) => {
        state[campo] = e.target.value === '' ? null : parseFloat(e.target.value)
        atualizarDerivados()
      })
    })

    container.querySelector('#salvar-btn').addEventListener('click', handleSalvar)
  }

  function atualizarDerivados() {
    const derivados = calcularDerivados(state)
    const cards = container.querySelectorAll('.stats-grid .stat-value')
    cards[0].textContent = formatDerivado(derivados.margemLiq, '%')
    cards[1].textContent = formatDerivado(derivados.roe, '%')
    cards[2].textContent = formatDerivado(derivados.divEbitda, 'x')
  }

  async function handleSalvar() {
    const erros = validar(state)
    if (erros.length) {
      state.erroSalvar = erros.join(' ')
      draw()
      return
    }

    const derivados = calcularDerivados(state)
    state.salvando = true
    state.erroSalvar = null
    draw()

    try {
      await inserirDadosFinanceiros({
        empresa_id: state.empresa.id,
        ticker: state.empresa.ticker,
        periodo: state.periodo,
        tipo: state.tipo,
        ano: parseInt(state.periodo.slice(0, 4), 10),
        receita: state.receita,
        lucro: state.lucro,
        ebitda: state.ebitda,
        divida_liq: state.dividaLiquida,
        pl: state.patrimonioLiquido,
        ativos_totais: state.ativosTotais,
        margem_liq: derivados.margemLiq,
        roe: derivados.roe,
        div_ebitda: derivados.divEbitda,
        fonte: 'manual',
      })
      state.salvando = false
      state.salvo = true
    } catch (error) {
      state.salvando = false
      state.erroSalvar = error.message
    }

    draw()
  }

  draw()
}
