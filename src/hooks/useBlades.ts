import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export type BladeRow = {
  id: string;
  blade_code: string;
  client_id: string | null;
  machine: string | null;
  width_mm: number | null;
  thickness_mm: number | null;
  length_mm: number | null;
  status: string | null;
  created_at: string;
  updated_at: string | null;
};

export type EnrichedBlade = BladeRow & {
  clientName?: string | null;
  clientCode?: string | null;
  lastMovementAt?: string | null;
};

async function fetchBladesEnriched(): Promise<EnrichedBlade[]> {
  const [{ data: blades, error: bErr }, { data: clients, error: cErr }] = await Promise.all([
    supabase
      .from('blades')
      .select(
        'id, blade_code, client_id, machine, width_mm, thickness_mm, length_mm, status, created_at, updated_at'
      ),
    supabase.from('clients').select('id, name, code2'),
  ]);
  if (bErr) throw bErr;
  if (cErr) throw cErr;

  // Map clients
  const cMap: Record<string, { name: string; code2: string | null }> = {};
  for (const c of clients ?? []) cMap[c.id] = { name: c.name, code2: c.code2 ?? null };

  // Try to get latest movement per blade from a view (fast); fallback to grouped aggregate.
  let latest: Record<string, string> = {};
  try {
    const { data, error } = await supabase.from('latest_movements').select('blade_id, last_at');
    if (error) throw error;
    for (const r of data ?? []) latest[r.blade_id] = (r as any).last_at;
  } catch {
    const { data } = await supabase
      .from('movements')
      .select('blade_id, last_at:max(created_at)')
      .group('blade_id');
    for (const r of (data ?? []) as any[]) latest[r.blade_id] = r.last_at;
  }

  return (blades ?? []).map((b) => ({
    ...b,
    clientName: b.client_id ? cMap[b.client_id]?.name ?? null : null,
    clientCode: b.client_id ? cMap[b.client_id]?.code2 ?? null : null,
    lastMovementAt: latest[b.id] ?? null,
  }));
}

export function useBlades() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['blades', 'enriched'],
    queryFn: fetchBladesEnriched,
    staleTime: 5 * 60 * 1000, // serve instantly from cache for 5min
  });

  // Single realtime invalidation for blades & movements.
  useEffect(() => {
    const channel = supabase
      .channel('blades-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blades' }, () => {
        queryClient.invalidateQueries({ queryKey: ['blades', 'enriched'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'movements' }, () => {
        queryClient.invalidateQueries({ queryKey: ['blades', 'enriched'] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}
