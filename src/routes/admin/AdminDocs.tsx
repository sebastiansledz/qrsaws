import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FilePlus2, Eye, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { PageHeader } from '../../components/common/PageHeader';

import { listDocs, createWZPZDoc } from '../../lib/queriesSupabase';
import { supabase } from '../../lib/supabase';
import { useNotify } from '../../lib/notify';
import useAuth from '../../hooks/useAuth';

type ClientLite = { id: string; name: string; code2: string | null };
type DocRow = {
  id: string;
  type: 'WZ' | 'PZ';
  client_id: string;
  human_id: string;
  status: 'open' | 'closed';
  created_at: string;
  client?: ClientLite;
};

export default function AdminDocs() {
  const { isAdmin } = useAuth();
  const nav = useNavigate();
  const { success, error } = useNotify();

  // filters
  const [q, setQ] = useState('');
  const [clientId, setClientId] = useState<string | 'all'>('all');
  const [status, setStatus] = useState<'all' | 'open' | 'closed'>('all');
  const [type, setType] = useState<'all' | 'WZ' | 'PZ'>('all');

  const [rows, setRows] = useState<DocRow[]>([]);
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [{ data: cl, error: ce }] = await Promise.all([
          supabase.from('clients').select('id, name, code2').order('name', { ascending: true }),
        ]);
        if (ce) throw ce;
        if (mounted) setClients(cl ?? []);
      } catch (e) {
        console.error('Clients load failed', e);
      } finally {
        // docs load happens in another effect
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listDocs({
          q,
          clientId: clientId === 'all' ? null : clientId,
          status,
          type,
          limit: 500,
        });
        if (mounted) setRows(data as DocRow[]);
      } catch (e) {
        console.error('Docs load error', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
  }, [q, clientId, status, type]);

  const filteredCount = rows.length;

  const onCreateDoc = async () => {
    if (!isAdmin) return;
    // simple modal-free flow: pick type & client via native prompts (keeps UI intact)
    const selType = window.prompt('Typ dokumentu (WZ lub PZ):', 'WZ')?.toUpperCase();
    if (selType !== 'WZ' && selType !== 'PZ') return;
    const selClientName = window.prompt('Podaj nazwę klienta dokładnie jak w bazie (lub kod):');
    if (!selClientName) return;

    const match =
      clients.find(c => c.name.toLowerCase() === selClientName.toLowerCase()) ||
      clients.find(c => (c.code2 ?? '').toLowerCase() === selClientName.toLowerCase());
    if (!match) {
      error('Nie znaleziono klienta o podanej nazwie/kodzie.');
      return;
    }

    setCreating(true);
    try {
      const doc = await createWZPZDoc({ type: selType as 'WZ' | 'PZ', client_id: match.id });
      success(`Utworzono dokument ${doc.human_id}`);
      // Reload list
      const data = await listDocs({ q, clientId: clientId === 'all' ? null : clientId, status, type });
      setRows(data as DocRow[]);
    } catch (e: any) {
      console.error('Create doc failed', e);
      error(e?.message || 'Nie udało się utworzyć dokumentu');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Full-width header and tabs (same look as other admin pages) */}
      <PageHeader title="Panel Administratora" subtitle="WZ/PZ" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Title row with action */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Zarządzanie dokumentami</h2>
          {isAdmin && (
            <Button onClick={onCreateDoc} disabled={creating} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <FilePlus2 className="h-4 w-4 mr-2" />
              Dodaj dokument
            </Button>
          )}
        </motion.div>

        {/* Filters box – mirrors Blades list */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardHeader>
              <CardTitle>Filtry i wyszukiwanie</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Input placeholder="Numer dokumentu (np. WZ/AB/2025/08/001)..." value={q} onChange={(e) => setQ(e.target.value)} />
              <Select value={clientId} onValueChange={(v) => setClientId(v as any)}>
                <SelectTrigger><SelectValue placeholder="Wszyscy klienci" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszyscy klienci</SelectItem>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name} {c.code2 ? `(${c.code2})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-4">
                <Select value={type} onValueChange={(v) => setType(v as any)}>
                  <SelectTrigger><SelectValue placeholder="Typ" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie typy</SelectItem>
                    <SelectItem value="WZ">WZ</SelectItem>
                    <SelectItem value="PZ">PZ</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                  <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie statusy</SelectItem>
                    <SelectItem value="open">Otwarte</SelectItem>
                    <SelectItem value="closed">Zamknięte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader><CardTitle>Lista dokumentów ({filteredCount})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numer</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Klient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data utworzenia</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!rows.length && !loading && (
                    <TableRow><TableCell colSpan={6} className="text-center text-gray-500">Brak dokumentów</TableCell></TableRow>
                  )}
                  {rows.map((r, i) => (
                    <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-muted/40">
                      <TableCell className="font-medium">{r.human_id}</TableCell>
                      <TableCell>{r.type}</TableCell>
                      <TableCell>{r.client?.name ?? '—'}{r.client?.code2 ? ` (${r.client.code2})` : ''}</TableCell>
                      <TableCell>
                        {r.status === 'open'
                          ? <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Otwarte</span>
                          : <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">Zamknięte</span>}
                      </TableCell>
                      <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => nav(`/app/docs/${r.id}`)}>
                          <Eye className="h-4 w-4 mr-1" /> Podgląd
                        </Button>
                        {isAdmin && (
                          <Button variant="outline" size="sm" onClick={() => nav(`/app/docs/${r.id}`)}>
                            <Edit className="h-4 w-4 mr-1" /> Edytuj
                          </Button>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
