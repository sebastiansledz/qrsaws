import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Package, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { PageHeader } from '../../../components/common/PageHeader';
import { StatusPill } from '../../../components/common/StatusPill';

export const ClientDashboard: React.FC = () => {
  const { t } = useTranslation();

  const stats = [
    {
      title: t('dashboard.client.myBlades'),
      value: '5',
      icon: Package,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: t('dashboard.client.pendingReturns'),
      value: '2',
      icon: Clock,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
    },
    {
      title: 'Przekroczenia',
      value: '0',
      icon: AlertCircle,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <PageHeader
        title={t('dashboard.client.title')}
        subtitle="Przegląd twoich ostrzy i aktywności"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Moje ostrza</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <p className="font-medium">Ostrze piły tarczowej #BS-001</p>
                    <p className="text-sm text-gray-600 mt-1">Model: Freud 250mm</p>
                  </div>
                  <StatusPill status="in-use" />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <p className="font-medium">Ostrze piły taśmowej #BS-002</p>
                    <p className="text-sm text-gray-600 mt-1">Model: Bahco 2360mm</p>
                  </div>
                  <StatusPill status="in-use" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};