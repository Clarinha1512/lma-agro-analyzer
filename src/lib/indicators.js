export const CLASSE_LABEL = { ok: 'Bom', warn: 'Atenção', danger: 'Ruim' }
export const CLASSE_POINTS = { ok: 2, warn: 1, danger: 0 }

export function classify(value, benchmark) {
  if (value == null || Number.isNaN(value) || !benchmark) return null
  const { bom_min, bom_max, ok_min, ok_max, inverso } = benchmark

  // "inverso" = menor é melhor (ex.: dívida/EBITDA, P/L, P/VP). Só o limite superior
  // importa: um valor bem abaixo do teto (inclusive negativo, ex. caixa líquido) é "Bom".
  if (inverso) {
    if (bom_max != null && value <= bom_max) return 'ok'
    if (ok_max != null && value <= ok_max) return 'warn'
    return 'danger'
  }

  if (bom_min != null && value >= bom_min) return 'ok'
  if (ok_min != null && value >= ok_min) return 'warn'
  return 'danger'
}

export function formatFaixa(benchmark, unidade) {
  if (!benchmark) return 'Sem benchmark cadastrado'
  const { bom_min, bom_max, ok_min, ok_max, inverso } = benchmark
  const fmt = (n) => `${n}${unidade}`
  return inverso
    ? `Bom: ≤ ${fmt(bom_max)} · Ok: ≤ ${fmt(ok_max)}`
    : `Bom: ≥ ${fmt(bom_min)} · Ok: ≥ ${fmt(ok_min)}`
}

export function interpretar(row) {
  if (row.requerDados) return 'Informe o preço da ação e o número de ações em circulação para calcular.'
  if (!row.benchmark) return 'Sem benchmark cadastrado para este indicador no subsetor da empresa.'
  if (row.classe === 'ok') return 'Dentro da faixa considerada saudável para o subsetor.'
  if (row.classe === 'warn') return 'Em zona de atenção — vale acompanhar a evolução.'
  return 'Fora da faixa saudável para o subsetor — investigue a causa.'
}

/**
 * Monta a lista de indicadores fundamentalistas de um período.
 * P/L e P/VP dependem de preço da ação e nº de ações (não vêm do banco).
 */
export function buildIndicators(dados, benchmarksSubsetor, { preco, numAcoes } = {}) {
  const benchmarks = benchmarksSubsetor || {}
  const lpa = preco != null && numAcoes ? dados.lucro / numAcoes : null
  const vpa = preco != null && numAcoes ? dados.pl / numAcoes : null
  const precoLucro = preco != null && lpa ? preco / lpa : null
  const precoVp = preco != null && vpa ? preco / vpa : null

  const base = [
    { key: 'roe', label: 'ROE', unidade: '%', valor: dados.roe },
    { key: 'mg', label: 'Margem líquida', unidade: '%', valor: dados.margem_liq },
    { key: 'div', label: 'Dívida/EBITDA', unidade: 'x', valor: dados.div_ebitda },
    { key: 'pl', label: 'P/L', unidade: 'x', valor: precoLucro, requerDados: precoLucro == null },
    { key: 'pvp', label: 'P/VP', unidade: 'x', valor: precoVp, requerDados: precoVp == null },
  ]

  return base.map((row) => {
    const benchmark = benchmarks[row.key]
    const classe = row.requerDados ? null : classify(row.valor, benchmark)
    return { ...row, benchmark, classe }
  })
}

export function computeScore(indicadores) {
  const validos = indicadores.filter((row) => row.classe)
  const score = validos.reduce((soma, row) => soma + CLASSE_POINTS[row.classe], 0)
  const max = validos.length * 2
  return { score, max }
}

export function veredictoAutomatico(score, max) {
  if (max === 0) return 'INDEFINIDO'
  const pct = score / max
  if (pct >= 0.7) return 'COMPRA'
  if (pct >= 0.4) return 'MANUTENÇÃO'
  return 'VENDA'
}

export function healthScore(row) {
  if (row.classe === 'ok') return 100
  if (row.classe === 'warn') return 60
  if (row.classe === 'danger') return 20
  return 0
}

