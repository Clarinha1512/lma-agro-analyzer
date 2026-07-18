import { supabase } from './supabase.js'

function client() {
  if (!supabase) {
    throw new Error('Supabase não configurado. Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.')
  }
  return supabase
}

export async function listarEmpresas() {
  const { data, error } = await client()
    .from('empresas')
    .select('*')
    .order('ticker', { ascending: true })
  if (error) throw error
  return data
}

export async function getEmpresa(ticker) {
  const { data, error } = await client()
    .from('empresas')
    .select('*')
    .eq('ticker', ticker)
    .single()
  if (error) throw error
  return data
}

export async function getDadosFinanceiros(ticker) {
  const { data, error } = await client()
    .from('dados_financeiros')
    .select('*')
    .eq('ticker', ticker)
    .order('periodo', { ascending: true })
  if (error) throw error
  return data
}

export async function getDadosPeriodo(ticker, periodo) {
  const { data, error } = await client()
    .from('dados_financeiros')
    .select('*')
    .eq('ticker', ticker)
    .eq('periodo', periodo)
    .single()
  if (error) throw error
  return data
}

export async function listarUltimosDados() {
  const { data, error } = await client()
    .from('dados_financeiros')
    .select('*')
    .order('periodo', { ascending: false })
  if (error) throw error

  const porTicker = new Map()
  for (const row of data) {
    if (!porTicker.has(row.ticker)) porTicker.set(row.ticker, row)
  }
  return porTicker
}

export async function getBenchmarks() {
  const { data, error } = await client().from('benchmarks').select('*')
  if (error) throw error

  const organizado = {}
  for (const row of data) {
    organizado[row.subsetor] ??= {}
    organizado[row.subsetor][row.indicador] = row
  }
  return organizado
}

export async function salvarAnalise(analise) {
  const { data, error } = await client()
    .from('analises')
    .insert(analise)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listarAnalises() {
  const { data, error } = await client()
    .from('analises')
    .select('*')
    .order('id', { ascending: false })
  if (error) throw error
  return data
}

export async function inserirDadosFinanceiros(dados) {
  const { data, error } = await client()
    .from('dados_financeiros')
    .insert(dados)
    .select()
    .single()
  if (error) throw error
  return data
}
