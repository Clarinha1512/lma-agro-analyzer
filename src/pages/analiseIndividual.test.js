import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from './analiseIndividual.js'

vi.mock('../lib/supabase.js', () => ({ isSupabaseConfigured: true }))

vi.mock('chart.js/auto', () => ({
  default: class MockChart {
    constructor(_canvas, config) {
      this.data = config.data
      this.destroy = vi.fn()
      this.update = vi.fn()
    }
  },
}))

const listarEmpresasMock = vi.fn()
const getDadosFinanceirosMock = vi.fn()
const getBenchmarksMock = vi.fn()
const salvarAnaliseMock = vi.fn()
const getSessionMock = vi.fn()
const getProfileMock = vi.fn()
const listarUltimosDadosMock = vi.fn()

vi.mock('../lib/database.js', () => ({
  listarEmpresas: (...args) => listarEmpresasMock(...args),
  getDadosFinanceiros: (...args) => getDadosFinanceirosMock(...args),
  getBenchmarks: (...args) => getBenchmarksMock(...args),
  salvarAnalise: (...args) => salvarAnaliseMock(...args),
  listarUltimosDados: (...args) => listarUltimosDadosMock(...args),
}))

vi.mock('../lib/auth.js', () => ({
  getSession: (...args) => getSessionMock(...args),
  getProfile: (...args) => getProfileMock(...args),
}))

// Benchmarks reais do subsetor "primario" (seed.sql)
const BENCHMARKS_PRIMARIO = {
  primario: {
    roe: { indicador: 'roe', bom_min: 15, bom_max: 999, ok_min: 10, ok_max: 15, inverso: false },
    mg: { indicador: 'mg', bom_min: 8, bom_max: 999, ok_min: 4, ok_max: 8, inverso: false },
    div: { indicador: 'div', bom_min: 0, bom_max: 2, ok_min: 2, ok_max: 3.5, inverso: true },
  },
}

const EMPRESA_SLCE3 = {
  id: 1,
  ticker: 'SLCE3',
  nome: 'SLC Agrícola',
  subsetor: 'primario',
  subsetor_label: 'Produção agrícola',
}

// Peer do mesmo subsetor, usado para testar a mediana do peer group (item 2.2).
const EMPRESA_AGRO3 = {
  id: 2,
  ticker: 'AGRO3',
  nome: 'BrasilAgro',
  subsetor: 'primario',
  subsetor_label: 'Produção agrícola',
}
const DADOS_AGRO3 = { ticker: 'AGRO3', periodo: '2024-12', roe: 13.9, margem_liq: 5.0, div_ebitda: 0.89 }

// Histórico real (seed.sql): 2024 é um declínio forte vs. 2023.
const PERIODOS_SLCE3 = [
  {
    ticker: 'SLCE3',
    periodo: '2023-12',
    tipo: 'DFP',
    receita: 7200000000,
    lucro: 850000000,
    ebitda: 1900000000,
    divida_liq: 4200000000,
    pl: 4950000000,
    margem_liq: 11.8,
    roe: 17.2,
    div_ebitda: 2.21,
  },
  {
    ticker: 'SLCE3',
    periodo: '2024-12',
    tipo: 'DFP',
    receita: 9590000000,
    lucro: 290600000,
    ebitda: 2039000000,
    divida_liq: 6347000000,
    pl: 5315000000,
    margem_liq: 3.0,
    roe: 6.1,
    div_ebitda: 3.11,
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  listarEmpresasMock.mockResolvedValue([EMPRESA_SLCE3, EMPRESA_AGRO3])
  getBenchmarksMock.mockResolvedValue(BENCHMARKS_PRIMARIO)
  getDadosFinanceirosMock.mockResolvedValue(PERIODOS_SLCE3)
  listarUltimosDadosMock.mockResolvedValue(
    new Map([
      ['SLCE3', PERIODOS_SLCE3[1]],
      ['AGRO3', DADOS_AGRO3],
    ])
  )
  getSessionMock.mockResolvedValue({
    user: { id: 'user-1', email: 'membro@liga.com', user_metadata: { nome: 'Enrico' } },
  })
  getProfileMock.mockResolvedValue({ id: 'user-1', nome: 'Enrico', nivel: 'analista' })
})

async function renderComPreselecao() {
  const container = document.createElement('div')
  await render(container, new URLSearchParams({ ticker: 'SLCE3', periodo: '2024-12' }))
  return container
}

