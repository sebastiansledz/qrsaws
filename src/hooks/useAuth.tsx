import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

type Profile = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  is_admin?: boolean | null;
};

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  async function loadUserAndProfile() {
    try {
      const { data: ures } = await supabase.auth.getUser();
      const u = ures?.user ?? null;
      setUser(u);

      if (!u) {
        setProfile(null);
        setIsAdmin(false);
        return;
      }

      // Try app_roles first (supports either text "role" or boolean "is_admin")
      let admin = false;

      // 1) boolean flavor
      const { data: rolesBool, error: rolesBoolErr } = await supabase
        .from('app_roles')
        .select('is_admin')
        .eq('user_id', u.id)
        .limit(1)
        .maybeSingle();

      if (!rolesBoolErr && rolesBool && (rolesBool as any).is_admin === true) {
        admin = true;
      } else {
        // 2) text flavor
        const { data: rolesText } = await supabase
          .from('app_roles')
          .select('role')
          .eq('user_id', u.id);

        if (Array.isArray(rolesText) && rolesText.some(r => (r as any).role === 'admin')) {
          admin = true;
        }
      }

      setIsAdmin(admin);

      // Load user_profiles (non-fatal if missing)
      const { data: prof, error: profErr } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, email, is_admin')
        .eq('user_id', u.id)
        .maybeSingle();

      if (!profErr && prof) setProfile(prof as Profile);
    } catch (e) {
      // Never leave loading stuck
      console.error('useAuth load error:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    // Safety timeout: never hang indefinitely
    const t = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 8000);

    // initial load
    loadUserAndProfile();

    // live auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, _session) => {
      // Reload role/profile when token/user changes
      setLoading(true);
      loadUserAndProfile();
    });

    return () => {
      cancelled = true;
      clearTimeout(t);
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  return useMemo(() => ({ user, profile, isAdmin, loading }), [user, profile, isAdmin, loading]);
}

export default useAuth;