import React, { useEffect, useState } from 'react';
import { Package, Activity, TrendingUp, Users, Octagon, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { PageHeader } from '../../components/common/PageHeader';
import { supabase } from '../../lib/supabase';

type Client = { id: string; name: string; code2: string | null; nip?: string | null };

type Buckets = {
  totalBlades: number;
  sharp: number;
  dull: number;
  regen: number;
  cracked: number;
  scrapped: number;
  other: number;
};

export const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Buckets>({
    totalBlades: 0,
    sharp: 0,
    dull: 0,
    regen: 0,
    cracked: 0,
    scrapped: 0,
    other: 0,
  });
  const [topClients, setTopClients] = useState<
    Array<Client & { counters: { bladesTotal: number; sharp: number; dull: number; regen: number } }>
  >([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [{ data: clients, error: cErr }, { data: blades, error: bErr }] = await Promise.all([
          supabase.from('clients').select('id, name, code2, nip').order('name'),
          supabase.from('blades').select('id, client_id, status'),
        ]);
        if (cErr) throw cErr;
        if (bErr) throw bErr;

        const buckets: Buckets = {
          totalBlades: 0,
          sharp: 0,
          dull: 0,
          regen: 0,
          cracked: 0,
          scrapped: 0,
          other: 0,
        };
        const DULL = new Set(['c1', 'c2']);

        const byClient: Record<string, { total: number; sharp: number; dull: number; regen: number }> = {};

        for (const b of blades ?? []) {
          buckets.totalBlades++;
          const s = (b.status ?? 'c0') as string;

          if (s === 'c0') buckets.sharp++;
          else if (DULL.has(s)) buckets.dull++;
          else if (s === 'c13') buckets.regen++;
          else if (s === 'c4') buckets.cracked++;
          else if (s === 'c12') buckets.scrapped++;
          else buckets.other++;

          const cid = b.client_id ?? '_none';
          if (!byClient[cid]) byClient[cid] = { total: 0, sharp: 0, dull: 0, regen: 0 };
          byClient[cid].total++;
          if (s === 'c0') byClient[cid].sharp++;
          else if (DULL.has(s)) byClient[cid].dull++;
          else if (s === 'c13') byClient[cid].regen++;
        }

        const tc = Object.entries(byClient)
          .filter(([id]) => id !== '_none')
          .map(([id, c]) => {
            const row = (clients ?? []).find((x) => x.id === id) as Client | undefined;
            return {
              id,
              name: row?.name ?? id,
              code2: row?.code2 ?? '',
              nip: row?.nip ?? '',
              counters: {
                bladesTotal: c.total,
                sharp: c.sharp,
                dull: c.dull,
                regen: c.regen,
              },
            };
          })
          .sort((a, b) => b.counters.bladesTotal - a.counters.bladesTotal)
          .slice(0, 10);

        if (!cancelled) {
          setStats(buckets);
          setTopClients(tc);
        }
      } catch (e) {
        console.error('AdminDashboard load error', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled =
