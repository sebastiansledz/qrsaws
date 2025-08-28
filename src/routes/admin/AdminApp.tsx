import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, Package } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { NavBar } from '../../components/common/NavBar';
import useAuth from '../../hooks/useAuth';

export const AdminApp: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="p-6 text-red-600">
        Sesja wygasła. Zaloguj się ponownie.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="page-transition">
        <Outlet />
      </main>
    </div>
  );
};