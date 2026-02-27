import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameSession, Player, PlayerData, PlayersMap, TurnState, SessionRecoveryData, GameMode, JoinRequest } from '@/types/game';
 import type { ActiveCardEffect } from '@/types/cards';
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
  submitJoinRequest,
} from '@/services/gameSessionService';
import { useAuth } from '@/contexts/AuthContext';
import { useToastContext } from '@/contexts/ToastContext';

// --- Session cache helpers ---
const SESSION_CACHE_KEY = 'cachedSession';
const PLAYER_CACHE_KEY = 'cachedPlayer';

const cacheSession = (s: GameSession | null, p: Player | null) => {
  try {
    if (s) {
      localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(s));
    } else {
      localStorage.removeItem(SESSION_CACHE_KEY);
    }
    if (p) {
      localStorage.setItem(PLAYER_CACHE_KEY, JSON.stringify(p));
    } else {
      localStorage.removeItem(PLAYER_CACHE_KEY);
    }
  } catch { /* quota exceeded — ignore */ }
};

const getCachedSession = (): { session: GameSession | null; player: Player | null } => {
  try {
    const s = localStorage.getItem(SESSION_CACHE_KEY);
    const p = localStorage.getItem(PLAYER_CACHE_KEY);
    return {
      session: s ? JSON.parse(s) : null,
      player: p ? JSON.parse(p) : null,
    };
  } catch {
    return { session: null, player: null };
  }
};

const clearSessionCache = () => {
  localStorage.removeItem(SESSION_CACHE_KEY);
  localStorage.removeItem(PLAYER_CACHE_KEY);
};

