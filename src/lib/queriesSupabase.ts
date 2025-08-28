import { supabase } from './supabaseClient';

function assertNoError<T>(data: T, error: any): T {
  if (error) {
    console.error('Supabase request failed', error);
    throw error;
  }
  return data;
}

export async function listClientsLite(): Promise<
  Array<{
    id: string;
    name: string;
    code2: string | null;
    email: string | null;
    phone: string | null;
    nip: string | null;
    address: string | null;
  }>
> {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, code2, email, phone, nip, address")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data as any;
}

type ClientInsert = {
  name: string;
  code2?: string;
  nip?: string;
  phone?: string;
  email?: string;
  address?: string;
};

export async function createClientSB(input: ClientInsert) {
  const payload = {
    name: input.name,
    code2: input.code2 || null,
    nip: input.nip || null,
    phone: input.phone || null,
    email: input.email || null,
    address: input.address || null,
    // if your table has is_active, created_at etc. they'll use defaults
  };

  const { data, error } = await supabase
    .from('clients')
    .insert(payload)
    .select('id, name, code2, email, phone, nip, address')
    .single();

  if (error) throw new Error(error.message);
  return data as any;
}

export async function updateClientSB(id: string, input: ClientInsert) {
  const payload = {
    name: input.name,
    code2: input.code2 || null,
    nip: input.nip || null,
    phone: input.phone || null,
    email: input.email || null,
    address: input.address || null,
  };

  const { data, error } = await supabase
    .from('clients')
    .update(payload)
    .eq('id', id)
    .select('id, name, code2, email, phone, nip, address')
    .single();

  if (error) throw new Error(error.message);
  return data as any;
}

export async function getClients() {
  const { data, error } = await supabase.from('clients').select('*').order('name');
  return assertNoError(data, error);
}

export async function createClient(payload: {
  name: string; code2: string; nip?: string; phone?: string; address?: string;
}) {
  const { data, error } = await supabase.from('clients').insert(payload).select().single();
  return assertNoError(data, error);
}

export async function getBlades() {
  const { data, error } = await supabase
    .from('blades')
    .select('*, clients(name, code2)')
    .order('created_at', { ascending: false });
  return assertNoError(data, error);
}

export async function createBlade(row: {
  client_id: string;
  code?: string | null;
  serial?: string | null;
  diameter?: number | null;
  type?: string | null;
  status?: string | null; // default 'available' if not provided
}) {
  const payload = {
    status: "available",
    ...row,
  };
  const { data, error } = await supabase
    .from("blades")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createMovement(payload: {
  blade_id: string;
  type: 'scan_in'|'scan_out'|'service_in'|'service_out'|'ship_in'|'ship_out';
  service_ops?: string[];
  note?: string;
}) {
  const { data, error } = await supabase.from('movements').insert(payload).select().single();
  return assertNoError(data, error);
}

export async function listServiceOps() {
  const { data, error } = await supabase.from('service_ops').select('*').order('id');
  return assertNoError(data, error);
}