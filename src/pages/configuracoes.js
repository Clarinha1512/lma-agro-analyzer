import { pageHeader } from '../components/page-header.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { getBenchmarks, atualizarBenchmark } from '../lib/database.js'

const INDICADOR_LABEL = { roe: 'ROE', mg: 'Margem líquida', div: 'Dívida/EBITDA', pl: 'P/L', pvp: 'P/VP' }
const SUBSETOR_LABEL = {
  primario: 'Primário',
  insumos: 'Insumos',
  agroindustria: 'Agroindústria',
  agroservicos: 'Agrosserviços',
}
const CAMPOS_NUMERICOS = ['bom_min', 'bom_max', 'ok_min', 'ok_max']

function renderBenchmarkRow(row) {
  const label = INDICADOR_LABEL[row.indicador] || row.indicador
  return `
    <div class="benchmark-row" data-id="${row.id}">
      <div class="form-row">
        <div class="field"><label>Indicador</label><input type="text" value="${label}" disabled /></div>
        <div class="field"><label>Bom min</label><input type="number" step="0.01" class="bm-input" data-field="bom_min" value="${row.bom_min ?? ''}" /></div>
        <div class="field"><label>Bom max</label><input type="number" step="0.01" class="bm-input" data-field="bom_max" value="${row.bom_max ?? ''}" /></div>
        <div class="field"><label>Ok min</label><input type="number" step="0.01" class="bm-input" data-field="ok_min" value="${row.ok_min ?? ''}" /></div>
        <div class="field"><label>Ok max</label><input type="number" step="0.01" class="bm-input" data-field="ok_max" value="${row.ok_max ?? ''}" /></div>
        <div class="field">
          <label>Direção</label>
          <select class="bm-input" data-field="inverso">
            <option value="false" ${!row.inverso ? 'selected' : ''}>Maior é melhor</option>
            <option value="true" ${row.inverso ? 'selected' : ''}>Menor é melhor</option>
          </select>
        </div>
      </div>
      <button class="btn btn-primary benchmark-save">Salvar</button>
      <span class="benchmark-status muted"></span>
    </div>`
}

function renderBenchmarksSection(benchmarksPorSubsetor) {
  return Object.entries(benchmarksPorSubsetor)
    .map(
      ([subsetor, porIndicador]) => `
      <div class="benchmark-group">
        <h3>${SUBSETOR_LABEL[subsetor] || subsetor}</h3>
        ${Object.values(porIndicador).map(renderBenchmarkRow).join('')}
      </div>`
    )
    .join('')
}

function bindBenchmarkEvents(container) {
  container.querySelectorAll('.benchmark-row').forEach((rowEl) => {
    const id = Number(rowEl.dataset.id)
    const saveBtn = rowEl.querySelector('.benchmark-save')
    const statusEl = rowEl.querySelector('.benchmark-status')

    saveBtn.addEventListener('click', async () => {
      const campos = {}
      rowEl.querySelectorAll('.bm-input').forEach((input) => {
        const field = input.dataset.field
        if (field === 'inverso') {
          campos[field] = input.value === 'true'
        } else if (CAMPOS_NUMERICOS.includes(field)) {
          campos[field] = input.value === '' ? null : parseFloat(input.value)
        }
      })

      saveBtn.disabled = true
      saveBtn.textContent = 'Salvando…'
      statusEl.textContent = ''
      try {
        await atualizarBenchmark(id, campos)
        statusEl.textContent = 'Salvo ✓'
      } catch (error) {
        statusEl.textContent = `Erro: ${error.message}`
      }
      saveBtn.disabled = false
      saveBtn.textContent = 'Salvar'
    })
  })
}

export async function render(container) {
  container.innerHTML = `
    ${pageHeader('Configurações', 'Status da conexão e preferências do sistema.')}

    <section class="card">
      <h2>Conexão com o Supabase</h2>
      <div class="status-row">
        <span class="status-dot ${isSupabaseConfigured ? 'ok' : 'pending'}"></span>
        <span>${isSupabaseConfigured ? 'Variáveis de ambiente detectadas' : 'Aguardando configuração do arquivo .env'}</span>
      </div>
      <p class="muted">Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env para conectar ao banco.</p>
    </section>

    <section class="card">
      <h2>Benchmarks por subsetor</h2>
      <p class="muted">Limites usados para classificar cada indicador (verde/amarelo/vermelho). Alterações valem para todas as empresas do subsetor.</p>
      <div id="benchmarks-body">${isSupabaseConfigured ? '<p class="muted">Carregando…</p>' : ''}</div>
    </section>`

  if (!isSupabaseConfigured) return

  const body = container.querySelector('#benchmarks-body')
  try {
    const benchmarksPorSubsetor = await getBenchmarks()
    body.innerHTML = renderBenchmarksSection(benchmarksPorSubsetor)
    bindBenchmarkEvents(body)
  } catch (error) {
    body.innerHTML = `<p>Erro ao carregar benchmarks: ${error.message}</p>`
  }
}
