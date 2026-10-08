import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-admin'

function requireAuth(req: NextRequest): NextResponse | null {
  const envPassword = String(
    process.env.ADMIN_PASSWORD || process.env.admin_password || ''
  ).trim()
  const passwordHeader = req.headers.get('x-admin-password') || ''
  if (!envPassword || passwordHeader !== envPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

// GET /api/keys — list every API key with its owner's username.
export async function GET(req: NextRequest) {
  const denied = requireAuth(req)
  if (denied) return denied

  try {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, user_id, api_key, name, created_at, last_used_at, system_prompt, prompt_mode')
      .order('created_at', { ascending: false })

    if (error) throw error

    const userIds = [...new Set((data || []).map((k: any) => k.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', userIds)
    const byId = new Map((profiles || []).map((p: any) => [p.id, p]))

    const keys = (data || []).map((k: any) => {
      const owner = byId.get(k.user_id)
      return {
        ...k,
        ownerUsername: owner?.username ?? null,
        ownerDisplayName: owner?.display_name ?? null,
      }
    })

    return NextResponse.json({ keys })
  } catch (err: any) {
    console.error('GET /api/keys error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

// PATCH /api/keys — rename a key. Body: { id, name }
export async function PATCH(req: NextRequest) {
  const denied = requireAuth(req)
  if (denied) return denied

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const id = String(body?.id || '').trim()
  const name = String(body?.name || '').trim()
  if (!id) return NextResponse.json({ error: 'Missing key id' }, { status: 400 })
  if (!name) return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })

  try {
    const supabase = createSupabaseAdminClient()
    const { data, error } = await supabase
      .from('api_keys')
      .update({ name })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ key: data })
  } catch (err: any) {
    console.error('PATCH /api/keys error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to rename key' },
      { status: 500 }
    )
  }
}

// DELETE /api/keys — revoke a key. Body: { id }
export async function DELETE(req: NextRequest) {
  const denied = requireAuth(req)
  if (denied) return denied

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const id = String(body?.id || '').trim()
  if (!id) return NextResponse.json({ error: 'Missing key id' }, { status: 400 })

  try {
    const supabase = createSupabaseAdminClient()
    const { error } = await supabase.from('api_keys').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true, id })
  } catch (err: any) {
    console.error('DELETE /api/keys error:', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to revoke key' },
      { status: 500 }
    )
  }
}