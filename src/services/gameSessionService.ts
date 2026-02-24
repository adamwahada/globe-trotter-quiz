import { database, auth, ref, set, onValue, update, remove, get, isFirebaseReady, onDisconnect } from '@/lib/firebase';
import type { GameSession, Player, PlayerData, PlayersMap, TurnState, SessionRecoveryData, JoinRequest } from '@/types/game';
import { playersMapToArray, getPlayerUids } from '@/types/game';

const SESSIONS_PATH = 'sessions';

// Generate random 6-character code
export const generateCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Get current authenticated user's UID
export const getCurrentUid = (): string | null => {
  return auth?.currentUser?.uid || null;
};

// Create a new session in Firebase
export const createSessionInFirebase = async (
  sessionData: GameSession
): Promise<void> => {
  const uid = getCurrentUid();
  if (!uid) {
    throw new Error('User must be authenticated to create a session');
  }

  if (!isFirebaseReady() || !database) {
    console.warn('Firebase not ready, storing session locally');
    localStorage.setItem(`session_${sessionData.code}`, JSON.stringify(sessionData));
    return;
  }
  const sessionRef = ref(database, `${SESSIONS_PATH}/${sessionData.code}`);
  await set(sessionRef, sessionData);
};

// Get session by code — works for both authenticated and guest (unauthenticated) users
export const getSessionByCode = async (code: string): Promise<GameSession | null> => {
  if (!isFirebaseReady() || !database) {
    const localSession = localStorage.getItem(`session_${code}`);
    return localSession ? JSON.parse(localSession) : null;
  }
  try {
    const sessionRef = ref(database, `${SESSIONS_PATH}/${code}`);
    const snapshot = await get(sessionRef);
    return snapshot.exists() ? snapshot.val() as GameSession : null;
  } catch (err: any) {
    // Firebase permission denied can happen if the session is not in 'waiting' status
    // and the reader is unauthenticated. Return null gracefully.
    console.warn('[Firebase] getSessionByCode error:', err?.code, err?.message);
    return null;
  }
};

// Subscribe to session changes — works for both authenticated and guest users.
// For guests, falls back to polling if the realtime subscription is denied after
// the session moves past 'waiting' (Firebase restricts unauthenticated reads).
export const subscribeToSession = (
  code: string,
  callback: (session: GameSession | null) => void
): (() => void) => {
  if (!isFirebaseReady() || !database) {
    const localSession = localStorage.getItem(`session_${code}`);
    callback(localSession ? JSON.parse(localSession) : null);
    return () => { };
  }
  const sessionRef = ref(database, `${SESSIONS_PATH}/${code}`);
  const isGuest = !!sessionStorage.getItem('guest_player_id');

  let pollInterval: ReturnType<typeof setInterval> | null = null;
  let unsubscribed = false;

  // Start polling fallback for guests (every 2 seconds) — this bypasses permission
  // issues since we use a plain REST-style `get()` call which can succeed even when
  // the realtime listener is denied.
  const startGuestPolling = () => {
    if (pollInterval || unsubscribed) return;
    console.log('[Firebase] Guest subscription denied — switching to polling fallback');
    pollInterval = setInterval(async () => {
      if (unsubscribed) {
        if (pollInterval) clearInterval(pollInterval);
        return;
      }
      try {
        const snapshot = await get(sessionRef);
        callback(snapshot.exists() ? snapshot.val() as GameSession : null);
      } catch (err) {
        // If even polling fails, keep last known state (do not call callback(null))
        console.warn('[Firebase] Guest poll error:', (err as any)?.code);
      }
    }, 2000);
  };

  const unsubscribe = onValue(sessionRef, (snapshot) => {
    // Real-time update received — stop polling if it was running
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    callback(snapshot.exists() ? snapshot.val() as GameSession : null);
  }, (error) => {
    console.warn('[Firebase] subscribeToSession error:', (error as any)?.code, error?.message);
    if (isGuest) {
      // Switch to polling so the guest keeps receiving updates
      startGuestPolling();
    } else {
      callback(null);
    }
  });

  return () => {
    unsubscribed = true;
    if (pollInterval) clearInterval(pollInterval);
    unsubscribe();
  };
};

