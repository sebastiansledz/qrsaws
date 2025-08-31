import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, CheckCircle2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/common/PageHeader';
import { useNotify } from '../../lib/notify';
import { supabase } from '../../lib/supabase';
import { addBladeToDoc, closeWZPZDoc, listDocItems } from '../../lib/queriesSupabase';
import useAuth from '../../hooks/useAuth';

type DocRow = {
  id: string;
  type: 'WZ' | 'PZ';
  client_id: string;
  human_id: string;
  status: 'open' | 'closed';
  created_at: string;
  client?: { id: string; name: string; code2: string | null };
};

export default function DocDetails() {
  const { id = '' } = useParams();
  const { isAdmin } = useAuth();
  const { success, error } = useNotify();

  const [doc, setDoc] = useState<DocRow | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [closing, setClosing] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const { data, error: dErr } = await supabase
        .from('wzpz_docs')
        .select('id, type, client_id, human_id, status, created_at, client:clients(id, name, code2)')
        .eq('id', id)
        .maybeSingle();
      if (dErr) throw dErr;
      setDoc(data as any);

      const list = await listDocItems(id);
      setItems(list);
    } catch (e) {
      console.error('Doc load error', e);
      error('Nie udało się wczytać dokumentu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) loadAll(); /* eslint-disable-next-line */ }, [id]);

  const onAddBlade = async () => {
    const code = window.prompt('Podaj ID piły (blade_code):');
    if (!code) return;

    try {
      setAdding(true);
      // translate blade_code -> blade id
      const { data: blade, error: bErr } = await supabase
        .from('blades')
        .select('id, blade_code')
        .eq('blade_code', code)
        .maybeSingle();
      if (bErr) throw bErr;
      if (!blade) throw new Error('Nie znaleziono piły');

      await addBladeToDoc(id, blade.id);
      success('Dodano piłę do dokumentu');
      const list = await listDocItems(id);
      setItems(list);
    } catch (e: any) {
      console.error('Add blade failed', e);
      error(e?.message || 'Nie udało się dodać piły');
    } finally {
      setAdding(false);
    }
  };

  const onCloseDoc = async () => {
    if (!doc || doc.status === 'closed') return;
    if (!window.confirm('Zamknąć dokument?')) return;

    try {
      setClosing(true);
      await closeWZPZDoc(doc.id);
      success('Dokument zamknięty');
      await loadAll();
    } catch (e: any) {
      console.error('Close doc failed', e);
      error(e?.message || 'Nie udało się zamknąć dokumentu');
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <PageHeader title="WZ/PZ" subtitle={doc?.human_id ?? 'Dokument'} showBack />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle>Informacje o dokumencie</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-4">
              <div>
                <div className="text-sm text-gray-600">Numer</div>
                <div className="font-medium">{doc?.human_id ?? '—'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Typ</div>
                <div className="font-medium">{doc?.type ?? '—'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Klient</div>
                <div className="font-medium">
                  {doc?.client?.name ?? '—'}{doc?.client?.code2 ? ` (${doc.client.code2})` : ''}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <div className="font-medium">
                  {doc?.status === 'open'
                    ? <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Otwarte</span>
                    : <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">Zamknięte</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Items */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Pozycje (piły)</CardTitle>
              <div className="space-x-2">
                {isAdmin && doc?.status === 'open' && (
                  <Button onClick={onAddBlade} disabled={adding}>
                    <Plus className="h-4 w-4 mr-2" /> Dodaj piłę
                  </Button>
                )}
                {isAdmin && doc?.status === 'open' && (
                  <Button variant="outline" onClick={onCloseDoc} disabled={closing}>
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Zakończ dokument
                  </Button>
                )}
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
                  {items.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-gray-500">Brak pozycji</TableCell></TableRow>
                  )}
                  {items.map((it: any, idx: number) => {
                    const b = it.blade;
                    return (
                      <motion.tr key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}>
                        <TableCell className="font-medium">{b.blade_code}</TableCell>
                        <TableCell>{[b.width_mm, b.thickness_mm, b.length_mm].filter(Boolean).join('×')}mm</TableCell>
                        <TableCell>{b.status ?? '—'}</TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
