import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { StatusPill } from '../../components/common/StatusPill';

import { useBlades } from '../../hooks/useBlades';

const STATUS_OPTIONS = ['c0','c1','c2','c3','c4','c5','c6','c7','c8','c9','c10','c11','c12','c13','c14'];

export const AdminBlades: React.FC = () => {
  const navigate = useNavigate();
  const { data: rows = [], isFetching, isLoading } = useBlades();

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [clientFilter, setClientFilter] = useState<string>('ALL');

  // Build client select from loaded rows
  const clients = useMemo(() => {
    const m = new Map<string, { name: string; code2: string | null }>();
    rows.forEach((r) => {
      if (r.client_id && r.clientName) m.set(r.client_id, { name: r.clientName, code2: r.clientCode ?? null });
    });
    return Array.from(m.entries());
  }, [rows]);

  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return rows.filter((r) => {
      const passQ =
        !qLower ||
        r.blade_code.toLowerCase().includes(qLower) ||
        (r.clientName ?? '').toLowerCase().includes(qLower);
      const passStatus = statusFilter === 'ALL' || (r.status ?? 'c0') === statusFilter;
      const passClient = clientFilter === 'ALL' || r.client_id === clientFilter;
      return passQ && passStatus && passClient;
    });
  }, [rows, q, statusFilter, clientFilter]);

  const refreshing = isFetching && !isLoading;

  return (
    <div className="space-y-6">
      {/* Header + add button (animation like Reports page) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex justify-between items-center"
      >
        <h2 className="text-2xl font-bold text-gray-900">Zarządzanie piłami</h2>
        <Button
          onClick={() => navigate('/admin/blade/new')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Dodaj piłę
        </Button>
      </motion.div>

      {/* Filters card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle>Filtry i wyszukiwanie</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Input
              placeholder="ID piły lub klient…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger><SelectValue placeholder="Wszyscy klienci" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Wszyscy klienci</SelectItem>
                {clients.map(([id, c]) => (
                  <SelectItem key={id} value={id}>
                    {c.name} ({c.code2 ?? '—'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Wszystkie statusy" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Wszystkie statusy</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </motion.div>

      {/* List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle>
              Lista pił ({filtered.length})
              {refreshing && <span className="ml-2 text-xs text-muted-foreground">(odświeżanie…)</span>}
            </CardTitle>
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          navigate(`/admin/blade/${encodeURIComponent(r.blade_code)}`);
                        }}
                      >
                        Podgląd
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          navigate(`/admin/blade/${encodeURIComponent(r.blade_code)}/edit`);
                        }}
                      >
                        Edytuj
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!filtered.length && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">
                      Brak danych
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminBlades;