// Update session — allows both authenticated users and guest players.
// Firebase rules enforce security: guests can only write during active gameplay.
export const updateSession = async (
  code: string,
  updates: Partial<GameSession>
): Promise<void> => {
  const uid = getCurrentUid();
  const guestId = typeof sessionStorage !== 'undefined'
    ? sessionStorage.getItem('guest_player_id')
    : null;

  if (!uid && !guestId) {
    throw new Error('No player identity found to update session');
  }

  if (!isFirebaseReady() || !database) {
    const localSession = localStorage.getItem(`session_${code}`);
    if (localSession) {
      const session = JSON.parse(localSession);
      localStorage.setItem(`session_${code}`, JSON.stringify({ ...session, ...updates }));
    }
    return;
  }
  const sessionRef = ref(database, `${SESSIONS_PATH}/${code}`);
  await update(sessionRef, updates);
};

// Add player to session using auth.uid or an explicit guest ID.
// Pass `preValidatedSession` to skip the internal re-fetch (useful for guests who already verified the session)
export const addPlayerToSession = async (
  code: string,
  playerData: PlayerData,
  explicitPlayerId?: string, // used for guest joins
  preValidatedSession?: GameSession // skip internal re-fetch if already validated
): Promise<boolean> => {
  const uid = explicitPlayerId || getCurrentUid();
  if (!uid) {
    throw new Error('Must provide a player ID to join a session');
  }

  if (!isFirebaseReady() || !database) {
    return false;
  }

  // If a pre-validated session was passed, trust it (avoids a potentially
  // permission-denied re-fetch for unauthenticated guests).
  const session = preValidatedSession ?? await getSessionByCode(code);
  if (!session) {
    throw new Error('Session not found');
  }

  const currentPlayers = playersMapToArray(session.players);
  if (currentPlayers.length >= session.maxPlayers) {
    throw new Error(`Session is full (${currentPlayers.length}/${session.maxPlayers})`);
  }
  if (session.status !== 'waiting') {
    throw new Error('Session has already started');
  }

  // Check if player already in session
  if (session.players && session.players[uid]) {
    throw new Error('You have already joined this session');
  }

  // Write player entry using uid as the key
  const playerRef = ref(database, `${SESSIONS_PATH}/${code}/players/${uid}`);
  try {
    await set(playerRef, playerData);
    console.log('[addPlayerToSession] Write succeeded for:', uid);
    return true;
  } catch (err: any) {
    console.error('[addPlayerToSession] Firebase write DENIED:', err?.code, err?.message, 'playerId:', uid, 'sessionCode:', code);
    throw new Error(err?.message || 'Firebase permission denied — could not write player data');
  }
};

// Remove player from session
export const removePlayerFromSession = async (
  code: string,
  playerId: string
): Promise<void> => {
  const uid = getCurrentUid();
  const isGuestPlayer = playerId.startsWith('guest_');

  // Allow guests to remove themselves; authenticated users must be self or creator
  if (!isGuestPlayer && !uid) {
    throw new Error('User must be authenticated');
  }

  if (!isGuestPlayer && uid && playerId !== uid) {
    const session = await getSessionByCode(code);
    if (!session) return;
    if (session.creatorId !== uid) {
      throw new Error('Cannot remove other players');
    }
  }

  const session = await getSessionByCode(code);
  if (!session) return;

  const playerUids = getPlayerUids(session.players);

  if (!isFirebaseReady() || !database) {
    return;
  }

  // Check if this would leave 0 players
  if (playerUids.length <= 1 && playerUids.includes(playerId)) {
    await deleteSession(code);
  } else {
    const playerRef = ref(database, `${SESSIONS_PATH}/${code}/players/${playerId}`);
    await remove(playerRef);
  }
};

