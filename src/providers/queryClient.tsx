import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import React from 'react';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep UI steady; refresh in background
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
      staleTime: 30_000, // adjust as needed
    },
  },
});

// Debounce focus-triggered refetches (e.g., 400ms)
let focusTimer: number | null = null;
focusManager.setEventListener((handleFocus) => {
  const onFocus = () => {
    if (document.visibilityState !== 'visible') return;
    if (focusTimer) window.clearTimeout(focusTimer);
    focusTimer = window.setTimeout(() => handleFocus(), 400);
  };
  window.addEventListener('visibilitychange', onFocus, false);
  window.addEventListener('focus', onFocus, false);
  return () => {
    window.removeEventListener('visibilitychange', onFocus);
    window.removeEventListener('focus', onFocus);
    if (focusTimer) window.clearTimeout(focusTimer);
  };
});

export function AppDataProviders({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}