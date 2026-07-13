import React, { useCallback, useRef } from 'react';
import { ReconnectionBanner } from '@/components/Banner/ReconnectionBanner';
import { useGame } from '@/contexts/GameContext';
import { useToastContext } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSessionPresence } from '@/hooks/useSessionPresence';

/**
 * In-game reconnection UI: presence heartbeat, auto-resume on reconnect, toast feedback.
 */
export const GameReconnectionBanner: React.FC = () => {
  const { resumeSession } = useGame();
  const { addToast } = useToastContext();
  const { t } = useLanguage();
  const reconnectedRef = useRef(false);

  useSessionPresence();

  const handleReconnect = useCallback(async () => {
    const status = await resumeSession();
    if (status && !reconnectedRef.current) {
      reconnectedRef.current = true;
      addToast('success', t.reconnected, 4000);
      setTimeout(() => { reconnectedRef.current = false; }, 8000);
    }
  }, [resumeSession, addToast, t.reconnected]);

  return <ReconnectionBanner onReconnect={handleReconnect} />;
};
