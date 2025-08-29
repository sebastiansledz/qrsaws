import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Package, Save, Loader2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PageHeader } from '../../components/common/PageHeader';
import { StatusPill } from '../../components/common/StatusPill';
import useAuth from '../../hooks/useAuth';
import { createMovement } from '../../lib/queriesSupabase';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SERVICE_OPS, type ServiceOpKey, BLADE_STATUS_CODES } from '../../constants/blade';
import { useNotify } from '../../lib/notify';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

// ----- form schema
const formSchema = z.object({
  opCode: z.enum(['MD','PZ','SR','ST1','ST2','WZ','MAGAZYN']),
  stateCode: z.enum(['c0','c1','c2','c3','c4','c5','c6','c7','c8','c9','c10','c11','c12','c13','c14']).optional(),
  machineId: z.string().optional(),
  notes: z.string().max(1000).optional(),
  serviceOps: z.array(z.enum(Object.keys(SERVICE_OPS) as [ServiceOpKey, ...ServiceOpKey[]])).optional(),
  clientId: z.string().optional(),           // WZ/PZ
  docChoice: z.string().optional(),          // 'NEW' | existing doc.id
  hoursWorked: z.coerce.number().optional(), // ST2
});
type FormValues = z.infer<typeof formSchema>;

type WZPZDoc = {
  id: string;
  type: 'WZ'|'PZ';
  client_id: string;
  human_id: string;
  status: 'open'|'closed';
  year: number; month: number; seq: number;
};
type ClientLite = { id: string; name: string; code2: string };
type MachineLite = { id: string; name: string };

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export const ScanAction: React.FC = () => {
  const { t } = useTranslation();
  const { bladeId = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useNotify();

  const [blade, setBlade] = useState<{
    id: string;           // UUID in DB
    code: string;         // human code like BLD01
    client_id: string | null;
    statusCode?: string | null;
    szerokosc?: number; grubosc?: number; dlugosc?: number;
    machineId?: string | null;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [clients, setClients] = useState<ClientLite[]>([]);
  const [openDocs, setOpenDocs] = useState<WZPZDoc[]>([]);
  const [machines, setMachines] = useState<MachineLite[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [loadingMachines, setLoadingMachines] = useState(false);

  // ----- resolve blade (code or UUID) -> DB row
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!bladeId) return;

        let row: any = null;
        if (isUuid(bladeId)) {
          const { data, error: err } = await supabase
            .from('blades')
            .select('id, code, client_id')
            .eq('id', bladeId)
            .maybeSingle();
          if (err) throw err;
          row = data;
        } else {
          const { data, error: err } = await supabase
            .from('blades')
            .select('id, code, client_id')
            .eq('code', decodeURIComponent(bladeId))
            .maybeSingle();
          if (err) throw err;
          row = data;
        }

        if (!row) throw new Error(`Blade not found: ${bladeId}`);

        if (mounted) {
          setBlade({
            id: row.id,
            code: row.code ?? decodeURIComponent(bladeId),
            client_id: row.client_id ?? null,
            statusCode: 'c0', // optional: replace with real status if you store it
            szerokosc: 25, grubosc: 0.8, dlugosc: 2500, // demo display
            machineId: null,
          });
        }
      } catch (e) {
        console.error(e);
        if (mounted) setBlade(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [bladeId]);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      opCode: 'WZ',
      stateCode: undefined,
      machineId: undefined,
      notes: '',
      serviceOps: [],
      clientId: '',
      docChoice: 'NEW',
      hoursWorked: undefined,
    }
  });

  const opCode = watch('opCode');
  const selectedClientId = watch('clientId');

  // ----- clients for WZ/PZ
  useEffect(() => {
    let mounted = true;
    if (!(opCode === 'WZ' || opCode === 'PZ')) return;
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from('clients')
          .select('id, name, code2')
          .order('name');
        if (err) throw err;
        if (mounted) setClients(data ?? []);
      } catch (e) { console.error(e); }
    })();
    return () => { mounted = false; };
  }, [opCode]);

  // ----- open docs for selected client
  useEffect(() => {
    let mounted = true;
    if (!(opCode === 'WZ' || opCode === 'PZ') || !selectedClientId) { setOpenDocs([]); return; }
    (async () => {
      setLoadingDocs(true);
      try {
        const { data, error: err } = await supabase
          .from('wzpz_docs')
          .select('*')
          .eq('type', opCode as 'WZ'|'PZ')
          .eq('client_id', selectedClientId)
          .eq('status', 'open')
          .order('created_at', { ascending: false });
        if (err) throw err;
        if (mounted) setOpenDocs(data ?? []);
      } catch (e) { console.error(e); }
      finally { if (mounted) setLoadingDocs(false); }
    })();
    return () => { mounted = false; };
  }, [opCode, selectedClientId]);

  // ----- machines for ST1/ST2
  useEffect(() => {
    let mounted = true;
    if (!selectedClientId || !(opCode === 'ST1' || opCode === 'ST2')) { setMachines([]); return; }
    (async () => {
      setLoadingMachines(true);
      try {
        const { data, error: err } = await supabase
          .from('machines')
          .select('id, name')
          .eq('client_id', selectedClientId)
          .order('name');
        if (err) throw err;
        if (mounted) setMachines(data ?? []);
      } catch (e) { console.error(e); }
      finally { if (mounted) setLoadingMachines(false); }
    })();
    return () => { mounted = false; };
  }, [opCode, selectedClientId]);

  // ----- helper: last ST1
  async function getLastST1(blade_uuid: string) {
    const { data, error: err } = await supabase
      .from('movements')
      .select('*')
      .eq('blade_id', blade_uuid)
      .eq('op_code', 'ST1')
      .order('created_at', { ascending: false })
      .limit(1);
    if (err) { console.error(err); return null; }
    return data?.[0] ?? null;
  }

  // ----- helper: WZ/PZ doc (existing or new)
  async function ensureDoc(op: 'WZ'|'PZ', client_id: string) {
    const choice = watch('docChoice');
    if (choice && choice !== 'NEW') {
      const existing = openDocs.find(d => d.id === choice);
      if (existing) return existing;
    }
    const { data: client, error: cErr } = await supabase
      .from('clients').select('code2').eq('id', client_id).maybeSingle();
    if (cErr) throw cErr;
    const code2 = client?.code2 ?? 'XX';

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth()+1;
    const { data: last } = await supabase
      .from('wzpz_docs')
      .select('seq')
      .eq('type', op).eq('client_id', client_id)
      .eq('year', year).eq('month', month)
      .order('seq', { ascending: false }).limit(1);
    const seq = (last?.[0]?.seq ?? 0) + 1;
    const human_id = `${op}/${code2}/${year}/${String(month).padStart(2,'0')}/${String(seq).padStart(3,'0')}`;

    const { data: doc, error: dErr } = await supabase
      .from('wzpz_docs')
      .insert({ type: op, client_id, year, month, seq, human_id, created_by: user?.id })
      .select('*').single();
    if (dErr) throw dErr;
    return doc as WZPZDoc;
  }

  async function addItemToDoc(doc_id: string, blade_uuid: string) {
    const { error: err } = await supabase
      .from('wzpz_items')
      .insert({ doc_id, blade_id: blade_uuid });
    if (err) throw err;
  }

  const onSubmit = async (data: FormValues) => {
    if (!user || !blade) return;
    setSubmitting(true);

    try {
      const typeMap: Record<string, string> = {
        'WZ': 'service_in',
        'PZ': 'service_out',
        'ST1': 'scan_in',
        'ST2': 'scan_out',
        'MD': 'ship_in',
        'MAGAZYN': 'ship_in',
        'SR': 'service_in',
      };

      // ST2 runtime (fallback 16h)
      let hoursWorked = data.hoursWorked;
      if (data.opCode === 'ST2' && (hoursWorked == null || Number.isNaN(hoursWorked))) {
        const last = await getLastST1(blade.id);
        if (last?.created_at) {
          const diffMs = Date.now() - new Date(last.created_at).getTime();
          hoursWorked = Math.max(0, diffMs / 3_600_000);
        } else {
          hoursWorked = 16;
        }
      }

      // WZ/PZ doc handling
      let docRef: string | undefined;
      if (data.opCode === 'WZ' || data.opCode === 'PZ') {
        if (!data.clientId) throw new Error('Client is required for WZ/PZ');
        const doc = await ensureDoc(data.opCode, data.clientId);
        await addItemToDoc(doc.id, blade.id);   // <-- use UUID
        docRef = doc.human_id;
      }

      // Create movement (use blade UUID)
      await createMovement({
        blade_id: blade.id,                      // <-- UUID now
        type: typeMap[data.opCode] as any,
        op_code: data.opCode as any,
        client_id: data.clientId ?? blade.client_id ?? null,
        machine_id: data.machineId ?? null,
        state_code: data.stateCode ?? null,
        hours_worked: hoursWorked ?? null,
        doc_ref: docRef ?? null,
        service_ops: data.serviceOps && data.serviceOps.length ? data.serviceOps : undefined,
        note: data.notes?.trim(),
      } as any);

      success(`Ruch ${data.opCode} został zarejestrowany dla ostrza ${blade.code}`);
      navigate('/app', { replace: true });
    } catch (e) {
      console.error(e);
      error('Błąd podczas rejestrowania ruchu');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!blade) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Package className="h-16 w-16 text-gray-400 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-900">Nie znaleziono ostrza</h2>
          <p className="text-gray-600">Ostrze o ID "{bladeId}" nie istnieje w systemie.</p>
          <Button onClick={() => navigate('/app')}>Powrót do panelu</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <PageHeader title="Rejestruj ruch" subtitle={`Ostrze: ${blade.code}`} showBack />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Blade Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-primary-600" />
                <span>Informacje o ostrzu</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">ID Ostrza</label>
                  <p className="mt-1 font-medium">{blade.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Aktualny status</label>
                  <div className="mt-1"><StatusPill status={blade.statusCode ?? 'c0'} /></div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Specyfikacja</label>
                  <p className="mt-1 text-sm text-gray-700">
                    {blade.szerokosc}×{blade.grubosc}×{blade.dlugosc}mm
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Maszyna</label>
                  <p className="mt-1 text-sm text-gray-700">{blade.machineId || '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Movement Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader><CardTitle>Wybierz akcję</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* opCode */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Typ operacji *</label>
                  <select
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    {...register('opCode')}
                  >
                    <option value="WZ">WZ — Przyjąłem piłę</option>
                    <option value="ST1">ST1 — Założyłem na trak</option>
                    <option value="ST2">ST2 — Zdjąłem z traka</option>
                    <option value="PZ">PZ — Wydałem piłę</option>
                    <option value="MD">MD — Magazyn Dostawcy</option>
                    <option value="MAGAZYN">MAGAZYN — Przyjęcie na magazyn iPM</option>
                    <option value="SR">SR — Przyjąłem od klienta</option>
                  </select>
                  {errors.opCode && <p className="text-sm text-error-600">{errors.opCode.message}</p>}
                </div>

                {/* client for WZ/PZ */}
                {(['WZ','PZ'] as const).includes(opCode) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Klient *</label>
                      <select
                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                        {...register('clientId')}
                        defaultValue=""
                      >
                        <option value="" disabled>— wybierz klienta —</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code2})</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Dokument {opCode} (istniejący / nowy)
                      </label>
                      <select
                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                        {...register('docChoice')}
                        disabled={!selectedClientId || loadingDocs}
                        defaultValue="NEW"
                      >
                        <option value="NEW">➕ Utwórz nowy</option>
                        {openDocs.map(d => <option key={d.id} value={d.id}>{d.human_id}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* machine for ST1/ST2 */}
                {(['ST1','ST2'] as const).includes(opCode) && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Maszyna (opcjonalnie)</label>
                    <select
                      {...register('machineId')}
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                      disabled={loadingMachines}
                      defaultValue=""
                    >
                      <option value="">— brak —</option>
                      {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                )}

                {/* state code (optional) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nowy status ostrza (opcjonalnie)</label>
                  <select
                    {...register('stateCode')}
                    defaultValue=""  // keep "no change" by default
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Bez zmiany statusu</option>
                    {Object.entries(BLADE_STATUS_CODES).map(([code, labelKey]) => (
                      <option key={code} value={code}>
                        {code} - {t(labelKey)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* hours for ST2 */}
                {opCode === 'ST2' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Czas pracy (godz.)</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      {...register('hoursWorked')}
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Wyliczymy z ST1, domyślnie 16h"
                    />
                  </div>
                )}

                {/* WZ/PZ info box */}
                {(['WZ', 'PZ'] as const).includes(opCode) && (
                  <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <FileText className="h-5 w-5 text-primary-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-primary-900">Dokument {opCode} zostanie powiązany</h4>
                        <p className="text-sm text-primary-700 mt-1">
                          Wybierz istniejący dokument lub utwórz nowy. Ostrze zostanie do niego dodane.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* service ops (optional) */}
                {(['WZ','PZ'] as const).includes(opCode) && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Operacje serwisowe (opcjonalnie)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(SERVICE_OPS).map(([k, label]) => (
                        <label key={k} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            onChange={(e) => {
                              const cur = new Set(watch('serviceOps') ?? []);
                              if (e.target.checked) cur.add(k as ServiceOpKey); else cur.delete(k as ServiceOpKey);
                              setValue('serviceOps', Array.from(cur) as ServiceOpKey[], { shouldValidate: true });
                            }}
                            checked={(watch('serviceOps') ?? []).includes(k as ServiceOpKey)}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Uwagi</label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Dodatkowe informacje o operacji..."
                  />
                </div>

                {/* actions */}
                <div className="flex space-x-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/app/scanner')}
                    onTouchEnd={() => navigate('/app/scanner')}
                    className="flex-1"
                  >
                    Anuluj
                  </Button>
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Zapisywanie...</>) : (<><Save className="h-4 w-4 mr-2" />Zarejestruj ruch</>)}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ScanAction;
