import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { PageHeader } from '../../components/common/PageHeader';
import useAuth from '../../hooks/useAuth';
import { getClients, createBlade } from '../../lib/queriesSupabase';
import { Client } from '../../types/client';
import { BLADE_STATUS_CODES } from '../../constants/blade';
import { useNotify } from '../../lib/notify';

const schema = z.object({
  clientId: z.string().min(1, 'Wybierz klienta'),
  machineId: z.string().optional(),
  szerokosc: z.coerce.number().positive('Szerokość musi być większa od 0'),
  grubosc: z.coerce.number().positive('Grubość musi być większa od 0'),
  dlugosc: z.coerce.number().positive('Długość musi być większa od 0'),
  podzialka: z.string().optional(),
  uzebienie: z.string().optional(),
  system: z.string().optional(),
  typPilarki: z.string().optional(),
  statusCode: z.enum(['c0','c1','c2','c3','c4','c5','c6','c7','c8','c9','c10','c11','c12','c13','c14']).default('c0'),
  notes: z.string().optional(),
});

type FormVals = z.infer<typeof schema>;

export const AdminBladeNew: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAuth();
  const { success, error } = useNotify();
  const [clients, setClients] = useState<Client[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [localError, setLocalError] = useState<string | undefined>();


  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormVals>({
    resolver: zodResolver(schema),
    defaultValues: { statusCode: 'c0' }
  });

  useEffect(() => {
    if (loading) return;
    if (!isAdmin) {
      navigate('/admin');
      return;
    }
    
    (async () => {
      try {
        const clientsData = await getClients() as Client[];
        setClients(clientsData);
      } catch (error) {
        console.error('Error loading clients:', error);
        setLocalError('Nie udało się załadować listy klientów.');
      } finally {
        setDataLoading(false);
      }
    })();
  }, [loading, isAdmin, navigate]);

  const onSubmit = async (values: FormVals) => {
    if (!isAdmin) return;

    try {
      const result = await createBlade({
        blade_code: `BS-${Date.now()}`,
        client_id: values.clientId,
        width_mm: values.szerokosc,
        thickness_mm: values.grubosc,
        length_mm: values.dlugosc,
        pitch: values.podzialka,
        machine: values.machineId,
        spec: `${values.uzebienie} ${values.system} ${values.typPilarki}`.trim(),
        status: values.statusCode,
      });


      success('Piła została utworzona pomyślnie');
      navigate(`/admin/blade/${result.blade_code}`);
    } catch (error) {
      console.error('Error creating blade:', error);
      error('Błąd podczas tworzenia piły. Spróbuj ponownie.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Brak uprawnień do dodawania pił.</p>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (localError) {
    return (
      <div className="text-center py-8">
        <p className="text-error-600">{localError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        title="Dodaj nową piłę"
        subtitle="Wypełnij formularz aby dodać piłę do systemu"
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
                {/* Client Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Klient *
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
                        {client.name} ({client.code2})
                      </option>
                    ))}
                  </select>
                  {errors.clientId && (
                    <p className="text-sm text-error-600">{errors.clientId.message}</p>
                  )}
                </div>

                {/* Specifications */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Specyfikacja</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Szerokość (mm) *
                      </label>
                      <Input
                        {...register('szerokosc')}
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
                        Grubość (mm) *
                      </label>
                      <Input
                        {...register('grubosc')}
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
                        Długość (mm) *
                      </label>
                      <Input
                        {...register('dlugosc')}
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
                        Podziałka
                      </label>
                      <Input
                        {...register('podzialka')}
                        placeholder="22mm"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Uzębienie
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
                        System
                      </label>
                      <Input
                        {...register('system')}
                        placeholder="Metric"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Typ pilarki
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
                    Status
                  </label>
                  <select
                    {...register('statusCode')}
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {Object.entries(BLADE_STATUS_CODES).map(([code, labelKey]) => (
                      <option key={code} value={code}>
                        {code} - {labelKey.split('.').pop()}
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
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Tworzenie...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Utwórz piłę
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

export default AdminBladeNew;