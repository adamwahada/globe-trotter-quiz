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
 * The server contains the full scoring logic and cannot be tampered with.
 * Falls back to a default wrong answer if the server is unreachable.
 */
export const validateGuessServer = async (
  guess: string,
  correctCountry: string,
  language: Language
): Promise<ScoreResult> => {
  try {
    const token = await getFirebaseIdToken();
    if (!token) {
      console.error('No Firebase token available for guess validation');
      return { correct: false, points: 0, matchType: 'wrong' as const };
    }

    const { data, error } = await supabase.functions.invoke('validate-guess', {
      body: { guess, correctCountry, language },
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