// Update player in session
export const updatePlayerInSession = async (
  code: string,
  playerId: string,
  updates: Partial<PlayerData>
): Promise<void> => {
  const uid = getCurrentUid();
  const isGuestPlayer = playerId.startsWith('guest_');

  if (!isGuestPlayer && !uid) {
    throw new Error('User must be authenticated');
  }

  // Can only update your own player data
  if (!isGuestPlayer && uid && playerId !== uid) {
    throw new Error('Cannot update other players');
  }

  if (!isFirebaseReady() || !database) {
    return;
  }

  const playerRef = ref(database, `${SESSIONS_PATH}/${code}/players/${playerId}`);
  await update(playerRef, updates);
};

// Delete session
export const deleteSession = async (code: string): Promise<void> => {
  if (!isFirebaseReady() || !database) {
    localStorage.removeItem(`session_${code}`);
    return;
  }
  const sessionRef = ref(database, `${SESSIONS_PATH}/${code}`);
  await remove(sessionRef);
};

// Update game state (for realtime sync during gameplay)
export const updateGameState = async (
  code: string,
  gameState: {
    currentTurn?: number;
    currentTurnState?: TurnState | null;
    players?: PlayersMap;
    guessedCountries?: string[];
    correctCountries?: string[];
    wrongCountries?: string[];
    status?: 'waiting' | 'countdown' | 'playing' | 'finished';
    turnStartTime?: number | null;
    isExtraTime?: boolean;
  }
): Promise<void> => {
  await updateSession(code, gameState);
};

// Update a specific player's data in the players map
export const updatePlayerData = async (
  code: string,
  playerId: string,
  updates: Partial<PlayerData>
): Promise<void> => {
  if (!isFirebaseReady() || !database) {
    return;
  }

  const playerRef = ref(database, `${SESSIONS_PATH}/${code}/players/${playerId}`);
  await update(playerRef, updates);
};

// Start countdown before game
export const startCountdown = async (code: string): Promise<void> => {
  await updateSession(code, {
    status: 'countdown',
    countdownStartTime: Date.now(),
  });
};

// Start game
export const startGameSession = async (code: string): Promise<void> => {
  await updateSession(code, {
    status: 'playing',
    startTime: Date.now(),
    currentTurn: 0,
    // turnStartTime is set to null initially; it will be set when the dice is rolled
    // and the country is determined, so the 30s countdown starts fairly
    turnStartTime: null,
    currentTurnState: null,
  });
};

// End game
export const endGameSession = async (code: string): Promise<void> => {
  await updateSession(code, {
    status: 'finished',
  });
};

// Kick unready players from session (used when waiting room timer expires)
export const kickUnreadyPlayers = async (code: string): Promise<string[]> => {
  const session = await getSessionByCode(code);
  if (!session || !session.players) return [];

  const kickedPlayerIds: string[] = [];
  const playerUids = Object.keys(session.players);

  for (const uid of playerUids) {
    const player = session.players[uid];
    if (!player.isReady) {
      kickedPlayerIds.push(uid);
      // Remove player from session
      if (isFirebaseReady() && database) {
        const playerRef = ref(database, `${SESSIONS_PATH}/${code}/players/${uid}`);
        await remove(playerRef);
      }
    }
  }

  return kickedPlayerIds;
};

// --- Join Request System (Closed Rooms) ---

// Submit a join request for a closed room
export const submitJoinRequest = async (
  code: string,
  playerId: string,
  request: JoinRequest
): Promise<void> => {
  if (!isFirebaseReady() || !database) {
    throw new Error('Firebase not ready');
  }
  const requestRef = ref(database, `${SESSIONS_PATH}/${code}/joinRequests/${playerId}`);
  await set(requestRef, request);
};

