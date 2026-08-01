import { pageHeader } from '../components/page-header.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import { getBenchmarks, atualizarBenchmark } from '../lib/database.js'
import { getSession, getProfile, updateProfile, listarProfiles } from '../lib/auth.js'
import { NIVEIS, NIVEL_LABEL } from '../lib/perfil.js'

const INDICADOR_LABEL = { roe: 'ROE', mg: 'Margem líquida', div: 'Dívida/EBITDA', pl: 'P/L', pvp: 'P/VP' }
const SUBSETOR_LABEL = {
  primario: 'Primário',
  insumos: 'Insumos',
  agroindustria: 'Agroindústria',
  agroservicos: 'Agrosserviços',
}
const CAMPOS_NUMERICOS = ['bom_min', 'bom_max', 'ok_min', 'ok_max']

function formatarData(data) {
  if (!data) return '—'
  return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR')
}

function renderPerfilSection(perfil) {
  return `
    <div class="form-row">
      <div class="field">
        <label for="perfil-nome">Nome completo</label>
        <input id="perfil-nome" type="text" value="${perfil.nome}" />
      </div>
    </div>
    <p class="muted">Nível: <strong>${NIVEL_LABEL[perfil.nivel] || perfil.nivel}</strong> · Entrou em ${formatarData(perfil.entrou_em)}. Promoção de nível é feita pela diretoria.</p>
    <button id="salvar-perfil-btn" class="btn btn-primary">Salvar perfil</button>
    <span id="perfil-status" class="muted"></span>`
}

function bindPerfilEvents(container, userId) {
  container.querySelector('#salvar-perfil-btn').addEventListener('click', async (e) => {
    const btn = e.target
    const statusEl = container.querySelector('#perfil-status')
    const nome = container.querySelector('#perfil-nome').value.trim()

    if (!nome) {
      statusEl.textContent = 'Preencha seu nome.'
      return
    }

    btn.disabled = true
    btn.textContent = 'Salvando…'
    statusEl.textContent = ''
    try {
      await updateProfile(userId, { nome })
      statusEl.textContent = 'Salvo ✓'
    } catch (error) {
      statusEl.textContent = `Erro: ${error.message}`
    }
    btn.disabled = false
    btn.textContent = 'Salvar perfil'
  })
}

function renderMembroRow(perfil) {
  return `
    <div class="benchmark-row" data-id="${perfil.id}">
      <div class="form-row">
        <div class="field"><label>Nome</label><input type="text" value="${perfil.nome}" disabled /></div>
        <div class="field"><label>E-mail</label><input type="text" value="${perfil.email || '—'}" disabled /></div>
        <div class="field">
          <label>Nível</label>
          <select class="membro-nivel">
            ${NIVEIS.map((n) => `<option value="${n}" ${perfil.nivel === n ? 'selected' : ''}>${NIVEL_LABEL[n]}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="membro-ativo-${perfil.id}">Ativo</label>
          <input id="membro-ativo-${perfil.id}" type="checkbox" class="membro-ativo" ${perfil.ativo ? 'checked' : ''} />
        </div>
      </div>
      <button class="btn btn-primary membro-save">Salvar</button>
      <span class="membro-status muted"></span>
    </div>`
}

function renderGerenciarMembrosSection(perfis) {
  return perfis.map(renderMembroRow).join('')
}

function bindGerenciarMembrosEvents(container, onSalvo) {
  container.querySelectorAll('.benchmark-row').forEach((rowEl) => {
    const userId = rowEl.dataset.id
    const saveBtn = rowEl.querySelector('.membro-save')
    const statusEl = rowEl.querySelector('.membro-status')

    saveBtn.addEventListener('click', async () => {
      const nivel = rowEl.querySelector('.membro-nivel').value
      const ativo = rowEl.querySelector('.membro-ativo').checked

      saveBtn.disabled = true
      saveBtn.textContent = 'Salvando…'
      statusEl.textContent = ''
      try {
        await updateProfile(userId, { nivel, ativo })
        statusEl.textContent = 'Salvo ✓'
        onSalvo?.()
      } catch (error) {
        statusEl.textContent = `Erro: ${error.message}`
      }
      saveBtn.disabled = false
      saveBtn.textContent = 'Salvar'
    })
  })
}

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

async function carregarGerenciarMembros(container) {
  const card = container.querySelector('#gerenciar-membros-card')
  const body = container.querySelector('#gerenciar-membros-body')
  card.style.display = ''
  body.innerHTML = '<p class="muted">Carregando…</p>'
  try {
    const perfis = await listarProfiles()
    body.innerHTML = renderGerenciarMembrosSection(perfis)
    bindGerenciarMembrosEvents(body, () => carregarGerenciarMembros(container))
  } catch (error) {
    body.innerHTML = `<p>Erro ao carregar membros: ${error.message}</p>`
  }
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
      <h2>Meu perfil</h2>
      <div id="perfil-body">${isSupabaseConfigured ? '<p class="muted">Carregando…</p>' : ''}</div>
    </section>

    <section class="card" id="gerenciar-membros-card" style="display:none">
      <h2>Gerenciar membros</h2>
      <p class="muted">Só quem é Diretor pode alterar o nível ou desativar um membro.</p>
      <div id="gerenciar-membros-body"></div>
    </section>

    <section class="card">
      <h2>Benchmarks por subsetor</h2>
      <p class="muted">Limites usados para classificar cada indicador (verde/amarelo/vermelho). Alterações valem para todas as empresas do subsetor.</p>
      <div id="benchmarks-body">${isSupabaseConfigured ? '<p class="muted">Carregando…</p>' : ''}</div>
    </section>`

  if (!isSupabaseConfigured) return

  const perfilBody = container.querySelector('#perfil-body')
  try {
    const session = await getSession()
    if (session?.user) {
      const perfil = await getProfile(session.user.id)
      perfilBody.innerHTML = renderPerfilSection(perfil)
      bindPerfilEvents(perfilBody, session.user.id)

      if (perfil.nivel === 'diretor') {
        await carregarGerenciarMembros(container)
      }
    } else {
      perfilBody.innerHTML = '<p class="muted">Nenhuma sessão ativa.</p>'
    }
  } catch (error) {
    perfilBody.innerHTML = `<p>Erro ao carregar perfil: ${error.message}</p>`
  }

  const body = container.querySelector('#benchmarks-body')
  try {
    const benchmarksPorSubsetor = await getBenchmarks()
    body.innerHTML = renderBenchmarksSection(benchmarksPorSubsetor)
    bindBenchmarkEvents(body)
  } catch (error) {
    body.innerHTML = `<p>Erro ao carregar benchmarks: ${error.message}</p>`
  }
}
