import { supabase } from './supabase.js'

function client() {
  if (!supabase) {
    throw new Error('Supabase não configurado. Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.')
  }
  return supabase
}

export async function signUp(email, senha, nome) {
  const { data, error } = await client().auth.signUp({
    email,
    password: senha,
    options: { data: { nome } },
  })
  if (error) throw error
  return data
}

export async function signIn(email, senha) {
  const { data, error } = await client().auth.signInWithPassword({ email, password: senha })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await client().auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data, error } = await client().auth.getSession()
  if (error) throw error
  return data.session
}

export async function getProfile(userId) {
  const { data, error } = await client().from('profiles').select('*').eq('id', userId).single()
  if (error) throw error
  return data
}

/**
 * Garante que existe uma linha em `profiles` para o usuário logado (idempotente).
 * Necessário porque, se a confirmação de e-mail estiver ativada no Supabase,
 * o signUp() não gera uma sessão ativa na hora — o perfil só pode ser criado
 * quando existe uma sessão de verdade (aqui, ou no primeiro login).
 */
export async function garantirProfile(user) {
  if (!user) return null
  const { data: existente, error: erroConsulta } = await client()
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()
  if (erroConsulta) throw erroConsulta
  if (existente) return existente

  const nome = user.user_metadata?.nome || user.email
  const { data, error } = await client().from('profiles').insert({ id: user.id, nome }).select().single()
  if (error) throw error
  return data
}

export function onAuthStateChange(callback) {
  return client().auth.onAuthStateChange((_event, session) => callback(session))
}
