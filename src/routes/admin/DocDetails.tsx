import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  // nested
  client?: { id: string; name: string; code2: string | null } | null;
  items?: Array<{
    blade_id: string;
    added_at: string;
    blade: {
      id: string;
      blade_code: string;
      width_mm: number | null;
      thickness_mm: number | null;
      length_mm: number | null;
      status: string | null;
    } | null;
  }>;
};

const isUUID = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function DocDetails() {
  const { id: rawParam = '' } = useParams();
  const idParam = decodeURIComponent(rawParam);
  const nav = useNavigate();
  const { success, error } = useNotify();

  const [doc, setDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);

  // Add blade modal
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [bladeCode, setBladeCode] = useState('');

  const isOpen = doc?.status === 'open';

  // ---- ONE query with nested relations (reduces concurrent requests) ----
  const fetchDocOnce = useCallback(async (param: string): Promise<Doc | null> => {
    // Build a single select with FK joins:
    // - client: clients!wzpz_docs_client_id_fkey
    // - items: wzpz_items with blade join blades!wzpz_items_blade_id_fkey
    const SELECT =
      'id,type,client_id,human_id,status,created_at,' +
      'client:clients!wzpz_docs_client_id_fkey(id,name,code2),' +
      'items:wzpz_items(blade_id,added_at,blade:blades!wzpz_items_blade_id_fkey(id,blade_code,width_mm,thickness_mm,length_mm,status))';

    if (isUUID(param)) {
      const { data, error } = await supabase
        .from('wzpz_docs')
        .select(SELECT)
        .eq('id', param)
        .maybeSingle<Doc>();
      if (error) throw error;
      return data ?? null;
    } else {
      const { data, error } = await supabase
        .from('wzpz_docs')
        .select(SELECT)
        .eq('human_id', param)
        .maybeSingle<Doc>();
      if (error) throw error;
      return data ?? null;
    }
  }, []);

  // Tiny retry specifically for preview/network hiccups
  const fetchWithRetry = useCallback(
    async (param: string) => {
      try {
        return await fetchDocOnce(param);
      } catch (e: any) {
        const msg = String(e?.message || e);
        if (/failed to fetch|timeout|network/i.test(msg)) {
          // one short retry
          await sleep(350);
          return await fetchDocOnce(param);
        }
        throw e;
      }
    },
    [fetchDocOnce]
  );

  // Guard against React 18 StrictMode double-effect in dev
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const d = await fetchWithRetry(idParam);
        if (!mounted) return;
        if (!d) throw new Error('Nie znaleziono dokumentu');
        setDoc(d);
      } catch (e: any) {
        console.error('DocDetails load error', e);
        error({
          message: 'TypeError: Failed to fetch',
          details: String(e?.stack || e?.message || e),
          hint: '',
          code: '',
        } as any);
      } finally {
        mounted && setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [idParam, fetchWithRetry, error]);

  const reloadDoc = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchWithRetry(idParam);
      if (!d) throw new Error('Nie znaleziono dokumentu');
      setDoc(d);
    } catch (e) {
      console.error('Reload doc failed', e);
    } finally {
      setLoading(false);
    }
  }, [fetchWithRetry, idParam]);

  const spec = useMemo(
    () => (b: Doc['items'][number]['blade'] | null | undefined) =>
      b ? `${b.width_mm ?? '—'}×${b.thickness_mm ?? '—'}×${b.length_mm ?? '—'}mm` : '—',
    []
  );

  // ---- Actions -----------------------------------------------------------
  const openAddModal = () => {
    setBladeCode('');
    setAddOpen(true);
  };

  const addBlade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doc) return;
    const code = bladeCode.trim();
    if (!code) return error('Podaj ID piły (blade_code)');
    setAdding(true);
    try {
      const { data: b, error: be } = await supabase
        .from('blades')
        .select('id, blade_code, client_id')
        .eq('blade_code', code)
        .maybeSingle();
      if (be) throw be;
      if (!b) throw new Error('Nie znaleziono piły o podanym ID');

      if (b.client_id !== doc.client_id) {
        throw new Error('Ta piła nie należy do klienta z dokumentu');
      }

      const { error: ie } = await supabase
        .from('wzpz_items')
        .insert({ doc_id: doc.id, blade_id: b.id });
      // ignore duplicate adds
      if (ie && (ie as any).code !== '23505') throw ie;

      success(`Dodano piłę ${b.blade_code} do dokumentu`);
      setAddOpen(false);
      await reloadDoc();
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
      await reloadDoc();
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
              <h1 className="text-2xl md:text-3xl font-extrabold">WZ/PZ</h1>
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
                  {doc.client ? `${doc.client.name}${doc.client.code2 ? ` (${doc.client.code2})` : ''}` : '—'}
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
                  {!doc.items?.length ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500">
                        Brak pozycji
                      </TableCell>
                    </TableRow>
                  ) : (
                    doc.items.map((row, i) => (
                      <motion.tr
                        key={row.blade_id + i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-muted/40"
                      >
                        <TableCell className="font-medium">{row.blade?.blade_code ?? '—'}</TableCell>
                        <TableCell>{spec(row.blade)}</TableCell>
                        <TableCell>{row.blade?.status ?? '—'}</TableCell>
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
