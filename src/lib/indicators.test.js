import { describe, it, expect } from 'vitest'
import {
  classify,
  buildIndicators,
  computeScore,
  veredictoAutomatico,
  healthScore,
  melhorPorValor,
  classificarTendencia,
  compararPeriodos,
  formatFaixa,
  interpretar,
  computeMedianasSubsetor,
  comMedianaSubsetor,
  computeDuPont,
} from './indicators.js'

// Benchmarks reais do subsetor "primario" (seed.sql), usados nos testes para
// que os números aqui batam com o que o app realmente usa em produção.
const BENCH_ROE = { indicador: 'roe', bom_min: 15, bom_max: 999, ok_min: 10, ok_max: 15, inverso: false }
const BENCH_MG = { indicador: 'mg', bom_min: 8, bom_max: 999, ok_min: 4, ok_max: 8, inverso: false }
const BENCH_DIV = { indicador: 'div', bom_min: 0, bom_max: 2, ok_min: 2, ok_max: 3.5, inverso: true }
const BENCHMARKS_PRIMARIO = { roe: BENCH_ROE, mg: BENCH_MG, div: BENCH_DIV }

describe('classify', () => {
  it('retorna null quando não há valor ou benchmark', () => {
    expect(classify(null, BENCH_ROE)).toBeNull()
    expect(classify(undefined, BENCH_ROE)).toBeNull()
    expect(classify(NaN, BENCH_ROE)).toBeNull()
    expect(classify(15, null)).toBeNull()
  })

  describe('indicador não-inverso (maior é melhor, ex: ROE)', () => {
    it('classifica "ok" quando >= bom_min', () => {
      expect(classify(15, BENCH_ROE)).toBe('ok')
      expect(classify(26.7, BENCH_ROE)).toBe('ok')
    })

    it('classifica "warn" quando entre ok_min e bom_min', () => {
      expect(classify(10, BENCH_ROE)).toBe('warn')
      expect(classify(12, BENCH_ROE)).toBe('warn')
    })

    it('classifica "danger" quando abaixo de ok_min', () => {
      expect(classify(9.9, BENCH_ROE)).toBe('danger')
      expect(classify(6.1, BENCH_ROE)).toBe('danger')
      expect(classify(-5, BENCH_ROE)).toBe('danger')
    })
  })

  describe('indicador inverso (menor é melhor, ex: dívida/EBITDA)', () => {
    it('classifica "ok" quando <= bom_max', () => {
      expect(classify(2, BENCH_DIV)).toBe('ok')
      expect(classify(1.25, BENCH_DIV)).toBe('ok')
    })

    it('classifica "warn" quando entre bom_max e ok_max', () => {
      expect(classify(2.21, BENCH_DIV)).toBe('warn')
      expect(classify(3.11, BENCH_DIV)).toBe('warn')
    })

    it('classifica "danger" quando acima de ok_max', () => {
      expect(classify(4, BENCH_DIV)).toBe('danger')
    })

    // Bug real encontrado em produção: AGRO3 tem dívida líquida negativa
    // (caixa líquido). Um valor bem abaixo de zero é "ótimo", não "ruim".
    it('classifica caixa líquido (valor negativo) como "ok", não "danger"', () => {
      expect(classify(-0.24, BENCH_DIV)).toBe('ok')
      expect(classify(-100, BENCH_DIV)).toBe('ok')
    })
  })
})

describe('formatFaixa', () => {
  it('formata indicador não-inverso com "≥"', () => {
    expect(formatFaixa(BENCH_ROE, '%')).toBe('Bom: ≥ 15% · Ok: ≥ 10%')
  })

  it('formata indicador inverso com "≤"', () => {
    expect(formatFaixa(BENCH_DIV, 'x')).toBe('Bom: ≤ 2x · Ok: ≤ 3.5x')
  })

  it('avisa quando não há benchmark', () => {
    expect(formatFaixa(null, '%')).toBe('Sem benchmark cadastrado')
  })
})

