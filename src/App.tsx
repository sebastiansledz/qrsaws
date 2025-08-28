import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { Toaster } from './components/ui/toaster';
import useAuth from './hooks/useAuth';
import './lib/i18n';

function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function AppWithAuth() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
    </AuthProvider>
  );
}

export default AppWithAuth;