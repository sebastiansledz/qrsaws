import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Eye, Edit, Download, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { StatusPill } from '../../components/common/StatusPill';
import useAuth from '../../hooks/useAuth';
import { getClients, getBlades } from '../../lib/queriesSupabase';
import { Client } from '../../types/client';
import { Blade, BladeStatusCode } from '../../types/blade';
import { BLADE_STATUS_CODES } from '../../constants/blade';
import { useNotify } from '../../lib/notify';

export const AdminBlades: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAuth();
  const { error } = useNotify();
  const [blades, setBlades] = useState<Blade[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [dataError, setDataError] = useState<string | undefined>();


  useEffect(() => {
    if (loading) return;
    if (!isAdmin) return;
    
    loadData();
  }, [loading, isAdmin]);

  const loadData = async () => {
    try {
      const [clientsData] = await Promise.all([
        getClients(),
        getBlades(),
      ]);
      
      setClients(clientsData as Client[]);
      
      // Map Supabase blade data to our Blade type
      const bladesData = await getBlades();
      const mappedBlades: Blade[] = (bladesData as any[]).map(b => ({
        bladeId: b.blade_code,
        clientId: b.client_id,
        szerokosc: b.width_mm || 0,
        grubosc: b.thickness_mm || 0,
        dlugosc: b.length_mm || 0,
        podzialka: b.pitch,
        uzebienie: b.spec,
        system: '',
        typPilarki: b.machine,
        statusCode: (b.status || 'c0') as BladeStatusCode,
        createdAt: new Date(b.created_at),
        updatedAt: new Date(b.updated_at || b.created_at),
        qr: {
          pngPath: `blades/${b.blade_code}.png`,
          svgPath: `blades/${b.blade_code}.svg`,
        },
      }));
      setBlades(mappedBlades);
    } catch (error) {
      console.error('Error loading data:', error);
      setDataError('Nie udało się załadować danych.');
      error('Nie udało się załadować danych pił');
    } finally {
      setDataLoading(false);
    }
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? `${client.name} (${client.code2})` : clientId;
  };

  const filteredBlades = blades.filter(blade => {
    const matchesSearch = blade.bladeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getClientName(blade.clientId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = !selectedClient || blade.clientId === selectedClient;
    const matchesStatus = !selectedStatus || blade.statusCode === selectedStatus;
    
    return matchesSearch && matchesClient && matchesStatus;
  });

  const handleRowClick = (blade: Blade) => {
    navigate(`/admin/blade/${blade.bladeId}`);
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
        <p className="text-gray-600">Brak uprawnień do zarządzania piłami.</p>
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

  if (dataError) {
    return (
      <div className="text-center py-8">
        <p className="text-error-600">{dataError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Zarządzanie piłami</h2>
        <Button onClick={() => navigate('/admin/blade/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Dodaj piłę
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtry i wyszukiwanie</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Wyszukaj</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ID piły lub klient..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Klient</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Wszyscy klienci</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.code2})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Wszystkie statusy</option>
                {Object.entries(BLADE_STATUS_CODES).map(([code, labelKey]) => (
                  <option key={code} value={code}>
                    {code} - {labelKey.split('.').pop()}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedClient('');
                  setSelectedStatus('');
                }}
                className="w-full"
              >
                Wyczyść filtry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista pił ({filteredBlades.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Piły</TableHead>
                <TableHead>Klient</TableHead>
                <TableHead>Maszyna</TableHead>
                <TableHead>Specyfikacja</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ostatni ruch</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBlades.map((blade, index) => (
                <motion.tr
                  key={blade.bladeId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(blade)}
                >
                  <TableCell className="font-medium">{blade.bladeId}</TableCell>
                  <TableCell>{getClientName(blade.clientId)}</TableCell>
                  <TableCell>{blade.machineId || '-'}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{blade.szerokosc}×{blade.grubosc}×{blade.dlugosc}mm</div>
                      <div className="text-gray-500">
                        {blade.podzialka} | {blade.uzebienie}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusPill status={blade.statusCode} />
                  </TableCell>
                  <TableCell>
                    {blade.lastMovementAt?.toLocaleDateString('pl-PL') || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/blade/${blade.bladeId}`);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/blade/${blade.bladeId}/edit`);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
              {filteredBlades.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    {searchTerm || selectedClient || selectedStatus 
                      ? 'Brak pił spełniających kryteria wyszukiwania'
                      : 'Brak pił w systemie'
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBlades;