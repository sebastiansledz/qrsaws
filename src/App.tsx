import React from 'react';
import { AppRouter } from './router';
import { Toaster } from './components/ui/toaster';
import './lib/i18n';

export default function App() {
  return (
    <>
      <AppRouter />
      <Toaster />
    </>
  );
}