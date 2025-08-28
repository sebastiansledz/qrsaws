import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

type Role = 'admin' | 'client' | 'worker'

type Action = 'invite' | 'resend'

interface Payload {
  email: string
  display_name?: string
  role?: Role
  action?: Action
}

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-secret, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
}

function json(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  for (const [k, v] of Object.entries(corsHeaders)) headers.set(k, v)
  return new Response(JSON.stringify(body), { ...init, headers })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  
  try {
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const url = Deno.env.get('SUPABASE_URL')
    const edgeSecret = Deno.env.get('EDGE_SECRET')

    if (!serviceRoleKey || !url) return json({ error: 'Missing env' }, { status: 500 })

    // Shared-secret check
    const provided = req.headers.get('x-secret')
    if (!edgeSecret || provided !== edgeSecret) return json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createClient(url, serviceRoleKey)

    const { email, display_name, role, action = 'invite' } = (await req.json()) as Payload
    if (!email) return json({ error: 'Email required' }, { status: 400 })

    if (action === 'invite') {
      if (!display_name || !role) return json({ error: 'display_name and role are required' }, { status: 400 })

      const inviteRes = await supabase.auth.admin.inviteUserByEmail(email, { 
        data: { display_name, app_role: role } 
      })
      if (inviteRes.error) return json({ error: inviteRes.error.message }, { status: 500 })

      const user = inviteRes.data.user
      const [profileUpsert, roleUpsert] = await Promise.all([
        supabase.from('user_profiles').upsert({ user_id: user.id, display_name, email }, { onConflict: 'user_id' }),
        supabase.from('app_roles').upsert({ user_id: user.id, role }, { onConflict: 'user_id' }),
      ])
      if (profileUpsert.error) return json({ error: profileUpsert.error.message }, { status: 500 })
      if (roleUpsert.error) return json({ error: roleUpsert.error.message }, { status: 500 })

      return json({ ok: true, sent: true, action: 'invite', user_id: user.id }, { status: 200 })
    }

    // action === 'resend'
    const resendRes = await supabase.auth.admin.inviteUserByEmail(email)
    if (resendRes.error) return json({ error: resendRes.error.message }, { status: 500 })
    return json({ ok: true, sent: true, action: 'resend' }, { status: 200 })
  } catch (e) {
    console.error('invite_user error', e)
    return json({ error: String(e?.message ?? e) }, { status: 500 })
  }
})