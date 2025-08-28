import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Package, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PageHeader } from '../../components/common/PageHeader';
import { bladeSchema, BladeFormData } from '../../lib/validators';
import { createFormConfig } from '../../lib/forms';
import { createBlade, getClients } from '../../lib/queriesSupabase';
import useAuth from '../../hooks/useAuth';
import { BLADE_STATUS_CODES } from '../../constants/blade';
import { useNotify } from '../../lib/notify';

export default function BladeNew() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useNotify();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<BladeFormData>(
    createFormConfig(bladeSchema, {
      statusCode: 'c0',
    })
  );

  const watchedClientId = watch('clientId');

  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientsData = await getClients();
        setClients(clientsData);
      } catch (err) {
        console.error('Error loading clients:', err);
      }
    };
    loadClients();
  }, []);

  useEffect(() => {
    if (watchedClientId && watchedClientId !== selectedClientId) {
      setSelectedClientId(watchedClientId);
      const loadMachines = async () => {
        try {
          // TODO: Implement getMachines for Supabase
          const machinesData: any[] = [];
          setMachines(machinesData);
          setValue('machineId', '');
        } catch (err) {
          console.error('Error loading machines:', err);
          setMachines([]);
        }
      };
      loadMachines();
    }
  }, [watchedClientId, selectedClientId, setValue]);

  const onSubmit = async (data: BladeFormData) => {
    if (!user) return;
    setLoading(true);
    try {
      await createBlade({
        blade_code: data.bladeId,
        client_id: data.clientId,
        width_mm: data.szerokosc,
        thickness_mm: data.grubosc,
        length_mm: data.dlugosc,
        pitch: data.podzialka,
        machine: data.machineId,
        spec: `${data.uzebienie} ${data.system} ${data.typPilarki}`.trim(),
        status: data.statusCode,
        notes: data.notes ?? null,
      });

      success(`Piła ${data.bladeId} została utworzona pomyślnie`);
      navigate(`/admin/blade/${data.bladeId}`);
    } catch (err: any) {
      console.error('Error creating blade:', err);
      error('Błąd podczas tworzenia piły. Spróbuj ponownie.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <PageHeader
        title="Dodaj nowe ostrze"
        subtitle="Wypełnij formularz aby dodać ostrze do systemu"
        showBack
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-primary-600" />
                <span>Dane ostrza</span>
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
                        {t('blade.specs.szerokosc')} *
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
                        {t('blade.specs.grubosc')} *
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
                        {t('blade.specs.dlugosc')} *
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
                        {t('blade.specs.podzialka')}
                      </label>
                      <Input {...register('podzialka')} placeholder="22mm" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        {t('blade.specs.uzebienie')}
                      </label>
                      <Input {...register('uzebienie')} placeholder="Standard" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        {t('blade.specs.system')}
                      </label>
                      <Input {...register('system')} placeholder="Metric" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        {t('blade.specs.typPilarki')}
                      </label>
                      <Input {...register('typPilarki')} placeholder="Taśmowa" />
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
                  <label className="text-sm font-medium text-gray-700">Uwagi</label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Dodatkowe informacje o ostrzu..."
                  />
                </div>

                {/* Submit */}
                <div className="flex space-x-4 pt-6">
                  <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
                    Anuluj
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Tworzenie...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Utwórz ostrze
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
}
