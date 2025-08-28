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
import { movementSchema, MovementFormData } from '../../lib/validators';
import { createFormConfig } from '../../lib/forms';
import { Blade, BladeStatusCode } from '../../types/blade';
import { MovementOpCode } from '../../types/movement';
import { MOVEMENT_OP_CODES, BLADE_STATUS_CODES } from '../../constants/blade';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SERVICE_OPS, type ServiceOpKey } from '../../constants/blade';
import { useNotify } from '../../lib/notify';

const formSchema = z.object({
  opCode: z.enum(['MD','PZ','SR','ST1','ST2','WZ','MAGAZYN']),
  stateCode: z.enum(['c0','c1','c2','c3','c4','c5','c6','c7','c8','c9','c10','c11','c12','c13','c14']).optional(),
  machineId: z.string().optional(),
  notes: z.string().max(1000).optional(),
  serviceOps: z.array(z.enum(Object.keys(SERVICE_OPS) as [ServiceOpKey, ...ServiceOpKey[]])).optional()
});

type FormValues = z.infer<typeof formSchema>;

export const ScanAction: React.FC = () => {
  const { bladeId = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useNotify();
  const [blade, setBlade] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load blade & claims once
  useEffect(() => {
    let mounted = true;
    async function loadBlade() {
      try {
        if (bladeId) {
          // TODO: Load blade from Supabase
          const mockBlade = {
            bladeId: decodeURIComponent(bladeId),
            clientId: 'client-1',
            szerokosc: 25,
            grubosc: 0.8,
            dlugosc: 2500,
            statusCode: 'c0',
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
    defaultValues: { opCode: 'WZ', stateCode: undefined, machineId: undefined, notes: '', serviceOps: [] }
  });

  const onSubmit = async (data: FormValues) => {
    if (!user) return;

    setSubmitting(true);
    try {
      // Map old movement types to new Supabase enum
      const typeMap: Record<string, string> = {
        'WZ': 'service_in',      // Przyjąłem piłę
        'PZ': 'service_out',     // Wydałem piłę  
        'ST1': 'scan_in',        // Założyłem na trak
        'ST2': 'scan_out',       // Zdjąłem z traka
        'MD': 'ship_in',         // Magazyn Dostawcy
        'MAGAZYN': 'ship_in',    // Przyjęcie na magazyn iPM
        'SR': 'service_in',      // Przyjąłem od klienta
      };

      await createMovement({
        blade_id: bladeId,
        type: typeMap[data.opCode] as any,
        service_ops: data.serviceOps,
        note: data.notes?.trim(),
      });
      
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
          <Button onClick={() => navigate('/app')}>
            Powrót do panelu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <PageHeader
        title="Rejestruj ruch"
        subtitle={`Ostrze: ${blade.bladeId}`}
        showBack
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Blade Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
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
                  <div className="mt-1">
                    <StatusPill status={blade.statusCode} />
                  </div>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Wybierz akcję</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Operation Code */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Typ operacji *
                  </label>
                  <select 
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" 
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
                  {errors.opCode && (
                    <p className="text-sm text-error-600">{errors.opCode.message}</p>
                  )}
                </div>

                {/* State Code (optional) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Nowy status ostrza (opcjonalnie)
                  </label>
                  <select
                    {...register('stateCode')}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Bez zmiany statusu</option>
                    {Object.entries(BLADE_STATUS_CODES).map(([code, labelKey]) => (
                      <option key={code} value={code}>
                        {code} - {labelKey.split('.').pop()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* WZ/PZ Document Notice */}
                {(['WZ', 'PZ'] as const).includes(watch('opCode')) && (
                  <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <FileText className="h-5 w-5 text-primary-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-primary-900">
                          Dokument {watch('opCode')} zostanie wygenerowany
                        </h4>
                        <p className="text-sm text-primary-700 mt-1">
                          Po zapisaniu ruchu automatycznie zostanie utworzony dokument WZPZ 
                          typu {watch('opCode') === 'WZ' ? 'Wydanie zewnętrzne' : 'Przyjęcie zewnętrzne'}.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Service Operations */}
                {(['WZ','PZ'] as const).includes(watch('opCode')) && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      Operacje serwisowe (opcjonalnie)
                    </label>
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
                  <label className="text-sm font-medium text-gray-700">
                    Uwagi
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Dodatkowe informacje o operacji..."
                  />
                </div>

                {/* Submit */}
                <div className="flex space-x-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="flex-1"
                  >
                    Anuluj
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Zapisywanie...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Zarejestruj ruch
                      </>
                    )}
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