export function pageHeader(title, subtitle) {
  return `
    <header class="page-header">
      <h1>${title}</h1>
      ${subtitle ? `<p>${subtitle}</p>` : ''}
    </header>`
}

export function emptyState(message) {
  return `
    <div class="card empty-state">
      <p>${message}</p>
    </div>`
}
