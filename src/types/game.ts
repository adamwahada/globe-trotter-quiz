// Game types for multiplayer World Quiz

export interface Player {
  id: string;
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

export interface TurnState {
  playerId: string;
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
  host: string;
  players: Player[];
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

export interface SessionRecoveryData {
  sessionCode: string;
  playerId: string;
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
