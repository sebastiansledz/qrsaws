import { getSession, getProfile } from './authSupabase';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export type Claims = { role?: 'admin'|'client'|'worker'; clientId?: string|null }

export async function getClaims(): Promise<Claims> {
  const session = await getSession();
  if (!session) return {};
  
  const profile = await getProfile();
  return { 
    role: profile?.role, 
    clientId: profile?.client_id ?? null 
  };
}

export function useClaims() {
  const [user, setUser] = useState<any>(null);
  const [claims, setClaims] = useState<Claims>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const session = await getSession();
        setUser(session?.user ?? null);
        if (session) {
          const c = await getClaims();
          setClaims(c);
        } else {
          setClaims({});
        }
      } catch (error) {
        console.error('Auth error:', error);
        setUser(null);
        setClaims({});
      } finally {
        setLoading(false);
      }
    };

    loadAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session) {
        const c = await getClaims();
        setClaims(c);
      } else {
        setClaims({});
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, claims, loading };
}