import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Package, ArrowRight, Save, Loader2, FileText } from 'lucide-react';
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

const formSchema = z.object({
  opCode: z.enum(['MD','PZ','SR','ST1','ST2','WZ','MAGAZYN']),
  stateCode: z.enum(['c0','c1','c2','c3','c4','c5','c6','c7','c8','c9','c10','c11','c12','c13','c14']).optional(),
  machineId: z.string().optional(),
  notes: z.string().max(1000).optional(),
  serviceOps: z.array(z.enum(Object.keys(SERVICE_OPS) as [ServiceOpKey, ...ServiceOpKey[]])).optional(),
  // New fields
  clientId: z.string().optional(),              // required for WZ/PZ (recipient/sender)
  docChoice: z.string().optional(),             // 'NEW' or existing doc.id
  hoursWorked: z.coerce.number().optional(),    // for ST2 (fallback 16h)
});

type FormValues = z.infer<typeof formSchema>;

type WZPZDoc = {
  id: string;
  type: 'WZ' | 'PZ';
  client_id: string;
  human_id: string;
  status: 'open' | 'closed';
  year: number; month: number; seq: number;
};

type ClientLite = { id: string; name: string; code2: string };
type MachineLite = { id: string; name: string };

export const ScanAction: React.FC = () => {
  const { bladeId = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useNotify();

  const [blade, setBlade] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // WZ/PZ helpers
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [openDocs, setOpenDocs] = useState<WZPZDoc[]>([]);
  const [machines, setMachines] = useState<MachineLite[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [loadingMachines, setLoadingMachines] = useState(false);

  // Load blade once (mock stays for now)
  useEffect(() => {
    let mounted = true;
    async function loadBlade() {
      try {
        if (bladeId) {
          const mockBlade = {
            bladeId: decodeURIComponent(bladeId),
            clientId: '00000000-0000-0000-0000-CLIENTID', // replace when hooking real query
            szerokosc: 25,
            grubosc: 0.8,
            dlugosc: 2500,
            statusCode: 'c0',
            machineId: null,
          };
          if (mounted) setBlade(mockBlade);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadBlade();
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
      clientId: undefined,
      docChoice: 'NEW',
      hoursWorked: undefined,
    }
  });

  const opCode = watch('opCode');
  const selectedClientId = watch('clientId');

  // Load clients when needed (for WZ/PZ target)
  useEffect(() => {
    let mounted = true;
    async function loadClients() {
      try {
        const { data, error: err } = await supabase
          .from('clients')
          .select('id, name, code2')
          .order('name');
        if (err) throw err;
        if (mounted) setClients(data ?? []);
      } catch (e) { console.error(e); }
    }
    if (opCode === 'WZ' || opCode === 'PZ') loadClients();
    // else keep previous selection
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opCode]);

  // Load open docs when opCode & client chosen
  useEffect(() => {
    let mounted = true;
    async function loadOpenDocs() {
      if (!selectedClientId) { setOpenDocs([]); return; }
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
    }
    if (opCode === 'WZ' || opCode === 'PZ') loadOpenDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opCode, selectedClientId]);

  // Load machines for the chosen client (for ST1/ST2 convenience)
  useEffect(() => {
    let mounted = true;
    async function loadMachines() {
      if (!selectedClientId) { setMachines([]); return; }
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
    }
    if (opCode === 'ST1' || opCode === 'ST2') loadMachines();
  }, [opCode, selectedClientId]);

  // Helper: fetch last ST1 for runtime calculation
  async function getLastST1(blade_id: string) {
    const { data, error: err } = await supabase
      .from('movements')
      .select('*')
      .eq('blade_id', blade_id)
      .eq('op_code', 'ST1')
      .order('created_at', { ascending: false })
      .limit(1);
    if (err) { console.error(err); return null; }
    return data?.[0] ?? null;
  }

  // Helper: create/select WZ/PZ doc and return {id, human_id}
  async function ensureDoc(op: 'WZ'|'PZ', client_id: string) {
    // If user selected existing:
    const choice = watch('docChoice');
    if (choice && choice !== 'NEW') {
      const existing = openDocs.find(d => d.id === choice);
      if (existing) return existing;
    }
    // Create new
    // Need client code2 to form human_id
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

  // Helper: add blade to doc
  async function addItemToDoc(doc_id: string, blade_id: string) {
    const { error: err } = await supabase
      .from('wzpz_items')
      .insert({ doc_id, blade_id });
    if (err) throw err;
  }

  const onSubmit = async (data: FormValues) => {
    if (!user) return;
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

      // Derive hours for ST2 if not provided
      let hoursWorked = data.hoursWorked;
      if (data.opCode === 'ST2' && !hoursWorked) {
        const last = await getLastST1(bladeId);
        if (last?.created_at) {
          const diffMs = Date.now() - new Date(last.created_at).getTime();
          hoursWorked = Math.max(0, diffMs / 3_600_000);
        } else {
          hoursWorked = 16; // default fallback; user may overwrite if you expose the field
        }
      }

      // If WZ/PZ: select or create doc, then add item; capture doc_ref
      let docRef: string | undefined;
      if ((data.opCode === 'WZ' || data.opCode === 'PZ')) {
        if (!data.clientId) throw new Error('Client is required for WZ/PZ');
        const doc = await ensureDoc(data.opCode, data.clientId);
        await addItemToDoc(doc.id, bladeId);
        docRef = doc.human_id;
      }

      await createMovement({
        blade_id: bladeId,
        type: typeMap[data.opCode] as any,
        op_code: data.opCode as any,
        client_id: data.clientId ?? null,
        machine_id: data.machineId ?? null,
        state_code: data.stateCode ?? null,
        hours_worked: hoursWorked ?? null,
        doc_ref: docRef ?? null,
        service_ops: data.serviceOps && data.serviceOps.length ? data.serviceOps : undefined,
        note: data.notes?.trim(),
      } as any);

      success(`Ruch ${data.opCode} został zarejestrowany dla ostrza ${bladeId}`);
      navigate('/app');
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
      <PageHeader title="Rejestruj ruch" subtitle={`Ostrze: ${blade.bladeId}`} showBack />

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
                  <p className="mt-1 font-medium">{blade.bladeId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Aktualny status</label>
                  <div className="mt-1"><StatusPill status={blade.statusCode} /></div>
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
                {/* Operation Code */}
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

                {/* Client selection for WZ/PZ */}
                {(['WZ','PZ'] as const).includes(opCode) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Klient *</label>
                      <select
                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                        {...register('clientId')}
                        defaultValue={''}
                      >
                        <option value="" disabled>— wybierz klienta —</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.code2})</option>
                        ))}
                      </select>
                      {errors.clientId && <p className="text-sm text-error-600">Wybierz klienta</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Dokument {opCode} (istniejący / nowy)
                      </label>
                      <select
                        className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                        {...register('docChoice')}
                        disabled={!selectedClientId || loadingDocs}
                      >
                        <option value="NEW">➕ Utwórz nowy</option>
                        {openDocs.map(d => (
                          <option key={d.id} value={d.id}>{d.human_id}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Machine select for ST1 / ST2 */}
                {(['ST1','ST2'] as const).includes(opCode) && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Maszyna (opcjonalnie)</label>
                    <select
                      {...register('machineId')}
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                      disabled={loadingMachines}
                    >
                      <option value="">— brak —</option>
                      {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                )}

                {/* State Code (optional) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nowy status ostrza (opcjonalnie)</label>
                  <select
                    {...register('stateCode')}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Bez zmiany statusu</option>
                    {Object.entries(BLADE_STATUS_CODES).map(([code, labelKey]) => (
                      <option key={code} value={code}>
                        {code} - {labelKey.split('.').pop()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hours worked (visible for ST2; user can override fallback) */}
                {opCode === 'ST2' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Czas pracy (godz.)</label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      {...register('hoursWorked')}
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Zostanie wyliczony z ST1, domyślnie 16h"
                    />
                  </div>
                )}

                {/* WZ/PZ Document Notice */}
                {(['WZ', 'PZ'] as const).includes(opCode) && (
                  <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <FileText className="h-5 w-5 text-primary-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-primary-900">
                          Dokument {opCode} zostanie powiązany
                        </h4>
                        <p className="text-sm text-primary-700 mt-1">
                          Wybierz istniejący dokument lub utwórz nowy. Ostrze zostanie do niego dodane.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Service Operations (optional) */}
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

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Uwagi</label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Dodatkowe informacje o operacji..."
                  />
                </div>

                {/* Submit */}
                <div className="flex space-x-4 pt-6">
                  <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
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

// Provide both exports so router imports work either way
export default ScanAction;
