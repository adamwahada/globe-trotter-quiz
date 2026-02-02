/**
 * Scoring and answer validation with multilingual support.
 */

import { Language } from '@/i18n/translations';
import { matchCountryInput, isCorrectGuess as checkCorrectGuess, isCloseGuess } from '@/i18n/countryNames';

/**
 * Calculate Levenshtein distance between two strings
 */
export const levenshteinDistance = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  const matrix: number[][] = [];

  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[s1.length][s2.length];
};

/**
 * Fuzzy match between guess and correct answer
 * Returns true if the distance is within acceptable threshold
 */
export const fuzzyMatch = (guess: string, correct: string, threshold = 1): boolean => {
  const distance = levenshteinDistance(guess, correct);
  return distance <= threshold;
};

/**
 * Remove accents and normalize a string for comparison.
 */
const removeAccents = (str: string): string => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

/**
 * Calculate score based on guess accuracy (legacy, language-agnostic version)
 * @returns { points: number, matchType: 'exact' | 'close' | 'wrong' }
 */
export const calculateScore = (guess: string, correct: string): { points: number; matchType: 'exact' | 'close' | 'wrong' } => {
  const normalizedGuess = removeAccents(guess.toLowerCase().trim());
  const normalizedCorrect = removeAccents(correct.toLowerCase().trim());

  // Exact match
  if (normalizedGuess === normalizedCorrect) {
    return { points: 3, matchType: 'exact' };
  }

  // Close match (Levenshtein distance <= 1)
  if (fuzzyMatch(normalizedGuess, normalizedCorrect, 1)) {
    return { points: 2, matchType: 'close' };
  }

  // Wrong answer
  return { points: 0, matchType: 'wrong' };
};

/**
 * Normalize country name for comparison (legacy version)
 * For multilingual support, use matchCountryInput from countryNames.ts instead.
 */
export const normalizeCountryName = (name: string): string => {
  const normalized = removeAccents(name.toLowerCase().trim());
  
  // Common variations mapping
  const variations: Record<string, string> = {
    'usa': 'united states',
    'us': 'united states',
    'united states of america': 'united states',
    'uk': 'united kingdom',
    'great britain': 'united kingdom',
    'england': 'united kingdom',
    'uae': 'united arab emirates',
    'drc': 'democratic republic of the congo',
    'dr congo': 'democratic republic of the congo',
    'korea': 'south korea',
    'holland': 'netherlands',
  };

  return variations[normalized] || normalized;
};

/**
 * Check if a country guess is correct with multilingual support.
 * @param guess The user's guess
 * @param correctCountry The canonical English name of the target country
 * @param language The current UI language (for matching localized names)
 */
export const isCorrectGuess = (
  guess: string, 
  correctCountry: string, 
  language: Language = 'en'
): { correct: boolean; points: number; matchType: 'exact' | 'close' | 'wrong' } => {
  // Try matching with the localized country names system
  const isExact = checkCorrectGuess(guess, correctCountry, language);
  
  if (isExact) {
    return { correct: true, points: 3, matchType: 'exact' };
  }
  
  // Check for close match (typos allowed)
  const isClose = isCloseGuess(guess, correctCountry, language);
  
  if (isClose) {
    return { correct: true, points: 2, matchType: 'close' };
  }
  
  // Fallback: Try the legacy matching for backward compatibility
  const normalizedGuess = normalizeCountryName(guess);
  const normalizedCorrect = normalizeCountryName(correctCountry);
  
  if (normalizedGuess === normalizedCorrect) {
    return { correct: true, points: 3, matchType: 'exact' };
  }
  
  if (fuzzyMatch(normalizedGuess, normalizedCorrect, 1)) {
    return { correct: true, points: 2, matchType: 'close' };
  }
  
  return { correct: false, points: 0, matchType: 'wrong' };
};

/**
 * Calculate score for a country guess with language support.
 * Use this as the main scoring function for gameplay.
 */
export const calculateCountryScore = (
  guess: string,
  correctCountry: string,
  language: Language = 'en'
): { points: number; matchType: 'exact' | 'close' | 'wrong' } => {
  const result = isCorrectGuess(guess, correctCountry, language);
  return { points: result.points, matchType: result.matchType };
};