function selecionarVeredito(container, valor) {
  const radio = container.querySelector(`input[name="veredito-membro"][value="${valor}"]`)
  radio.checked = true
  radio.dispatchEvent(new Event('change', { bubbles: true }))
}

describe('Análise Individual — fluxo veredito-primeiro', () => {
  it('pré-seleciona empresa e período vindos da URL (deep-link do Ranking/Histórico)', async () => {
    const container = await renderComPreselecao()

    expect(getDadosFinanceirosMock).toHaveBeenCalledWith('SLCE3')
    expect(container.textContent).toMatch(/SLC Agrícola/)
    expect(container.querySelector('#period-select').value).toBe('2024-12')
  })

  it('mostra o nome de quem está logado, sem pedir para digitar (vem do perfil, não de metadata)', async () => {
    const container = await renderComPreselecao()

    expect(container.textContent).toMatch(/Você:.*Enrico/s)
    expect(container.querySelector('#membro-nome')).toBeNull()
  })

  it('cai para o e-mail se a busca do perfil falhar (não trava a página)', async () => {
    getProfileMock.mockRejectedValue(new Error('tabela profiles indisponível'))
    const container = await renderComPreselecao()

    expect(container.textContent).toMatch(/Você:.*membro@liga\.com/s)
  })

  it('esconde o veredito do sistema até o membro registrar o dele', async () => {
    const container = await renderComPreselecao()

    expect(container.textContent).toMatch(/Antes de ver o veredito do sistema/)
    expect(container.querySelector('#gauge-container')).toBeNull()
    expect(container.querySelector('#revelar-btn').disabled).toBe(true)
  })

  it('habilita "Revelar" só depois de escolher um veredito', async () => {
    const container = await renderComPreselecao()

    selecionarVeredito(container, 'COMPRA')

    expect(container.querySelector('#revelar-btn').disabled).toBe(false)
  })

  it('revela o veredito do sistema e sinaliza divergência com o do membro', async () => {
    const container = await renderComPreselecao()

    selecionarVeredito(container, 'COMPRA')
    container.querySelector('#revelar-btn').click()

    // Score real apurado: 2024-12 vs benchmark "primario" = 1/6 → VENDA
    expect(container.textContent).toMatch(/Sistema: VENDA/)
    expect(container.textContent).toMatch(/Você: COMPRA/)
    expect(container.textContent).toMatch(/diverge do sistema/)
  })

  it('reconhece concordância quando o veredito do membro bate com o do sistema', async () => {
    const container = await renderComPreselecao()

    selecionarVeredito(container, 'VENDA')
    container.querySelector('#revelar-btn').click()

    expect(container.textContent).toMatch(/coincide com o do sistema/)
  })

  it('avisa que falta "ativos totais" quando o período não tem esse dado (DuPont)', async () => {
    const container = await renderComPreselecao()
    selecionarVeredito(container, 'VENDA')
    container.querySelector('#revelar-btn').click()

    expect(container.textContent).toMatch(/Preencha "Ativos totais" deste período em Adicionar Dados/)
  })

  it('mostra a decomposição DuPont quando o período tem "ativos totais" preenchido', async () => {
    getDadosFinanceirosMock.mockResolvedValue([
      ...PERIODOS_SLCE3.slice(0, 1),
      { ...PERIODOS_SLCE3[1], ativos_totais: 12_000_000_000 },
    ])
    const container = await renderComPreselecao()
    selecionarVeredito(container, 'VENDA')
    container.querySelector('#revelar-btn').click()

    expect(container.textContent).toMatch(/ROE = Margem líquida × Giro de ativos × Alavancagem/)
    // 3,0% (margem) × 0,799x (giro = 9,59bi/12bi) × 2,258x (alavancagem = 12bi/5,315bi) ≈ 5,4%
    expect(container.querySelector('.dupont-resultado').textContent).toMatch(/5,4%/)
  })

  it('mostra a mediana do subsetor (peer group) ao lado de cada indicador', async () => {
    const container = await renderComPreselecao()
    selecionarVeredito(container, 'VENDA')
    container.querySelector('#revelar-btn').click()

    expect(container.textContent).toMatch(/Mediana calculada com 2 empresas do subsetor Produção agrícola/)

    // Mediana ROE = (6.1 da SLCE3 + 13.9 da AGRO3) / 2 = 10
    const linhaRoe = [...container.querySelectorAll('.indicator-row')].find((el) => el.textContent.includes('ROE'))
    expect(linhaRoe.querySelector('.indicator-mediana').textContent).toMatch(/Mediana do setor: 10%/)
  })

  it('mostra a seta de piora nos indicadores que caíram vs. o período anterior', async () => {
    const container = await renderComPreselecao()

    selecionarVeredito(container, 'VENDA')
    container.querySelector('#revelar-btn').click()

    const linhaRoe = [...container.querySelectorAll('.indicator-row')].find((el) =>
      el.textContent.includes('ROE')
    )
    expect(linhaRoe.querySelector('.trend-piora')).not.toBeNull()
  })

  it('calcula P/L e P/VP ao vivo quando preço e nº de ações são preenchidos', async () => {
    const container = await renderComPreselecao()
    selecionarVeredito(container, 'VENDA')
    container.querySelector('#revelar-btn').click()

    const precoInput = container.querySelector('#preco-acao')
    precoInput.value = '20'
    precoInput.dispatchEvent(new Event('input', { bubbles: true }))

    const numAcoesInput = container.querySelector('#num-acoes')
    numAcoesInput.value = '500000000'
    numAcoesInput.dispatchEvent(new Event('input', { bubbles: true }))

    const linhaPL = [...container.querySelectorAll('.indicator-row')].find((el) => el.textContent.includes('P/L'))
    expect(linhaPL.textContent).not.toMatch(/—/)
  })

  it('chama window.print() ao clicar em "Exportar PDF"', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {})
    const container = await renderComPreselecao()
    selecionarVeredito(container, 'VENDA')
    container.querySelector('#revelar-btn').click()

    container.querySelector('#exportar-btn').click()

    expect(printSpy).toHaveBeenCalledTimes(1)
  })

  it('salva a análise com o score e veredito do sistema calculados', async () => {
    salvarAnaliseMock.mockResolvedValue({ id: 99 })
    const container = await renderComPreselecao()
    selecionarVeredito(container, 'COMPRA')
    container.querySelector('#revelar-btn').click()

    container.querySelector('#salvar-btn').click()

    await vi.waitFor(() => {
      expect(salvarAnaliseMock).toHaveBeenCalledTimes(1)
    })

    expect(salvarAnaliseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ticker: 'SLCE3',
        periodo: '2024-12',
        membro: 'Enrico',
        veredito_membro: 'COMPRA',
        veredito_sistema: 'VENDA',
        score_sistema: 1,
        score_max: 6,
      })
    )
  })

  it('inclui o scorecard qualitativo preenchido ao salvar, e mostra o resumo depois de revelar', async () => {
    salvarAnaliseMock.mockResolvedValue({ id: 1 })
    const container = await renderComPreselecao()
    selecionarVeredito(container, 'COMPRA')

    const governancaSelect = container.querySelector('#qual-governanca')
    governancaSelect.value = '4'
    governancaSelect.dispatchEvent(new Event('change', { bubbles: true }))

    const observacoesInput = container.querySelector('#qual-observacoes')
    observacoesInput.value = 'Boa gestão de risco climático'
    observacoesInput.dispatchEvent(new Event('input', { bubbles: true }))

    container.querySelector('#revelar-btn').click()

    expect(container.textContent).toMatch(/Seu scorecard qualitativo/)
    expect(container.textContent).toMatch(/Governança: 4\/5/)

    container.querySelector('#salvar-btn').click()

    await vi.waitFor(() => {
      expect(salvarAnaliseMock).toHaveBeenCalledTimes(1)
    })

    expect(salvarAnaliseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        scorecard_qualitativo: {
          governanca: 4,
          gestao: null,
          posicaoCompetitiva: null,
          riscos: null,
          observacoes: 'Boa gestão de risco climático',
        },
      })
    )
  })

  it('envia scorecard_qualitativo como null e não mostra resumo quando nada é preenchido', async () => {
    salvarAnaliseMock.mockResolvedValue({ id: 2 })
    const container = await renderComPreselecao()
    selecionarVeredito(container, 'VENDA')
    container.querySelector('#revelar-btn').click()

    expect(container.querySelector('.qualitativo-resumo')).toBeNull()

    container.querySelector('#salvar-btn').click()

    await vi.waitFor(() => {
      expect(salvarAnaliseMock).toHaveBeenCalledTimes(1)
    })

    expect(salvarAnaliseMock).toHaveBeenCalledWith(expect.objectContaining({ scorecard_qualitativo: null }))
  })
})
