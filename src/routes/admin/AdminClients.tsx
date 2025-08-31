import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Settings, Wrench, X } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/common/PageHeader';

import { supabase } from '../../lib/supabase';
import { useNotify } from '../../lib/notify';
import { listMachinesByClient, createMachine } from '../../lib/queriesSupabase';

const Overlay: React.FC<React.PropsWithChildren<{ open: boolean; onClose: () => void }>> = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center overflow-auto">
        <div className="mt-8 mb-8 w-[min(1100px,95vw)] rounded-3xl bg-white shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
};

type ClientRow = {
  id: string;
  name: string;
  code2: string | null;
  nip: string | null;
  created_at: string;
};

type MachineRow = {
  id: string;
  client_id: string;
  name: string;
  code: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
};

export const AdminClients: React.FC = () => {
  const { success, error } = useNotify();

  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  // Machines dialog state
  const [machinesOpen, setMachinesOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);
  const [machines, setMachines] = useState<MachineRow[]>([]);
  const [machinesLoading, setMachinesLoading] = useState(false);

  // Add machine form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mName, setMName] = useState('');
  const [mLocation, setMLocation] = useState('');
  const [mNotes, setMNotes] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error: qErr } = await supabase
          .from('clients')
          .select('id, name, code2, nip, created_at')
          .order('name', { ascending: true });
        if (qErr) throw qErr;
        if (!cancelled) setRows(data ?? []);
      } catch (e) {
        console.error('AdminClients load error', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return rows;
    return rows.filter(r =>
      r.name.toLowerCase().includes(k) ||
      (r.code2 ?? '').toLowerCase().includes(k) ||
      (r.nip ?? '').toLowerCase().includes(k)
    );
  }, [rows, q]);

  const openMachines = async (client: ClientRow) => {
    setSelectedClient(client);
    setMachines([]);
    setShowAddForm(false);
    setMName(''); setMLocation(''); setMNotes('');
    setMachinesOpen(true);
    setMachinesLoading(true);
    try {
      const list = await listMachinesByClient(client.id);
      setMachines(list as MachineRow[]);
    } catch (e) {
      console.error('Machines list error', e);
      error('Nie udało się pobrać listy maszyn');
    } finally {
      setMachinesLoading(false);
    }
  };

  const closeMachines = () => {
    setMachinesOpen(false);
    setSelectedClient(null);
    setMachines([]);
    setShowAddForm(false);
    setMName(''); setMLocation(''); setMNotes('');
  };

  const submitAddMachine = async () => {
    if (!selectedClient) return;
    const name = mName.trim();
    if (!name) {
      error('Nazwa maszyny jest wymagana');
      return;
    }
    setSaving(true);
    try {
      const row = await createMachine({
        client_id: selectedClient.id,
        name,
        location: mLocation.trim() || null,
        notes: mNotes.trim() || null,
      });
      setMachines(prev => [row as MachineRow, ...prev]); // optimistic
      setShowAddForm(false);
      setMName(''); setMLocation(''); setMNotes('');
      success('Maszyna została dodana');
    } catch (e: any) {
      console.error('Create machine failed', e);
      error(e?.message || 'Nie udało się dodać maszyny');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">  

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-center justify-between"
        >
          <h2 className="text-2xl font-bold text-gray-900">Zarządzanie klientami</h2>
          <div className="w-72">
            <Input placeholder="Szukaj: nazwa / kod / NIP…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle>Lista klientów ({filtered.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Klient</TableHead>
                    <TableHead>Kod</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.code2 ?? '—'}</TableCell>
                      <TableCell>{c.nip ?? '—'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openMachines(c)}>
                          <Wrench className="h-4 w-4 mr-2" />
                          Maszyny
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          Edytuj
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filtered.length && !loading && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">Brak klientów</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Machines dialog */}
      <Overlay open={machinesOpen} onClose={closeMachines}>
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold">Maszyny{selectedClient ? ` — ${selectedClient.name}` : ''}</h3>
            <button className="rounded-full p-2 hover:bg-gray-100" aria-label="Zamknij" onClick={closeMachines}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={() => setShowAddForm(true)} className="bg-primary-600 hover:bg-primary-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Dodaj maszynę
            </Button>
          </div>

          <div className="mt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Lokalizacja</TableHead>
                  <TableHead>Uwagi</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {machinesLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">Ładowanie…</TableCell>
                  </TableRow>
                ) : machines.length ? (
                  machines.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>{m.location ?? '—'}</TableCell>
                      <TableCell>{m.notes ?? '—'}</TableCell>
                      <TableCell className="text-right">{/* future actions */}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">Brak maszyn</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {showAddForm && (
            <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <h4 className="text-lg font-semibold mb-4">Dodaj nową maszynę</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Nazwa *</label>
                  <Input value={mName} onChange={(e) => setMName(e.target.value)} placeholder="np. Trak 2" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Lokalizacja</label>
                  <Input value={mLocation} onChange={(e) => setMLocation(e.target.value)} placeholder="np. Hala 12" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Uwagi</label>
                  <textarea
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    rows={3}
                    value={mNotes}
                    onChange={(e) => setMNotes(e.target.value)}
                    placeholder="Dodatkowe informacje…"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>Anuluj</Button>
                <Button onClick={submitAddMachine} disabled={saving}>
                  {saving ? 'Zapisywanie…' : 'Dodaj maszynę'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Overlay>
    </div>
  );
};

export default AdminClients;