// Subscribe to join requests (for host to see incoming requests in real-time)
export const subscribeToJoinRequests = (
  code: string,
  callback: (requests: { [id: string]: JoinRequest } | null) => void
): (() => void) => {
  if (!isFirebaseReady() || !database) {
    callback(null);
    return () => {};
  }
  const requestsRef = ref(database, `${SESSIONS_PATH}/${code}/joinRequests`);
  const unsubscribe = onValue(requestsRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  }, () => {
    callback(null);
  });
  return unsubscribe;
};

// Subscribe to a specific join request status (for the requesting player to watch for approval/rejection)
export const subscribeToJoinRequestStatus = (
  code: string,
  playerId: string,
  callback: (request: JoinRequest | null) => void
): (() => void) => {
  if (!isFirebaseReady() || !database) {
    callback(null);
    return () => {};
  }
  const requestRef = ref(database, `${SESSIONS_PATH}/${code}/joinRequests/${playerId}`);
  const unsubscribe = onValue(requestRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  }, () => {
    callback(null);
  });
  return unsubscribe;
};

// Approve a join request — moves player data from joinRequests into players
export const approveJoinRequest = async (
  code: string,
  requestPlayerId: string
): Promise<boolean> => {
  if (!isFirebaseReady() || !database) return false;

  const session = await getSessionByCode(code);
  if (!session) return false;

  const request = session.joinRequests?.[requestPlayerId];
  if (!request || request.status !== 'pending') return false;

  const currentPlayers = playersMapToArray(session.players);
  if (currentPlayers.length >= session.maxPlayers) return false;

  // Create player data from the request
  const playerData: PlayerData = {
    username: request.username,
    avatar: request.avatar,
    color: request.color,
    score: 0,
    turnsPlayed: 0,
    countriesGuessed: [],
    isReady: false,
    isConnected: true,
    lastSeen: Date.now(),
    isGuest: request.isGuest,
  };

  // Add player to the session
  const playerRef = ref(database, `${SESSIONS_PATH}/${code}/players/${requestPlayerId}`);
  await set(playerRef, playerData);

  // Update request status to approved
  const requestRef = ref(database, `${SESSIONS_PATH}/${code}/joinRequests/${requestPlayerId}/status`);
  await set(requestRef, 'approved');

  return true;
};

// Reject a join request
export const rejectJoinRequest = async (
  code: string,
  requestPlayerId: string
): Promise<void> => {
  if (!isFirebaseReady() || !database) return;
  const requestRef = ref(database, `${SESSIONS_PATH}/${code}/joinRequests/${requestPlayerId}/status`);
  await set(requestRef, 'rejected');
};

// Cancel a join request (player cancels their own request)
export const cancelJoinRequest = async (
  code: string,
  playerId: string
): Promise<void> => {
  if (!isFirebaseReady() || !database) return;
  const requestRef = ref(database, `${SESSIONS_PATH}/${code}/joinRequests/${playerId}`);
  await remove(requestRef);
};

// Update turn state (for realtime sync of turn actions)
export const updateTurnState = async (
  code: string,
  turnState: TurnState | null
): Promise<void> => {
  await updateSession(code, {
    currentTurnState: turnState,
    turnStartTime: turnState?.startTime || null,
  });
};

// Save recovery data for reconnection
export const saveRecoveryData = (data: SessionRecoveryData): void => {
  localStorage.setItem('gameRecovery', JSON.stringify(data));
};

// Get recovery data
export const getRecoveryData = (): SessionRecoveryData | null => {
  const data = localStorage.getItem('gameRecovery');
  return data ? JSON.parse(data) : null;
};

// Clear recovery data
export const clearRecoveryData = (): void => {
  localStorage.removeItem('gameRecovery');
  localStorage.removeItem('gameSessionCode');
  localStorage.removeItem('currentPlayerId');
};

