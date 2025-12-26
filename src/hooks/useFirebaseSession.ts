import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameSession, Player, TurnState, SessionRecoveryData } from '@/types/game';
import {
  subscribeToSession,
  createSessionInFirebase,
  getSessionByCode,
  addPlayerToSession,
  removePlayerFromSession,
  updatePlayerInSession,
  updateGameState,
  updateTurnState as updateTurnStateService,
  startGameSession,
  startCountdown as startCountdownService,
  endGameSession,
  generateCode,
  saveRecoveryData,
  getRecoveryData,
  clearRecoveryData,
  hasActiveSession as checkHasActiveSession,
  updatePlayerConnection,
} from '@/services/gameSessionService';
import { useAuth } from '@/contexts/AuthContext';

export const useFirebaseSession = () => {
  const [session, setSession] = useState<GameSession | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const { user } = useAuth();

  // Subscribe to session updates - use ref to avoid stale closure
  const currentPlayerIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    currentPlayerIdRef.current = currentPlayer?.id || null;
  }, [currentPlayer?.id]);

  useEffect(() => {
    if (!session?.code) return;

    console.log('[Firebase] Subscribing to session:', session.code);

    const unsubscribe = subscribeToSession(session.code, (updatedSession) => {
      if (updatedSession) {
        console.log('[Firebase] Session update received:', updatedSession.players.length, 'players');
        setSession(updatedSession);
        // Update current player from session using ref to get latest value
        const playerId = currentPlayerIdRef.current;
        if (playerId) {
          const updatedPlayer = updatedSession.players.find(p => p.id === playerId);
          if (updatedPlayer) {
            setCurrentPlayer(updatedPlayer);
          }
        }
      } else {
        // Session was deleted
        console.log('[Firebase] Session deleted');
        setSession(null);
        setCurrentPlayer(null);
        clearRecoveryData();
      }
    });

    return () => {
      console.log('[Firebase] Unsubscribing from session:', session.code);
      unsubscribe();
    };
  }, [session?.code]); // Remove currentPlayer.id from deps to prevent re-subscription

  // Keep player connection alive
  useEffect(() => {
    if (!session?.code || !currentPlayer?.id) return;

    // Update connection status on mount
    updatePlayerConnection(session.code, currentPlayer.id, true);

    // Heartbeat every 10 seconds
    const heartbeat = setInterval(() => {
      updatePlayerConnection(session.code, currentPlayer.id, true);
    }, 10000);

    // Update on unmount
    return () => {
      clearInterval(heartbeat);
      updatePlayerConnection(session.code, currentPlayer.id, false);
    };
  }, [session?.code, currentPlayer?.id]);

  // Check for active session on mount
  useEffect(() => {
    const checkSession = async () => {
      const result = await checkHasActiveSession();
      setHasActiveSession(result.hasSession);
    };
    checkSession();
  }, []);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedSessionCode = localStorage.getItem('gameSessionCode');
    const savedPlayerId = localStorage.getItem('currentPlayerId');

    if (savedSessionCode && savedPlayerId) {
      setIsLoading(true);
      getSessionByCode(savedSessionCode)
        .then((restoredSession) => {
          if (restoredSession && restoredSession.status !== 'finished') {
            setSession(restoredSession);
            const player = restoredSession.players.find(p => p.id === savedPlayerId);
            if (player) {
              setCurrentPlayer(player);
              setHasActiveSession(true);
              // Update recovery data
              saveRecoveryData({
                sessionCode: savedSessionCode,
                playerId: savedPlayerId,
                timestamp: Date.now(),
              });
            }
          } else {
            clearRecoveryData();
            setHasActiveSession(false);
          }
        })
        .catch(() => {
          clearRecoveryData();
          setHasActiveSession(false);
        })
        .finally(() => setIsLoading(false));
    }
  }, []);

  const createSession = useCallback(async (maxPlayers: number, duration: number): Promise<string> => {
    // Check for existing active session
    const activeCheck = await checkHasActiveSession();
    if (activeCheck.hasSession) {
      setError('You already have an active session. Resume or leave it first.');
      throw new Error('Active session exists');
    }

    setIsLoading(true);
    setError(null);

    try {
      const code = generateCode();
      const playerId = `player_${Date.now()}`;
      
      const player: Player = {
        id: playerId,
        username: user?.username || 'You',
        avatar: user?.avatar || '🌍',
        color: user?.color || '#E50914',
        score: 0,
        countriesGuessed: [],
        isReady: false,
        isConnected: true,
        lastSeen: Date.now(),
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
        currentTurnState: null,
        guessedCountries: [],
        startTime: null,
        waitingRoomStartTime: Date.now(),
        countdownStartTime: null,
        turnStartTime: null,
      };

      await createSessionInFirebase(newSession);
      
      setSession(newSession);
      setCurrentPlayer(player);
      setHasActiveSession(true);
      
      // Save recovery data
      localStorage.setItem('gameSessionCode', code);
      localStorage.setItem('currentPlayerId', playerId);
      saveRecoveryData({
        sessionCode: code,
        playerId,
        timestamp: Date.now(),
      });

      return code;
    } catch (err) {
      setError('Failed to create session');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const joinSession = useCallback(async (code: string): Promise<boolean> => {
    // Check for existing active session
    const activeCheck = await checkHasActiveSession();
    if (activeCheck.hasSession && activeCheck.session?.code !== code) {
      setError('You already have an active session. Resume or leave it first.');
      return false;
    }

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
        username: user?.username || 'Player',
        avatar: user?.avatar || '🗺️',
        color: user?.color || '#4169E1',
        score: 0,
        countriesGuessed: [],
        isReady: false,
        isConnected: true,
        lastSeen: Date.now(),
      };

      const success = await addPlayerToSession(code, player);
      
      if (success) {
        // Set current player first
        setCurrentPlayer(player);
        
        // Create a minimal session object with the code to trigger subscription
        // The subscription will fetch the full session data
        setSession({
          ...existingSession,
          code, // Ensure code is set for subscription
        });
        
        setHasActiveSession(true);
        
        localStorage.setItem('gameSessionCode', code);
        localStorage.setItem('currentPlayerId', playerId);
        saveRecoveryData({
          sessionCode: code,
          playerId,
          timestamp: Date.now(),
        });
      }

      return success;
    } catch (err) {
      setError('Failed to join session');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const leaveSession = useCallback(async () => {
    if (!session?.code || !currentPlayer?.id) return;

    try {
      await removePlayerFromSession(session.code, currentPlayer.id);
    } finally {
      setSession(null);
      setCurrentPlayer(null);
      setHasActiveSession(false);
      clearRecoveryData();
    }
  }, [session?.code, currentPlayer?.id]);

  const setReady = useCallback(async (ready: boolean) => {
    if (!session?.code || !currentPlayer?.id) return;

    await updatePlayerInSession(session.code, currentPlayer.id, { isReady: ready });
  }, [session?.code, currentPlayer?.id]);

  const startCountdown = useCallback(async () => {
    if (!session?.code) return;
    await startCountdownService(session.code);
  }, [session?.code]);

  const startGame = useCallback(async () => {
    if (!session?.code) return;
    await startGameSession(session.code);
  }, [session?.code]);

  const updateCurrentGameState = useCallback(async (
    updates: {
      currentTurn?: number;
      currentTurnState?: TurnState | null;
      players?: Player[];
      guessedCountries?: string[];
      turnStartTime?: number | null;
    }
  ) => {
    if (!session?.code) return;
    await updateGameState(session.code, updates);
  }, [session?.code]);

  const updateTurnState = useCallback(async (turnState: TurnState | null) => {
    if (!session?.code) return;
    await updateTurnStateService(session.code, turnState);
  }, [session?.code]);

  const endGame = useCallback(async () => {
    if (!session?.code) return;
    await endGameSession(session.code);
    setHasActiveSession(false);
    clearRecoveryData();
  }, [session?.code]);

  const resumeSession = useCallback(async (): Promise<boolean> => {
    const activeCheck = await checkHasActiveSession();
    if (!activeCheck.hasSession || !activeCheck.session || !activeCheck.playerId) {
      return false;
    }

    setSession(activeCheck.session);
    const player = activeCheck.session.players.find(p => p.id === activeCheck.playerId);
    if (player) {
      setCurrentPlayer(player);
      setHasActiveSession(true);
      // Update connection
      await updatePlayerConnection(activeCheck.session.code, activeCheck.playerId, true);
      return true;
    }
    return false;
  }, []);

  const checkActiveSession = useCallback(async (): Promise<boolean> => {
    const result = await checkHasActiveSession();
    setHasActiveSession(result.hasSession);
    return result.hasSession;
  }, []);

  return {
    session,
    currentPlayer,
    isLoading,
    error,
    hasActiveSession,
    createSession,
    joinSession,
    leaveSession,
    setReady,
    startCountdown,
    startGame,
    updateCurrentGameState,
    updateTurnState,
    endGame,
    resumeSession,
    checkActiveSession,
  };
};
