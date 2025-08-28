import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { StatusPill } from '../../components/common/StatusPill';
import { PageHeader } from '../../components/common/PageHeader';
import useAuth from '../../hooks/useAuth';
import { Movement, MovementOpCode } from '../../types/movement';
import { MOVEMENT_OP_CODES } from '../../constants/blade';

export const ServiceHistory: React.FC = () => {
  const { user, profile } = useAuth();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const loadServiceHistory = async () => {
      try {
        // TODO: Load movements where clientId === profile?.client_id
        // Mock data for now
        const mockMovements: Movement[] = [
          {
            id: '1',
            bladeId: 'BS-001-2024',
            clientId: profile?.user_id || 'client-1',
            machineId: 'machine-1',
            opCode: 'PZ',
            stateCode: 'c0',
            byUserId: 'user-1',
            at: new Date('2024-12-20T10:30:00'),
            meta: { notes: 'Wydanie do klienta' },
          },
          {
            id: '2',
            bladeId: 'BS-001-2024',
            clientId: profile?.user_id || 'client-1',
            machineId: 'machine-1',
            opCode: 'ST1',
            stateCode: 'c0',
            byUserId: 'user-2',
            at: new Date('2024-12-20T11:00:00'),
            meta: { notes: 'Założono na trak A' },
          },
          {
            id: '3',
            bladeId: 'BS-001-2024',
            clientId: profile?.user_id || 'client-1',
            machineId: 'machine-1',
            opCode: 'ST2',
            stateCode: 'c1',
            byUserId: 'user-2',
            at: new Date('2024-12-20T18:00:00'),
            meta: { notes: 'Zdjęto z traka - rysuje' },
          },
          {
            id: '4',
            bladeId: 'BS-002-2024',
            clientId: profile?.user_id || 'client-1',
            machineId: 'machine-2',
            opCode: 'PZ',
            stateCode: 'c0',
            byUserId: 'user-1',
            at: new Date('2024-12-19T14:15:00'),
            meta: { notes: 'Wydanie do klienta' },
          },
          {
            id: '5',
            bladeId: 'BS-002-2024',
            clientId: profile?.user_id || 'client-1',
            machineId: 'machine-2',
            opCode: 'ST1',
            stateCode: 'c0',
            byUserId: 'user-3',
            at: new Date('2024-12-19T15:00:00'),
            meta: { notes: 'Założono na trak B' },
          },
        ];
        
        setMovements(mockMovements);
      } catch (error) {
        console.error('Error loading service history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadServiceHistory();
  }, [profile?.user_id]);

  const filteredMovements = movements.filter(movement =>
    movement.bladeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMovements = filteredMovements.slice(startIndex, startIndex + itemsPerPage);

  const getOpCodeLabel = (opCode: MovementOpCode) => {
    const labelKey = MOVEMENT_OP_CODES[opCode];
    return labelKey ? labelKey.split('.').pop() : opCode;
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
        title="Historia serwisowania"
        subtitle={`${filteredMovements.length} ruchów w historii`}
        showBack
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Wyszukaj po ID ostrza..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Historia ruchów</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paginatedMovements.map((movement, index) => (
                <motion.div
                  key={movement.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-3"></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {movement.bladeId}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                          {movement.opCode}
                        </span>
                        {movement.stateCode && (
                          <StatusPill status={movement.stateCode} />
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {movement.at.toLocaleString('pl-PL')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {getOpCodeLabel(movement.opCode)}
                    </p>
                    {movement.machineId && (
                      <p className="text-sm text-gray-500 mb-1">
                        Maszyna: {movement.machineId}
                      </p>
                    )}
                    {movement.meta?.notes && (
                      <p className="text-sm text-gray-700">
                        {movement.meta.notes}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}

              {paginatedMovements.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Brak historii</p>
                  <p>
                    {searchTerm 
                      ? 'Brak ruchów spełniających kryteria wyszukiwania'
                      : 'Brak ruchów w historii'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Strona {currentPage} z {totalPages} ({filteredMovements.length} ruchów)
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Poprzednia
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Następna
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};