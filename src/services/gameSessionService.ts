import { database, ref, set, onValue, update, remove, get, isFirebaseReady, onDisconnect } from '@/lib/firebase';
import type { GameSession, Player, TurnState, SessionRecoveryData } from '@/types/game';

const SESSIONS_PATH = 'sessions';
const RECOVERY_PATH = 'recovery';

// Generate random 6-character code
export const generateCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Create a new session in Firebase
export const createSessionInFirebase = async (
  sessionData: GameSession
): Promise<void> => {
  if (!isFirebaseReady() || !database) {
    console.warn('Firebase not ready, storing session locally');
    localStorage.setItem(`session_${sessionData.code}`, JSON.stringify(sessionData));
    return;
  }
  const sessionRef = ref(database, `${SESSIONS_PATH}/${sessionData.code}`);
  await set(sessionRef, sessionData);
};

// Get session by code
export const getSessionByCode = async (code: string): Promise<GameSession | null> => {
  if (!isFirebaseReady() || !database) {
    const localSession = localStorage.getItem(`session_${code}`);
    return localSession ? JSON.parse(localSession) : null;
  }
  const sessionRef = ref(database, `${SESSIONS_PATH}/${code}`);
  const snapshot = await get(sessionRef);
  return snapshot.exists() ? snapshot.val() as GameSession : null;
};

// Subscribe to session changes
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
  const unsubscribe = onValue(sessionRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() as GameSession : null);
  });
  return unsubscribe;
};

// Update session
export const updateSession = async (
  code: string,
  updates: Partial<GameSession>
): Promise<void> => {
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

// Add player to session
export const addPlayerToSession = async (
  code: string,
  player: Player
): Promise<boolean> => {
  const session = await getSessionByCode(code);
  if (!session) return false;
  if (session.players.length >= session.maxPlayers) return false;
  if (session.status !== 'waiting') return false;

  const updatedPlayers = [...session.players, player];
  await updateSession(code, { players: updatedPlayers });
  return true;
};

// Remove player from session
export const removePlayerFromSession = async (
  code: string,
  playerId: string
): Promise<void> => {
  const session = await getSessionByCode(code);
  if (!session) return;

  const updatedPlayers = session.players.filter(p => p.id !== playerId);

  if (updatedPlayers.length === 0) {
    await deleteSession(code);
  } else {
    await updateSession(code, { players: updatedPlayers });
  }
};

// Update player in session
export const updatePlayerInSession = async (
  code: string,
  playerId: string,
  updates: Partial<Player>
): Promise<void> => {
  const session = await getSessionByCode(code);
  if (!session) return;

  const updatedPlayers = session.players.map(p =>
    p.id === playerId ? { ...p, ...updates } : p
  );
  await updateSession(code, { players: updatedPlayers });
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
    players?: Player[];
    guessedCountries?: string[];
    status?: 'waiting' | 'countdown' | 'playing' | 'finished';
    turnStartTime?: number | null;
  }
): Promise<void> => {
  await updateSession(code, gameState);
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

  // Check if player is still in session
  const playerExists = session.players.some(p => p.id === recoveryData.playerId);
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
  await updatePlayerInSession(code, playerId, {
    isConnected,
    lastSeen: Date.now(),
  });
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
  if (!isFirebaseReady() || !database) return false;
  const userPresenceRef = ref(database, `activeSessions/${uid}`);
  const snapshot = await get(userPresenceRef);
  if (!snapshot.exists()) return true; // No session registered yet
  return snapshot.val().sessionId === localSessionId;
};
