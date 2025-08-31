import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, Download, Printer, Edit, Clock, FileText } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusPill } from '../../components/common/StatusPill';
import { supabase } from '../../lib/supabase';
import { generateQRPNG, downloadQR, printQRLabel } from '../../lib/qr';

type BladeRow = {
  id: string;
  blade_code: string;
  client_id: string | null;
  width_mm: number | null;
  thickness_mm: number | null;
  length_mm: number | null;
  pitch: string | null;
  spec: string | null;
  machine: string | null;
  status: string | null;
};

type ClientRow = { id: string; name: string; code2: string | null };

type MovementRow = {
  id: string;
  blade_id: string;
  type: 'scan_in' | 'scan_out' | 'service_in' | 'service_out' | 'ship_in' | 'ship_out';
  service_ops: string[] | null;
  note: string | null;
  created_at: string;
};

type DocRow = { id: string; human_id: string; type: 'WZ' | 'PZ'; created_at: string };

const isUUID = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

const opLabel = (t: MovementRow['type']) => {
  switch (t) {
    case 'scan_in': return 'ST1';
    case 'scan_out': return 'ST2';
    case 'service_in': return 'WZ';
    case 'service_out': return 'PZ';
    case 'ship_in': return 'MD';
    case 'ship_out': return 'MAG';
    default: return t.toUpperCase();
  }
};

