import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { database, ref, onValue } from '@/lib/firebase';

interface ReconnectionBannerProps {
  onReconnect?: () => void;
}

export const ReconnectionBanner: React.FC<ReconnectionBannerProps> = ({ onReconnect }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!database) return;

    // Listen to Firebase connection state
    const connectedRef = ref(database, '.info/connected');
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const connected = snapshot.val() === true;
      
      if (connected && !isOnline) {
        // Just reconnected
        setIsReconnecting(true);
        setShowBanner(true);
        
        // Trigger reconnection callback
        if (onReconnect) {
          onReconnect();
        }
        
        // Hide banner after successful reconnection
        setTimeout(() => {
          setIsReconnecting(false);
          setTimeout(() => setShowBanner(false), 2000);
        }, 1000);
      } else if (!connected && isOnline) {
        // Just disconnected
        setShowBanner(true);
      }
      
      setIsOnline(connected);
    });

    // Also listen to browser online/offline events
    const handleOnline = () => {
      console.log('[Reconnection] Browser back online');
    };

    const handleOffline = () => {
      console.log('[Reconnection] Browser went offline');
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline, onReconnect]);

  if (!showBanner) return null;

  return (
    <div 
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        showBanner ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className={`
        flex items-center justify-center gap-3 py-3 px-4 text-sm font-medium
        ${isOnline 
          ? 'bg-success text-success-foreground' 
          : 'bg-destructive text-destructive-foreground'
        }
      `}>
        {isOnline ? (
          <>
            {isReconnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Reconnecting...</span>
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4" />
                <span>Connection restored!</span>
              </>
            )}
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Connection lost. Attempting to reconnect...</span>
            <Loader2 className="h-4 w-4 animate-spin" />
          </>
        )}
      </div>
    </div>
  );
};
