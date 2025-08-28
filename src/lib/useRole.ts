import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export function useRole() {
  const [role, setRole] = useState<'admin' | 'client' | 'worker' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { 
        setRole(null)
        setLoading(false)
        return 
      }
      
      const { data } = await supabase
        .from('app_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle()
        
      if (mounted) { 
        setRole((data?.role ?? null) as any)
        setLoading(false) 
      }
    })()
    return () => { mounted = false }
  }, [])

  return { role, loading }
}