export const BladeDetails: React.FC = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [blade, setBlade] = useState<BladeRow | null>(null);
  const [client, setClient] = useState<ClientRow | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const ident = decodeURIComponent(id);
        const field = isUUID(ident) ? 'id' : 'blade_code';

        const { data: bladeRow, error: bErr } = await supabase
          .from('blades')
          .select('id, blade_code, client_id, width_mm, thickness_mm, length_mm, pitch, spec, machine, status')
          .eq(field, ident)
          .maybeSingle();
        if (bErr) throw bErr;
        if (!bladeRow) throw new Error('Blade not found');
        if (!cancelled) setBlade(bladeRow);

        if (bladeRow.client_id) {
          try {
            const { data: cRow, error: cErr } = await supabase
              .from('clients')
              .select('id, name, code2')
              .eq('id', bladeRow.client_id)
              .maybeSingle();
            if (cErr) throw cErr;
            if (!cancelled) setClient(cRow ?? null);
          } catch (e) {
            console.error('BladeDetails client error', e);
          }
        } else {
          if (!cancelled) setClient(null);
        }

        try {
          const qr = await generateQRPNG(bladeRow.blade_code);
          if (!cancelled) setQrDataUrl(typeof qr === 'string' ? qr : String(qr));
        } catch (e) {
          console.error('QR generate error', e);
        }

        try {
          const { data: mv, error: mErr } = await supabase
            .from('movements')
            .select('id, blade_id, type, service_ops, note, created_at')
            .eq('blade_id', bladeRow.id)
            .order('created_at', { ascending: false })
            .limit(30);
          if (mErr) throw mErr;
          if (!cancelled) setMovements(mv ?? []);
        } catch (e) {
          console.error('Movements load error', e);
          if (!cancelled) setMovements([]);
        }

        try {
          const { data: items, error: iErr } = await supabase
            .from('wzpz_items')
            .select('doc_id')
            .eq('blade_id', bladeRow.id);
          if (iErr) throw iErr;

          const docIds = (items ?? []).map((x: any) => x.doc_id);
          if (docIds.length) {
            const { data: dRows, error: dErr } = await supabase
              .from('wzpz_docs')
              .select('id, human_id, type, created_at')
              .in('id', docIds)
              .order('created_at', { ascending: false });
            if (dErr) throw dErr;
            if (!cancelled) setDocs((dRows ?? []) as DocRow[]);
          } else {
            if (!cancelled) setDocs([]);
          }
        } catch (e) {
          console.error('WZPZ docs load error', e);
          if (!cancelled) setDocs([]);
        }
      } catch (e) {
        console.error('BladeDetails load error', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const width = blade?.width_mm ?? '—';
  const thick = blade?.thickness_mm ?? '—';
  const length = blade?.length_mm ?? '—';
  const pitch = blade?.pitch ?? '—';
  const tooth = blade?.spec ?? '—';
  const sawType = blade?.machine ?? '—';

  const headerTitle = blade ? `Piła ${blade.blade_code}` : 'Piła';
  const headerSubtitle = client ? `${client.name} (${client.code2 ?? '—'})` : undefined;

  const handleEdit = () => { if (blade) navigate(`/admin/blade/${encodeURIComponent(blade.blade_code)}/edit`); };

  const handleDownloadQR = async () => {
    if (!blade) return;
    const filename = `${blade.blade_code}.png`;
    if (qrDataUrl) {
      try {
        const a = document.createElement('a');
        a.href = qrDataUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      } catch (e) {
        console.error('Direct QR download failed, fallback to helper', e);
      }
    }
    try { await downloadQR(blade.blade_code); } catch (e) { console.error('downloadQR helper failed', e); }
  };

  const handlePrintLabel = async () => { if (blade) { try { await printQRLabel(blade.blade_code); } catch {} } };

  return (
    <>
      {/* FULL-WIDTH HEADER (outside container so its background spans the page) */}
      <PageHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        showBack
        actions={
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edytuj
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrintLabel}>
              <Printer className="h-4 w-4 mr-2" />
              Drukuj
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadQR}>
              <Download className="h-4 w-4 mr-2" />
              Pobierz QR
            </Button>
          </div>
        }
      />
      {/* CONSTRAINED CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-20 md:pb-6 mt-8">
        {/* Top: QR (left) + Info (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* QR card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <QrCode className="h-5 w-5 text-primary-600" />
                  <span>Kod QR</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="w-full flex items-center justify-center">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR" className="w-56 h-56" />
                  ) : (
                    <div className="w-56 h-56 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                      QR
                    </div>
                  )}
                </div>
                <div className="w-full mt-4 space-y-2">
                  <Button className="w-full" variant="outline" onClick={handleDownloadQR}>
                    <Download className="h-4 w-4 mr-2" />
                    Pobierz PNG
                  </Button>
                  <Button className="w-full" onClick={handlePrintLabel}>
                    <Printer className="h-4 w-4 mr-2" />
                    Drukuj etykietę (A7)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Info card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary-600" />
                  <span>Informacje o pile</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-600">ID Piły</div>
                    <div className="font-medium">{blade?.blade_code ?? '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <div className="mt-1"><StatusPill status={(blade?.status ?? 'c0') as any} /></div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Klient</div>
                    <div className="font-medium">{client ? `${client.name} (${client.code2 ?? '—'})` : '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Maszyna</div>
                    <div className="font-medium">{blade?.machine ?? '—'}</div>
                  </div>
                </div>

                {/* Split spec grid (6 items) */}
                <div>
                  <div className="text-sm text-gray-600 mb-3">Specyfikacja</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                      <div className="text-sm text-gray-500">Szerokość:</div>
                      <div className="font-semibold">{width} <span className="font-normal">mm</span></div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Grubość:</div>
                      <div className="font-semibold">{thick} <span className="font-normal">mm</span></div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Długość:</div>
                      <div className="font-semibold">{length} <span className="font-normal">mm</span></div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Podziałka:</div>
                      <div className="font-semibold">{pitch}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Uzębienie:</div>
                      <div className="font-semibold">{tooth}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Typ pilarki:</div>
                      <div className="font-semibold">{sawType}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Movements */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary-600" />
                <span>Historia ruchów (ostatnie 30)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data i czas</TableHead>
                    <TableHead>Operacja</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uwagi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length ? (
                    movements.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{new Date(m.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-medium">
                            {opLabel(m.type)}
                          </span>
                        </TableCell>
                        <TableCell><StatusPill status={(blade?.status ?? 'c0') as any} /></TableCell>
                        <TableCell>{m.note ?? '—'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">Brak ruchów</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        {/* WZPZ documents */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary-600" />
                <span>Dokumenty WZPZ</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numer dokumentu</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Data utworzenia</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.length ? (
                    docs.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.human_id}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            d.type === 'WZ' ? 'bg-emerald-50 text-emerald-700' : 'bg-cyan-50 text-cyan-700'
                          }`}>
                            {d.type === 'WZ' ? 'Wydanie zewnętrzne' : 'Przyjęcie zewnętrzne'}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(d.created_at).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline">Pobierz PDF</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">Brak dokumentów WZPZ</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
};

export default BladeDetails;
