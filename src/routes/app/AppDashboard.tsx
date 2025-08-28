import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Package, Clock, AlertCircle, QrCode, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { StatusPill } from '../../components/common/StatusPill';
import useAuth from '../../hooks/useAuth';

export const AppDashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const stats = [
    {
      title: 'Moje ostrza',
      value: '5',
      icon: Package,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Oczekujące zwroty',
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

  const myBlades = [
    {
      id: 'BS-001',
      name: 'Ostrze piły tarczowej #BS-001',
      model: 'Freud 250mm',
      statusCode: 'c0',
      location: 'Trak A',
    },
    {
      id: 'BS-002',
      name: 'Ostrze piły taśmowej #BS-002',
      model: 'Bahco 2360mm',
      statusCode: 'c1',
      location: 'Trak B',
    },
    {
      id: 'BS-003',
      name: 'Ostrze piły tarczowej #BS-003',
      model: 'Freud 300mm',
      statusCode: 'c13',
      location: 'Magazyn',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Panel Klienta
        </h1>
        <p className="text-gray-600 mt-2">
          Witaj, {user?.email || 'Użytkownik'}
        </p>
      </div>

      <div className="space-y-8">
        {/* Stats Grid */}
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
                <Card className="tap-highlight cursor-pointer hover:shadow-medium transition-shadow">
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

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Szybkie akcje</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/app/scan">
                  <Button className="w-full h-auto p-4 flex flex-col items-center space-y-2">
                    <QrCode className="h-6 w-6" />
                    <span className="text-sm font-medium">Skanuj ostrze</span>
                  </Button>
                </Link>
                <Link to="/app/blade/new">
                  <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
                    <Plus className="h-6 w-6" />
                    <span className="text-sm font-medium">Dodaj ostrze</span>
                  </Button>
                </Link>
                <Link to="/app/blades">
                  <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center space-y-2">
                    <Package className="h-6 w-6" />
                    <span className="text-sm font-medium">Moje ostrza</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* My Blades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Moje ostrza</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myBlades.map((blade, index) => (
                  <motion.div
                    key={blade.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <Link to={`/app/blade/${blade.id}`}>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className="flex-1">
                          <p className="font-medium">{blade.name}</p>
                          <p className="text-sm text-gray-600 mt-1">Model: {blade.model}</p>
                          <p className="text-sm text-gray-500 mt-1">Lokalizacja: {blade.location}</p>
                        </div>
                        <StatusPill status={blade.statusCode} />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};