describe('buildIndicators', () => {
  const dadosSLCE3_2024 = { roe: 6.1, margem_liq: 3.0, div_ebitda: 3.11, lucro: 290600000, pl: 5315000000 }

  it('monta os 5 indicadores com valores e classes corretas', () => {
    const indicadores = buildIndicators(dadosSLCE3_2024, BENCHMARKS_PRIMARIO)
    const porChave = Object.fromEntries(indicadores.map((r) => [r.key, r]))

    expect(porChave.roe.valor).toBe(6.1)
    expect(porChave.roe.classe).toBe('danger')
    expect(porChave.mg.valor).toBe(3.0)
    expect(porChave.mg.classe).toBe('danger')
    expect(porChave.div.valor).toBe(3.11)
    expect(porChave.div.classe).toBe('warn')
  })

  it('P/L e P/VP ficam "requerDados" sem preço e nº de ações', () => {
    const indicadores = buildIndicators(dadosSLCE3_2024, BENCHMARKS_PRIMARIO)
    const pl = indicadores.find((r) => r.key === 'pl')
    const pvp = indicadores.find((r) => r.key === 'pvp')

    expect(pl.requerDados).toBe(true)
    expect(pl.valor).toBeNull()
    expect(pl.classe).toBeNull()
    expect(pvp.requerDados).toBe(true)
  })

  it('calcula P/L e P/VP quando preço e nº de ações são informados', () => {
    // LPA = 290.600.000 / 500.000.000 = 0,5812 → P/L = 20 / 0,5812 ≈ 34,41
    // VPA = 5.315.000.000 / 500.000.000 = 10,63 → P/VP = 20 / 10,63 ≈ 1,88
    const indicadores = buildIndicators(dadosSLCE3_2024, BENCHMARKS_PRIMARIO, {
      preco: 20,
      numAcoes: 500_000_000,
    })
    const pl = indicadores.find((r) => r.key === 'pl')
    const pvp = indicadores.find((r) => r.key === 'pvp')

    expect(pl.requerDados).toBe(false)
    expect(pl.valor).toBeCloseTo(34.41, 1)
    expect(pvp.valor).toBeCloseTo(1.88, 1)
  })

  it('não calcula P/L nem P/VP se só o preço for informado (sem nº de ações)', () => {
    const indicadores = buildIndicators(dadosSLCE3_2024, BENCHMARKS_PRIMARIO, { preco: 20 })
    expect(indicadores.find((r) => r.key === 'pl').requerDados).toBe(true)
  })

  it('funciona sem benchmarks (subsetor sem cadastro) sem quebrar', () => {
    const indicadores = buildIndicators(dadosSLCE3_2024, null)
    expect(indicadores.find((r) => r.key === 'roe').classe).toBeNull()
    expect(indicadores.find((r) => r.key === 'roe').valor).toBe(6.1)
  })
})

describe('computeScore', () => {
  it('soma pontos (ok=2, warn=1, danger=0) só dos indicadores com classe definida', () => {
    const indicadores = [
      { classe: 'ok' },
      { classe: 'warn' },
      { classe: 'danger' },
      { classe: null }, // P/L sem cotação — não deve contar
    ]
    const { score, max } = computeScore(indicadores)
    expect(score).toBe(3) // 2 + 1 + 0
    expect(max).toBe(6) // 3 indicadores válidos × 2
  })

  it('retorna score 0/0 quando nenhum indicador tem benchmark', () => {
    const { score, max } = computeScore([{ classe: null }, { classe: null }])
    expect(score).toBe(0)
    expect(max).toBe(0)
  })
})

describe('veredictoAutomatico', () => {
  it('retorna COMPRA quando score/max >= 0.7', () => {
    expect(veredictoAutomatico(6, 6)).toBe('COMPRA')
    expect(veredictoAutomatico(5, 6)).toBe('COMPRA') // 0.833
  })

  it('respeita o limite exato de 0.7 para COMPRA', () => {
    expect(veredictoAutomatico(7, 10)).toBe('COMPRA') // 0.7 exato
    expect(veredictoAutomatico(6.9, 10)).toBe('MANUTENÇÃO')
  })

  it('retorna MANUTENÇÃO entre 0.4 e 0.7', () => {
    expect(veredictoAutomatico(4, 10)).toBe('MANUTENÇÃO') // 0.4 exato
    expect(veredictoAutomatico(6, 10)).toBe('MANUTENÇÃO') // 0.6
  })

  it('retorna VENDA abaixo de 0.4', () => {
    expect(veredictoAutomatico(1, 6)).toBe('VENDA') // 0.1667
    expect(veredictoAutomatico(0, 6)).toBe('VENDA')
  })

  it('retorna INDEFINIDO quando max é 0 (nenhum indicador com benchmark)', () => {
    expect(veredictoAutomatico(0, 0)).toBe('INDEFINIDO')
  })

  it('reproduz o caso real da SLCE3 2024 (declínio de margem/ROE)', () => {
    // score 1/6 apurado manualmente contra o benchmark "primario"
    expect(veredictoAutomatico(1, 6)).toBe('VENDA')
  })
})

