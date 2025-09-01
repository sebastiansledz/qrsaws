import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit, Settings, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useForm } from 'react-hook-form';
import { listClientsLite, createClientSB, updateClientSB } from '../../lib/queriesSupabase';
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
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [machines, setMachines] = useState<any[]>([]);
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [showMachinesDialog, setShowMachinesDialog] = useState(false);
  const [showMachineForm, setShowMachineForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [localError, setLocalError] = useState<string | undefined>();

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

  if (localError) {
    return (
      <div className="text-center py-8">
        <p className="text-error-600">{localError}</p>
      </div>
    );
  }

  const loadMachines = async (clientId: string) => {
    try {
      // TODO: Implement getMachines for Supabase
      const machinesData: any[] = [];
      setMachines(machinesData);
    } catch (error) {
      console.error('Error loading machines:', error);
      setMachines([]);
    }
  };

  const handleAddClient = () => {
    setEditingClient(null);
    clientForm.reset();
    setShowClientDialog(true);
  };

  const handleEditClient = (client: any) => {
    setEditingClient(client);
    clientForm.reset({
      name: client.name,
      code2: client.code2 || '',
      nip: client.nip || '',
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
    });
    setShowClientDialog(true);
  };

  const handleShowMachines = async (client: any) => {
    setSelectedClient(client);
    await loadMachines(client.id);
    setShowMachinesDialog(true);
  };

  const onSubmitClient = async (data: ClientFormData) => {
    try {
      const payload = {
        ...data,
        code2: (data.code2 || '').trim().toUpperCase(),
      };

      if (editingClient) {
        const updated = await updateClientSB(editingClient.id, payload);
        refetch(); // Refresh data via React Query
        success('Zapisano zmiany klienta.');
      } else {
        const created = await createClientSB(payload);
        refetch(); // Refresh data via React Query
        success('Dodano klienta.');
      }

      setShowClientDialog(false);
    } catch (error) {
      console.error('Error saving client:', error);
      notifyError((error as any)?.message || 'Nie udało się zapisać klienta');
    }
  };

  const onSubmitMachine = async (data: MachineFormData) => {
    try {
      // TODO: Implement machine creation for Supabase
      success('Dodawanie maszyn będzie dostępne wkrótce');
      setShowMachineForm(false);
      if (selectedClient) {
        await loadMachines(selectedClient.id);
      }
    } catch (error) {
      console.error('Error saving machine:', error);
      error('Nie udało się zapisać maszyny');
    }
  };


  return (
    <div className="space-y-6">
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
  className="flex justify-between items-center">
  <h2 className="text-2xl font-bold text-gray-900">Zarządzanie klientami</h2>
  <Button onClick={handleAddClient}>
    <Plus className="h-4 w-4 mr-2" />
    Dodaj klienta
  </Button>
</motion.div>

    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <Card>
        <CardHeader>
          <CardTitle>Lista klientów</CardTitle>
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
              {rows.map((client, index) => (
                <motion.tr
                  key={client.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>
                    {client.code2 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                        {client.code2}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>{client.email ?? '—'}</TableCell>
                  <TableCell>{client.phone ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClient(client)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShowMachines(client)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-500 py-8">
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
                  <p className="text-sm text-error-600">
                    {clientForm.formState.errors.name.message}
                  </p>
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
                  <p className="text-sm text-error-600">
                    {clientForm.formState.errors.code2.message}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>NIP *</Label>
              <Input
                {...clientForm.register('nip')}
                placeholder="1234567890"
              />
              {clientForm.formState.errors.nip && (
                <p className="text-sm text-error-600">
                  {clientForm.formState.errors.nip.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  {...clientForm.register('phone')}
                  placeholder="+48 123 456 789"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  {...clientForm.register('email')}
                  type="email"
                  placeholder="kontakt@firma.pl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Adres</Label>
              <Input
                {...clientForm.register('address')}
                placeholder="ul. Przykładowa 1, 00-001 Warszawa"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowClientDialog(false)}
              >
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
            <DialogTitle>
              Maszyny - {selectedClient?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowMachineForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Dodaj maszynę
              </Button>
            </div>
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
                {machines.map((machine) => (
                  <TableRow key={machine.id}>
                    <TableCell className="font-medium">{machine.name}</TableCell>
                    <TableCell>{machine.location || '-'}</TableCell>
                    <TableCell>{machine.notes || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
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
        </DialogContent>
      </Dialog>

      {/* Machine Form Dialog */}
      <Dialog open={showMachineForm} onOpenChange={setShowMachineForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj nową maszynę</DialogTitle>
          </DialogHeader>
          <form onSubmit={machineForm.handleSubmit(onSubmitMachine)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nazwa *</Label>
              <Input
                {...machineForm.register('name')}
                placeholder="Trak A"
              />
              {machineForm.formState.errors.name && (
                <p className="text-sm text-error-600">
                  {machineForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Lokalizacja</Label>
              <Input
                {...machineForm.register('location')}
                placeholder="Hala produkcyjna A"
              />
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
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMachineForm(false)}
              >
                Anuluj
              </Button>
              <Button type="submit">Dodaj maszynę</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminClients;