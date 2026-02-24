// Game types for multiplayer World Quiz

// Game mode types
export type GameMode = 'turnBased' | 'againstTheClock' | 'speedRace';
 
 // Import card types
 import type { PlayerCard, ActiveCardEffect } from './cards';

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
  inactiveTurns?: number; // Track consecutive inactive turns (timeout/skip)
  isGuest?: boolean; // True for players who joined without an account
  // Against the Clock specific - tracks which country the player is currently guessing
  currentGuessCountry?: string | null;
   // Card system state
   cardPoints?: number;
   correctStreak?: number;
   playerCards?: PlayerCard[];
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

// Join request for closed rooms
export interface JoinRequest {
  playerId: string;
  username: string;
  avatar: string;
  color: string;
  isGuest: boolean;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
}

// Speed Race: state for a single round (shared across all players via Firebase)
export interface SpeedRaceRoundState {
  roundNumber: number;          // 1-indexed current round
  country: string;              // The country to find this round
  phase: 'reveal' | 'countdown' | 'guessing' | 'results'; // Current phase
  phaseStartTime: number;       // Server timestamp when phase started
  submissions: {                // Map of playerId → submission
    [playerId: string]: {
      clickedCountry: string | null; // Country the player clicked
      confirmedAt: number;           // Timestamp of confirmation
      isCorrect: boolean;
      pointsEarned: number;          // Floating-point speed-based score
    };
  };
}

export interface GameSession {
  id: string;
  code: string;
  creatorId: string; // auth.uid of session creator
  host: string; // auth.uid of host (same as creatorId initially)
  players: PlayersMap; // Map keyed by auth.uid
  maxPlayers: number;
  duration: number; // in minutes (unused for speedRace)
  status: 'waiting' | 'countdown' | 'playing' | 'finished';
  currentTurn: number;
  currentTurnState: TurnState | null;
  guessedCountries: string[]; // All played countries
  correctCountries: string[]; // Countries guessed correctly
  wrongCountries: string[]; // Countries guessed incorrectly or skipped
  startTime: number | null;
  waitingRoomStartTime: number;
  countdownStartTime: number | null;
  turnStartTime: number | null;
  isExtraTime?: boolean;
  isSoloMode?: boolean; // Indicates solo practice mode
  gameMode?: GameMode;
  cardModeEnabled?: boolean; // Card system enabled for this session
  activeCardEffects?: ActiveCardEffect[]; // Global card effects affecting gameplay
  isOpenRoom?: boolean; // If true, anyone with code/link joins automatically. If false, host must approve.
  joinRequests?: { [requestId: string]: JoinRequest }; // Pending join requests for closed rooms
  // Speed Race specific fields
  totalRounds?: number;         // Total rounds for SpeedRace mode
  currentRound?: number;        // Current round index (1-indexed)
  speedRaceRoundState?: SpeedRaceRoundState | null; // Live round state
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

export const TURN_TIME_SECONDS = 30;
export const COUNTDOWN_SECONDS = 5;
export const WAITING_ROOM_TIMEOUT = 300; // 5 minutes

// Scoring constants (Turn-Based / Against-The-Clock)
export const POINTS_CORRECT = 3;
export const POINTS_CLOSE = 2;
export const POINTS_WRONG = 0;
export const POINTS_HINT_PENALTY = -1;

// Speed Race scoring constants
export const SPEED_RACE_ANSWER_TIME = 20;    // seconds players have to answer
export const SPEED_RACE_REVEAL_TIME = 2000;  // ms to show country name
export const SPEED_RACE_COUNTDOWN_TIME = 3000; // ms for the 3-second countdown
export const SPEED_RACE_RESULTS_TIME = 5000; // ms to show round results
export const SPEED_RACE_MAX_POINTS = 5;     // Maximum points for the fastest answer

/**
 * Speed Race scoring formula:
 *
 * Points awarded = MAX_POINTS × (1 - elapsed / ANSWER_TIME × 0.8)
 *
 * - A player who answers in 0 seconds gets exactly MAX_POINTS (5.00 pts).
 * - A player who answers at the last second (20s) gets 5 × 0.2 = 1.00 pt.
 * - Wrong / no answer = 0 pts.
 * - Points are rounded to 2 decimal places.
 *
 * This gives a linear decay from 5.00 → 1.00 over the full answer window,
 * rewarding faster correct answers while still giving something to slower ones.
 */
export const calculateSpeedRacePoints = (elapsedMs: number): number => {
  const elapsedSec = Math.max(0, elapsedMs / 1000);
  const fraction = Math.min(1, elapsedSec / SPEED_RACE_ANSWER_TIME);
  const raw = SPEED_RACE_MAX_POINTS * (1 - fraction * 0.8);
  return Math.round(raw * 100) / 100; // 2 decimal places
};
