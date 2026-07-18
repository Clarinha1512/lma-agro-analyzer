const routes = new Map()

export function registerRoute(path, render) {
  routes.set(path, render)
}

export function getCurrentPath() {
  const hash = window.location.hash.replace(/^#/, '')
  const [path] = hash.split('?')
  return path || '/dashboard'
}

export function getCurrentQuery() {
  const hash = window.location.hash.replace(/^#/, '')
  const [, query] = hash.split('?')
  return new URLSearchParams(query || '')
}

export function navigateTo(path, params) {
  const query = params ? `?${new URLSearchParams(params).toString()}` : ''
  window.location.hash = `${path}${query}`
}

export function startRouter(outlet, onNavigate) {
  const resolve = () => {
    const path = getCurrentPath()
    const query = getCurrentQuery()
    const render = routes.get(path) || routes.get('/dashboard')
    outlet.innerHTML = ''
    render(outlet, query)
    onNavigate?.(path)
  }

  window.addEventListener('hashchange', resolve)
  resolve()
}
