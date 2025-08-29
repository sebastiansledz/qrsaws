import React from 'react';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// Debounce focus-triggered refetch (~400ms)
let timer: number | null = null;
focusManager.setEventListener((handleFocus) => {
  const onFocus = () => {
    if (document.visibilityState !== 'visible') return;
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => handleFocus(), 400);
  };
  window.addEventListener('visibilitychange', onFocus);
  window.addEventListener('focus', onFocus);
  return () => {
    window.removeEventListener('visibilitychange', onFocus);
    window.removeEventListener('focus', onFocus);
    if (timer) window.clearTimeout(timer);
  };
});

export function AppDataProviders({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}