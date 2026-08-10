import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from './historico.js'

vi.mock('../lib/supabase.js', () => ({ isSupabaseConfigured: true }))

const listarAnalisesMock = vi.fn()
const listarEmpresasMock = vi.fn()
const navigateToMock = vi.fn()

vi.mock('../lib/database.js', () => ({
  listarAnalises: (...args) => listarAnalisesMock(...args),
  listarEmpresas: (...args) => listarEmpresasMock(...args),
}))

vi.mock('../lib/router.js', () => ({ navigateTo: (...args) => navigateToMock(...args) }))

const montarCsvMock = vi.fn(() => 'csv-fake')
const baixarCsvMock = vi.fn()
vi.mock('../lib/csv.js', () => ({
  montarCsv: (...args) => montarCsvMock(...args),
  baixarCsv: (...args) => baixarCsvMock(...args),
}))

function empresa(ticker, nome = ticker) {
  return { id: ticker, ticker, nome, subsetor: 'primario', subsetor_label: 'Produção agrícola' }
}

function analise(overrides) {
  return {
    id: Math.random(),
    ticker: 'SLCE3',
    periodo: '2024-12',
    membro: 'Enrico',
    veredito_membro: 'VENDA',
    veredito_sistema: 'VENDA',
    score_sistema: 1,
    score_max: 6,
    criado_em: '2026-08-01T10:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  listarEmpresasMock.mockResolvedValue([empresa('SLCE3', 'SLC Agrícola')])
})

describe('historico render() — Batalha de análises', () => {
  it('mostra mensagem de vazio quando nenhuma empresa/período tem 2+ membros', async () => {
    listarAnalisesMock.mockResolvedValue([analise({ membro: 'Enrico' })])

    const container = document.createElement('div')
    await render(container)

    expect(container.textContent).toMatch(/Ainda não há duas análises de membros diferentes/)
    expect(container.querySelector('.battle-card')).toBeNull()
  })

  it('agrupa e mostra "Consenso" quando dois membros bateram no mesmo veredito', async () => {
    listarAnalisesMock.mockResolvedValue([
      analise({ membro: 'Enrico', veredito_membro: 'VENDA' }),
      analise({ membro: 'Maria', veredito_membro: 'VENDA', criado_em: '2026-08-02T10:00:00Z' }),
    ])

    const container = document.createElement('div')
    await render(container)

    const card = container.querySelector('.battle-card')
    expect(card).not.toBeNull()
    expect(card.textContent).toMatch(/Consenso/)
    expect(card.textContent).toMatch(/Enrico/)
    expect(card.textContent).toMatch(/Maria/)
  })

  it('marca "Divergência entre membros" quando os vereditos diferem', async () => {
    listarAnalisesMock.mockResolvedValue([
      analise({ membro: 'Enrico', veredito_membro: 'VENDA' }),
      analise({ membro: 'Maria', veredito_membro: 'COMPRA', criado_em: '2026-08-02T10:00:00Z' }),
    ])

    const container = document.createElement('div')
    await render(container)

    expect(container.querySelector('.battle-card').textContent).toMatch(/Divergência entre membros/)
  })

  it('indica quem bateu e quem divergiu do veredito do sistema', async () => {
    listarAnalisesMock.mockResolvedValue([
      analise({ membro: 'Enrico', veredito_membro: 'VENDA', veredito_sistema: 'VENDA' }),
      analise({ membro: 'Maria', veredito_membro: 'COMPRA', veredito_sistema: 'VENDA', criado_em: '2026-08-02T10:00:00Z' }),
    ])

    const container = document.createElement('div')
    await render(container)

    const texto = container.querySelector('.battle-card').textContent
    expect(texto).toMatch(/Enrico[\s\S]*✓ bateu com o sistema/)
    expect(texto).toMatch(/Maria[\s\S]*✗ divergiu do sistema/)
  })

  it('não agrupa análises de empresas/períodos diferentes', async () => {
    listarEmpresasMock.mockResolvedValue([empresa('SLCE3', 'SLC Agrícola'), empresa('AGRO3', 'BrasilAgro')])
    listarAnalisesMock.mockResolvedValue([
      analise({ membro: 'Enrico', ticker: 'SLCE3', periodo: '2024-12' }),
      analise({ membro: 'Maria', ticker: 'AGRO3', periodo: '2024-12', criado_em: '2026-08-02T10:00:00Z' }),
    ])

    const container = document.createElement('div')
    await render(container)

    expect(container.querySelector('.battle-card')).toBeNull()
  })

  it('navega para a Análise Individual ao clicar num card de batalha', async () => {
    listarAnalisesMock.mockResolvedValue([
      analise({ membro: 'Enrico', veredito_membro: 'VENDA' }),
      analise({ membro: 'Maria', veredito_membro: 'COMPRA', criado_em: '2026-08-02T10:00:00Z' }),
    ])

    const container = document.createElement('div')
    await render(container)

    container.querySelector('.battle-card').click()

    expect(navigateToMock).toHaveBeenCalledWith('/analise', { ticker: 'SLCE3', periodo: '2024-12' })
  })

  it('exporta CSV com as linhas atualmente filtradas', async () => {
    listarAnalisesMock.mockResolvedValue([
      analise({ membro: 'Enrico', ticker: 'SLCE3' }),
      analise({ membro: 'Maria', ticker: 'AGRO3', criado_em: '2026-08-02T10:00:00Z' }),
    ])
    listarEmpresasMock.mockResolvedValue([empresa('SLCE3', 'SLC Agrícola'), empresa('AGRO3', 'BrasilAgro')])

    const container = document.createElement('div')
    await render(container)

    const filtroInput = container.querySelector('#filtro-input')
    filtroInput.value = 'SLCE3'
    filtroInput.dispatchEvent(new Event('input', { bubbles: true }))

    container.querySelector('#exportar-csv-btn').click()

    expect(montarCsvMock).toHaveBeenCalledTimes(1)
    const linhasExportadas = montarCsvMock.mock.calls[0][1]
    expect(linhasExportadas).toHaveLength(1)
    expect(linhasExportadas[0].ticker).toBe('SLCE3')
    expect(baixarCsvMock).toHaveBeenCalledWith('historico-analises.csv', 'csv-fake')
  })
})
