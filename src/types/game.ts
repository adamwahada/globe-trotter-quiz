// Game types for multiplayer World Quiz

// Player data stored in Firebase under sessions/{code}/players/{uid}
export interface PlayerData {
  username: string;
  avatar: string;
  color: string;
  score: number;
  turnsPlayed: number;
  countriesGuessed: string[];
  isReady: boolean;
  isConnected: boolean;
  lastSeen: number;
}

// Full player with uid (used in client-side arrays)
export interface Player extends PlayerData {
  id: string; // This is the auth.uid
}

// Players map as stored in Firebase
export interface PlayersMap {
  [uid: string]: PlayerData;
}

export interface TurnState {
  playerId: string; // This is the auth.uid of the current player
  startTime: number;
  country: string | null;
  diceRolled: boolean;
  modalOpen: boolean;
  submittedAnswer: string | null;
  pointsEarned: number | null;
  isCorrect: boolean | null;
}

export interface GameSession {
  id: string;
  code: string;
  creatorId: string; // auth.uid of session creator
  host: string; // auth.uid of host (same as creatorId initially)
  players: PlayersMap; // Map keyed by auth.uid
  maxPlayers: number;
  duration: number; // in minutes
  status: 'waiting' | 'countdown' | 'playing' | 'finished';
  currentTurn: number;
  currentTurnState: TurnState | null;
  guessedCountries: string[];
  startTime: number | null;
  waitingRoomStartTime: number;
  countdownStartTime: number | null;
  turnStartTime: number | null;
  isExtraTime?: boolean;
}

// Helper function to convert PlayersMap to Player array
export const playersMapToArray = (playersMap: PlayersMap | undefined): Player[] => {
  if (!playersMap) return [];
  return Object.entries(playersMap).map(([uid, data]) => ({
    id: uid,
    ...data
  }));
};

// Helper function to get player UIDs in order (for turn management)
export const getPlayerUids = (playersMap: PlayersMap | undefined): string[] => {
  if (!playersMap) return [];
  return Object.keys(playersMap);
};

export interface SessionRecoveryData {
  sessionCode: string;
  playerId: string; // This is now auth.uid
  timestamp: number;
}

export const TURN_TIME_SECONDS = 35;
export const COUNTDOWN_SECONDS = 5;
export const WAITING_ROOM_TIMEOUT = 300; // 5 minutes

// Scoring constants
export const POINTS_CORRECT = 3;
export const POINTS_CLOSE = 2;
export const POINTS_WRONG = 0;
export const POINTS_HINT_PENALTY = -1;
