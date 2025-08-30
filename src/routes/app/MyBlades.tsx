import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusPill } from '../../components/common/StatusPill';
import useAuth from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

type Row = {
  id: string;
  blade_code: string;
  status: string | null;
  width_mm: number | null;
  thickness_mm: number | null;
  length_mm: number | null;
  machine: string | null;
  lastMovementAt?: string | null;
};

export const MyBlades: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!profile?.client_id) { setRows([]); return; }
        const { data: blades, error: bErr } = await supabase
          .from('blades')
          .select('id, blade_code, status, width_mm, thickness_mm, length_mm, machine, created_at')
          .eq('client_id', profile.client_id)
          .order('created_at', { ascending: false });
        if (bErr) throw bErr;

        const ids = (blades ?? []).map(b => b.id);
        let latest: Record<string, string> = {};
        if (ids.length) {
          const { data: mv, error: mErr } = await supabase
            .from('movements')
            .select('blade_id, created_at')
            .in('blade_id', ids)
            .order('created_at', { ascending: false });
          if (mErr) throw mErr;
          for (const m of mv ?? []) {
            if (!latest[m.blade_id]) latest[m.blade_id] = m.created_at;
          }
        }

        const mapped: Row[] = (blades ?? []).map((b) => ({
          ...b,
          lastMovementAt: latest[b.id] ?? null,
        }));

        if (!cancelled) setRows(mapped);
      } catch (e) {
        console.error('MyBlades load error', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [profile?.client_id]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const passQ = !q || r.blade_code.toLowerCase().includes(q.toLowerCase());
      const passStatus = statusFilter === 'ALL' || (r.status ?? 'c0') === statusFilter;
      return passQ && passStatus;
    });
  }, [rows, q, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader title="Moje piły" subtitle="Lista" showBack />

      <Card>
        <CardHeader><CardTitle>Filtry i wyszukiwanie</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-3">
          <Input placeholder="ID piły..." value={q} onChange={(e) => setQ(e.target.value)} />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Wszystkie statusy" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Wszystkie statusy</SelectItem>
              {['c0','c1','c2','c3','c4','c5','c6','c7','c8','c9','c10','c11','c12','c13','c14'].map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Lista pił ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Piły</TableHead>
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
                  <TableCell>{r.machine ?? '—'}</TableCell>
                  <TableCell>{(r.width_mm ?? '—')}×{(r.thickness_mm ?? '—')}×{(r.length_mm ?? '—')}mm</TableCell>
                  <TableCell><StatusPill status={(r.status ?? 'c0') as any} /></TableCell>
                  <TableCell>{r.lastMovementAt ? new Date(r.lastMovementAt).toLocaleString() : '—'}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => navigate(`/app/blades/${encodeURIComponent(r.blade_code)}`)}>Podgląd</Button>
                  </TableCell>
                </TableRow>
              ))}
              {!filtered.length && !loading && (
                <TableRow><TableCell colSpan={6} className="text-center text-gray-500">Brak danych</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyBlades;
