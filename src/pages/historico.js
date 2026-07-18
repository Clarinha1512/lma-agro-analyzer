import { pageHeader, emptyState } from '../components/page-header.js'

export function render(container) {
  container.innerHTML = `
    ${pageHeader('Histórico', 'Análises registradas pelos membros da liga.')}

    ${emptyState('Conecte o Supabase para listar as análises salvas pela equipe.')}`
}
