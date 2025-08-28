import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Calendar, Filter, FileText, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { getClients } from '../../lib/queriesSupabase';
import { Client } from '../../types/client';
import { useNotify } from '../../lib/notify';

export const AdminReports: React.FC = () => {
  const { success } = useNotify();
  const [clients, setClients] = useState<Client[]>([]);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    clientId: '',
    machineId: '',
    statusCode: '',
  });

  React.useEffect(() => {
    const loadClients = async () => {
      try {
        const clientsData = await getClients();
        setClients(clientsData);
      } catch (error) {
        console.error('Error loading clients:', error);
      }
    };
    loadClients();
  }, []);

  const handleExportCSV = () => {
    // TODO: Implement CSV export functionality
    console.log('Exporting CSV with filters:', filters);
    success("Funkcja eksportu CSV będzie wkrótce dostępna");
  };

  const reportTypes = [
    {
      title: 'Raport ruchów pił',
      description: 'Historia wszystkich ruchów pił w wybranym okresie',
      icon: BarChart3,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Raport statusów pił',
      description: 'Aktualny stan wszystkich pił w systemie',
      icon: FileText,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-50',
    },
    {
      title: 'Raport klientów',
      description: 'Zestawienie aktywności klientów',
      icon: BarChart3,
      color: 'text-accent-600',
      bgColor: 'bg-accent-50',
    },
    {
      title: 'Raport WZPZ',
      description: 'Lista dokumentów WZ/PZ w wybranym okresie',
      icon: FileText,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Raporty i eksport danych</h2>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportTypes.map((report, index) => {
          const Icon = report.icon;
          return (
            <motion.div
              key={report.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-medium transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className={`p-3 rounded-xl ${report.bgColor} inline-block mb-4`}>
                    <Icon className={`h-6 w-6 ${report.color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{report.title}</h3>
                  <p className="text-sm text-gray-600">{report.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filtry raportu</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data od</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data do</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Klient</label>
                <select
                  value={filters.clientId}
                  onChange={(e) => setFilters(prev => ({ ...prev, clientId: e.target.value }))}
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
                <label className="text-sm font-medium">Maszyna</label>
                <Input
                  placeholder="ID maszyny"
                  value={filters.machineId}
                  onChange={(e) => setFilters(prev => ({ ...prev, machineId: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={filters.statusCode}
                  onChange={(e) => setFilters(prev => ({ ...prev, statusCode: e.target.value }))}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Wszystkie statusy</option>
                  <option value="c0">c0 - Bez uwag</option>
                  <option value="c1">c1 - Rysuje</option>
                  <option value="c2">c2 - Faluje</option>
                  <option value="c13">c13 - Do regeneracji</option>
                  <option value="c12">c12 - Na złom</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Export Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Eksport danych</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Wybierz filtry powyżej i kliknij przycisk eksportu aby pobrać dane w formacie CSV.
              </p>
              <div className="flex space-x-4">
                <Button onClick={handleExportCSV} className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Wyeksportuj CSV</span>
                </Button>
                <Button variant="outline" disabled>
                  <FileText className="h-4 w-4 mr-2" />
                  Eksport PDF (wkrótce)
                </Button>
                <Button variant="outline" disabled>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Eksport Excel (wkrótce)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Preview Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Podgląd danych</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Podgląd raportu</p>
              <p>Wybierz filtry i kliknij "Wyeksportuj CSV" aby zobaczyć podgląd danych</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminReports;