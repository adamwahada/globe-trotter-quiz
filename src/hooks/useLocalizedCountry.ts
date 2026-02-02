/**
 * Hook for accessing localized country data and hints.
 * Provides language-aware country names and hint data.
 */

import { useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedCountryName, matchCountryInput, isCorrectGuess, isCloseGuess } from '@/i18n/countryNames';
import { getLocalizedHint, hasLocalizedHints } from '@/i18n/localizedHints';
import { 
  getFamousPerson, 
  getCountryFlag, 
  getContinent,
  countryContinent 
} from '@/utils/countryData';
import {
  getCountryCapital,
  getFamousPlayer,
  getFamousSinger,
  getHintAvailability,
  hasExtendedHints
} from '@/utils/countryHints';

export interface LocalizedHintResult {
  capital: string | null;
  famousPlayer: string | null;
  famousSinger: string | null;
  famousPerson: string | null;
  flag: string;
  continent: string | null;
}

export const useLocalizedCountry = () => {
  const { language } = useLanguage();

  /**
   * Get the display name of a country in the current language.
   */
  const getCountryDisplayName = useCallback((canonicalName: string): string => {
    return getLocalizedCountryName(canonicalName, language);
  }, [language]);

  /**
   * Get all hints for a country in the current language.
   */
  const getLocalizedHints = useCallback((canonicalName: string): LocalizedHintResult => {
    // Try to get localized hints first
    const hasLocalized = hasLocalizedHints(canonicalName);
    
    let capital: string | null = null;
    let famousPlayer: string | null = null;
    let famousSinger: string | null = null;
    let famousPerson: string | null = null;

    if (hasLocalized) {
      capital = getLocalizedHint(canonicalName, 'capital', language);
      famousPlayer = getLocalizedHint(canonicalName, 'famousPlayer', language);
      famousSinger = getLocalizedHint(canonicalName, 'famousSinger', language);
      famousPerson = getLocalizedHint(canonicalName, 'famousPerson', language);
    }

    // Fallback to English data from countryHints if no localized version
    if (!capital) {
      capital = getCountryCapital(canonicalName);
    }
    if (!famousPlayer) {
      famousPlayer = getFamousPlayer(canonicalName);
    }
    if (!famousSinger) {
      famousSinger = getFamousSinger(canonicalName);
    }
    if (!famousPerson) {
      famousPerson = getFamousPerson(canonicalName);
    }

    return {
      capital,
      famousPlayer,
      famousSinger,
      famousPerson,
      flag: getCountryFlag(canonicalName),
      continent: getContinent(canonicalName),
    };
  }, [language]);

  /**
   * Match user input to a canonical country name using the current language.
   */
  const matchInput = useCallback((input: string): string | null => {
    return matchCountryInput(input, language);
  }, [language]);

  /**
   * Check if a guess is correct for a target country.
   */
  const checkGuess = useCallback((guess: string, targetCountry: string): {
    isExact: boolean;
    isClose: boolean;
    points: number;
  } => {
    const isExact = isCorrectGuess(guess, targetCountry, language);
    const isClose = !isExact && isCloseGuess(guess, targetCountry, language);
    
    return {
      isExact,
      isClose,
      points: isExact ? 3 : isClose ? 2 : 0,
    };
  }, [language]);

  /**
   * Get hint availability for a country.
   */
  const getAvailableHints = useCallback((canonicalName: string) => {
    return getHintAvailability(canonicalName);
  }, []);

  /**
   * Check if country has extended hints (capital, player, singer).
   */
  const hasExtended = useCallback((canonicalName: string) => {
    return hasExtendedHints(canonicalName);
  }, []);

  return {
    getCountryDisplayName,
    getLocalizedHints,
    matchInput,
    checkGuess,
    getAvailableHints,
    hasExtended,
    language,
  };
};