export const useFirebaseSession = () => {
  // Instantly hydrate from cache for zero-latency restore on refresh
  const [session, setSessionRaw] = useState<GameSession | null>(() => {
    const savedCode = localStorage.getItem('gameSessionCode');
    if (!savedCode) return null;
    const cached = getCachedSession();
    // Only use cache if it matches the saved session code and isn't finished
    if (cached.session?.code === savedCode && cached.session.status !== 'finished') {
      return cached.session;
    }
    return null;
  });
  const [currentPlayer, setCurrentPlayerRaw] = useState<Player | null>(() => {
    const savedCode = localStorage.getItem('gameSessionCode');
    if (!savedCode) return null;
    const cached = getCachedSession();
    if (cached.session?.code === savedCode && cached.session.status !== 'finished') {
      return cached.player;
    }
    return null;
  });

  // Wrapper setters that also persist to cache
  const setSession = useCallback((s: GameSession | null) => {
    setSessionRaw(s);
    // Cache asynchronously to avoid blocking renders
    queueMicrotask(() => {
      setCurrentPlayerRaw(prev => {
        cacheSession(s, prev);
        return prev;
      });
    });
  }, []);

  const setCurrentPlayer = useCallback((p: Player | null) => {
    setCurrentPlayerRaw(p);
    queueMicrotask(() => {
      setSessionRaw(prev => {
        cacheSession(prev, p);
        return prev;
      });
    });
  }, []);

  // If we hydrated from cache, we're NOT loading — the UI can render immediately.
  // We only start as loading if we have saved keys but NO cache (stale/corrupt).
  const [isLoading, setIsLoading] = useState(() => {
    const savedCode = localStorage.getItem('gameSessionCode');
    const savedPlayer = localStorage.getItem('currentPlayerId');
    if (!savedCode || !savedPlayer) return false;
    // If we already hydrated from cache, skip loading
    const cached = getCachedSession();
    return !(cached.session?.code === savedCode && cached.session.status !== 'finished');
  });
  const [error, setError] = useState<string | null>(null);
  const [hasActiveSession, setHasActiveSession] = useState(() => {
    // Instantly true if we hydrated from cache
    const savedCode = localStorage.getItem('gameSessionCode');
    if (!savedCode) return false;
    const cached = getCachedSession();
    return !!(cached.session?.code === savedCode && cached.session.status !== 'finished');
  });
  const { user, tabSessionId } = useAuth();
  const { addToast } = useToastContext();

  // If the user gets logged out (e.g. session conflict from another device),
  // immediately clear any in-progress game state so the UI can't be used in a
  // half-authenticated state.
  // IMPORTANT: We must NOT run this while auth is still loading (user===null
  // on initial render). We use a ref to track whether we ever saw a logged-in
  // user — only then does losing the user mean a real logout.
  const hadUserRef = useRef(false);

  useEffect(() => {
    if (user) {
      hadUserRef.current = true;
      return;
    }
    // Don't clear state for guest players (they have no Firebase auth user)
    const guestId = sessionStorage.getItem('guest_player_id');
    if (guestId) return;

    // Only clear if we previously had a user (real logout), not on initial load
    if (!hadUserRef.current) return;

    setSession(null);
    setCurrentPlayer(null);
    setHasActiveSession(false);
    setError(null);
    clearRecoveryData();
    clearSessionCache();
  }, [user?.id]);

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
        clearSessionCache();
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

  // Restore session from localStorage on mount — retries when user becomes available
  // so that auth-dependent reads (Firebase rules) succeed after refresh.
  const sessionRestoredRef = useRef(false);

  useEffect(() => {
    // Skip if we already successfully restored
    if (sessionRestoredRef.current) return;

    const savedSessionCode = localStorage.getItem('gameSessionCode');
    const savedPlayerId = localStorage.getItem('currentPlayerId');

    if (!savedSessionCode || !savedPlayerId) {
      setIsLoading(false);
      return;
    }

    // For non-guest players, wait until auth is ready before attempting restore
    const isGuestPlayer = savedPlayerId.startsWith('guest_');
    if (!isGuestPlayer && !user) {
      // Auth still loading — keep isLoading true and wait for next render
      return;
    }

    setIsLoading(true);
    getSessionByCode(savedSessionCode)
      .then((restoredSession) => {
        if (restoredSession && restoredSession.status !== 'finished') {
          // Get player from the players map using the saved playerId (which is now auth.uid)
          if (restoredSession.players && restoredSession.players[savedPlayerId]) {
            sessionRestoredRef.current = true;
            setSession(restoredSession);
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
          } else {
            // Session exists but player was removed — zombie state
            console.warn('[Restore] Player not found in session, clearing zombie state');
            clearRecoveryData();
            clearSessionCache();
            setHasActiveSession(false);
            setSession(null);
            setCurrentPlayer(null);
          }
        } else {
          clearRecoveryData();
          clearSessionCache();
          setHasActiveSession(false);
        }
      })
      .catch(() => {
        clearRecoveryData();
        clearSessionCache();
        setHasActiveSession(false);
      })
      .finally(() => setIsLoading(false));
  }, [user?.id]);

   const createSession = useCallback(async (maxPlayers: number, duration: number, isSoloMode?: boolean, gameMode?: GameMode, cardModeEnabled?: boolean, totalRounds?: number, isOpenRoom?: boolean): Promise<string> => {
    // Get current user's auth.uid
    const uid = getCurrentUid();
    if (!uid || !user) {
      setError('You must be signed in to create a session');
      throw new Error('Not authenticated');
    }

    // Check for existing active session
    const activeCheck = await checkHasActiveSession();
    if (activeCheck.hasSession) {
      // For solo mode, stale recovery data could block creation — clear it and retry
      if (isSoloMode) {
        console.warn('[createSession] Stale active session found for solo, clearing...');
        clearRecoveryData();
        clearSessionCache();
      } else {
        setError('You already have an active session. Resume or leave it first.');
        throw new Error('Active session exists');
      }
    }

    // MANDATORY: Validate that this is the authorized session (skip for solo to avoid race conditions)
    if (!isSoloMode) {
      const isValid = await validateUserPresence(uid, tabSessionId);
      if (!isValid) {
        addToast('error', translations[localStorage.getItem('worldquiz_language') as 'en' | 'fr' | 'ar' || 'en'].sessionConflictDesc, 8000);
        throw new Error('Unauthorized session instance');
      }
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

      // Determine effective game mode
      const effectiveGameMode: GameMode = isSoloMode ? 'turnBased' : (gameMode || 'turnBased');

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
        gameMode: effectiveGameMode,
        cardModeEnabled: cardModeEnabled || false,
        activeCardEffects: [],
        isOpenRoom: isSoloMode ? true : (isOpenRoom !== false), // Default to open
        // Speed Race specific — only include when applicable (Firebase rejects undefined)
        ...(gameMode === 'speedRace' ? {
          totalRounds: totalRounds || 20,
          currentRound: 0,
          speedRaceRoundState: null,
        } : {}),
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
    } catch (err: any) {
      console.error('[createSession] Failed:', err?.code, err?.message);
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

    // Skip presence validation for joining — only enforce on creation.
    // Joining via invite link must not be blocked by stale presence records.

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

      // Check if user already in session (using auth.uid) — restore local state
      if (existingSession.players && existingSession.players[uid]) {
        const existingPlayerData = existingSession.players[uid];
        setCurrentPlayer({ id: uid, ...existingPlayerData });
        setSession(existingSession);
        setHasActiveSession(true);
        return true;
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

      // Closed room: submit a join request instead of joining directly
      if (existingSession.isOpenRoom === false) {
        const joinReq: JoinRequest = {
          playerId,
          username: currentUsername || 'Player',
          avatar: user?.avatar || '🗺️',
          color: user?.color || '#4169E1',
          isGuest: false,
          timestamp: Date.now(),
          status: 'pending',
        };
        await submitJoinRequest(code, playerId, joinReq);
        // Store pending info so the UI can show the waiting screen
        localStorage.setItem('pendingJoinRequest', JSON.stringify({
          code,
          playerId,
          username: joinReq.username,
          avatar: joinReq.avatar,
          color: joinReq.color,
          isGuest: false,
        }));
        setError('JOIN_REQUEST_SUBMITTED');
        return false;
      }

      const success = await addPlayerToSession(code, playerData, undefined, existingSession);

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

      return true;
    } catch (err: any) {
      const msg = err?.message || 'Failed to join session';
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, tabSessionId, addToast]);

  // Guest join — no Firebase auth required. Returns { success, error } for precise error reporting.
  const joinSessionAsGuest = useCallback(async (code: string, guestUsername: string): Promise<boolean> => {
    // Always generate a fresh guest ID for each join attempt to avoid "already joined" false positives
    const guestId = 'guest_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    sessionStorage.setItem('guest_player_id', guestId);

    setIsLoading(true);
    setError(null);

    try {
      console.log('[Guest Join] Fetching session:', code);
      const existingSession = await getSessionByCode(code);
      console.log('[Guest Join] Session fetched:', existingSession?.code, 'status:', existingSession?.status, 'players:', Object.keys(existingSession?.players || {}).length);

      if (!existingSession) {
        console.warn('[Guest Join] Session not found:', code);
        throw new Error('Session not found. The link may have expired.');
      }

      const currentPlayers = playersMapToArray(existingSession.players);
      console.log('[Guest Join] Player count:', currentPlayers.length, '/', existingSession.maxPlayers);

      if (currentPlayers.length >= existingSession.maxPlayers) {
        throw new Error(`Session is full (${currentPlayers.length}/${existingSession.maxPlayers})`);
      }
      if (existingSession.status !== 'waiting') {
        throw new Error('Session has already started');
      }

      const avatars = ['🗺️', '🌍', '🌎', '🌏', '🧭', '🏔️', '🌊', '🏝️', '🌋', '🌵'];
      const colors = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

      const playerData: PlayerData = {
        username: guestUsername,
        avatar: avatars[Math.floor(Math.random() * avatars.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
        score: 0,
        turnsPlayed: 0,
        countriesGuessed: [],
        isReady: false,
        isConnected: true,
        lastSeen: Date.now(),
        isGuest: true,
      };

      // Closed room: submit a join request instead of joining directly
      if (existingSession.isOpenRoom === false) {
        const joinReq: JoinRequest = {
          playerId: guestId,
          username: guestUsername,
          avatar: playerData.avatar,
          color: playerData.color,
          isGuest: true,
          timestamp: Date.now(),
          status: 'pending',
        };
        await submitJoinRequest(code, guestId, joinReq);
        localStorage.setItem('pendingJoinRequest', JSON.stringify({
          code,
          playerId: guestId,
          username: guestUsername,
          avatar: playerData.avatar,
          color: playerData.color,
          isGuest: true,
        }));
        setError('JOIN_REQUEST_SUBMITTED');
        return false;
      }

      // Pass the pre-validated session to skip a redundant re-fetch inside addPlayerToSession.
      // This avoids any potential permission issues for unauthenticated guests.
      const success = await addPlayerToSession(code, playerData, guestId, existingSession);
      console.log('[Guest Join] addPlayerToSession result:', success, 'guestId:', guestId);

      setCurrentPlayer({ id: guestId, ...playerData });
      // Build optimistic session immediately — avoids a second read that could fail for guests
      const optimisticSession: GameSession = {
        ...existingSession,
        players: { ...existingSession.players, [guestId]: playerData },
      };
      setSession(optimisticSession);
      setHasActiveSession(true);

      sessionStorage.setItem('guest_session_code', code);
      sessionStorage.setItem('guest_username', guestUsername);
      localStorage.setItem('gameSessionCode', code);
      localStorage.setItem('currentPlayerId', guestId);

      return true;
    } catch (err: any) {
      console.error('[Guest Join] Error:', err);
      const msg = err?.message || 'Failed to join session';
      setError(msg);
      throw err; // Re-throw so handleGuestJoin can show the real message

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
      setHasActiveSession(false);
      clearRecoveryData();
      clearSessionCache();
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
       activeCardEffects?: ActiveCardEffect[];
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
    clearSessionCache();
  }, [session?.code]);

  // Returns the session status string on success (e.g. 'waiting', 'playing'),
  // or null on failure. On failure, clears all zombie state so new games can be created.
  const resumeSession = useCallback(async (): Promise<string | null> => {
    const activeCheck = await checkHasActiveSession();
    if (!activeCheck.hasSession || !activeCheck.session || !activeCheck.playerId) {
      // Session is gone — clear zombie state so user can start a new game
      console.warn('[resumeSession] No active session found, clearing zombie state');
      setHasActiveSession(false);
      setSession(null);
      setCurrentPlayer(null);
      clearRecoveryData();
      clearSessionCache();
      return null;
    }

    const uid = getCurrentUid();

    // MANDATORY: Validate that this is the authorized session
    if (uid) {
      const isValid = await validateUserPresence(uid, tabSessionId);
      if (!isValid) {
        addToast('error', translations[localStorage.getItem('worldquiz_language') as 'en' | 'fr' | 'ar' || 'en'].sessionConflictDesc, 8000);
        // Tab conflict — don't clear recovery (session is valid, just wrong tab)
        return null;
      }
    }

    if (activeCheck.session.players && activeCheck.session.players[activeCheck.playerId]) {
      setSession(activeCheck.session);
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
      return activeCheck.session.status;
    }

    // Player not in session — zombie state
    console.warn('[resumeSession] Player not in session, clearing zombie state');
    setHasActiveSession(false);
    setSession(null);
    setCurrentPlayer(null);
    clearRecoveryData();
    clearSessionCache();
    return null;
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

  // Restore session state after a join request is approved
  const restoreApprovedSession = useCallback(async (code: string, playerId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const existingSession = await getSessionByCode(code);
      if (!existingSession || !existingSession.players?.[playerId]) {
        setError('Session not found or player not approved');
        return false;
      }

      const playerData = existingSession.players[playerId];
      setCurrentPlayer({ id: playerId, ...playerData });
      setSession(existingSession);
      setHasActiveSession(true);

      // Store session recovery data
      localStorage.setItem('gameSessionCode', code);
      localStorage.setItem('currentPlayerId', playerId);

      if (playerData.isGuest) {
        sessionStorage.setItem('guest_player_id', playerId);
        sessionStorage.setItem('guest_session_code', code);
        sessionStorage.setItem('guest_username', playerData.username);
      }

      return true;
    } catch (err: any) {
      setError(err?.message || 'Failed to restore session');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    session,
    currentPlayer,
    isLoading,
    error,
    hasActiveSession,
    createSession,
    joinSession,
    joinSessionAsGuest,
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
    getPlayersArray,
    restoreApprovedSession,
  };
};