/** Indica qual dos dois valores é melhor para o indicador, respeitando a direção (inverso = menor é melhor). */
export function melhorPorValor(valorA, valorB, inverso) {
  if (valorA == null && valorB == null) return null
  if (valorA == null) return 'B'
  if (valorB == null) return 'A'
  if (valorA === valorB) return null
  if (inverso) return valorA < valorB ? 'A' : 'B'
  return valorA > valorB ? 'A' : 'B'
}

/**
 * Classifica a tendência de um indicador entre dois períodos, respeitando a direção
 * (inverso = menor é melhor). Usado para os alertas de piora.
 */
export function classificarTendencia(valorAtual, valorAnterior, inverso) {
  if (valorAtual == null || valorAnterior == null) return null
  if (valorAtual === valorAnterior) return 'estavel'
  const melhorou = inverso ? valorAtual < valorAnterior : valorAtual > valorAnterior
  return melhorou ? 'melhora' : 'piora'
}

/**
 * Compara os indicadores de dois períodos consecutivos (mesma empresa) e retorna,
 * para cada indicador com valor nos dois períodos, a tendência e a variação.
 */
export function compararPeriodos(indicadoresAtuais, indicadoresAnteriores) {
  const porChaveAnterior = Object.fromEntries(indicadoresAnteriores.map((r) => [r.key, r]))
  return indicadoresAtuais.map((atual) => {
    const anterior = porChaveAnterior[atual.key]
    const inverso = atual.benchmark?.inverso ?? anterior?.benchmark?.inverso ?? false
    const tendencia = classificarTendencia(atual.valor, anterior?.valor, inverso)
    return { ...atual, tendencia, valorAnterior: anterior?.valor ?? null }
  })
}

function mediana(valores) {
  const validos = valores.filter((v) => v != null && !Number.isNaN(v)).sort((a, b) => a - b)
  if (!validos.length) return null
  const meio = Math.floor(validos.length / 2)
  return validos.length % 2 ? validos[meio] : (validos[meio - 1] + validos[meio]) / 2
}

/**
 * Mediana do peer group (empresas do mesmo subsetor) para os indicadores que não
 * dependem de cotação — ROE, margem líquida e dívida/EBITDA vêm prontos do banco;
 * P/L e P/VP dependem de preço/nº de ações de cada peer, que o app não tem.
 */
export function computeMedianasSubsetor(dadosPeers) {
  return {
    roe: mediana(dadosPeers.map((d) => d.roe)),
    mg: mediana(dadosPeers.map((d) => d.margem_liq)),
    div: mediana(dadosPeers.map((d) => d.div_ebitda)),
  }
}

/**
 * Decomposição DuPont: ROE = Margem líquida × Giro de ativos × Alavancagem.
 * Exige `ativos_totais`, preenchido manualmente em Adicionar Dados — sem ele,
 * não dá pra separar giro de alavancagem, então retorna null.
 */
export function computeDuPont(dados) {
  const { receita, margem_liq, pl, ativos_totais } = dados
  if (!ativos_totais || !pl || !receita || margem_liq == null) return null

  const giroAtivos = receita / ativos_totais
  const alavancagem = ativos_totais / pl
  const roeCalculado = margem_liq * giroAtivos * alavancagem

  return { margemLiquida: margem_liq, giroAtivos, alavancagem, roeCalculado }
}

function anosEntrePeriodos(periodoInicial, periodoFinal) {
  const [anoIni, mesIni] = periodoInicial.split('-').map(Number)
  const [anoFim, mesFim] = periodoFinal.split('-').map(Number)
  return (anoFim * 12 + mesFim - (anoIni * 12 + mesIni)) / 12
}

function cagrEntre(valorInicial, valorFinal, anos) {
  if (valorInicial == null || valorFinal == null || valorInicial <= 0 || valorFinal <= 0) return null
  return (Math.pow(valorFinal / valorInicial, 1 / anos) - 1) * 100
}

