import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';
import { AppDataProviders } from './providers/queryClient';
import { SessionProvider } from './features/auth/SessionProvider';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppDataProviders>
      <SessionProvider>
        <AppErrorBoundary>
          <App />
        </AppErrorBoundary>
      </SessionProvider>
    </AppDataProviders>
  </StrictMode>
);