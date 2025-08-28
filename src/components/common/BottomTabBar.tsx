import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Home, 
  QrCode, 
  Package, 
  Users, 
  BarChart3 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import useAuth from '../../hooks/useAuth';

export const BottomTabBar: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  // Don't show bottom tab bar for admin users
  if (isAdmin) {
    return null;
  }

  const tabs = [
    {
      id: 'dashboard',
      label: t('navigation.dashboard'),
      icon: Home,
      path: '/app',
    },
    {
      id: 'scan',
      label: t('navigation.scan'),
      icon: QrCode,
      path: '/app/scan',
    },
    {
      id: 'blades',
      label: t('navigation.blades'),
      icon: Package,
      path: '/app/blades',
    },
    {
      id: 'reports',
      label: t('navigation.reports'),
      icon: BarChart3,
      path: '/app/reports',
    },
  ];

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 md:hidden z-50"
    >
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path || 
            (tab.path !== '/app' && location.pathname.startsWith(tab.path));
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={cn(
                "flex flex-col items-center py-2 px-3 min-w-0 tap-highlight",
                "transition-colors duration-200"
              )}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={cn(
                  "p-2 rounded-xl transition-colors duration-200",
                  isActive 
                    ? "bg-primary text-white" 
                    : "text-gray-500 hover:bg-gray-100"
                )}
              >
                <Icon className="h-5 w-5" />
              </motion.div>
              <span className={cn(
                "text-xs mt-1 font-medium truncate",
                isActive ? "text-primary" : "text-gray-500"
              )}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
};