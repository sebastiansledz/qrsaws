// src/routes/admin/AdminDocs.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { FilePlus2, Eye, Edit, QrCode } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';

import { useNotify } from '../../lib/notify';
import { supabase } from '../../lib/supabase';
import useAuth from '../../hooks/useAuth';

import { createWZPZDoc, listDocs } from '../../lib/queriesSupabase';

// ---- Types --------------------------------------------------------------
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

// ---- Component ----------------------------------------------------------
export default function AdminDocs() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { user, isAdmin } = useAuth();
  const { success, error } = useNotify();

  // filters
  const [q, setQ] = useState('');
  const [clientId, setClientId] = useState<string | 'all'>('all');
  const [status, setStatus] = useState<'all' | 'open' | 'closed'>('all');
  const [type, setType] = useState<'all' | 'WZ' | 'PZ'>('all');

  // data
  const [rows, setRows] = useState<DocRow[]>([]);
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [loading, setLoading] = useState(true);

  // create dialog
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newType, setNewType] = useState<'WZ' | 'PZ'>('WZ');
  const [newClientId, setNewClientId] = useState<string>('');

  // --- load clients once
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error: ce } = await supabase
        .from('clients')
        .select('id, name, code2')
        .order('name', { ascending: true });
      if (!ce && mounted) setClients((data ?? []) as ClientLite[]);
    })();
    return () => { mounted = false; };
  }, []);

  // --- load docs on filters change
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
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
        error('Nie udało się pobrać listy dokumentów');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [q, clientId, status, type, error]);

  // --- tabs active value from URL
  const currentTab = useMemo(() => {
    if (pathname.startsWith('/admin/clients')) return 'clients';
    if (pathname.startsWith('/admin/blade'))   return 'blades';
    if (pathname.startsWith('/admin/docs'))    return 'docs';
    if (pathname.startsWith('/admin/users'))   return 'users';
    if (pathname.startsWith('/admin/reports')) return 'reports';
    return 'dashboard';
  }, [pathname]);

  const onTabsChange = (v: string) => {
    if (v === 'dashboard') return nav('/admin');
    if (v === 'clients')   return nav('/admin');
    if (v === 'blades')    return nav('/admin');
    if (v === 'docs')      return nav('/admin/docs');
    if (v === 'users')     return nav('/admin');
    if (v === 'reports')   return nav('/admin');
  };

  const onOpenCreate = () => {
    setNewType('WZ');
    setNewClientId('');
    setOpenCreate(true);
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientId) {
      return error('Wybierz klienta');
    }
    setCreating(true);
    try {
      const doc = await createWZPZDoc({ type: newType, client_id: newClientId });
      success(`Utworzono dokument ${doc.human_id}`);
      setOpenCreate(false);
      // reload and go to details
      const data = await listDocs({ q, clientId: clientId === 'all' ? null : clientId, status, type, limit: 500 });
      setRows(data as DocRow[]);
      nav(`/admin/docs/${doc.id}`);
    } catch (e: any) {
      console.error('Create doc failed', e);
      error(e?.message || 'Nie udało się utworzyć dokumentu');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* === HERO HEADER (same style as other admin tabs) =================== */}
      <div className="bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold tracking-tight>
              Panel Administratora
            </h1>
            <p className="mt-2 text-gray-600">
              Witaj, {user?.email} – zarządzaj systemem QRSaws
            </p>

            <div className="mt-4 flex items-center gap-3">
          <Button onClick={() => navigate('/scan')} className="gap-2">
            <QrCode className="h-4 w-4" />
            Skanuj ostrze
          </Button>
          <Button
            onClick={() => navigate('/admin/blade/new')}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Dodaj piłę
          </Button>
              )}
            </div>
          </div>

          {/* Tabs bar shared across admin pages */}
          <Tabs value={currentTab} onValueChange={onTabsChange} className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-6">
              <TabsTrigger value="dashboard" className="w-full">Pulpit</TabsTrigger>
              <TabsTrigger value="clients"   className="w-full">Klienci</TabsTrigger>
              <TabsTrigger value="blades"    className="w-full">Piły</TabsTrigger>
              <TabsTrigger value="docs"      className="w-full">WZ/PZ</TabsTrigger>
              <TabsTrigger value="users"     className="w-full">Użytkownicy</TabsTrigger>
              <TabsTrigger value="reports"   className="w-full">Raporty</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* === CONTENT ======================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Title + action */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Zarządzanie dokumentami</h2>
          {isAdmin && (
            <Button
              type="button"
              onClick={onOpenCreate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <FilePlus2 className="h-4 w-4 mr-2" />
              Dodaj dokument
            </Button>
          )}
        </motion.div>

        {/* Filters */}
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
            <CardHeader><CardTitle>Lista dokumentów ({rows.length})</CardTitle></CardHeader>
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
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-muted/40"
                    >
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
                        <Button variant="outline" size="sm" type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); nav(`/admin/docs/${r.id}`); }}>
                          <Eye className="h-4 w-4 mr-1" /> Podgląd
                        </Button>
                        {isAdmin && (
                          <Button variant="outline" size="sm" type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); nav(`/admin/docs/${r.id}`); }}>
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

      {/* === CREATE DOCUMENT DIALOG ======================================= */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Dodaj dokument WZ/PZ</DialogTitle>
          </DialogHeader>

          <form onSubmit={onCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Typ *</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as 'WZ' | 'PZ')}>
                  <SelectTrigger><SelectValue placeholder="Wybierz typ" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WZ">WZ — Wydanie zewnętrzne</SelectItem>
                    <SelectItem value="PZ">PZ — Przyjęcie zewnętrzne</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Klient *</Label>
                <Select value={newClientId} onValueChange={(v) => setNewClientId(v)}>
                  <SelectTrigger><SelectValue placeholder="Wybierz klienta" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name} {c.code2 ? `(${c.code2})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenCreate(false)}>Anuluj</Button>
              <Button type="submit" disabled={creating}>Utwórz</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
