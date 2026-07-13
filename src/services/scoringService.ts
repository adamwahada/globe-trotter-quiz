/**
 * Client-side service for server-validated scoring.
 * All guess validation is performed server-side to prevent score manipulation.
 */

import { supabase } from '@/integrations/supabase/client';
import { getFirebaseIdToken } from '@/utils/firebaseToken';
import { Language } from '@/i18n/translations';

interface ScoreResult {
  correct: boolean;
  points: number;
  matchType: 'exact' | 'close' | 'wrong';
}

export interface RefereeSessionContext {
  sessionCode: string;
  playerId: string;
}

export type RefereeAction =
  | 'speed_race_confirm'
  | 'lms_continent'
  | 'lms_country'
  | 'map_click_validate';

export interface SpeedRaceRefereeResult {
  isCorrect: boolean;
  pointsEarned: number;
  answerKey: string;
  elapsedMs: number;
}

export interface LmsContinentRefereeResult {
  isCorrect: boolean;
  correctContinent: string;
  heartLoss: number;
}

export interface LmsCountryRefereeResult {
  isCorrect: boolean;
  isContinentCorrect: boolean;
  answerKey: string;
  heartLoss: number;
}

interface GameHistoryEntry {
  user_id: string;
  session_code: string;
  score: number;
  countries_correct: number;
  countries_wrong: number;
  total_turns: number;
  is_winner: boolean;
  player_count: number;
  game_duration_minutes: number;
  is_solo_mode: boolean;
  rank: number;
}

/**
 * Validate a guess server-side.
 * Pass sessionContext to bind validation to the active Firebase session (anti-cheat).
 */
export const validateGuessServer = async (
  guess: string,
  correctCountry: string,
  language: Language,
  sessionContext?: RefereeSessionContext,
): Promise<ScoreResult> => {
  try {
    const token = await getFirebaseIdToken();
    if (!token) {
      console.error('No Firebase token available for guess validation');
      return { correct: false, points: 0, matchType: 'wrong' as const };
    }

    const body: Record<string, unknown> = { guess, correctCountry, language };
    if (sessionContext) {
      body.sessionCode = sessionContext.sessionCode;
      body.playerId = sessionContext.playerId;
    }

    const { data, error } = await supabase.functions.invoke('validate-guess', {
      body,
      headers: { Authorization: `Bearer ${token}` },
    });

    if (error) {
      console.error('Server validation error:', error);
      // On error, return wrong to prevent fake correct answers
      return { correct: false, points: 0, matchType: 'wrong' };
    }

    // Validate the response shape
    if (
      typeof data?.correct !== 'boolean' ||
      typeof data?.points !== 'number' ||
      !['exact', 'close', 'wrong'].includes(data?.matchType)
    ) {
      console.error('Invalid server response shape:', data);
      return { correct: false, points: 0, matchType: 'wrong' };
    }

    return {
      correct: data.correct,
      points: data.points,
      matchType: data.matchType,
    };
  } catch (err) {
    console.error('Failed to validate guess server-side:', err);
    return { correct: false, points: 0, matchType: 'wrong' };
  }
};

/**
 * Call the game-referee edge function for Speed Race / LMS actions.
 * Returns null when the server rejects or is unreachable.
 */
export const refereeAction = async <T>(
  action: RefereeAction,
  sessionContext: RefereeSessionContext,
  payload: Record<string, unknown> = {},
): Promise<T | null> => {
  try {
    const token = await getFirebaseIdToken();
    if (!token) {
      console.error('No Firebase token available for referee action');
      return null;
    }

    const { data, error } = await supabase.functions.invoke('game-referee', {
      body: {
        action,
        sessionCode: sessionContext.sessionCode,
        playerId: sessionContext.playerId,
        ...payload,
      },
      headers: { Authorization: `Bearer ${token}` },
    });

    if (error) {
      console.error(`Referee action "${action}" failed:`, error);
      return null;
    }

    if (data?.error) {
      console.error(`Referee action "${action}" rejected:`, data.error);
      return null;
    }

    return data as T;
  } catch (err) {
    console.error(`Referee action "${action}" error:`, err);
    return null;
  }
};

/**
 * Save game history through the server-validated endpoint.
 * Uses edge function with service role key to bypass RLS and validate data.
 */
export const saveGameHistoryServer = async (
  entries: GameHistoryEntry[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    const token = await getFirebaseIdToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase.functions.invoke('save-game-history', {
      body: { entries },
      headers: { Authorization: `Bearer ${token}` },
    });

    if (error) {
      console.error('Failed to save game history:', error);
      return { success: false, error: error.message };
    }

    if (data?.duplicate) {
      console.log('Game history already saved for this session');
      return { success: true };
    }

    return { success: data?.success || false, error: data?.error };
  } catch (err) {
    console.error('Error saving game history:', err);
    return { success: false, error: 'Network error' };
  }
};

/**
 * Fetch game history via server-validated endpoint.
 * Uses Firebase auth token verified server-side, bypasses Supabase RLS.
 */
export const fetchGameHistoryServer = async (): Promise<{ data: any[]; error?: string }> => {
  try {
    const token = await getFirebaseIdToken();
    if (!token) {
      return { data: [], error: 'Not authenticated' };
    }

    const { data, error } = await supabase.functions.invoke('get-game-history', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (error) {
      console.error('Failed to fetch game history:', error);
      return { data: [], error: error.message };
    }

    return { data: data?.data || [] };
  } catch (err) {
    console.error('Error fetching game history:', err);
    return { data: [], error: 'Network error' };
  }
};
