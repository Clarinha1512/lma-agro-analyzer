import { pageHeader } from '../components/page-header.js'
import { isSupabaseConfigured } from '../lib/supabase.js'

export function render(container) {
  container.innerHTML = `
    ${pageHeader('Configurações', 'Status da conexão e preferências do sistema.')}

    <section class="card">
      <h2>Conexão com o Supabase</h2>
      <div class="status-row">
        <span class="status-dot ${isSupabaseConfigured ? 'ok' : 'pending'}"></span>
        <span>${isSupabaseConfigured ? 'Variáveis de ambiente detectadas' : 'Aguardando configuração do arquivo .env'}</span>
      </div>
      <p class="muted">Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env para conectar ao banco.</p>
    </section>`
}
