import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppDataProviders } from './providers/queryClient';
import { SessionProvider } from './features/auth/SessionProvider';
import App from './App';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';
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