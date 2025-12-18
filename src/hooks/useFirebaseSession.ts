import { useState, useEffect, useCallback } from 'react';
import type { GameSession, Player } from '@/contexts/GameContext';
import {
  subscribeToSession,
  createSessionInFirebase,
  getSessionByCode,
  addPlayerToSession,
  removePlayerFromSession,
  updatePlayerInSession,
  updateGameState,
  startGameSession,
  endGameSession,
  generateCode,
} from '@/services/gameSessionService';

export const useFirebaseSession = () => {
  const [session, setSession] = useState<GameSession | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to session updates
  useEffect(() => {
    if (!session?.code) return;

    const unsubscribe = subscribeToSession(session.code, (updatedSession) => {
      if (updatedSession) {
        setSession(updatedSession);
        // Update current player from session
        if (currentPlayer) {
          const updatedPlayer = updatedSession.players.find(p => p.id === currentPlayer.id);
          if (updatedPlayer) {
            setCurrentPlayer(updatedPlayer);
          }
        }
      } else {
        // Session was deleted
        setSession(null);
        setCurrentPlayer(null);
      }
    });

    return () => unsubscribe();
  }, [session?.code, currentPlayer?.id]);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedSessionCode = localStorage.getItem('gameSessionCode');
    const savedPlayerId = localStorage.getItem('currentPlayerId');

    if (savedSessionCode && savedPlayerId) {
      setIsLoading(true);
      getSessionByCode(savedSessionCode)
        .then((restoredSession) => {
          if (restoredSession) {
            setSession(restoredSession);
            const player = restoredSession.players.find(p => p.id === savedPlayerId);
            if (player) {
              setCurrentPlayer(player);
            }
          } else {
            // Session no longer exists, clear localStorage
            localStorage.removeItem('gameSessionCode');
            localStorage.removeItem('currentPlayerId');
          }
        })
        .catch(() => {
          localStorage.removeItem('gameSessionCode');
          localStorage.removeItem('currentPlayerId');
        })
        .finally(() => setIsLoading(false));
    }
  }, []);

  const createSession = useCallback(async (maxPlayers: number, duration: number): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const code = generateCode();
      const playerId = `player_${Date.now()}`;
      
      const player: Player = {
        id: playerId,
        username: 'You',
        avatar: '🌍',
        color: '#E50914',
        score: 0,
        countriesGuessed: [],
        isReady: false,
      };

      const newSession: GameSession = {
        id: Date.now().toString(),
        code,
        host: playerId,
        players: [player],
        maxPlayers,
        duration,
        status: 'waiting',
        currentTurn: 0,
        currentCountry: null,
        startTime: null,
        waitingRoomStartTime: Date.now(),
      };

      await createSessionInFirebase(newSession);
      
      setSession(newSession);
      setCurrentPlayer(player);
      
      // Save to localStorage for persistence
      localStorage.setItem('gameSessionCode', code);
      localStorage.setItem('currentPlayerId', playerId);

      return code;
    } catch (err) {
      setError('Failed to create session');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const joinSession = useCallback(async (code: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const existingSession = await getSessionByCode(code);
      
      if (!existingSession) {
        setError('Session not found');
        return false;
      }

      if (existingSession.players.length >= existingSession.maxPlayers) {
        setError('Session is full');
        return false;
      }

      if (existingSession.status !== 'waiting') {
        setError('Session has already started');
        return false;
      }

      const playerId = `player_${Date.now()}`;
      const player: Player = {
        id: playerId,
        username: 'Player',
        avatar: '🗺️',
        color: '#4169E1',
        score: 0,
        countriesGuessed: [],
        isReady: false,
      };

      const success = await addPlayerToSession(code, player);
      
      if (success) {
        setCurrentPlayer(player);
        // Session will be updated via subscription
        const updatedSession = await getSessionByCode(code);
        setSession(updatedSession);
        
        localStorage.setItem('gameSessionCode', code);
        localStorage.setItem('currentPlayerId', playerId);
      }

      return success;
    } catch (err) {
      setError('Failed to join session');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const leaveSession = useCallback(async () => {
    if (!session?.code || !currentPlayer?.id) return;

    try {
      await removePlayerFromSession(session.code, currentPlayer.id);
    } finally {
      setSession(null);
      setCurrentPlayer(null);
      localStorage.removeItem('gameSessionCode');
      localStorage.removeItem('currentPlayerId');
    }
  }, [session?.code, currentPlayer?.id]);

  const setReady = useCallback(async (ready: boolean) => {
    if (!session?.code || !currentPlayer?.id) return;

    await updatePlayerInSession(session.code, currentPlayer.id, { isReady: ready });
  }, [session?.code, currentPlayer?.id]);

  const startGame = useCallback(async () => {
    if (!session?.code) return;
    await startGameSession(session.code);
  }, [session?.code]);

  const updateCurrentGameState = useCallback(async (
    updates: {
      currentTurn?: number;
      currentCountry?: string | null;
      players?: Player[];
      guessedCountries?: string[];
    }
  ) => {
    if (!session?.code) return;
    await updateGameState(session.code, updates);
  }, [session?.code]);

  const endGame = useCallback(async () => {
    if (!session?.code) return;
    await endGameSession(session.code);
  }, [session?.code]);

  return {
    session,
    currentPlayer,
    isLoading,
    error,
    createSession,
    joinSession,
    leaveSession,
    setReady,
    startGame,
    updateCurrentGameState,
    endGame,
  };
};
