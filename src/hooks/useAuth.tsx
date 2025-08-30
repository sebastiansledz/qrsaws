import { useEffect, useState, useMemo, useCallback, useRef, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';

type Profile = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  is_admin?: boolean | null;
  role?: 'admin' | 'client' | 'worker' | null;
  client_id?: string | null;
};

type AuthContextType = {
  user: any | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const subRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadUserAndProfile() {
      try {
        const { data: session } = await supabase.auth.getSession();
        const currentUser = session?.session?.user ?? null;
        if (!currentUser) {
          if (!cancelled) {
            setUser(null);
            setProfile(null);
            setIsAdmin(false);
            setLoading(false);
          }
          return;
        }
        setUser(currentUser);

        const { data: prof, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle();

        if (error) throw error;

        if (!cancelled) {
          const typed: Profile | null = prof
            ? {
                user_id: prof.user_id,
                display_name: prof.display_name ?? null,
                email: prof.email ?? currentUser.email ?? null,
                is_admin: prof.is_admin ?? null,
                role: (prof.role as Profile['role']) ?? null,
                client_id: (prof.client_id as string | null) ?? null,
              }
            : null;

          setProfile(typed);
          setIsAdmin(!!typed?.is_admin || typed?.role === 'admin');
          setLoading(false);
        }
      } catch (e) {
        console.error('loadUserAndProfile error', e);
        if (!cancelled) setLoading(false);
      }
    }

    // initial
    loadUserAndProfile();

    // subscribe to auth state
    subRef.current = supabase.auth.onAuthStateChange((_event, _session) => {
      loadUserAndProfile();
    });

    return () => {
      cancelled = true;
      try {
        subRef.current?.data?.subscription?.unsubscribe?.();
      } catch {}
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  }, []);

  const value: AuthContextType = useMemo(
    () => ({ user, profile, isAdmin, loading, signOut }),
    [user, profile, isAdmin, loading, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default function useAuth() {
  return useContext(AuthContext);
}
