// Supabase Edge Functions client-side interface
import { supabase } from './supabase';

export interface CreateUserWithRoleData {
  email: string;
  password: string;
  displayName?: string;
  role: 'admin' | 'client' | 'worker';
  clientId?: string;
}

export const createUserWithRole = async (data: CreateUserWithRoleData) => {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`;
  
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  
  if (!token) {
    throw new Error('No authentication token available');
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to create user');
  }

  return await response.json();
};

export const setUserClaims = async (data: any) => {
  throw new Error('User role management is handled via the create-user edge function. Please use createUserWithRole instead.');
};

export const generateWZPZ = async (data: any) => {
  throw new Error('WZPZ document generation will be implemented with Supabase Edge Functions. Please contact administrator.');
};