/**
 * CAGR (taxa de crescimento anual composta) de receita e lucro entre o primeiro
 * e o último período cadastrado. Não é definido quando falta pelo menos ~1 ano
 * de intervalo, ou quando algum dos extremos é zero/negativo (prejuízo).
 */
export function computeCagr(periodos) {
  if (!periodos || periodos.length < 2) return null
  const ordenados = [...periodos].sort((a, b) => a.periodo.localeCompare(b.periodo))
  const primeiro = ordenados[0]
  const ultimo = ordenados[ordenados.length - 1]

  const anos = anosEntrePeriodos(primeiro.periodo, ultimo.periodo)
  if (!anos || anos < 0.5) return null

  return {
    anos,
    receita: cagrEntre(primeiro.receita, ultimo.receita, anos),
    lucro: cagrEntre(primeiro.lucro, ultimo.lucro, anos),
  }
}

/**
 * Múltiplos baseados em Enterprise Value (valor de mercado + dívida líquida) —
 * ao contrário do P/L, considera a alavancagem, o que importa bastante no agro.
 * Exige preço da ação e nº de ações, como P/L e P/VP.
 */
export function computeEvMultiplos(dados, { preco, numAcoes } = {}) {
  if (preco == null || !numAcoes) return null
  const valorMercado = preco * numAcoes
  const ev = valorMercado + (dados.divida_liq ?? 0)
  return {
    ev,
    evEbitda: dados.ebitda ? ev / dados.ebitda : null,
    evReceita: dados.receita ? ev / dados.receita : null,
  }
}

/**
 * DCF simplificado e didático: projeta o EBITDA do período (proxy de fluxo de
 * caixa, já que o app não tem capex/impostos detalhados) por N anos a uma taxa
 * de crescimento informada, traz a valor presente pela taxa de desconto (WACC),
 * soma um valor terminal (perpetuidade de Gordon) e subtrai a dívida líquida
 * pra chegar num valor de patrimônio e, se houver nº de ações, um preço "justo".
 *
 * Não é um DCF profissional — é uma aproximação pedagógica, sensível às
 * premissas informadas pelo usuário.
 */
export function computeDcfSimplificado(dados, { crescimentoAnual, wacc, anos, crescimentoTerminal, numAcoes } = {}) {
  if (
    dados.ebitda == null ||
    crescimentoAnual == null ||
    wacc == null ||
    !anos ||
    anos <= 0 ||
    crescimentoTerminal == null
  ) {
    return null
  }

  const w = wacc / 100
  const gt = crescimentoTerminal / 100
  if (w <= gt) return { erro: 'wacc_deve_ser_maior_que_crescimento_terminal' }

  const g = crescimentoAnual / 100
  let fluxo = dados.ebitda
  let valorPresenteFluxos = 0
  for (let ano = 1; ano <= anos; ano++) {
    fluxo *= 1 + g
    valorPresenteFluxos += fluxo / Math.pow(1 + w, ano)
  }

  const valorTerminal = (fluxo * (1 + gt)) / (w - gt)
  const valorPresenteTerminal = valorTerminal / Math.pow(1 + w, anos)
  const valorEmpresa = valorPresenteFluxos + valorPresenteTerminal
  const valorPatrimonio = valorEmpresa - (dados.divida_liq ?? 0)
  const precoJusto = numAcoes ? valorPatrimonio / numAcoes : null

  return { valorEmpresa, valorPatrimonio, precoJusto }
}

/** Anexa a mediana do subsetor a cada indicador e se o valor da empresa é favorável frente a ela. */
export function comMedianaSubsetor(indicadores, medianas) {
  return indicadores.map((row) => {
    const medianaSubsetor = medianas?.[row.key] ?? null
    if (medianaSubsetor == null || row.valor == null) return { ...row, medianaSubsetor }
    const inverso = row.benchmark?.inverso ?? false
    const melhor = melhorPorValor(row.valor, medianaSubsetor, inverso)
    return { ...row, medianaSubsetor, favoravel: melhor === 'A' ? true : melhor === 'B' ? false : null }
  })
}
