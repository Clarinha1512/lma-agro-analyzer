export function companyPicker(id, placeholder) {
  return `
    <div class="company-picker" data-picker="${id}">
      <input type="text" class="picker-input" placeholder="${placeholder}" autocomplete="off" />
      <div class="picker-dropdown hidden"></div>
    </div>`
}

export function bindCompanyPicker(root, id, empresas, onSelect) {
  const wrapper = root.querySelector(`[data-picker="${id}"]`)
  const input = wrapper.querySelector('.picker-input')
  const dropdown = wrapper.querySelector('.picker-dropdown')

  function showResults(query) {
    const q = query.trim().toLowerCase()
    const results = (
      q
        ? empresas.filter(
            (e) => e.ticker.toLowerCase().includes(q) || e.nome.toLowerCase().includes(q)
          )
        : empresas
    ).slice(0, 8)

    dropdown.innerHTML = results.length
      ? results
          .map(
            (e) => `
        <button type="button" class="picker-option" data-ticker="${e.ticker}">
          <strong>${e.ticker}</strong>
          <span class="muted">${e.nome}</span>
        </button>`
          )
          .join('')
      : `<div class="picker-empty muted">Nenhuma empresa encontrada</div>`

    dropdown.classList.remove('hidden')
  }

  input.addEventListener('focus', () => showResults(input.value))
  input.addEventListener('input', () => showResults(input.value))
  input.addEventListener('blur', () => {
    setTimeout(() => dropdown.classList.add('hidden'), 150)
  })

  dropdown.addEventListener('mousedown', (event) => {
    const option = event.target.closest('.picker-option')
    if (!option) return
    const empresa = empresas.find((e) => e.ticker === option.dataset.ticker)
    if (!empresa) return
    input.value = `${empresa.ticker} — ${empresa.nome}`
    dropdown.classList.add('hidden')
    onSelect(empresa)
  })

  return { setValue: (text) => { input.value = text } }
}
