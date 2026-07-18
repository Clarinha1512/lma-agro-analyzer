import { pageHeader, emptyState } from '../components/page-header.js'

export function render(container) {
  container.innerHTML = `
    ${pageHeader('Evolução Temporal', 'Acompanhe a trajetória dos indicadores de uma empresa ao longo dos períodos.')}

    ${emptyState('Conecte o Supabase para ver os gráficos de evolução histórica.')}`
}
