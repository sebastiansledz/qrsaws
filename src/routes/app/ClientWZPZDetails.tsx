import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/common/PageHeader';

import { supabase } from '../../lib/supabase';
import useAuth from '../../hooks/useAuth';
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
  created_by: string | null;
  closed_at: string | null;
  closed_by: string | null;
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
      spec: string | null;
    } | null;
  }>;
};

const isUUID = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

const SELECT =
  'id,type,client_id,human_id,status,created_at,created_by,closed_at,closed_by,' +
  'items:wzpz_items(blade_id,added_at,blade:blades(id,blade_code,width_mm,thickness_mm,length_mm,status,spec))';

export default function ClientWZPZDetails() {
  const { id: raw = '' } = useParams();
  const idParam = decodeURIComponent(raw);
  const nav = useNavigate();
  const { profile } = useAuth();
  const { error } = useNotify();

  const [doc, setDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDoc = useCallback(async (param: string): Promise<Doc | null> => {
    if (!profile?.client_id) return null;

    if (isUUID(param)) {
      const { data, error: de } = await supabase
        .from('wzpz_docs')
        .select(SELECT)
        .eq('id', param)
        .eq('client_id', profile.client_id) // Only allow access to own docs
        .maybeSingle<Doc>();
      if (de) throw de;
      return data ?? null;
    } else {
      const { data, error: he } = await supabase
        .from('wzpz_docs')
        .select(SELECT)
        .eq('human_id', param)
        .eq('client_id', profile.client_id) // Only allow access to own docs
        .maybeSingle<Doc>();
      if (he) throw he;
      return data ?? null;
    }
  }, [profile?.client_id]);

  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    (async () => {
      setLoading(true);
      try {
        const d = await fetchDoc(idParam);
        if (!d) throw new Error('Nie znaleziono dokumentu lub brak uprawnień');
        setDoc(d);
      } catch (e: any) {
        console.error('ClientWZPZDetails load error', e);
        error(e?.message || 'Błąd ładowania dokumentu');
      } finally {
        setLoading(false);
      }
    })();
  }, [idParam, fetchDoc, error]);

  const spec = (b: Doc['items'][number]['blade'] | null | undefined) =>
    b ? (b.spec || `${b.width_mm ?? '—'}×${b.thickness_mm ?? '—'}×${b.length_mm ?? '—'}mm`) : '—';

  if (loading) {
    return <div className="min-h-[40vh] flex items-center justify-center text-gray-500">Ładowanie…</div>;
  }

  if (!doc) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dokument WZ/PZ" showBack />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Nie znaleziono dokumentu</h2>
            <p className="text-gray-600">Dokument nie istnieje lub nie masz do niego uprawnień.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dokument WZ/PZ" 
        subtitle={doc.human_id}
        showBack 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader><CardTitle>Informacje o dokumencie</CardTitle></CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-4">
              <div>
                <div className="text-sm text-gray-500">Numer</div>
                <div className="font-medium">{doc.human_id}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Typ</div>
                <div className="font-medium">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    doc.type === 'WZ' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'bg-cyan-50 text-cyan-700'
                  }`}>
                    {doc.type === 'WZ' ? 'Wydanie zewnętrzne' : 'Przyjęcie zewnętrzne'}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Data utworzenia</div>
                <div className="font-medium">{new Date(doc.created_at).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <div>
                  {doc.status === 'open'
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
            <CardHeader>
              <CardTitle>Pozycje (piły)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Piły</TableHead>
                    <TableHead>Specyfikacja</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data dodania</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!doc.items?.length ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">Brak pozycji</TableCell>
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
                        <TableCell>{new Date(row.added_at).toLocaleString()}</TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}