import { supabase } from './supabaseClient';

function assertNoError<T>(data: T, error: any): T {
  if (error) {
    console.error('Supabase request failed', error);
    throw error;
  }
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ 
    email, 
    password,
    options: {
      emailRedirectTo: `${import.meta.env.VITE_SITE_URL}/auth/callback`
    }
  });
  return assertNoError(data, error);
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

export async function getProfile() {
  const session = await getSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single();
  return assertNoError(data, error);
}

export async function inviteOrCreateUser(params: {
  email: string;
  displayName?: string;
  role: "admin" | "client" | "worker";
  clientId?: string;
}) {
  const { email, displayName, role, clientId } = params;

  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite_user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-secret': import.meta.env.VITE_EDGE_SECRET!,
      },
      body: JSON.stringify({ 
        action: 'invite', 
        email, 
        display_name: displayName, 
        role,
        client_id: clientId
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to invite user');
    }

    return result;
  } catch (error: any) {
    throw new Error(error.message || 'Network error while inviting user');
  }
}