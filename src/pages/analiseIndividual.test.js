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
  salvarAnaliseMock.mockResolvedValue({ id: 1 })
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

// Respostas com folga acima do mínimo de 300 caracteres somados.
const RESPOSTAS_TESE = {
  saude:
    'A SLC Agrícola vem de um ano difícil: a receita cresceu, mas a margem líquida despencou e a alavancagem subiu bastante em 2024.',
  compraria:
    'Não compraria hoje. Prefiro esperar sinais concretos de recuperação de margem antes de entrar nessa posição.',
  preocupacao:
    'O que mais me preocupa é a dívida líquida crescendo mais rápido que o EBITDA, num ciclo ruim de preços de commodities.',
}

function preencherTese(container, respostas = RESPOSTAS_TESE) {
  Object.entries(respostas).forEach(([key, texto]) => {
    const textarea = container.querySelector(`#tese-${key}`)
    textarea.value = texto
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

/** Articula veredito + tese e gera o relatório (o clique agora grava no Supabase antes de revelar). */
async function gerarRelatorio(container, veredito) {
  selecionarVeredito(container, veredito)
  preencherTese(container)
  container.querySelector('#revelar-btn').click()
  await vi.waitFor(() => {
    expect(container.querySelector('#gauge-container')).not.toBeNull()
  })
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

    expect(container.textContent).toMatch(/Antes de ver o que o sistema calculou/)
    expect(container.querySelector('#gauge-container')).toBeNull()
    expect(container.querySelector('#revelar-btn').disabled).toBe(true)
  })

  it('mantém o relatório bloqueado enquanto a tese não atingir o mínimo de caracteres', async () => {
    const container = await renderComPreselecao()

    selecionarVeredito(container, 'COMPRA')
    expect(container.querySelector('#revelar-btn').disabled).toBe(true)

    preencherTese(container, { saude: 'Curta.', compraria: 'Não.', preocupacao: 'Dívida.' })
    expect(container.querySelector('#revelar-btn').disabled).toBe(true)
    expect(container.querySelector('#tese-contador').textContent).toMatch(/17 \/ 300 caracteres/)
  })

  it('exige resposta nas três perguntas, não só o total de caracteres', async () => {
    const container = await renderComPreselecao()
    selecionarVeredito(container, 'COMPRA')

    // Só duas respondidas, mas já passando de 300 caracteres somados
    preencherTese(container, {
      saude: RESPOSTAS_TESE.saude + RESPOSTAS_TESE.preocupacao,
      compraria: RESPOSTAS_TESE.compraria,
      preocupacao: '',
    })

    expect(container.querySelector('#tese-contador').textContent).toMatch(/\d{3,} \/ 300/)
    expect(container.querySelector('#revelar-btn').disabled).toBe(true)
  })

  it('libera o relatório só com veredito escolhido E tese completa', async () => {
    const container = await renderComPreselecao()

    preencherTese(container)
    expect(container.querySelector('#revelar-btn').disabled).toBe(true) // falta o veredito

    selecionarVeredito(container, 'COMPRA')
    expect(container.querySelector('#revelar-btn').disabled).toBe(false)
    expect(container.querySelector('#tese-contador').classList.contains('tese-ok')).toBe(true)
  })

  it('grava a tese no Supabase no momento em que o relatório é gerado, antes de mostrar os números', async () => {
    const container = await renderComPreselecao()

    await gerarRelatorio(container, 'COMPRA')

    expect(salvarAnaliseMock).toHaveBeenCalledTimes(1)
    const salvo = salvarAnaliseMock.mock.calls[0][0]
    // As três respostas viram um texto único, com os títulos das perguntas
    expect(salvo.notas_membro).toBe(
      `Saúde financeira: ${RESPOSTAS_TESE.saude}\n\n` +
        `Decisão de compra: ${RESPOSTAS_TESE.compraria}\n\n` +
        `Principal preocupação: ${RESPOSTAS_TESE.preocupacao}`
    )
    expect(salvo.veredito_membro).toBe('COMPRA')
    expect(salvo.membro_id).toBe('user-1')
    expect(salvo.tese_registrada_em).toBeTruthy()
    // O veredito do sistema é o apurado no instante do registro (1/6 → VENDA)
    expect(salvo.veredito_sistema).toBe('VENDA')
    expect(salvo.score_sistema).toBe(1)
  })

  it('não revela o relatório se a gravação da tese falhar', async () => {
    salvarAnaliseMock.mockRejectedValue(new Error('sem conexão'))
    const container = await renderComPreselecao()

    selecionarVeredito(container, 'COMPRA')
    preencherTese(container)
    container.querySelector('#revelar-btn').click()

    await vi.waitFor(() => {
      expect(container.querySelector('#revelar-status').textContent).toMatch(/Erro ao registrar a tese/)
    })
    expect(container.querySelector('#gauge-container')).toBeNull()
    expect(container.querySelector('#revelar-btn').disabled).toBe(false)
  })

  it('mostra a tese registrada lado a lado com a leitura escrita do sistema', async () => {
    const container = await renderComPreselecao()

    await gerarRelatorio(container, 'COMPRA')

    const comparacao = container.querySelector('.comparacao-tese')
    expect(comparacao.textContent).toMatch(/O que você concluiu/)
    expect(comparacao.textContent).toMatch(/O que os dados mostram/)

    // As três respostas aparecem separadas, com o título de cada pergunta
    const respostas = [...comparacao.querySelectorAll('.tese-registrada')]
    expect(respostas).toHaveLength(3)
    expect(respostas[0].textContent).toMatch(/Saúde financeira:.*ano difícil/)
    expect(respostas[2].textContent).toMatch(/Principal preocupação:.*dívida líquida/)

    // Leitura do sistema montada a partir dos números reais do período
    expect(comparacao.textContent).toMatch(/Somando 1 de 6 pontos/)
    expect(comparacao.textContent).toMatch(/Fora da faixa saudável do subsetor: ROE, Margem líquida/)
    expect(comparacao.textContent).toMatch(/Pioraram frente ao período anterior/)
  })

  it('revela o veredito do sistema e sinaliza divergência com o do membro', async () => {
    const container = await renderComPreselecao()

    await gerarRelatorio(container, 'COMPRA')

    // Score real apurado: 2024-12 vs benchmark "primario" = 1/6 → VENDA
    expect(container.textContent).toMatch(/Sistema: VENDA/)
    expect(container.textContent).toMatch(/Você: COMPRA/)
    expect(container.textContent).toMatch(/diverge do sistema/)
  })

  it('reconhece concordância quando o veredito do membro bate com o do sistema', async () => {
    const container = await renderComPreselecao()

    await gerarRelatorio(container, 'VENDA')

    expect(container.textContent).toMatch(/coincide com o do sistema/)
  })

  it('avisa que falta "ativos totais" quando o período não tem esse dado (DuPont)', async () => {
    const container = await renderComPreselecao()
    await gerarRelatorio(container, 'VENDA')

    expect(container.textContent).toMatch(/Preencha "Ativos totais" deste período em Adicionar Dados/)
  })

  it('mostra a decomposição DuPont quando o período tem "ativos totais" preenchido', async () => {
    getDadosFinanceirosMock.mockResolvedValue([
      ...PERIODOS_SLCE3.slice(0, 1),
      { ...PERIODOS_SLCE3[1], ativos_totais: 12_000_000_000 },
    ])
    const container = await renderComPreselecao()
    await gerarRelatorio(container, 'VENDA')

    expect(container.textContent).toMatch(/ROE = Margem líquida × Giro de ativos × Alavancagem/)
    // 3,0% (margem) × 0,799x (giro = 9,59bi/12bi) × 2,258x (alavancagem = 12bi/5,315bi) ≈ 5,4%
    expect(container.querySelector('.dupont-resultado').textContent).toMatch(/5,4%/)
  })

  it('mostra o CAGR de receita e lucro entre o primeiro e o último período cadastrado', async () => {
    const container = await renderComPreselecao()
    await gerarRelatorio(container, 'VENDA')

    // Receita: 7,2bi (2023) → 9,59bi (2024), 1 ano → CAGR ≈ 33,2%
    // Lucro: 850mi (2023) → 290,6mi (2024), 1 ano → CAGR ≈ -65,8%
    expect(container.textContent).toMatch(/CAGR Receita \(1[.,]0 anos\)/)
    expect(container.textContent).toMatch(/33[.,]2%/)
    expect(container.textContent).toMatch(/-65[.,]8%/)
  })

  it('calcula EV/EBITDA e EV/Receita ao vivo quando preço e nº de ações são preenchidos', async () => {
    const container = await renderComPreselecao()
    await gerarRelatorio(container, 'VENDA')

    expect(container.textContent).toMatch(/Preencha preço da ação e nº de ações/)

    const precoInput = container.querySelector('#preco-acao')
    precoInput.value = '20'
    precoInput.dispatchEvent(new Event('input', { bubbles: true }))

    const numAcoesInput = container.querySelector('#num-acoes')
    numAcoesInput.value = '500000000'
    numAcoesInput.dispatchEvent(new Event('input', { bubbles: true }))

    // EV = 20 * 500mi + 6,347bi (dívida líq.) = 16,347bi → EV/EBITDA ≈ 8,02x, EV/Receita ≈ 1,70x
    expect(container.textContent).toMatch(/8[.,]02x/)
    expect(container.textContent).toMatch(/1[.,]7x/)
  })

  it('mostra o DCF simplificado com o crescimento pré-preenchido pelo CAGR histórico', async () => {
    const container = await renderComPreselecao()
    await gerarRelatorio(container, 'VENDA')

    expect(container.textContent).toMatch(/DCF simplificado/)
    // CAGR de receita da SLCE3 (fixture) ≈ 33,2% — vira a sugestão inicial de crescimento
    expect(container.querySelector('#dcf-crescimento').value).toBe('33.2')
    // Com os defaults (WACC 12%, 5 anos, 3% na perpetuidade) já dá pra calcular
    expect(container.querySelector('#dcf-resultado').textContent).toMatch(/Valor da empresa/)
  })

  it('recalcula o DCF ao vivo quando o usuário muda as premissas', async () => {
    const container = await renderComPreselecao()
    await gerarRelatorio(container, 'VENDA')

    const waccInput = container.querySelector('#dcf-wacc')
    waccInput.value = '2'
    waccInput.dispatchEvent(new Event('input', { bubbles: true }))

    expect(container.querySelector('#dcf-resultado').textContent).toMatch(
      /WACC\) precisa ser maior que o crescimento na perpetuidade/
    )
  })

  it('mostra o preço justo do DCF e compara com o preço atual quando preenchido', async () => {
    const container = await renderComPreselecao()
    await gerarRelatorio(container, 'VENDA')

    const numAcoesInput = container.querySelector('#num-acoes')
    numAcoesInput.value = '500000000'
    numAcoesInput.dispatchEvent(new Event('input', { bubbles: true }))

    const precoInput = container.querySelector('#preco-acao')
    precoInput.value = '20'
    precoInput.dispatchEvent(new Event('input', { bubbles: true }))

    expect(container.querySelector('#dcf-resultado').textContent).toMatch(/Preço justo \(DCF\)/)
    expect(container.querySelector('#dcf-resultado').textContent).toMatch(/potencial de (alta|queda)/)
  })

  it('mostra a mediana do subsetor (peer group) ao lado de cada indicador', async () => {
    const container = await renderComPreselecao()
    await gerarRelatorio(container, 'VENDA')

    expect(container.textContent).toMatch(/Mediana calculada com 2 empresas do subsetor Produção agrícola/)

    // Mediana ROE = (6.1 da SLCE3 + 13.9 da AGRO3) / 2 = 10
    const linhaRoe = [...container.querySelectorAll('.indicator-row')].find((el) => el.textContent.includes('ROE'))
    expect(linhaRoe.querySelector('.indicator-mediana').textContent).toMatch(/Mediana do setor: 10%/)
  })

  it('mostra a seta de piora nos indicadores que caíram vs. o período anterior', async () => {
    const container = await renderComPreselecao()

    await gerarRelatorio(container, 'VENDA')

    const linhaRoe = [...container.querySelectorAll('.indicator-row')].find((el) =>
      el.textContent.includes('ROE')
    )
    expect(linhaRoe.querySelector('.trend-piora')).not.toBeNull()
  })

  it('calcula P/L e P/VP ao vivo quando preço e nº de ações são preenchidos', async () => {
    const container = await renderComPreselecao()
    await gerarRelatorio(container, 'VENDA')

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
    await gerarRelatorio(container, 'VENDA')

    container.querySelector('#exportar-btn').click()

    expect(printSpy).toHaveBeenCalledTimes(1)
  })

  it('salva a análise com o score e veredito do sistema calculados', async () => {
    const container = await renderComPreselecao()
    await gerarRelatorio(container, 'COMPRA')

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

  it('inclui o scorecard qualitativo preenchido ao gerar o relatório, e mostra o resumo depois', async () => {
    const container = await renderComPreselecao()
    selecionarVeredito(container, 'COMPRA')
    preencherTese(container)

    const governancaSelect = container.querySelector('#qual-governanca')
    governancaSelect.value = '4'
    governancaSelect.dispatchEvent(new Event('change', { bubbles: true }))

    const observacoesInput = container.querySelector('#qual-observacoes')
    observacoesInput.value = 'Boa gestão de risco climático'
    observacoesInput.dispatchEvent(new Event('input', { bubbles: true }))

    container.querySelector('#revelar-btn').click()
    await vi.waitFor(() => {
      expect(container.querySelector('#gauge-container')).not.toBeNull()
    })

    expect(container.textContent).toMatch(/Seu scorecard qualitativo/)
    expect(container.textContent).toMatch(/Governança: 4\/5/)

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
    const container = await renderComPreselecao()
    await gerarRelatorio(container, 'VENDA')

    expect(container.querySelector('.qualitativo-resumo')).toBeNull()
    expect(salvarAnaliseMock).toHaveBeenCalledWith(expect.objectContaining({ scorecard_qualitativo: null }))
  })
})