describe('healthScore', () => {
  it('mapeia classe para valor de 0-100', () => {
    expect(healthScore({ classe: 'ok' })).toBe(100)
    expect(healthScore({ classe: 'warn' })).toBe(60)
    expect(healthScore({ classe: 'danger' })).toBe(20)
    expect(healthScore({ classe: null })).toBe(0)
  })
})

describe('melhorPorValor', () => {
  it('indicador não-inverso: maior valor vence', () => {
    expect(melhorPorValor(20, 10, false)).toBe('A')
    expect(melhorPorValor(10, 20, false)).toBe('B')
  })

  it('indicador inverso: menor valor vence', () => {
    expect(melhorPorValor(1, 3, true)).toBe('A')
    expect(melhorPorValor(3, 1, true)).toBe('B')
  })

  it('retorna null em empate', () => {
    expect(melhorPorValor(5, 5, false)).toBeNull()
  })

  it('trata valor ausente como perdedor automático', () => {
    expect(melhorPorValor(null, 10, false)).toBe('B')
    expect(melhorPorValor(10, null, false)).toBe('A')
    expect(melhorPorValor(null, null, false)).toBeNull()
  })
})

describe('classificarTendencia', () => {
  it('indicador não-inverso: aumento é melhora, queda é piora', () => {
    expect(classificarTendencia(20, 10, false)).toBe('melhora')
    expect(classificarTendencia(10, 20, false)).toBe('piora')
  })

  it('indicador inverso: queda é melhora, aumento é piora', () => {
    expect(classificarTendencia(1, 3, true)).toBe('melhora')
    expect(classificarTendencia(3, 1, true)).toBe('piora')
  })

  it('caixa líquido ficando mais negativo é melhora (inverso)', () => {
    expect(classificarTendencia(-0.38, -0.17, true)).toBe('melhora')
  })

  it('retorna "estavel" quando os valores são iguais', () => {
    expect(classificarTendencia(10, 10, false)).toBe('estavel')
  })

  it('retorna null quando falta algum valor', () => {
    expect(classificarTendencia(null, 10, false)).toBeNull()
    expect(classificarTendencia(10, null, false)).toBeNull()
  })
})

describe('compararPeriodos', () => {
  it('reproduz o declínio real da SLCE3 (2023 → 2024)', () => {
    const indicadores2023 = buildIndicators(
      { roe: 17.2, margem_liq: 11.8, div_ebitda: 2.21 },
      BENCHMARKS_PRIMARIO
    )
    const indicadores2024 = buildIndicators(
      { roe: 6.1, margem_liq: 3.0, div_ebitda: 3.11 },
      BENCHMARKS_PRIMARIO
    )

    const comparado = compararPeriodos(indicadores2024, indicadores2023)
    const porChave = Object.fromEntries(comparado.map((r) => [r.key, r]))

    expect(porChave.roe.tendencia).toBe('piora')
    expect(porChave.mg.tendencia).toBe('piora')
    expect(porChave.div.tendencia).toBe('piora') // subiu, e é inverso → piora
    expect(porChave.roe.valorAnterior).toBe(17.2)
  })

  it('reconhece melhora quando indicador inverso cai', () => {
    const anterior = buildIndicators({ roe: 15, margem_liq: 10, div_ebitda: 3 }, BENCHMARKS_PRIMARIO)
    const atual = buildIndicators({ roe: 15, margem_liq: 10, div_ebitda: 1 }, BENCHMARKS_PRIMARIO)
    const comparado = compararPeriodos(atual, anterior)
    expect(comparado.find((r) => r.key === 'div').tendencia).toBe('melhora')
  })
})

