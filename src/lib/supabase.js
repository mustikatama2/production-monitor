import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
export const isSupabaseReady = !!(url && key && url.startsWith('http'))
export const supabase = isSupabaseReady ? createClient(url, key) : null
