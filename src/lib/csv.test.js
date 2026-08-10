import { describe, it, expect, vi } from 'vitest'
import { montarCsv, baixarCsv } from './csv.js'

describe('montarCsv', () => {
  const colunas = [
    { label: 'Ticker', value: (r) => r.ticker },
    { label: 'Nome', value: (r) => r.nome },
  ]

  it('monta cabeçalho e linhas separados por ";"', () => {
    const csv = montarCsv(colunas, [{ ticker: 'SLCE3', nome: 'SLC Agrícola' }])
    expect(csv).toBe('Ticker;Nome\nSLCE3;SLC Agrícola')
  })

  it('escapa campos que contêm ";", aspas ou quebra de linha', () => {
    const csv = montarCsv(colunas, [{ ticker: 'X1', nome: 'Empresa "A"; irmã' }])
    expect(csv).toBe('Ticker;Nome\nX1;"Empresa ""A""; irmã"')
  })

  it('trata valores nulos/undefined como campo vazio', () => {
    const csv = montarCsv(colunas, [{ ticker: 'X1', nome: null }])
    expect(csv).toBe('Ticker;Nome\nX1;')
  })

  it('retorna só o cabeçalho quando não há linhas', () => {
    expect(montarCsv(colunas, [])).toBe('Ticker;Nome')
  })
})

describe('baixarCsv', () => {
  it('cria um link de download e dispara o click', () => {
    const createObjectURLSpy = vi.fn(() => 'blob:fake-url')
    const revokeObjectURLSpy = vi.fn()
    URL.createObjectURL = createObjectURLSpy
    URL.revokeObjectURL = revokeObjectURLSpy

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    baixarCsv('arquivo.csv', 'a;b\n1;2')

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:fake-url')

    clickSpy.mockRestore()
  })
})
