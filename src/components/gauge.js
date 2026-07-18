const VEREDICTO_COR = {
  COMPRA: 'var(--color-ok)',
  'MANUTENÇÃO': 'var(--color-warn)',
  VENDA: 'var(--color-danger)',
  INDEFINIDO: 'var(--color-text-muted)',
}

export function gaugeSvg({ score, max, veredicto }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, score / max)) : 0
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const dash = circumference * pct
  const cor = VEREDICTO_COR[veredicto] || VEREDICTO_COR.INDEFINIDO

  return `
    <svg viewBox="0 0 130 130" class="gauge-svg">
      <circle cx="65" cy="65" r="${radius}" class="gauge-track" />
      <circle
        cx="65" cy="65" r="${radius}"
        class="gauge-fill"
        style="stroke:${cor}; stroke-dasharray:${dash} ${circumference};"
        transform="rotate(-90 65 65)"
      />
      <text x="65" y="60" text-anchor="middle" class="gauge-score">${score}</text>
      <text x="65" y="78" text-anchor="middle" class="gauge-max">de ${max}</text>
    </svg>`
}
