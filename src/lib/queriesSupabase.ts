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

export async function createMovement(input: {
  blade_id: string;
  type: 'scan_in' | 'scan_out' | 'service_in' | 'service_out' | 'ship_in' | 'ship_out';
  op_code: 'MD' | 'PZ' | 'SR' | 'ST1' | 'ST2' | 'WZ' | 'MAGAZYN';
  client_id?: string | null;
  machine_id?: string | null;
  state_code?: string | null;
  hours_worked?: number | null;
  doc_ref?: string | null;
  service_ops?: string[];
  note?: string;
}) {
  const { data, error } = await supabase
    .from('movements')
    .insert({
      blade_id: input.blade_id,
      type: input.type,
      op_code: input.op_code,
      client_id: input.client_id || null,
      machine_id: input.machine_id || null,
      state_code: input.state_code || null,
      hours_worked: input.hours_worked || null,
      doc_ref: input.doc_ref || null,
      service_ops: input.service_ops || null,
      note: input.note || null,
      by_user: (await supabase.auth.getUser()).data.user?.id || null,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}