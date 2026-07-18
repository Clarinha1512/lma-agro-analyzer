export function formatMoeda(valor) {
  if (valor == null) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(valor)
}

export function formatMoedaCompacta(valor) {
  if (valor == null) return '—'
  const abs = Math.abs(valor)
  const sinal = valor < 0 ? '-' : ''
  const escala = (divisor, sufixo) =>
    `${sinal}R$ ${(abs / divisor).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ${sufixo}`

  if (abs >= 1e12) return escala(1e12, 'tri')
  if (abs >= 1e9) return escala(1e9, 'bi')
  if (abs >= 1e6) return escala(1e6, 'mi')
  if (abs >= 1e3) return escala(1e3, 'mil')
  return formatMoeda(valor)
}
