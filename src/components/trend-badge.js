export function trendBadge(tendencia) {
  if (tendencia !== 'melhora' && tendencia !== 'piora') return ''
  const seta = tendencia === 'melhora' ? '▲' : '▼'
  const titulo = tendencia === 'melhora' ? 'Melhorou vs. período anterior' : 'Piorou vs. período anterior'
  return `<span class="trend trend-${tendencia}" title="${titulo}">${seta}</span>`
}
