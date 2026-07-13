import { useEffect, useRef } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useToastContext } from '@/contexts/ToastContext';
import {
  getSessionByCode,
  kickStaleDisconnectedPlayers,
  registerPlayerDisconnectHandler,
  tryMigrateHost,
  updatePlayerConnection,
} from '@/services/gameSessionService';
import { getDisconnectGraceMs } from '@/types/game';

const HEARTBEAT_MS = 15_000;
const HOST_MAINTENANCE_MS = 10_000;

/**
 * Keeps player presence fresh, registers disconnect handlers,
 * and runs host duties (migration + stale player removal).
 */
export const useSessionPresence = (): void => {
  const { session, currentPlayer } = useGame();
  const { addToast } = useToastContext();
  const migratedToastRef = useRef(false);

  useEffect(() => {
    const code = session?.code;
    const playerId = currentPlayer?.id;
    if (!code || !playerId || session?.status === 'finished') return;

    registerPlayerDisconnectHandler(code, playerId);

    const heartbeat = setInterval(() => {
      updatePlayerConnection(code, playerId, true);
    }, HEARTBEAT_MS);

    const isHost = session.host === playerId;
    let maintenance: ReturnType<typeof setInterval> | null = null;

    if (session.status === 'playing' || session.status === 'waiting' || session.status === 'countdown') {
      maintenance = setInterval(async () => {
        const fresh = await getSessionByCode(code);
        if (!fresh) return;

        const migrated = await tryMigrateHost(code, fresh);
        if (migrated && fresh.host === playerId && !migratedToastRef.current) {
          migratedToastRef.current = true;
          addToast('info', 'You are now the host.', 6000);
          setTimeout(() => { migratedToastRef.current = false; }, 30_000);
        }

        const latest = migrated ? await getSessionByCode(code) : fresh;
        if (!latest) return;

        const amHost = latest.host === playerId;
        if (amHost && latest.status === 'playing') {
          const grace = getDisconnectGraceMs(latest.gameMode);
          await kickStaleDisconnectedPlayers(code, latest, grace);
        }
      }, HOST_MAINTENANCE_MS);
    }

    return () => {
      clearInterval(heartbeat);
      if (maintenance) clearInterval(maintenance);
    };
  }, [
    session?.code,
    session?.host,
    session?.status,
    session?.gameMode,
    currentPlayer?.id,
    addToast,
  ]);
};
