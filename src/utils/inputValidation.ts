/**
 * Input validation utilities for security hardening.
 * Provides client-side validation for usernames, session codes, and guesses.
 */

/** Maximum allowed length for a country guess */
export const MAX_GUESS_LENGTH = 100;

/** Maximum allowed length for a username */
export const MAX_USERNAME_LENGTH = 20;

/** Session code format: exactly 6 uppercase alphanumeric characters */
const SESSION_CODE_REGEX = /^[A-Z0-9]{6}$/;

/** Username format: alphanumeric, underscores, hyphens, spaces (for display names) */
const USERNAME_REGEX = /^[a-zA-Z0-9_\-\s\u00C0-\u024F\u0600-\u06FF]+$/;

/**
 * Validate a username string.
 * @returns {{ valid: boolean; error?: string }}
 */
export const validateUsername = (name: string): { valid: boolean; error?: string } => {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: 'Username is required' };
  }
  if (trimmed.length > MAX_USERNAME_LENGTH) {
    return { valid: false, error: `Username must be ${MAX_USERNAME_LENGTH} characters or less` };
  }
  if (trimmed.length < 2) {
    return { valid: false, error: 'Username must be at least 2 characters' };
  }
  if (!USERNAME_REGEX.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, spaces, hyphens, and underscores' };
  }
  return { valid: true };
};

/**
 * Validate a session code string.
 * @returns {{ valid: boolean; error?: string }}
 */
export const validateSessionCode = (code: string): { valid: boolean; error?: string } => {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) {
    return { valid: false, error: 'Session code is required' };
  }
  if (!SESSION_CODE_REGEX.test(trimmed)) {
    return { valid: false, error: 'Session code must be 6 uppercase letters/numbers' };
  }
  return { valid: true };
};

/**
 * Validate a country guess string.
 * @returns {{ valid: boolean; error?: string }}
 */
export const validateGuess = (guess: string): { valid: boolean; error?: string } => {
  const trimmed = guess.trim();
  if (!trimmed) {
    return { valid: false, error: 'Guess cannot be empty' };
  }
  if (trimmed.length > MAX_GUESS_LENGTH) {
    return { valid: false, error: `Guess must be ${MAX_GUESS_LENGTH} characters or less` };
  }
  return { valid: true };
};

/**
 * Sanitize a string by trimming whitespace and limiting length.
 */
export const sanitizeInput = (input: string, maxLength: number): string => {
  return input.trim().slice(0, maxLength);
};
