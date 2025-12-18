import { database, ref, set, onValue, update, remove, get, isFirebaseReady } from '@/lib/firebase';
import type { GameSession, Player } from '@/contexts/GameContext';

const SESSIONS_PATH = 'sessions';

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
    // For local mode, just call callback once with local data
    const localSession = localStorage.getItem(`session_${code}`);
    callback(localSession ? JSON.parse(localSession) : null);
    return () => {};
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
    currentCountry?: string | null;
    players?: Player[];
    guessedCountries?: string[];
    status?: 'waiting' | 'playing' | 'finished';
  }
): Promise<void> => {
  await updateSession(code, gameState);
};

// Start game
export const startGameSession = async (code: string): Promise<void> => {
  await updateSession(code, {
    status: 'playing',
    startTime: Date.now(),
  });
};

// End game
export const endGameSession = async (code: string): Promise<void> => {
  await updateSession(code, {
    status: 'finished',
  });
};
