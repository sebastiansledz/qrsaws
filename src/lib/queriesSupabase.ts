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
  op_code: 'MD'|'PZ'|'SR'|'ST1'|'ST2'|'WZ'|'MAGAZYN';
  client_id?: string | null;
  machine_id?: string | null;
  state_code?: string | null;      // 'c0'..'c14'
  hours_worked?: number | null;    // hours
  doc_ref?: string | null;         // e.g. 'WZ/JK/2025/08/007'
  service_ops?: string[];
  note?: string;
}) {
  const { data, error } = await supabase
    .from('movements')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}


export async function listServiceOps() {
  const { data, error } = await supabase.from('service_ops').select('*').order('id');
  return assertNoError(data, error);
}

export async function listOpenDocs(type: 'WZ'|'PZ', client_id: string) {
  const { data, error } = await supabase
    .from('wzpz_docs')
    .select('*')
    .eq('type', type)
    .eq('client_id', client_id)
    .eq('status', 'open')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createDoc(type: 'WZ'|'PZ', client_id: string, client_code2: string, by_user?: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { data: last } = await supabase
    .from('wzpz_docs')
    .select('seq')
    .eq('client_id', client_id).eq('type', type)
    .eq('year', year).eq('month', month)
    .order('seq', { ascending: false })
    .limit(1);
  const seq = (last?.[0]?.seq ?? 0) + 1;

  const human_id = `${type}/${client_code2}/${year}/${String(month).padStart(2,'0')}/${String(seq).padStart(3,'0')}`;

  const { data, error } = await supabase
    .from('wzpz_docs')
    .insert({ type, client_id, seq, year, month, human_id, created_by: by_user })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addItemToDoc(doc_id: string, blade_id: string) {
  const { data, error } = await supabase
    .from('wzpz_items')
    .insert({ doc_id, blade_id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function closeDoc(doc_id: string, by_user?: string) {
  const { data, error } = await supabase
    .from('wzpz_docs')
    .update({ status: 'closed', closed_at: new Date().toISOString(), closed_by: by_user })
    .eq('id', doc_id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getLastST1(blade_id: string) {
  const { data, error } = await supabase
    .from('movements')
    .select('*')
    .eq('blade_id', blade_id)
    .eq('op_code', 'ST1')
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function listMachinesByClient(clientId: string) {
  const { data, error } = await supabase
    .from('machines')
    .select('id, client_id, name, code, location, notes, created_at')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createMachine(input: {
  client_id: string;
  name: string;
  code?: string | null;
  location?: string | null;
  notes?: string | null;
}) {
  const payload = {
    client_id: input.client_id,
    name: input.name.trim(),
    code: input.code?.trim() || null,
    location: input.location?.trim() || null,
    notes: input.notes?.trim() || null,
  };

  const { data, error } = await supabase
    .from('machines')
    .insert(payload)
    .select('id, client_id, name, code, location, notes, created_at')
    .single();

  if (error) throw error;
  return data;
}

// ---- WZ/PZ: lists -----------------------------------------------------------
export async function listDocs(params?: {
  q?: string;                 // search by human_id
  clientId?: string | null;   // filter by client
  status?: 'open' | 'closed' | 'all';
  type?: 'WZ' | 'PZ' | 'all';
  limit?: number;
}) {
  const { q, clientId, status = 'all', type = 'all', limit } = params || {};
  let query = supabase
    .from('wzpz_docs')
    .select('id, type, client_id, human_id, status, created_at, client:clients(id, name, code2)')
    .order('created_at', { ascending: false });

  if (clientId) query = query.eq('client_id', clientId);
  if (status !== 'all') query = query.eq('status', status);
  if (type !== 'all') query = query.eq('type', type);
  if (q && q.trim()) query = query.ilike('human_id', `%${q.trim()}%`);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function listDocsForClient(clientId: string, limit = 50) {
  return listDocs({ clientId, limit });
}

// ---- WZ/PZ: create/close ----------------------------------------------------
export async function createWZPZDoc(input: { type: 'WZ' | 'PZ'; client_id: string }) {
  // uses RPC to ensure human_id + seq are allocated atomically
  const { data, error } = await supabase.rpc('wzpz_create_doc', {
    p_type: input.type,
    p_client_id: input.client_id,
  });
  if (error) throw error;
  return data;
}

export async function closeWZPZDoc(docId: string) {
  const { data, error } = await supabase
    .from('wzpz_docs')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', docId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ---- WZ/PZ items ------------------------------------------------------------
export async function addBladeToDoc(docId: string, bladeId: string) {
  const { data, error } = await supabase
    .from('wzpz_items')
    .insert({ doc_id: docId, blade_id: bladeId })
    .select('doc_id, blade_id')
    .single();
  if (error) throw error;
  return data;
}

export async function listDocItems(docId: string) {
  const { data, error } = await supabase
    .from('wzpz_items')
    .select('blade:blades(id, blade_code, width_mm, thickness_mm, length_mm, status)')
    .eq('doc_id', docId);
  if (error) throw error;
  return data ?? [];
}