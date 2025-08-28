import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Search, Filter, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { StatusPill } from '../../components/common/StatusPill';
import { PageHeader } from '../../components/common/PageHeader';
import useAuth from '../../hooks/useAuth';
import { Blade } from '../../types/blade';
import { BLADE_STATUS_CODES } from '../../constants/blade';

export const MyBlades: React.FC = () => {
  const { user, profile } = useAuth();
  const [blades, setBlades] = useState<Blade[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    const loadMyBlades = async () => {
      try {
        // TODO: Load blades where clientId === profile?.client_id
        // Mock data for now
        const mockBlades: Blade[] = [
          {
            bladeId: 'BS-001-2024',
            clientId: profile?.user_id || 'client-1',
            machineId: 'machine-1',
            szerokosc: 25,
            grubosc: 0.8,
            dlugosc: 2500,
            podzialka: '22mm',
            uzebienie: 'Standard',
            system: 'Metric',
            typPilarki: 'Taśmowa',
            statusCode: 'c0',
            createdAt: new Date(),
            updatedAt: new Date(),
            lastMovementAt: new Date(),
            qr: {
              pngPath: 'qrs/blades/BS-001-2024.png',
              svgPath: 'qrs/blades/BS-001-2024.svg',
            },
          },
          {
            bladeId: 'BS-002-2024',
            clientId: profile?.user_id || 'client-1',
            machineId: 'machine-2',
            szerokosc: 30,
            grubosc: 1.0,
            dlugosc: 3000,
            podzialka: '25mm',
            uzebienie: 'Aggressive',
            system: 'Imperial',
            typPilarki: 'Tarczowa',
            statusCode: 'c1',
            createdAt: new Date(),
            updatedAt: new Date(),
            lastMovementAt: new Date(),
            qr: {
              pngPath: 'qrs/blades/BS-002-2024.png',
              svgPath: 'qrs/blades/BS-002-2024.svg',
            },
          },
        ];
        
        setBlades(mockBlades);
      } catch (error) {
        console.error('Error loading my blades:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMyBlades();
  }, [profile?.user_id]);

  const machines = ['machine-1', 'machine-2']; // TODO: Load from Firestore

  const filteredBlades = blades.filter(blade => {
    const matchesSearch = blade.bladeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMachine = !selectedMachine || blade.machineId === selectedMachine;
    const matchesStatus = !selectedStatus || blade.statusCode === selectedStatus;
    
    return matchesSearch && matchesMachine && matchesStatus;
  });

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
        title="Moje ostrza"
        subtitle={`${filteredBlades.length} ostrzy w systemie`}
        showBack
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtry</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Wyszukaj</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="ID ostrza..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Maszyna</label>
                <select
                  value={selectedMachine}
                  onChange={(e) => setSelectedMachine(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Wszystkie maszyny</option>
                  {machines.map(machine => (
                    <option key={machine} value={machine}>
                      {machine}
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
            </div>
          </CardContent>
        </Card>

        {/* Blades Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Lista ostrzy ({filteredBlades.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Ostrza</TableHead>
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
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="font-medium">{blade.bladeId}</TableCell>
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
                        <Link to={`/app/blade/${blade.bladeId}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </motion.tr>
                  ))}
                  {filteredBlades.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                        {searchTerm || selectedMachine || selectedStatus 
                          ? 'Brak ostrzy spełniających kryteria wyszukiwania'
                          : 'Brak ostrzy w systemie'
                        }
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};