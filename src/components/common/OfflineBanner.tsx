import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, X } from 'lucide-react';
import { Button } from '../ui/button';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasOfflineData, setHasOfflineData] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for offline data in IndexedDB
    const checkOfflineData = async () => {
      try {
        // TODO: Check IndexedDB for pending sync items
        // For now, simulate having offline data
        setHasOfflineData(false);
      } catch (error) {
        console.error('Error checking offline data:', error);
      }
    };

    checkOfflineData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showBanner = (!isOnline || hasOfflineData) && !dismissed;

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-16 left-0 right-0 z-40 bg-warning-500 text-white shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              {isOnline ? (
                <Wifi className="h-5 w-5" />
              ) : (
                <WifiOff className="h-5 w-5" />
              )}
              <div>
                <p className="font-medium">
                  {isOnline 
                    ? 'Tryb offline – dane zostaną zsynchronizowane'
                    : 'Brak połączenia z internetem'
                  }
                </p>
                <p className="text-sm opacity-90">
                  {isOnline
                    ? 'Masz niezesynchronizowane dane, które zostaną przesłane automatycznie.'
                    : 'Możesz nadal korzystać z aplikacji. Dane zostaną zsynchronizowane po przywróceniu połączenia.'
                  }
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};