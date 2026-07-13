import { FIREBASE_DATABASE_URL } from './firebaseAuth.ts';

export interface SessionPlayer {
  username?: string;
  score?: number;
  isConnected?: boolean;
  lastSeen?: number;
  isGuest?: boolean;
}

export interface GameSessionSnapshot {
  status?: string;
  host?: string;
  gameMode?: string;
  currentTurn?: number;
  currentTurnState?: { country?: string; playerId?: string; submittedAnswer?: string | null };
  speedRaceRoundState?: {
    phase?: string;
    country?: string;
    phaseStartTime?: number;
    submissions?: Record<string, unknown>;
  };
  lmsRoundState?: {
    phase?: string;
    country?: string;
    correctContinent?: string;
    submissions?: Record<string, { selectedContinent?: string | null; selectedCountry?: string | null }>;
  };
  players?: Record<string, SessionPlayer>;
}

export async function fetchSession(sessionCode: string, idToken?: string): Promise<GameSessionSnapshot | null> {
  const url = idToken
    ? `${FIREBASE_DATABASE_URL}/sessions/${sessionCode}.json?auth=${encodeURIComponent(idToken)}`
    : `${FIREBASE_DATABASE_URL}/sessions/${sessionCode}.json`;

  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || typeof data !== 'object') return null;
  return data as GameSessionSnapshot;
}

export function assertPlayerInSession(session: GameSessionSnapshot, playerId: string, uid: string): boolean {
  if (playerId !== uid) return false;
  return Boolean(session.players && session.players[playerId]);
}

export function resolveTurnBasedCountry(session: GameSessionSnapshot, playerId: string): string | null {
  if (session.status !== 'playing') return null;
  const turn = session.currentTurnState;
  if (!turn?.country) return null;
  if (turn.playerId && turn.playerId !== playerId) return null;
  if (turn.submittedAnswer) return null;
  return turn.country;
}

export function resolveSpeedRaceCountry(session: GameSessionSnapshot, playerId: string): string | null {
  const rs = session.speedRaceRoundState;
  if (!rs || rs.phase !== 'guessing' || !rs.country) return null;
  if (rs.submissions?.[playerId]) return null;
  return rs.country;
}

export function resolveLmsRound(session: GameSessionSnapshot) {
  const rs = session.lmsRoundState;
  if (!rs?.country || !rs.correctContinent) return null;
  return rs;
}
