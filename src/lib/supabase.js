import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Verificar conexión
export const checkConnection = async () => {
  try {
    const { data, error } = await supabase.from('organizaciones').select('count')
    if (error) throw error

    return true
  } catch (error) {
    console.error('Nixon, error de conexión:', error.message)
    return false
  }
}