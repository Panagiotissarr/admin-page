// Server-only Supabase client using the SERVICE ROLE key.
// Bypasses RLS so the PIN-gated admin panel can read/write every user's keys.
// Never import this into a client component — the key stays server-side.
import { createClient } from '@supabase/supabase-js'

export function createSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the Vercel environment.'
    )
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}