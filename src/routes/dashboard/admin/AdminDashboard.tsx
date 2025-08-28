import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Package, Users, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { PageHeader } from '../../../components/common/PageHeader';

export const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();

  const stats = [
    {
      title: t('dashboard.admin.totalBlades'),
      value: '124',
      icon: Package,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: t('dashboard.admin.activeClients'),
      value: '18',
      icon: Users,
      color: 'text-secondary-600',
      bgColor: 'bg-secondary-50',
    },
    {
      title: t('dashboard.admin.recentMovements'),
      value: '34',
      icon: TrendingUp,
      color: 'text-accent-600',
      bgColor: 'bg-accent-50',
    },
    {
      title: 'Aktywność dzisiaj',
      value: '12',
      icon: Activity,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <PageHeader
        title={t('dashboard.admin.title')}
        subtitle={t('dashboard.admin.systemOverview')}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="tap-highlight cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          {stat.title}
                        </p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {stat.value}
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Ostatnie ruchy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium">Ostrze #BS-001</p>
                      <p className="text-sm text-gray-600">Wydano do Klient ABC</p>
                    </div>
                    <span className="text-sm text-gray-500">2 godz. temu</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium">Ostrze #BS-002</p>
                      <p className="text-sm text-gray-600">Zwrócono z Klient XYZ</p>
                    </div>
                    <span className="text-sm text-gray-500">4 godz. temu</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Aktywni klienci</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-700">A</span>
                    </div>
                    <div>
                      <p className="font-medium">ABC Stolarka</p>
                      <p className="text-sm text-gray-600">3 ostrza w użyciu</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-secondary-700">X</span>
                    </div>
                    <div>
                      <p className="font-medium">XYZ Meble</p>
                      <p className="text-sm text-gray-600">2 ostrza w użyciu</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};