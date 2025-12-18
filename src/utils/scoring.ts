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
 * Calculate score based on guess accuracy
 * @returns { points: number, matchType: 'exact' | 'close' | 'wrong' }
 */
export const calculateScore = (guess: string, correct: string): { points: number; matchType: 'exact' | 'close' | 'wrong' } => {
  const normalizedGuess = guess.toLowerCase().trim();
  const normalizedCorrect = correct.toLowerCase().trim();

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
 * Normalize country name for comparison
 * Handles common variations and abbreviations
 */
export const normalizeCountryName = (name: string): string => {
  const normalized = name.toLowerCase().trim();
  
  // Common variations mapping
  const variations: Record<string, string> = {
    'usa': 'united states',
    'us': 'united states',
    'united states of america': 'united states',
    'uk': 'united kingdom',
    'great britain': 'united kingdom',
    'england': 'united kingdom', // Note: technically incorrect but common
    'uae': 'united arab emirates',
    'drc': 'democratic republic of the congo',
    'dr congo': 'democratic republic of the congo',
    'korea': 'south korea',
    'holland': 'netherlands',
  };

  return variations[normalized] || normalized;
};

/**
 * Check if a country guess is correct
 */
export const isCorrectGuess = (guess: string, correctCountry: string): { correct: boolean; points: number; matchType: 'exact' | 'close' | 'wrong' } => {
  const normalizedGuess = normalizeCountryName(guess);
  const normalizedCorrect = normalizeCountryName(correctCountry);
  
  const result = calculateScore(normalizedGuess, normalizedCorrect);
  
  return {
    correct: result.points > 0,
    ...result,
  };
};
