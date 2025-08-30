// src/App.tsx
import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { Toaster } from './components/ui/toaster';
import { AuthProvider } from './hooks/useAuth'; // <-- use the real provider
import './lib/i18n';

function AppWithAuth() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster />
    </AuthProvider>
  );
}

export default AppWithAuth;
