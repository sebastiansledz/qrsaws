import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NavBar } from '../../components/common/NavBar';
import { BottomTabBar } from '../../components/common/BottomTabBar';
import useAuth from '../../hooks/useAuth';

export const ClientApp: React.FC = () => {
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
      <main className="page-transition pb-20 md:pb-6">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  );
};