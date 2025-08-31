import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit, Settings } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';

import { useForm } from 'react-hook-form';
import { listClientsLite, createClientSB, updateClientSB, listMachinesByClient, createMachine } from '../../lib/queriesSupabase';
import useAuth from '../../hooks/useAuth';
import { Client } from '../../types/client';
import { clientSchema, machineSchema, ClientFormData, MachineFormData } from '../../lib/validators';
import { createFormConfig } from '../../lib/forms';
import { useNotify } from '../../lib/notify';

function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const data = await listClientsLite();
      return data;
    },
  });
}

export const AdminClients: React.FC = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const { success, error: notifyError } = useNotify();
  const { data: rows = [], isLoading: dataLoading, refetch } = useClients();

  // dialogs / forms
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [showMachinesDialog, setShowMachinesDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [machines, setMachines] = useState<any[]>([]);
  const [showMachineForm, setShowMachineForm] = useState(false);

  const clientForm = useForm<ClientFormData>(createFormConfig(clientSchema));
  const machineForm = useForm<MachineFormData>(createFormConfig(machineSchema));

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Brak uprawnień do zarządzania klientami.</p>
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

  // ---- actions ----
  const handleAddClient = () => {
    setEditingClient(null);
    clientForm.reset({
      name: '',
      code2: '',
      nip: '',
      phone: '',
      email: '',
      address: '',
    });
    setShowClientDialog(true);
  };

  const handleEditClient = (client: any) => {
    setEditingClient(client);
    clientForm.reset({
      name: client.name || '',
      code2: client.code2 || '',
      nip: client.nip || '',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
    });
    setShowClientDialog(true);
  };

  const onSubmitClient = async (data: ClientFormData) => {
    try {
      const payload = {
        ...data,
        code2: (data.code2 || '').trim().toUpperCase(),
      };

      if (editingClient) {
        await updateClientSB(editingClient.id, payload);
        success('Zapisano zmiany klienta.');
      } else {
        await createClientSB(payload);
        success('Dodano klienta.');
      }
      setShowClientDialog(false);
      refetch();
    } catch (e: any) {
      console.error('Save client failed', e);
      notifyError(e?.message || 'Nie udało się zapisać klienta');
    }
  };

  const loadMachines = async (clientId: string) => {
    try {
      const list = await listMachinesByClient(clientId);
      setMachines(list);
    } catch (e) {
      console.error('Error loading machines:', e);
      setMachines([]);
      notifyError('Nie udało się pobrać listy maszyn');
    }
  };

  const handleShowMachines = async (client: any) => {
    setSelectedClient(client);
    setShowMachineForm(false);
    await loadMachines(client.id);
    setShowMachinesDialog(true);
  };

  const onSubmitMachine = async (data: MachineFormData) => {
    if (!selectedClient) return;
    try {
      const row = await createMachine({
        client_id: selectedClient.id,
        name: data.name,
        location: data.location || null,
        notes: data.notes || null,
      });
      // optimistic update
      setMachines((prev) => [row, ...prev]);
      setShowMachineForm(false);
      machineForm.reset({ name: '', location: '', notes: '' });
      success('Maszyna została dodana');
    } catch (e: any) {
      console.error('Create machine failed', e);
      notifyError(e?.message || 'Nie udało się dodać maszyny');
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Klienci</CardTitle>
            <Button onClick={handleAddClient}>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj klienta
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nazwa</TableHead>
                  <TableHead>Kod</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((client: any, index: number) => (
                  <motion.tr
                    key={client.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.code2 ?? '—'}</TableCell>
                    <TableCell>{client.email ?? '—'}</TableCell>
                    <TableCell>{client.phone ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation(); // makes sure the dialog opens even inside motion.tr
                            handleEditClient(client);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleShowMachines(client);
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      Brak klientów w systemie
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Client Form Dialog */}
      <Dialog open={showClientDialog} onOpenChange={setShowClientDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Edytuj klienta' : 'Dodaj nowego klienta'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={clientForm.handleSubmit(onSubmitClient)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nazwa *</Label>
                <Input
                  {...clientForm.register('name')}
                  placeholder="Nazwa firmy"
                />
                {clientForm.formState.errors.name && (
                  <p className="text-sm text-error-600">{clientForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Kod klienta *</Label>
                <Input
                  {...clientForm.register('code2')}
                  placeholder="AB"
                  maxLength={2}
                  className="uppercase"
                />
                {clientForm.formState.errors.code2 && (
                  <p className="text-sm text-error-600">{clientForm.formState.errors.code2.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>NIP *</Label>
              <Input {...clientForm.register('nip')} placeholder="1234567890" />
              {clientForm.formState.errors.nip && (
                <p className="text-sm text-error-600">{clientForm.formState.errors.nip.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input {...clientForm.register('phone')} placeholder="+48 600 000 000" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input {...clientForm.register('email')} placeholder="biuro@firma.pl" />
                {clientForm.formState.errors.email && (
                  <p className="text-sm text-error-600">{clientForm.formState.errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Adres</Label>
              <Input {...clientForm.register('address')} placeholder="ul. Przykładowa 1, 00-000 Miasto" />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowClientDialog(false)}>
                Anuluj
              </Button>
              <Button type="submit" disabled={clientForm.formState.isSubmitting}>
                {editingClient ? 'Zapisz zmiany' : 'Dodaj klienta'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Machines Dialog */}
      <Dialog open={showMachinesDialog} onOpenChange={setShowMachinesDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Maszyny — {selectedClient?.name}</DialogTitle>
          </DialogHeader>

          {!showMachineForm && (
            <div className="flex justify-end">
              <Button onClick={() => setShowMachineForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Dodaj maszynę
              </Button>
            </div>
          )}

          {/* Machines list */}
          {!showMachineForm && (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nazwa</TableHead>
                    <TableHead>Lokalizacja</TableHead>
                    <TableHead>Uwagi</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {machines.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>{m.location || '—'}</TableCell>
                      <TableCell>{m.notes || '—'}</TableCell>
                      <TableCell className="text-right">{/* future actions */}</TableCell>
                    </TableRow>
                  ))}
                  {machines.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">
                        Brak maszyn
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Add machine form */}
          {showMachineForm && (
            <form onSubmit={machineForm.handleSubmit(onSubmitMachine)} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Nazwa *</Label>
                <Input {...machineForm.register('name')} placeholder="Trak A" />
                {machineForm.formState.errors.name && (
                  <p className="text-sm text-error-600">{machineForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Lokalizacja</Label>
                <Input {...machineForm.register('location')} placeholder="Hala produkcyjna A" />
              </div>
              <div className="space-y-2">
                <Label>Uwagi</Label>
                <textarea
                  {...machineForm.register('notes')}
                  rows={3}
                  className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Dodatkowe informacje..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowMachineForm(false);
                    machineForm.reset({ name: '', location: '', notes: '' });
                  }}
                >
                  Anuluj
                </Button>
                <Button type="submit">Dodaj maszynę</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminClients;
