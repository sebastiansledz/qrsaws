import { getSession, getProfile } from './authSupabase';

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