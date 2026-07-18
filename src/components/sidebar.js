export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'grid' },
  { path: '/analise', label: 'Análise Individual', icon: 'search' },
  { path: '/comparar', label: 'Comparar', icon: 'columns' },
  { path: '/ranking', label: 'Ranking', icon: 'trophy' },
  { path: '/evolucao', label: 'Evolução Temporal', icon: 'trending' },
  { path: '/historico', label: 'Histórico', icon: 'clock' },
  { path: '/adicionar-dados', label: 'Adicionar Dados', icon: 'upload' },
  { path: '/configuracoes', label: 'Configurações', icon: 'settings' },
]

const ICONS = {
  grid: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
  search:
    '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.35-4.35"/>',
  columns: '<path d="M4 4h7v16H4zM13 4h7v16h-7z"/>',
  trophy:
    '<path d="M8 4h8v4a4 4 0 0 1-8 0V4z"/><path d="M8 5H5a2 2 0 0 0 2 4M16 5h3a2 2 0 0 1-2 4"/><path d="M10 14h4v3h-4z"/><path d="M8 20h8"/>',
  trending: '<path d="M4 16l5-5 4 4 7-8"/><path d="M15 7h6v6"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  upload:
    '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
}

function icon(name) {
  return `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`
}

export function renderSidebar(activePath) {
  const items = NAV_ITEMS.map(
    (item) => `
      <a href="#${item.path}" class="nav-item${item.path === activePath ? ' active' : ''}">
        ${icon(item.icon)}
        <span>${item.label}</span>
      </a>`
  ).join('')

  return `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">LMA</div>
        <div class="brand-text">
          <strong>Agro Analyzer</strong>
          <span>Liga de Mercado de Ações</span>
        </div>
      </div>
      <nav class="nav">${items}</nav>
      <div class="sidebar-footer">
        <span>v0.1.0</span>
      </div>
    </aside>`
}

export function bindSidebarActiveState(root, activePath) {
  root.querySelectorAll('.nav-item').forEach((el) => {
    el.classList.toggle('active', el.getAttribute('href') === `#${activePath}`)
  })
}
