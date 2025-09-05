import { supabase } from './supabase';

export async function getMachines(clientId: string) {
  const { data, error } = await supabase
    .from('machines')
    .select('id, name, code, location, notes')
    .eq('client_id', clientId)
    .order('name');
  if (error) throw error;
  return data ?? [];
}

export async function createMachine(clientId: string, input: {
  name: string;
  code?: string;
  location?: string;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from('machines')
    .insert({
      client_id: clientId,
      name: input.name,
      code: input.code || null,
      location: input.location || null,
      notes: input.notes || null,
    })
    .select('id, name, code, location, notes')
    .single();
  if (error) throw error;
  return data;
}