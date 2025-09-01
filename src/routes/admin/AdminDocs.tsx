import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ExternalLink } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';

import { supabase } from '../../lib/supabase';
import { useNotify } from '../../lib/notify';

type DocType = 'WZ' | 'PZ';
type DocStatus = 'open' | 'closed';

type DocRow = {
  id: string;
  type: DocType;
  client_id: string;
  human_id: string;
  status: DocStatus;
  created_at: string;
  client: { id: string; name: string; code2: string | null } | null;
};

type ClientLite = { id: string; name: string; code2: string | null };

const pad = (n: number, len: number) => String(n).padStart(len, '0');

const SELECT =
  'id,type,client_id,human_id,status,created_at,' +
  'client:clients!wzpz_docs_client_id_fkey(id,name,code2)';

export default function AdminDocs() {
  const nav = useNavigate();
  const { error, success } = useNotify();

  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  // create modal state
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [docType, setDocType] = useState<DocType>('WZ');
  const [clientId, setClientId] = useState<string>('');
  const [clients, setClients] = useState<ClientLite[]>([]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter(d =>
      d.human_id.toLowerCase().includes(q) ||
      (d.client?.name?.toLowerCase().includes(q) ?? false) ||
      (d.client?.code2?.toLowerCase().includes(q) ?? false)
    );
  }, [docs, filter]);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: de } = await supabase
        .from('wzpz_docs')
        .select(SELECT)
        .order('created_at', { ascending: false });
      if (de) throw de;
      setDocs((data ?? []) as DocRow[]);
    } catch (e) {
      console.error('AdminDocs load error', e);
      error('Nie udało się wczytać dokumentów');
    } finally {
      setLoading(false);
    }
  }, [error]);

  const loadClients = useCallback(async () => {
    const { data, error: ce } = await supabase
      .from('clients')
      .select('id,name,code2')
      .order('name', { ascending: true });
    if (ce) throw ce;
    setClients((data ?? []) as ClientLite[]);
  }, []);

  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    (async () => {
      try { await Promise.all([loadDocs(), loadClients()]); } catch {}
    })();
  }, [loadDocs, loadClients]);

  async function createDoc(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) return error('Wybierz klienta');
    setSaving(true);
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const { data: seqRow, error: se } = await supabase
        .from('wzpz_docs')
        .select('seq')
        .eq('type', docType)
        .eq('client_id', clientId)
        .eq('year', year)
        .eq('month', month)
        .order('seq', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (se) throw se;
      const seq = (seqRow?.seq ?? 0) + 1;

      const cli = clients.find(c => c.id === clientId);
      const code2 = cli?.code2 || 'XX';
      const human_id = `${docType}/${code2}/${year}/${pad(month, 2)}/${pad(seq, 3)}`;

      const { data: ins, error: ie } = await supabase
        .from('wzpz_docs')
        .insert({ type: docType, client_id: clientId, seq, year, month, human_id, status: 'open' })
        .select('id')
        .single();
      if (ie) throw ie;

      success(`Utworzono dokument ${human_id}`);
      setOpen(false);
      setClientId('');
      setDocType('WZ');
      nav(`/admin/docs/${ins.id}`);
    } catch (e: any) {
      console.error('Doc create failed', e);
      error(e?.message || 'Nie udało się utworzyć dokumentu');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader><CardTitle>Filtry i wyszukiwanie</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <Label>Szukaj</Label>
            <Input placeholder="Numer dokumentu lub klient…" value={filter} onChange={e => setFilter(e.target.value)} />
          </div>
          <div className="flex items-end justify-end">
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj dokument
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader><CardTitle>Lista dokumentów</CardTitle></CardHeader>
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
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-gray-500">Ładowanie…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-gray-500">Brak dokumentów</TableCell></TableRow>
              ) : (
                filtered.map((d, i) => (
                  <motion.tr
                    key={d.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-muted/40 cursor-pointer"
                    onClick={() => nav(`/admin/docs/${d.id}`)}
                  >
                    <TableCell className="font-medium">{d.human_id}</TableCell>
                    <TableCell>{d.type}</TableCell>
                    <TableCell>{d.client ? `${d.client.name}${d.client.code2 ? ` (${d.client.code2})` : ''}` : '—'}</TableCell>
                    <TableCell>
                      {d.status === 'open' ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Otwarte</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">Zamknięte</span>
                      )}
                    </TableCell>
                    <TableCell>{new Date(d.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); nav(`/admin/docs/${d.id}`); }}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Podgląd
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader><DialogTitle>Dodaj dokument</DialogTitle></DialogHeader>
          <form onSubmit={createDoc} className="space-y-4">
            <div className="space-y-2">
              <Label>Typ *</Label>
              <Select value={docType} onValueChange={(v: DocType) => setDocType(v)}>
                <SelectTrigger><SelectValue placeholder="Wybierz typ" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WZ">WZ — Wydanie zewnętrzne</SelectItem>
                  <SelectItem value="PZ">PZ — Przyjęcie zewnętrzne</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Klient *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger><SelectValue placeholder="Wybierz klienta" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}{c.code2 ? ` (${c.code2})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Anuluj</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Tworzenie…' : 'Utwórz'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
