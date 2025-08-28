import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Package, Users, TrendingUp, Activity, QrCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { getClients } from '../../lib/queriesSupabase';
import { Client } from '../../types/client';
import useAuth from '../../hooks/useAuth';
import { AdminClients } from './AdminClients';
import { AdminBlades } from './AdminBlades';
import { AdminUsers } from './AdminUsers';
import { AdminReports } from './AdminReports';

interface DashboardStats {
  totalBlades: number;
  sharp: number;
  dull: number;
  regen: number;
  cracked: number;
  scrapped: number;
  other: number;
}

export const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBlades: 0,
    sharp: 0,
    dull: 0,
    regen: 0,
    cracked: 0,
    scrapped: 0,
    other: 0,
  });
  const [topClients, setTopClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load clients and calculate stats
        const clients = await getClients();
        setTopClients(clients.slice(0, 10));

        // Calculate blade stats from client counters
        const totalStats = clients.reduce((acc, client) => {
          const counters = client.counters || {
            bladesTotal: 0,
            sharp: 0,
            dull: 0,
            regen: 0,
            cracked: 0,
            scrapped: 0,
          };

          return {
            totalBlades: acc.totalBlades + counters.bladesTotal,
            sharp: acc.sharp + counters.sharp,
            dull: acc.dull + counters.dull,
            regen: acc.regen + counters.regen,
            cracked: acc.cracked + counters.cracked,
            scrapped: acc.scrapped + counters.scrapped,
            other: acc.other + (counters.bladesTotal - counters.sharp - counters.dull - counters.regen - counters.cracked - counters.scrapped),
          };
        }, {
          totalBlades: 0,
          sharp: 0,
          dull: 0,
          regen: 0,
          cracked: 0,
          scrapped: 0,
          other: 0,
        });

        setStats(totalStats);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const kpiCards = [
    {
      title: 'Wszystkie piły',
      value: stats.totalBlades.toString(),
      icon: Package,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Ostre (c0)',
      value: stats.sharp.toString(),
      icon: Activity,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
    {
      title: 'Tępe',
      value: stats.dull.toString(),
      icon: TrendingUp,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
    },
    {
      title: 'Do regeneracji',
      value: stats.regen.toString(),
      icon: Users,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-50',
    },
    {
      title: 'Pęknięte',
      value: stats.cracked.toString(),
      icon: Package,
      color: 'text-error-600',
      bgColor: 'bg-error-50',
    },
    {
      title: 'Na złom',
      value: stats.scrapped.toString(),
      icon: Activity,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel Administratora</h1>
        <p className="text-gray-600 mt-2">
          Witaj, {user?.email || 'Administrator'} - zarządzaj systemem QRSaws
        </p>
        <div className="mt-4">
          <div className="flex space-x-4">
            <button 
              onClick={() => navigate('/scan')}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Skanuj ostrze
            </button>
            <button 
              onClick={() => navigate('/admin/blade/new')}
              className="inline-flex items-center px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors"
            >
              <Package className="h-4 w-4 mr-2" />
              Dodaj piłę
            </button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Pulpit</TabsTrigger>
          <TabsTrigger value="clients">Klienci</TabsTrigger>
          <TabsTrigger value="blades">Piły</TabsTrigger>
          <TabsTrigger value="users">Użytkownicy</TabsTrigger>
          <TabsTrigger value="reports">Raporty</TabsTrigger>
        </TabsList>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <TabsContent value="dashboard" className="space-y-6">
            <div className="space-y-8">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {kpiCards.map((kpi, index) => {
                  const Icon = kpi.icon;
                  return (
                    <motion.div
                      key={kpi.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-medium transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">
                                {kpi.title}
                              </p>
                              <p className="text-2xl font-bold text-gray-900 mt-2">
                                {kpi.value}
                              </p>
                            </div>
                            <div className={`p-3 rounded-xl ${kpi.bgColor}`}>
                              <Icon className={`h-5 w-5 ${kpi.color}`} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Top Clients */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Top 10 klientów według liczby pił</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Klient</TableHead>
                          <TableHead>Kod</TableHead>
                          <TableHead>NIP</TableHead>
                          <TableHead className="text-right">Wszystkie piły</TableHead>
                          <TableHead className="text-right">Ostre</TableHead>
                          <TableHead className="text-right">Tępe</TableHead>
                          <TableHead className="text-right">Do regeneracji</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topClients.map((client, index) => (
                          <motion.tr
                            key={client.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 + index * 0.05 }}
                            className="hover:bg-muted/50 transition-colors"
                          >
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                                {client.code2}
                              </span>
                            </TableCell>
                            <TableCell className="text-gray-600">{client.nip}</TableCell>
                            <TableCell className="text-right font-medium">
                              {client.counters?.bladesTotal || 0}
                            </TableCell>
                            <TableCell className="text-right text-success-600">
                              {client.counters?.sharp || 0}
                            </TableCell>
                            <TableCell className="text-right text-warning-600">
                              {client.counters?.dull || 0}
                            </TableCell>
                            <TableCell className="text-right text-secondary-600">
                              {client.counters?.regen || 0}
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <AdminClients />
          </TabsContent>

          <TabsContent value="blades" className="space-y-6">
            <AdminBlades />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <AdminReports />
          </TabsContent>
        </motion.div>
      </Tabs>
    </div>
  );
};