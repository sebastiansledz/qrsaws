import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  Activity,
  TrendingUp,
  Users,
  Octagon,
  Trash2,
  QrCode,
  Plus,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

import useAuth from '../../hooks/useAuth';
import { AdminClients } from './AdminClients';
import { AdminBlades } from './AdminBlades';
import { AdminUsers } from './AdminUsers';
import { AdminReports } from './AdminReports';
import AdminDocs from './AdminDocs';
import { supabase } from '../../lib/supabase';

type Client = { id: string; name: string; code2: string | null; nip?: string | null };

type Buckets = {
  totalBlades: number;
  sharp: number;
  dull: number;
  regen: number;
  cracked: number;
  scrapped: number;
  other: number;
};

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Buckets>({
    totalBlades: 0,
    sharp: 0,
    dull: 0,
    regen: 0,
    cracked: 0,
    scrapped: 0,
    other: 0,
  });
  const [topClients, setTopClients] = useState<
    Array<Client & { counters: { bladesTotal: number; sharp: number; dull: number; regen: number } }>
  >([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [{ data: clients, error: cErr }, { data: blades, error: bErr }] = await Promise.all([
          supabase.from('clients').select('id, name, code2, nip').order('name'),
          supabase.from('blades').select('id, client_id, status'),
        ]);
        if (cErr) throw cErr;
        if (bErr) throw bErr;

        const buckets: Buckets = {
          totalBlades: 0,
          sharp: 0,
          dull: 0,
          regen: 0,
          cracked: 0,
          scrapped: 0,
          other: 0,
        };
        const DULL = new Set(['c1', 'c2']);

        const byClient: Record<string, { total: number; sharp: number; dull: number; regen: number }> = {};

        for (const b of blades ?? []) {
          buckets.totalBlades++;
          const s = (b.status ?? 'c0') as string;

          if (s === 'c0') buckets.sharp++;
          else if (DULL.has(s)) buckets.dull++;
          else if (s === 'c13') buckets.regen++;
          else if (s === 'c4') buckets.cracked++;
          else if (s === 'c12') buckets.scrapped++;
          else buckets.other++;

          const cid = b.client_id ?? '_none';
          if (!byClient[cid]) byClient[cid] = { total: 0, sharp: 0, dull: 0, regen: 0 };
          byClient[cid].total++;
          if (s === 'c0') byClient[cid].sharp++;
          else if (DULL.has(s)) byClient[cid].dull++;
          else if (s === 'c13') byClient[cid].regen++;
        }

        const tc = Object.entries(byClient)
          .filter(([id]) => id !== '_none')
          .map(([id, c]) => {
            const row = (clients ?? []).find((x) => x.id === id) as Client | undefined;
            return {
              id,
              name: row?.name ?? id,
              code2: row?.code2 ?? '',
              nip: row?.nip ?? '',
              counters: {
                bladesTotal: c.total,
                sharp: c.sharp,
                dull: c.dull,
                regen: c.regen,
              },
            };
          })
          .sort((a, b) => b.counters.bladesTotal - a.counters.bladesTotal)
          .slice(0, 10);

        if (!cancelled) {
          setStats(buckets);
          setTopClients(tc);
        }
      } catch (e) {
        console.error('AdminDashboard load error', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const tiles = [
    { title: 'Wszystkie piły', value: stats.totalBlades, icon: Package, color: 'text-primary-600', bg: 'bg-primary-50' },
    { title: 'Ostre (c0)', value: stats.sharp, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Tępe (c1–c2)', value: stats.dull, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Do regeneracji (c13)', value: stats.regen, icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { title: 'Pęknięte (c4)', value: stats.cracked, icon: Octagon, color: 'text-rose-600', bg: 'bg-rose-50' },
    { title: 'Na złom (c12)', value: stats.scrapped, icon: Trash2, color: 'text-slate-600', bg: 'bg-slate-50' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header with actions (animated like Reports) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel Administratora</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Witaj, {user?.email ?? '—'} – zarządzaj systemem QRSaws
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate('/scan')} className="gap-2">
            <QrCode className="h-4 w-4" />
            Skanuj ostrze
          </Button>
          <Button
            onClick={() => navigate('/admin/blade/new')}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Dodaj piłę
          </Button>
        </div>
      </motion.div>

      {/* Tabs (full width + restored spacing under tabs) */}
      <Tabs defaultValue="dashboard" className="w-full">
<TabsList className="grid w-full grid-cols-6 mb-6">
  <TabsTrigger value="dashboard" className="w-full">Pulpit</TabsTrigger>
  <TabsTrigger value="clients" className="w-full">Klienci</TabsTrigger>
  <TabsTrigger value="blades"  className="w-full">Piły</TabsTrigger>
  <TabsTrigger value="docs"    className="w-full" onClick={() => navigate('/admin/docs')}>WZ/PZ</TabsTrigger>
  <TabsTrigger value="users"   className="w-full">Użytkownicy</TabsTrigger>
  <TabsTrigger value="reports" className="w-full">Raporty</TabsTrigger>
</TabsList>


        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
          {/* DASHBOARD */}
          <TabsContent value="dashboard" className="mt-6 space-y-6">
            {/* KPI tiles with stagger like Reports */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {tiles.map((t, i) => (
                <motion.div
                  key={t.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">{t.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <div className="text-3xl font-semibold">{loading ? '—' : t.value}</div>
                      <div className={`p-2 rounded-xl ${t.bg}`}>
                        <t.icon className={`h-6 w-6 ${t.color}`} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Top clients table (animated) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
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
                      {topClients.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>{c.name}</TableCell>
                          <TableCell>{c.code2 || '—'}</TableCell>
                          <TableCell>{c.nip || '—'}</TableCell>
                          <TableCell className="text-right">{c.counters.bladesTotal}</TableCell>
                          <TableCell className="text-right">{c.counters.sharp}</TableCell>
                          <TableCell className="text-right">{c.counters.dull}</TableCell>
                          <TableCell className="text-right">{c.counters.regen}</TableCell>
                        </TableRow>
                      ))}
                      {!topClients.length && !loading && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-gray-500">
                            Brak danych
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* CLIENTS */}
          <TabsContent value="clients" className="mt-6 space-y-6">
            <AdminClients />
          </TabsContent>

          {/* BLADES */}
          <TabsContent value="blades" className="mt-6 space-y-6">
            <AdminBlades />
          </TabsContent>

          {/* USERS */}
          <TabsContent value="users" className="mt-6 space-y-6">
            <AdminUsers />
          </TabsContent>

          {/* REPORTS */}
          <TabsContent value="reports" className="mt-6 space-y-6">
            <AdminReports />
          </TabsContent>
        </motion.div>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
