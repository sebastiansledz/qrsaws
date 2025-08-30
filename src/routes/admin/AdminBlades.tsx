import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusPill } from '../../components/common/StatusPill';
import { supabase } from '../../lib/supabase';

type BladeRow = {
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
  lastMovementAt?: string | null;
  clientName?: string | null;
  clientCode?: string | null;
};

export const AdminBlades: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<BladeRow[]>([]);
  const [clients, setClients] = useState<Record<string, { name: string; code2: string | null }>>({});
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ data: blades, error: bErr }, { data: clientRows, error: cErr }] = await Promise.all([
          supabase.from('blades').select('id, blade_code, client_id, machine, width_mm, thickness_mm, length_mm, status, created_at, updated_at'),
          supabase.from('clients').select('id, name, code2'),
        ]);
        if (bErr) throw bErr;
        if (cErr) throw cErr;

        const clientsMap: Record<string, { name: string; code2: string | null }> = {};
        for (const c of clientRows ?? []) clientsMap[c.id] = { name: c.name, code2: c.code2 ?? null };

        // latest movement per blade
        const ids = (blades ?? []).map((b) => b.id);
        let latestById: Record<string, string | null> = {};
        if (ids.length) {
          const { data: mv, error: mErr } = await supabase
            .from('movements')
            .select('blade_id, created_at')
            .in('blade_id', ids)
            .order('created_at', { ascending: false });
          if (mErr) throw mErr;
          for (const m of mv ?? []) {
            if (!latestById[m.blade_id]) latestById[m.blade_id] = m.created_at;
          }
        }

        const mapped: BladeRow[] = (blades ?? []).map((b) => ({
          ...b,
          lastMovementAt: latestById[b.id] ?? null,
          clientName: b.client_id ? clientsMap[b.client_id]?.name ?? null : null,
          clientCode: b.client_id ? clientsMap[b.client_id]?.code2 ?? null : null,
        }));

        if (!cancelled) {
          setRows(mapped);
          setClients(clientsMap);
        }
      } catch (e) {
        console.error('AdminBlades load error', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const passQ =
        !q ||
        r.blade_code.toLowerCase().includes(q.toLowerCase()) ||
        (r.clientName ?? '').toLowerCase().includes(q.toLowerCase());
      const passStatus = statusFilter === 'ALL' || (r.status ?? 'c0') === statusFilter;
      const passClient = clientFilter === 'ALL' || r.client_id === clientFilter;
      return passQ && passStatus && passClient;
    });
  }, [rows, q, statusFilter, clientFilter]);

  return (
    <div className="space-y-6">
      <PageHeader title="Panel Administratora" subtitle="Piły" showBack={false} />

      <Card>
        <CardHeader>
          <CardTitle>Filtry i wyszukiwanie</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input placeholder="ID piły lub klient..." value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger><SelectValue placeholder="Wszyscy klienci" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Wszyscy klienci</SelectItem>
              {Object.entries(clients).map(([id, c]) => (
                <SelectItem key={id} value={id}>{c.name} ({c.code2 ?? '—'})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Wszystkie statusy" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Wszystkie statusy</SelectItem>
              {['c0','c1','c2','c3','c4','c5','c6','c7','c8','c9','c10','c11','c12','c13','c14'].map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista pił ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Piły</TableHead>
                <TableHead>Klient</TableHead>
                <TableHead>Maszyna</TableHead>
                <TableHead>Specyfikacja</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ostatni ruch</TableHead>
                <TableHead>Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.blade_code}</TableCell>
                  <TableCell>{r.clientName ? `${r.clientName} (${r.clientCode ?? '—'})` : '—'}</TableCell>
                  <TableCell>{r.machine ?? '—'}</TableCell>
                  <TableCell>
                    {(r.width_mm ?? '—')}×{(r.thickness_mm ?? '—')}×{(r.length_mm ?? '—')}mm
                  </TableCell>
                  <TableCell><StatusPill status={(r.status ?? 'c0') as any} /></TableCell>
                  <TableCell>{r.lastMovementAt ? new Date(r.lastMovementAt).toLocaleString() : '—'}</TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/admin/blades/${encodeURIComponent(r.blade_code)}`)}>Podgląd</Button>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/admin/blades/${encodeURIComponent(r.blade_code)}/edit`)}>Edytuj</Button>
                  </TableCell>
                </TableRow>
              ))}
              {!filtered.length && !loading && (
                <TableRow><TableCell colSpan={7} className="text-center text-gray-500">Brak danych</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBlades;
