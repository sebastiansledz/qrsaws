// src/routes/admin/DocDetails.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Lock, Unlock } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';

import { supabase } from '../../lib/supabase';
import { useNotify } from '../../lib/notify';

type DocType = 'WZ' | 'PZ';
type DocStatus = 'open' | 'closed';

type Doc = {
  id: string;
  type: DocType;
  client_id: string;
  human_id: string;
  status: DocStatus;
  created_at: string;
};

type ClientLite = { id: string; name: string; code2: string | null };

type DocItemRow = {
  blade_id: string;
  added_at: string;
  blades: {
    id: string;
    blade_code: string;
    width_mm: number | null;
    thickness_mm: number | null;
    length_mm: number | null;
    status: string | null;
  } | null;
};

export default function DocDetails() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { success, error } = useNotify();

  const [doc, setDoc] = useState<Doc | null>(null);
  const [client, setClient] = useState<ClientLite | null>(null);
  const [items, setItems] = useState<DocItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Add blade modal
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [bladeCode, setBladeCode] = useState('');

  const isOpen = doc?.status === 'open';

  // ---- Load data ---------------------------------------------------------
  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: d, error: de } = await supabase
        .from('wzpz_docs')
        .select('id,type,client_id,human_id,status,created_at')
        .eq('id', id)
        .single<Doc>();
      if (de) throw de;
      setDoc(d);

      const { data: c, error: ce } = await supabase
        .from('clients')
        .select('id,name,code2')
        .eq('id', d.client_id)
        .single<ClientLite>();
      if (ce) throw ce;
      setClient(c);

      const { data: it, error: ie } = await supabase
        .from('wzpz_items')
        .select('blade_id,added_at,blades(id,blade_code,width_mm,thickness_mm,length_mm,status)')
        .eq('doc_id', id)
        .order('added_at', { ascending: true });
      if (ie) throw ie;
      setItems((it ?? []) as DocItemRow[]);
    } catch (e) {
      console.error('DocDetails load error', e);
      error('Nie udało się wczytać dokumentu');
    } finally {
      setLoading(false);
    }
  }, [id, error]);

  useEffect(() => { load(); }, [load]);

  const spec = useMemo(() => {
    return (b: DocItemRow['blades']) =>
      b ? `${b.width_mm ?? '—'}×${b.thickness_mm ?? '—'}×${b.length_mm ?? '—'}mm` : '—';
  }, []);

  // ---- Actions -----------------------------------------------------------
  const openAddModal = () => {
    setBladeCode('');
    setAddOpen(true);
  };

  const addBlade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doc) return;
    if (!bladeCode.trim()) return error('Podaj ID piły (blade_code)');
    setAdding(true);
    try {
      // 1) resolve blade by code
      const { data: b, error: be } = await supabase
        .from('blades')
        .select('id, blade_code, client_id')
        .eq('blade_code', bladeCode.trim())
        .single();
      if (be || !b) throw new Error('Nie znaleziono piły o podanym ID');

      // 2) ensure blade belongs to doc client
      if (b.client_id !== doc.client_id) {
        throw new Error('Ta piła nie należy do klienta z dokumentu');
      }

      // 3) insert row into wzpz_items
      const { error: ie } = await supabase
        .from('wzpz_items')
        .insert({ doc_id: doc.id, blade_id: b.id });
      if (ie && (ie as any).code !== '23505') throw ie; // ignore duplicate

      success(`Dodano piłę ${b.blade_code} do dokumentu`);
      setAddOpen(false);
      await load();
    } catch (e: any) {
      console.error('Add blade failed', e);
      error(e?.message || 'Nie udało się dodać piły');
    } finally {
      setAdding(false);
    }
  };

  const closeDoc = async () => {
    if (!doc) return;
    try {
      const { error: ue } = await supabase
        .from('wzpz_docs')
        .update({ status: 'closed' })
        .eq('id', doc.id);
      if (ue) throw ue;
      success('Dokument został zamknięty');
      await load();
    } catch (e) {
      console.error('Close doc failed', e);
      error('Nie udało się zamknąć dokumentu');
    }
  };

  // ---- UI ---------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-gray-500">
        Ładowanie...
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={() => nav(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Wróć
        </Button>
        <div>Nie znaleziono dokumentu.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center">
            <Button variant="ghost" onClick={() => nav(-1)} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold">
                WZ/PZ
              </h1>
              <p className="text-gray-600">{doc.human_id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Doc info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle>Informacje o dokumencie</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-4">
              <div>
                <div className="text-sm text-gray-500">Numer</div>
                <div className="font-medium">{doc.human_id}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Typ</div>
                <div className="font-medium">{doc.type}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Klient</div>
                <div className="font-medium">
                  {client ? `${client.name}${client.code2 ? ` (${client.code2})` : ''}` : '—'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <div>
                  {doc.status === 'open' ? (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      Otwarte
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      Zamknięte
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Items */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pozycje (piły)</CardTitle>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); openAddModal(); }}
                    disabled={!isOpen}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Dodaj piłę
                  </Button>
                  {isOpen ? (
                    <Button type="button" variant="outline" onClick={closeDoc}>
                      <Lock className="h-4 w-4 mr-2" />
                      Zakończ dokument
                    </Button>
                  ) : (
                    <Button type="button" variant="outline" disabled>
                      <Unlock className="h-4 w-4 mr-2" />
                      Dokument zamknięty
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Piły</TableHead>
                    <TableHead>Specyfikacja</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500">
                        Brak pozycji
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((row, i) => (
                      <motion.tr
                        key={row.blade_id + i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-muted/40"
                      >
                        <TableCell className="font-medium">{row.blades?.blade_code ?? '—'}</TableCell>
                        <TableCell>{spec(row.blades)}</TableCell>
                        <TableCell>{row.blades?.status ?? '—'}</TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Add Blade Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Dodaj piłę do dokumentu</DialogTitle>
          </DialogHeader>

          <form onSubmit={addBlade} className="space-y-4">
            <div className="space-y-2">
              <Label>ID piły (blade_code) *</Label>
              <Input
                placeholder="np. BLD01"
                value={bladeCode}
                onChange={(e) => setBladeCode(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-gray-500">
                Piła musi należeć do tego samego klienta co dokument.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Anuluj
              </Button>
              <Button type="submit" disabled={adding}>
                {adding ? 'Dodawanie...' : 'Dodaj'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
