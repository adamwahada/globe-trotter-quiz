import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameSession, Player, PlayerData, PlayersMap, TurnState, SessionRecoveryData } from '@/types/game';
import { playersMapToArray, getPlayerUids } from '@/types/game';
import { translations } from '@/i18n/translations';
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
  trackUserPresence,
  validateUserPresence,
  getCurrentUid,
  updatePlayerData,
} from '@/services/gameSessionService';
import { useAuth } from '@/contexts/AuthContext';
import { useToastContext } from '@/contexts/ToastContext';

export const useFirebaseSession = () => {
  const [session, setSession] = useState<GameSession | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const { user, tabSessionId } = useAuth();
  const { addToast } = useToastContext();

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
        const updatedPlayers = playersMapToArray(updatedSession.players);
        console.log('[Firebase] Session update received:', updatedPlayers.length, 'players');

        // Check for departures to show notifications
        if (session) {
          const currentPlayers = playersMapToArray(session.players);
          const removedPlayers = currentPlayers.filter(
            p => !updatedSession.players || !updatedSession.players[p.id]
          );

          if (removedPlayers.length > 0) {
            removedPlayers.forEach(p => {
              // Don't toast for ourselves
              if (p.id !== currentPlayerIdRef.current) {
                console.log('[Firebase] Player left:', p.username);
              }
            });
          }
        }

        setSession(updatedSession);
        // Update current player from session using ref to get latest value
        const playerId = currentPlayerIdRef.current;
        if (playerId && updatedSession.players && updatedSession.players[playerId]) {
          const playerData = updatedSession.players[playerId];
          setCurrentPlayer({
            id: playerId,
            ...playerData
          });
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
  }, [session?.code]);

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

            // Get player from the players map using the saved playerId (which is now auth.uid)
            if (restoredSession.players && restoredSession.players[savedPlayerId]) {
              const playerData = restoredSession.players[savedPlayerId];
              setCurrentPlayer({
                id: savedPlayerId,
                ...playerData
              });
              setHasActiveSession(true);

              // Register this session for the current game
              if (user?.id) {
                trackUserPresence(user.id, tabSessionId, savedSessionCode);
              }

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

  const createSession = useCallback(async (maxPlayers: number, duration: number, isSoloMode?: boolean): Promise<string> => {
    // Get current user's auth.uid
    const uid = getCurrentUid();
    if (!uid || !user) {
      setError('You must be signed in to create a session');
      throw new Error('Not authenticated');
    }

    // Check for existing active session
    const activeCheck = await checkHasActiveSession();
    if (activeCheck.hasSession) {
      setError('You already have an active session. Resume or leave it first.');
      throw new Error('Active session exists');
    }

    // MANDATORY: Validate that this is the authorized session
    const isValid = await validateUserPresence(uid, tabSessionId);
    if (!isValid) {
      addToast('error', translations[localStorage.getItem('worldquiz_language') as 'en' | 'fr' | 'ar' || 'en'].sessionConflictDesc, 8000);
      throw new Error('Unauthorized session instance');
    }

    setIsLoading(true);
    setError(null);

    try {
      const code = generateCode();

      // Use auth.uid as player ID
      const playerId = uid;

      const playerData: PlayerData = {
        username: user?.username || 'You',
        avatar: user?.avatar || '🌍',
        color: user?.color || '#E50914',
        score: 0,
        turnsPlayed: 0,
        countriesGuessed: [],
        isReady: isSoloMode ? true : false, // Auto-ready for solo
        isConnected: true,
        lastSeen: Date.now(),
      };

      // Create players map with auth.uid as key
      const playersMap: PlayersMap = {
        [playerId]: playerData
      };

      const newSession: GameSession = {
        id: Date.now().toString(),
        code,
        creatorId: uid, // Store creator's auth.uid
        host: playerId,
        players: playersMap,
        maxPlayers: isSoloMode ? 1 : maxPlayers,
        duration: Math.min(duration, 60), // Max 60 minutes
        status: isSoloMode ? 'playing' : 'waiting', // Solo skips waiting room
        currentTurn: 0,
        currentTurnState: null,
        guessedCountries: [],
        correctCountries: [],
        wrongCountries: [],
        startTime: isSoloMode ? Date.now() : null, // Start immediately for solo
        waitingRoomStartTime: Date.now(),
        countdownStartTime: null,
        turnStartTime: null,
        isSoloMode: isSoloMode || false,
      };

      await createSessionInFirebase(newSession);

      setSession(newSession);
      setCurrentPlayer({
        id: playerId,
        ...playerData
      });
      setHasActiveSession(true);

      // Track user session for single-session enforcement
      await trackUserPresence(uid, tabSessionId, code);

      // Save recovery data with auth.uid as playerId
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
  }, [user, tabSessionId, addToast]);

  const joinSession = useCallback(async (code: string, username?: string): Promise<boolean> => {
    // Get current user's auth.uid
    const uid = getCurrentUid();
    if (!uid) {
      setError('You must be signed in to join a session');
      return false;
    }

    // Check for existing active session
    const activeCheck = await checkHasActiveSession();
    if (activeCheck.hasSession && activeCheck.session?.code !== code) {
      setError('You already have an active session. Resume or leave it first.');
      return false;
    }

    setIsLoading(true);
    setError(null);

    // MANDATORY: Validate that this is the authorized session
    const isValid = await validateUserPresence(uid, tabSessionId);
    if (!isValid) {
      addToast('error', translations[localStorage.getItem('worldquiz_language') as 'en' | 'fr' | 'ar' || 'en'].sessionConflictDesc, 8000);
      setIsLoading(false);
      return false;
    }

    try {
      const existingSession = await getSessionByCode(code);

      if (!existingSession) {
        setError('Session not found');
        return false;
      }

      const currentPlayers = playersMapToArray(existingSession.players);

      if (currentPlayers.length >= existingSession.maxPlayers) {
        setError('Session is full');
        return false;
      }

      // Allow joining waiting sessions only
      if (existingSession.status !== 'waiting') {
        setError('Session has already started');
        return false;
      }

      // Check if user already in session (using auth.uid)
      if (existingSession.players && existingSession.players[uid]) {
        setError(translations[localStorage.getItem('worldquiz_language') as ('en' | 'fr' | 'ar') || 'en'].duplicateJoinError);
        return false;
      }

      // Use auth.uid as player ID
      const playerId = uid;
      const currentUsername = username || user?.username || localStorage.getItem('guest_username');

      const playerData: PlayerData = {
        username: currentUsername || 'Player',
        avatar: user?.avatar || '🗺️',
        color: user?.color || '#4169E1',
        score: 0,
        turnsPlayed: 0,
        countriesGuessed: [],
        isReady: false,
        isConnected: true,
        lastSeen: Date.now(),
      };

      const success = await addPlayerToSession(code, playerData);

      if (success) {
        // Set current player
        setCurrentPlayer({
          id: playerId,
          ...playerData
        });

        // Get the refreshed session
        const refreshedSession = await getSessionByCode(code);
        setSession(refreshedSession || existingSession);

        setHasActiveSession(true);

        if (username) localStorage.setItem('guest_username', username);
        localStorage.setItem('gameSessionCode', code);
        localStorage.setItem('currentPlayerId', playerId);

        // Track user session for single-session enforcement
        await trackUserPresence(uid, tabSessionId, code);

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
  }, [user, tabSessionId, addToast]);

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

  const updatePlayerMetadata = useCallback(async (metadata: Partial<PlayerData>) => {
    if (!session?.code || !currentPlayer?.id) return;
    await updatePlayerInSession(session.code, currentPlayer.id, metadata);
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
      players?: PlayersMap;
      guessedCountries?: string[];
      correctCountries?: string[];
      wrongCountries?: string[];
      turnStartTime?: number | null;
      isExtraTime?: boolean;
    }
  ) => {
    if (!session?.code) return;
    await updateGameState(session.code, updates);
  }, [session?.code]);

  const updateTurnState = useCallback(async (turnState: TurnState | null) => {
    if (!session?.code) return;

    // If turn is being submitted (completed), increment turnsPlayed for the player
    if (turnState?.submittedAnswer !== null && session.currentTurnState?.submittedAnswer === null) {
      const playerUids = getPlayerUids(session.players);
      const currentPlayerUid = playerUids[session.currentTurn];

      if (currentPlayerUid && session.players[currentPlayerUid]) {
        const currentPlayerData = session.players[currentPlayerUid];
        const updatedPlayers: PlayersMap = {
          ...session.players,
          [currentPlayerUid]: {
            ...currentPlayerData,
            turnsPlayed: currentPlayerData.turnsPlayed + 1
          }
        };

        await updateGameState(session.code, {
          currentTurnState: turnState,
          players: updatedPlayers
        });
        return;
      }
    }

    await updateTurnStateService(session.code, turnState);
  }, [session]);

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

    const uid = getCurrentUid();

    // MANDATORY: Validate that this is the authorized session
    if (uid) {
      const isValid = await validateUserPresence(uid, tabSessionId);
      if (!isValid) {
        addToast('error', translations[localStorage.getItem('worldquiz_language') as 'en' | 'fr' | 'ar' || 'en'].sessionConflictDesc, 8000);
        return false;
      }
    }

    setSession(activeCheck.session);

    if (activeCheck.session.players && activeCheck.session.players[activeCheck.playerId]) {
      const playerData = activeCheck.session.players[activeCheck.playerId];
      setCurrentPlayer({
        id: activeCheck.playerId,
        ...playerData
      });
      setHasActiveSession(true);

      // Track user session for single-session enforcement
      if (uid) {
        await trackUserPresence(uid, tabSessionId, activeCheck.session.code);
      }

      // Update connection
      await updatePlayerConnection(activeCheck.session.code, activeCheck.playerId, true);
      return true;
    }
    return false;
  }, [tabSessionId, addToast]);

  const checkActiveSession = useCallback(async (): Promise<boolean> => {
    const result = await checkHasActiveSession();
    setHasActiveSession(result.hasSession);
    return result.hasSession;
  }, []);

  // Helper to get players as array for UI components
  const getPlayersArray = useCallback((): Player[] => {
    return playersMapToArray(session?.players);
  }, [session?.players]);

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
    updatePlayerMetadata,
    startCountdown,
    startGame,
    updateCurrentGameState,
    updateTurnState,
    endGame,
    resumeSession,
    checkActiveSession,
    getPlayersArray, // New helper for UI components
  };
};
