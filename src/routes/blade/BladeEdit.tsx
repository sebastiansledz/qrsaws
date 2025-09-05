import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Package, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PageHeader } from '../../components/common/PageHeader';
import { bladeSchema, BladeFormData } from '../../lib/validators';
import { createFormConfig } from '../../lib/forms';
import { createBlade, getClients, getMachines } from '../../lib/queriesSupabase';
import useAuth from '../../hooks/useAuth';
import { BLADE_STATUS_CODES } from '../../constants/blade';
import { useNotify } from '../../lib/notify';
import { supabase } from '../../lib/supabase';

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export const BladeEdit: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const { user } = useAuth();
  const { success, error } = useNotify();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<BladeFormData>(
    createFormConfig(bladeSchema, {
      statusCode: 'c0',
    })
  );

  const watchedClientId = watch('clientId');

  // Load blade data and clients on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsData] = await Promise.all([
          getClients(),
        ]);
        setClients(clientsData);

        // Load blade data
        const bladeId = decodeURIComponent(id);
        const field = isUuid(bladeId) ? 'id' : 'blade_code';
        
        const { data: bladeData, error: bladeError } = await supabase
          .from('blades')
          .select('*')
          .eq(field, bladeId)
          .maybeSingle();
          
        if (bladeError) throw bladeError;
        if (!bladeData) throw new Error('Blade not found');

        // Populate form with existing data
        reset({
          bladeId: bladeData.blade_code,
          clientId: bladeData.client_id || '',
          machineId: bladeData.machine || '',
          szerokosc: bladeData.width_mm || 0,
          grubosc: bladeData.thickness_mm || 0,
          dlugosc: bladeData.length_mm || 0,
          podzialka: bladeData.pitch || '',
          uzebienie: bladeData.spec?.split(' ')[0] || '',
          system: bladeData.spec?.split(' ')[1] || '',
          typPilarki: bladeData.spec?.split(' ')[2] || '',
          statusCode: (bladeData.status || 'c0') as any,
          notes: bladeData.notes || '',
        });

        setSelectedClientId(bladeData.client_id || '');
      } catch (error) {
        console.error('Error loading blade data:', error);
        error('Błąd podczas ładowania danych piły');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, reset, error]);

  // Load machines when client changes
  useEffect(() => {
    if (watchedClientId && watchedClientId !== selectedClientId) {
      setSelectedClientId(watchedClientId);
      const loadMachines = async () => {
        try {
          const machinesData = await getMachines(watchedClientId);
          setMachines(machinesData);
        } catch (error) {
          console.error('Error loading machines:', error);
          setMachines([]);
        }
      };
      loadMachines();
    }
  }, [watchedClientId, selectedClientId]);

  const onSubmit = async (data: BladeFormData) => {
    if (!user) return;

    setSaving(true);
    try {
      const bladeId = decodeURIComponent(id);
      const field = isUuid(bladeId) ? 'id' : 'blade_code';

      // Update blade via Supabase
      const { error: updateError } = await supabase
        .from('blades')
        .update({
          blade_code: data.bladeId,
          client_id: data.clientId,
          width_mm: data.szerokosc,
          thickness_mm: data.grubosc,
          length_mm: data.dlugosc,
          pitch: data.podzialka,
          machine: data.machineId,
          spec: `${data.uzebienie} ${data.system} ${data.typPilarki}`.trim(),
          status: data.statusCode,
          notes: data.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq(field, bladeId);
      
      if (updateError) throw updateError;
      
      success(`Piła ${data.bladeId} została zaktualizowana pomyślnie`);
      navigate(`/admin/blade/${encodeURIComponent(data.bladeId)}`);
    } catch (error) {
      console.error('Error updating blade:', error);
      error('Błąd podczas aktualizacji piły. Spróbuj ponownie.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <PageHeader
        title="Edytuj piłę"
        subtitle="Zaktualizuj dane piły w systemie"
        showBack
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-primary-600" />
                <span>Dane piły</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t('blade.bladeId')} *
                    </label>
                    <Input
                      {...register('bladeId')}
                      placeholder="np. BS-001-2024"
                      className={errors.bladeId ? 'border-error-500' : ''}
                    />
                    {errors.bladeId && (
                      <p className="text-sm text-error-600">{errors.bladeId.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t('blade.client')} *
                    </label>
                    <select
                      {...register('clientId')}
                      className={`flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        errors.clientId ? 'border-error-500' : ''
                      }`}
                    >
                      <option value="">Wybierz klienta</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name} {client.code2 ? `(${client.code2})` : ''}
                        </option>
                      ))}
                    </select>
                    {errors.clientId && (
                      <p className="text-sm text-error-600">{errors.clientId.message}</p>
                    )}
                  </div>
                </div>

                {/* Machine (optional) */}
                {machines.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Maszyna (opcjonalnie)
                    </label>
                    <select
                      {...register('machineId')}
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="">Brak przypisania</option>
                      {machines.map((machine) => (
                        <option key={machine.id} value={machine.id}>
                          {machine.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Specifications */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Specyfikacja</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        {t('blade.specs.width')} *
                      </label>
                      <Input
                        {...register('szerokosc', { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        placeholder="25"
                        className={errors.szerokosc ? 'border-error-500' : ''}
                      />
                      {errors.szerokosc && (
                        <p className="text-sm text-error-600">{errors.szerokosc.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        {t('blade.specs.thickness')} *
                      </label>
                      <Input
                        {...register('grubosc', { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        placeholder="0.8"
                        className={errors.grubosc ? 'border-error-500' : ''}
                      />
                      {errors.grubosc && (
                        <p className="text-sm text-error-600">{errors.grubosc.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        {t('blade.specs.length')} *
                      </label>
                      <Input
                        {...register('dlugosc', { valueAsNumber: true })}
                        type="number"
                        placeholder="2500"
                        className={errors.dlugosc ? 'border-error-500' : ''}
                      />
                      {errors.dlugosc && (
                        <p className="text-sm text-error-600">{errors.dlugosc.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        {t('blade.specs.pitch')}
                      </label>
                      <Input
                        {...register('podzialka')}
                        placeholder="22mm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        {t('blade.specs.tooth')}
                      </label>
                      <Input
                        {...register('uzebienie')}
                        placeholder="Standard"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        {t('blade.specs.system')}
                      </label>
                      <Input
                        {...register('system')}
                        placeholder="Metric"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        {t('blade.specs.typPilarki')}
                      </label>
                      <Input
                        {...register('typPilarki')}
                        placeholder="Taśmowa"
                      />
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {t('blade.statusLabel')}
                  </label>
                  <select
                    {...register('statusCode')}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {Object.entries(BLADE_STATUS_CODES).map(([code, labelKey]) => (
                      <option key={code} value={code}>
                        {t(labelKey)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Uwagi
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Dodatkowe informacje o pile..."
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
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Zapisywanie...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Zapisz zmiany
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