describe('computeMedianasSubsetor', () => {
  it('calcula a mediana de roe/margem/dívida entre os peers do subsetor', () => {
    const peers = [
      { roe: 10, margem_liq: 5, div_ebitda: 3 },
      { roe: 20, margem_liq: 8, div_ebitda: 1 },
      { roe: 30, margem_liq: 12, div_ebitda: 2 },
    ]
    const medianas = computeMedianasSubsetor(peers)
    expect(medianas.roe).toBe(20)
    expect(medianas.mg).toBe(8)
    expect(medianas.div).toBe(2)
  })

  it('faz média dos dois valores centrais quando o número de peers é par', () => {
    const peers = [{ roe: 10, margem_liq: null, div_ebitda: null }, { roe: 30, margem_liq: null, div_ebitda: null }]
    expect(computeMedianasSubsetor(peers).roe).toBe(20)
  })

  it('ignora valores nulos e retorna null se não houver nenhum válido', () => {
    const peers = [{ roe: null, margem_liq: null, div_ebitda: null }]
    const medianas = computeMedianasSubsetor(peers)
    expect(medianas.roe).toBeNull()
    expect(medianas.mg).toBeNull()
    expect(medianas.div).toBeNull()
  })
})

describe('comMedianaSubsetor', () => {
  it('marca como favorável quando o valor da empresa é melhor que a mediana', () => {
    const indicadores = buildIndicators(
      { roe: 20, margem_liq: 3, div_ebitda: 3.11 },
      BENCHMARKS_PRIMARIO
    )
    const comMediana = comMedianaSubsetor(indicadores, { roe: 15, mg: 8, div: 1 })
    const porChave = Object.fromEntries(comMediana.map((r) => [r.key, r]))

    expect(porChave.roe.favoravel).toBe(true) // 20 > 15, não-inverso
    expect(porChave.mg.favoravel).toBe(false) // 3 < 8, não-inverso
    expect(porChave.div.favoravel).toBe(false) // 3.11 > 1, inverso → pior
  })

  it('não quebra quando não há mediana calculada (sem peers)', () => {
    const indicadores = buildIndicators({ roe: 20, margem_liq: 3, div_ebitda: 3.11 }, BENCHMARKS_PRIMARIO)
    const comMediana = comMedianaSubsetor(indicadores, { roe: null, mg: null, div: null })
    expect(comMediana.find((r) => r.key === 'roe').medianaSubsetor).toBeNull()
    expect(comMediana.find((r) => r.key === 'roe').favoravel).toBeUndefined()
  })
})

describe('computeDuPont', () => {
  it('decompõe o ROE em margem × giro de ativos × alavancagem', () => {
    // Receita 9.590.000.000, margem 3,0%, PL 5.315.000.000, ativos totais 12.000.000.000 (SLCE3 2024, hipotético)
    const dados = { receita: 9_590_000_000, margem_liq: 3.0, pl: 5_315_000_000, ativos_totais: 12_000_000_000 }
    const dupont = computeDuPont(dados)

    expect(dupont.margemLiquida).toBe(3.0)
    expect(dupont.giroAtivos).toBeCloseTo(0.799, 2) // receita / ativos
    expect(dupont.alavancagem).toBeCloseTo(2.258, 2) // ativos / PL
    // ROE calculado deve bater com margem × giro × alavancagem
    expect(dupont.roeCalculado).toBeCloseTo(3.0 * dupont.giroAtivos * dupont.alavancagem, 5)
  })

  it('retorna null quando falta "ativos_totais" (campo opcional, preenchido manualmente)', () => {
    const dados = { receita: 9_590_000_000, margem_liq: 3.0, pl: 5_315_000_000, ativos_totais: null }
    expect(computeDuPont(dados)).toBeNull()
  })

  it('retorna null quando falta patrimônio líquido ou receita', () => {
    expect(computeDuPont({ receita: null, margem_liq: 3, pl: 100, ativos_totais: 200 })).toBeNull()
    expect(computeDuPont({ receita: 100, margem_liq: 3, pl: null, ativos_totais: 200 })).toBeNull()
  })
})

describe('interpretar', () => {
  it('avisa que faltam dados quando requerDados é true', () => {
    expect(interpretar({ requerDados: true })).toMatch(/preço da ação/)
  })

  it('avisa quando não há benchmark cadastrado', () => {
    expect(interpretar({ requerDados: false, benchmark: null })).toMatch(/Sem benchmark/)
  })

  it('retorna mensagem correspondente para cada classe', () => {
    expect(interpretar({ benchmark: BENCH_ROE, classe: 'ok' })).toMatch(/saudável/)
    expect(interpretar({ benchmark: BENCH_ROE, classe: 'warn' })).toMatch(/atenção/)
    expect(interpretar({ benchmark: BENCH_ROE, classe: 'danger' })).toMatch(/investigue/)
  })
})
