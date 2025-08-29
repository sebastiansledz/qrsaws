import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { queryClient } from '../../providers/queryClient';

type SessionContextValue = {
  user: any | null;
  claims: Record<string, any>;
  loading: boolean;
};

const SessionContext = createContext<SessionContextValue>({ user: null, claims: {}, loading: true });

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [claims, setClaims] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  async function loadInitial() {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    // TODO: replace with your real claims fetcher if needed
    setClaims(session ? { role: 'unknown' } : {});
    setLoading(false);
  }

  useEffect(() => {
    loadInitial();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Do NOT toggle global loading here to avoid UI thrash.
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setClaims({});
        queryClient.clear(); // optional: clear cached user data
        return;
      }

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);
        // Refresh claims quietly
        setClaims(session ? { role: 'unknown' } : {});
        // Soft refresh active data; keep UI mounted
        queryClient.invalidateQueries({ refetchType: 'active' });
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo(() => ({ user, claims, loading }), [user, claims, loading]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSessionContext() {
  return useContext(SessionContext);
}