// Check if player has active session
export const hasActiveSession = async (): Promise<{ hasSession: boolean; session: GameSession | null; playerId: string | null }> => {
  const recoveryData = getRecoveryData();
  if (!recoveryData) {
    return { hasSession: false, session: null, playerId: null };
  }

  // Check if recovery data is recent (within 1 hour)
  if (Date.now() - recoveryData.timestamp > 3600000) {
    clearRecoveryData();
    return { hasSession: false, session: null, playerId: null };
  }

  const session = await getSessionByCode(recoveryData.sessionCode);
  if (!session) {
    clearRecoveryData();
    return { hasSession: false, session: null, playerId: null };
  }

  // Check if session is still active (not finished)
  if (session.status === 'finished') {
    clearRecoveryData();
    return { hasSession: false, session: null, playerId: null };
  }

  // Check if player is still in session (using auth.uid)
  const playerExists = session.players && session.players[recoveryData.playerId];
  if (!playerExists) {
    clearRecoveryData();
    return { hasSession: false, session: null, playerId: null };
  }

  return { hasSession: true, session, playerId: recoveryData.playerId };
};

// Update player connection status
export const updatePlayerConnection = async (
  code: string,
  playerId: string,
  isConnected: boolean
): Promise<void> => {
  const uid = getCurrentUid();
  const isGuestPlayer = playerId.startsWith('guest_');
  // Guests use their guestId, authenticated users must match uid
  if (!isGuestPlayer && (!uid || playerId !== uid)) {
    return; // Can only update own connection status
  }

  try {
    await updatePlayerData(code, playerId, {
      isConnected,
      lastSeen: Date.now(),
    });
  } catch (err: any) {
    // Silently ignore permission errors for guests — they cannot write after status changes
    console.warn('[updatePlayerConnection] Write skipped:', err?.code);
  }
};

// --- User Presence & Single Session Enforcement ---

/**
 * Register a unique sessionId for a user's current session/tab.
 * Uses onDisconnect() to ensure cleanup when the browser is closed.
 */
export const trackUserPresence = async (
  uid: string,
  sessionId: string,
  sessionCode: string = ''
): Promise<void> => {
  if (!isFirebaseReady() || !database) return;

  const userPresenceRef = ref(database, `activeSessions/${uid}`);

  // Set the current session info
  await set(userPresenceRef, {
    sessionId,
    sessionCode,
    timestamp: Date.now(),
    connected: true
  });

  // Ensure the record is removed when this specific client disconnects
  // This prevents ghost sessions even if the browser crashes
  await onDisconnect(userPresenceRef).remove();
};

/**
 * Listen for changes to the user's active session.
 * This is used globally to detect if the same account logs in elsewhere.
 */
export const subscribeToUserPresence = (
  uid: string,
  callback: (presence: { sessionId: string; sessionCode: string } | null) => void
): (() => void) => {
  if (!isFirebaseReady() || !database) return () => { };

  const userPresenceRef = ref(database, `activeSessions/${uid}`);
  const unsubscribe = onValue(userPresenceRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  }, (error) => {
    console.error('[Presence] Subscription error:', error);
  });

  return unsubscribe;
};

/**
 * Explicitly clear presence (e.g., on manual logout)
 */
export const clearUserPresence = async (uid: string): Promise<void> => {
  if (!isFirebaseReady() || !database) return;
  const userPresenceRef = ref(database, `activeSessions/${uid}`);
  await remove(userPresenceRef);
};

/**
 * Validate that the current client matches the registered session in the database.
 */
export const validateUserPresence = async (uid: string, localSessionId: string): Promise<boolean> => {
  if (!isFirebaseReady() || !database) return true; // Allow if Firebase not ready
  const userPresenceRef = ref(database, `activeSessions/${uid}`);
  try {
    const snapshot = await get(userPresenceRef);
    if (!snapshot.exists()) return true; // No session registered yet
    return snapshot.val().sessionId === localSessionId;
  } catch (error) {
    console.error('[Presence] Validation error:', error);
    return true; // Allow on error to avoid blocking users
  }
};
