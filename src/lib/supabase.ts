import { createClient } from '@supabase/supabase-js'

// Variabel ini harus disetting di file .env.local nantinya oleh user
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Export supabase instance untuk dipakai di pages/components
export const supabase = createClient(supabaseUrl, supabaseKey)
