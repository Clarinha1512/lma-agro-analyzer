import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from './dashboard.js'

vi.mock('../lib/supabase.js', () => ({ isSupabaseConfigured: true }))

const listarEmpresasMock = vi.fn()
const listarAnalisesMock = vi.fn()
const listarDadosFinanceirosAgrupadosMock = vi.fn()
const getBenchmarksMock = vi.fn()

vi.mock('../lib/database.js', () => ({
  listarEmpresas: (...args) => listarEmpresasMock(...args),
  listarAnalises: (...args) => listarAnalisesMock(...args),
  listarDadosFinanceirosAgrupados: (...args) => listarDadosFinanceirosAgrupadosMock(...args),
  getBenchmarks: (...args) => getBenchmarksMock(...args),
}))

vi.mock('../lib/router.js', () => ({ navigateTo: vi.fn() }))

// Benchmarks reais do subsetor "primario" (seed.sql)
const BENCHMARKS_PRIMARIO = {
  primario: {
    roe: { indicador: 'roe', bom_min: 15, bom_max: 999, ok_min: 10, ok_max: 15, inverso: false },
    mg: { indicador: 'mg', bom_min: 8, bom_max: 999, ok_min: 4, ok_max: 8, inverso: false },
    div: { indicador: 'div', bom_min: 0, bom_max: 2, ok_min: 2, ok_max: 3.5, inverso: true },
  },
}

function empresa(ticker, nome = ticker) {
  return { id: ticker, ticker, nome, subsetor: 'primario', subsetor_label: 'Produção agrícola' }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('dashboard render()', () => {
  it('mostra os contadores corretos e nenhum alerta quando nada piorou', async () => {
    listarEmpresasMock.mockResolvedValue([empresa('AGRO3', 'BrasilAgro')])
    listarAnalisesMock.mockResolvedValue([])
    listarDadosFinanceirosAgrupadosMock.mockResolvedValue(
      new Map([
        [
          'AGRO3',
          [
            { ticker: 'AGRO3', periodo: '2023-12', roe: 15.7, margem_liq: 25.0, div_ebitda: -0.17 },
            { ticker: 'AGRO3', periodo: '2024-12', roe: 16.3, margem_liq: 29.5, div_ebitda: -0.24 },
          ],
        ],
      ])
    )
    getBenchmarksMock.mockResolvedValue(BENCHMARKS_PRIMARIO)

    const container = document.createElement('div')
    await render(container)

    expect(container.querySelector('.stats-grid .stat-value').textContent).toBe('1')
    expect(container.textContent).toMatch(/Nenhuma piora detectada/)
  })

  it('gera um alerta clicável quando indicadores caem (caso real: SLCE3 2023→2024)', async () => {
    listarEmpresasMock.mockResolvedValue([empresa('SLCE3', 'SLC Agrícola')])
    listarAnalisesMock.mockResolvedValue([])
    listarDadosFinanceirosAgrupadosMock.mockResolvedValue(
      new Map([
        [
          'SLCE3',
          [
            { ticker: 'SLCE3', periodo: '2023-12', roe: 17.2, margem_liq: 11.8, div_ebitda: 2.21 },
            { ticker: 'SLCE3', periodo: '2024-12', roe: 6.1, margem_liq: 3.0, div_ebitda: 3.11 },
          ],
        ],
      ])
    )
    getBenchmarksMock.mockResolvedValue(BENCHMARKS_PRIMARIO)

    const container = document.createElement('div')
    await render(container)

    const alertItem = container.querySelector('.alert-item')
    expect(alertItem).not.toBeNull()
    expect(alertItem.dataset.ticker).toBe('SLCE3')
    expect(alertItem.dataset.periodo).toBe('2024-12')
    expect(alertItem.textContent).toMatch(/ROE/)
  })

  it('não gera alerta para empresa com apenas 1 período cadastrado', async () => {
    listarEmpresasMock.mockResolvedValue([empresa('SOJA3', 'Boa Safra')])
    listarAnalisesMock.mockResolvedValue([])
    listarDadosFinanceirosAgrupadosMock.mockResolvedValue(
      new Map([['SOJA3', [{ ticker: 'SOJA3', periodo: '2024-12', roe: 1, margem_liq: 1, div_ebitda: 9 }]]])
    )
    getBenchmarksMock.mockResolvedValue(BENCHMARKS_PRIMARIO)

    const container = document.createElement('div')
    await render(container)

    expect(container.querySelector('.alert-item')).toBeNull()
  })

  it('mostra mensagem de erro quando a busca de dados falha', async () => {
    listarEmpresasMock.mockRejectedValue(new Error('falha de rede'))
    listarAnalisesMock.mockResolvedValue([])
    listarDadosFinanceirosAgrupadosMock.mockResolvedValue(new Map())
    getBenchmarksMock.mockResolvedValue({})

    const container = document.createElement('div')
    await render(container)

    expect(container.textContent).toMatch(/Não foi possível carregar/)
  })
})
