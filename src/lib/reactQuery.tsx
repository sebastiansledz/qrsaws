import React, { useEffect, useMemo } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
} from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const FOCUS_DEBOUNCE_MS = 350;

// Debounce refetch on focus/visibility so we don’t hammer the DB.
function installDebouncedFocusListener() {
  let timer: number | null = null;
  focusManager.setEventListener((handleFocus) => {
    const onFocus = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => handleFocus(true), FOCUS_DEBOUNCE_MS);
    };
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onFocus();
    });
    window.addEventListener('focus', onFocus);
    return () => {
      if (timer) window.clearTimeout(timer);
      window.removeEventListener('focus', onFocus);
    };
  });
}

export const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // serve quickly from cache, then refresh in background
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 24 * 60 * 60 * 1000, // keep cache for a day
        refetchOnWindowFocus: true,
        refetchOnReconnect: 'always',
        retry: 2,
      },
    },
  });

export const AppQueryProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const client = useMemo(() => makeQueryClient(), []);
  useEffect(() => {
    installDebouncedFocusListener();
    const persister = createSyncStoragePersister({
      storage: window.localStorage,
      key: 'qrsaws-cache-v1',
      throttleTime: 500,
    });
    const unsub = persistQueryClient({
      queryClient: client,
      persister,
      maxAge: 24 * 60 * 60 * 1000, // 24h
      dehydratedState: undefined,
    });
    return () => { unsub?.(); };
  }, [client]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};
