import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusPill } from '../../components/common/StatusPill';
import { supabase } from '../../lib/supabase';

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export const BladeDetails: React.FC = () => {
  const { bladeId = '' } = useParams();
  const [loading, setLoading] = useState(true);
  const [blade, setBlade] = useState<any | null>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const col = isUuid(bladeId) ? 'id' : 'blade_code';
        const val = isUuid(bladeId) ? bladeId : decodeURIComponent(bladeId);
        const { data: b, error: bErr } = await supabase
          .from('blades')
          .select('id, blade_code, client_id, status, width_mm, thickness_mm, length_mm, machine, created_at, updated_at')
          .eq(col, val)
          .maybeSingle();
        if (bErr) throw bErr;
        if (!b) throw new Error('Blade not found');

        if (!cancelled) setBlade(b);

        // last 30 movements
        const { data: mv, error: mErr } = await supabase
          .from('movements')
          .select('created_at, op_code, state_code, note')
          .eq('blade_id', b.id)
          .order('created_at', { ascending: false })
          .limit(30);
        if (mErr) throw mErr;

        // docs joined through wzpz_items
        const { data: items, error: iErr } = await supabase
          .from('wzpz_items')
          .select('doc:wzpz_docs(id, human_id, type, created_at)')
          .eq('blade_id', b.id)
          .order('doc(created_at)', { ascending: false });
        if (iErr) throw iErr;

        if (!cancelled) {
          setMovements(mv ?? []);
          setDocs((items ?? []).map((x) => x.doc).filter(Boolean));
        }
      } catch (e) {
        console.error('BladeDetails load error', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [bladeId]);

  return (
    <div className="space-y-6">
      <PageHeader title={`Piła ${decodeURIComponent(bladeId)}`} showBack />

      {/* Blade summary */}
      <Card>
        <CardHeader><CardTitle>Informacje o pile</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">ID Piły</div>
            <div className="font-medium">{blade?.blade_code ?? '—'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Status</div>
            <div className="mt-1"><StatusPill status={(blade?.status ?? 'c0') as any} /></div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Specyfikacja</div>
            <div className="text-sm">{(blade?.width_mm ?? '—')}×{(blade?.thickness_mm ?? '—')}×{(blade?.length_mm ?? '—')}mm</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Maszyna</div>
            <div className="text-sm">{blade?.machine ?? '—'}</div>
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader><CardTitle>Historia ruchów (ostatnie 30)</CardTitle></CardHeader>
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
              {movements.map((m, idx) => (
                <TableRow key={idx}>
                  <TableCell>{new Date(m.created_at).toLocaleString()}</TableCell>
                  <TableCell><span className="rounded-full bg-blue-50 text-blue-700 px-2 py-1 text-xs font-medium">{m.op_code}</span></TableCell>
                  <TableCell><StatusPill status={(m.state_code ?? 'c0') as any} /></TableCell>
                  <TableCell>{m.note ?? '—'}</TableCell>
                </TableRow>
              ))}
              {!movements.length && !loading && (
                <TableRow><TableCell colSpan={4} className="text-center text-gray-500">Brak ruchów</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Docs */}
      <Card>
        <CardHeader><CardTitle>Dokumenty WZPZ</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numer dokumentu</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Data utworzenia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((d:any) => (
                <TableRow key={d.id}>
                  <TableCell>{d.human_id}</TableCell>
                  <TableCell>{d.type === 'WZ' ? 'Wydanie zewnętrzne' : 'Przyjęcie zewnętrzne'}</TableCell>
                  <TableCell>{new Date(d.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {!docs.length && !loading && (
                <TableRow><TableCell colSpan={3} className="text-center text-gray-500">Brak dokumentów</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BladeDetails;
