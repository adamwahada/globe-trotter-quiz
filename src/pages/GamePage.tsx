import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SpeedRaceGame from '@/components/Game/SpeedRaceGame';
import { Logo } from '@/components/Logo/Logo';
import { Button } from '@/components/ui/button';
import { WorldMap } from '@/components/Map/WorldMap';
import { Dice } from '@/components/Dice/Dice';
import { Leaderboard } from '@/components/Leaderboard/Leaderboard';
import { RankingModal } from '@/components/Ranking/RankingModal';
import { GuessModal } from '@/components/Guess/GuessModal';
import { GameResults } from '@/components/Results/GameResults';
import { TimerProgress } from '@/components/Timer/TimerProgress';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { LanguageSwitcher } from '@/components/LanguageSwitcher/LanguageSwitcher';
import { CountdownOverlay } from '@/components/Countdown/CountdownOverlay';
import { FloatingScore } from '@/components/Score/FloatingScore';
import { LonePlayerOverlay } from '@/components/Modal/LonePlayerOverlay';
import { InactivityWarning } from '@/components/Modal/InactivityWarning';
import { ReconnectionBanner } from '@/components/Banner/ReconnectionBanner';
import { AgainstTheClockGame } from '@/components/Game/AgainstTheClockGame';
import { CardButton } from '@/components/Cards/CardButton';
import { CardModal } from '@/components/Cards/CardModal';
import { CardEffectIndicator } from '@/components/Cards/CardEffectIndicator';
import { CountrySelectionOverlay } from '@/components/Cards/CountrySelectionOverlay';
import { useCardSystem } from '@/hooks/useCardSystem';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame, TurnState, Player } from '@/contexts/GameContext';
import { useToastContext } from '@/contexts/ToastContext';
import { useSound } from '@/contexts/SoundContext';
import { useLocalizedCountry } from '@/hooks/useLocalizedCountry';
import { validateGuessServer, saveGameHistoryServer } from '@/services/scoringService';
import { getRandomUnplayedCountry, getFamousPerson, getMapCountryName, getCountryFlag, preloadCountryFlag, preloadAllCountryFlags, getRandomUnplayedCountryFromContinent } from '@/utils/countryData';
import { hasExtendedHints, getFamousPlayer, getFamousSinger, getCountryCapital, getHintAvailability, HintAvailability } from '@/utils/countryHints';
import { GuidedHintType } from '@/components/Guess/GuessModal';
import { TURN_TIME_SECONDS, COUNTDOWN_SECONDS, playersMapToArray, PlayersMap } from '@/types/game';
import { Trophy, LogOut, Volume2, VolumeX, Users, Clock, SkipForward } from 'lucide-react';
 import { Sparkles } from 'lucide-react';
import { removePlayerFromSession, clearRecoveryData } from '@/services/gameSessionService';
import { FloatingChatWidget } from '@/components/Messaging/FloatingChatWidget';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { validateGuess } from '@/utils/inputValidation';

const GamePage = () => {
  const { session, isLoading } = useGame();

  // While restoring session from localStorage after a page refresh, show nothing
  if (isLoading) return null;

  // Dispatch to Speed Race component when in that mode
  if (session?.gameMode === 'speedRace') {
    return <SpeedRaceGame />;
  }

  return <GamePageInner />;
};

const GamePageInner = () => {
  const { t, language } = useLanguage();
  const {
    session,
    currentPlayer,
    isLoading,
    leaveSession,
    updatePlayerMetadata,
    updateGameState,
    updateTurnState,
    endGame,
    startGame,
    getPlayersArray,
  } = useGame();
  const { isLoading: authLoading } = useAuth();
  const { addToast } = useToastContext();
  const { playToastSound, playDiceSound, toggleSound, soundEnabled } = useSound();
  const navigate = useNavigate();

  const prevPlayersRef = useRef<Player[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [guessModalOpen, setGuessModalOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [autoRollCountdown, setAutoRollCountdown] = useState<number | null>(null);
  const [floatingScore, setFloatingScore] = useState<{ points: number; show: boolean }>({ points: 0, show: false });
  const [isRolling, setIsRolling] = useState(false);
   const [showCardModal, setShowCardModal] = useState(false);
  // Country selection mode for "Pick Your Country" card
  const [countrySelectionMode, setCountrySelectionMode] = useState(false);
  const [pendingCountryCardId, setPendingCountryCardId] = useState<string | null>(null);
  const [selectedCountryForCard, setSelectedCountryForCard] = useState<string | null>(null);

  // Ref-based rolling lock to prevent race conditions between auto-roll and manual click
  const rollingLockRef = useRef(false);

  // Track which turn we've already shown the "your turn" toast for
  const lastToastTurnRef = useRef<number>(-1);

  // Guard to ensure we only process a timeout ONCE per turn.
  // Without this, the 1s interval can fire multiple times after time hits 0,
  // quickly incrementing inactiveTurns multiple times and kicking too early.
  const handledTimeoutKeyRef = useRef<string | null>(null);
  const historySavedRef = useRef(false);

  // Tracks whether we intentionally closed the modal (submit/skip/timeout/close)
  // so the session-sync effect doesn't reopen it before async state propagates.
  // Stores the turn index to persist the guard for the entire turn.
  const modalClosedForTurnRef = useRef<number>(-1);

  // Card effects state for current turn
  const [currentCardEffects, setCurrentCardEffects] = useState<{
    extraHints: number;
    hintsBlocked: boolean;
    doublePoints: boolean;
    pointStrike?: { targetPlayerId: string; penalty: number };
  }>({
    extraHints: 0,
    hintsBlocked: false,
    doublePoints: false,
  });

   // Card effects for continent/country forcing (persists across turn)
   const forcedContinentRef = useRef<string | null>(null);
   const forcedCountryRef = useRef<string | null>(null);

   // Guard: process card effects only once per turn
   const processedEffectsTurnRef = useRef<number>(-1);
   // Track previous turn index for skip detection
   const prevTurnIndexRef = useRef<number>(-1);

  // Card system hook
    const {
     isCardModeEnabled,
     cardPoints,
     playerCards,
     activeEffects,
     updateStreak,
     buyCard,
     activateCard,
     fuseCards,
     hasEffect,
     cleanupExpiredEffects,
   } = useCardSystem();

  // Get players as array for rendering and game logic
  const players = getPlayersArray ? getPlayersArray() : playersMapToArray(session?.players);
  const playerUids = players.map(p => p.id);

  const currentTurnIndex = session?.currentTurn || 0;
  const currentTurnState = session?.currentTurnState;
  const guessedCountries = session?.guessedCountries || [];
  const correctCountries = session?.correctCountries || [];
  const wrongCountries = session?.wrongCountries || [];
  const currentCountry = currentTurnState?.country || null;
  const isSoloMode = session?.isSoloMode || false;
  const isAgainstTheClock = session?.gameMode === 'againstTheClock';

  // For solo mode, store the country clicked by the player for click-to-guess mode
  const [soloClickedCountry, setSoloClickedCountry] = useState<string | null>(null);
  // Track solo click turn start time (independent of modal)
  const [soloClickStartTime, setSoloClickStartTime] = useState<number | null>(null);

  // Check if it's current player's turn (always true in solo mode)
  const isMyTurn = isSoloMode ? true : (session ? players[currentTurnIndex]?.id === currentPlayer?.id : false);
  const currentTurnPlayer = players[currentTurnIndex];

  // The active country to guess - either from dice roll or solo click
  const activeCountry = isSoloMode ? (currentCountry || soloClickedCountry) : currentCountry;

  // A turn is finished once an answer/skip/timeout has been recorded
  const isTurnFinished = !!currentTurnState?.submittedAnswer;

  // Handle scroll for navbar blur effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Redirect if no session or session ended
  useEffect(() => {
    // Wait for BOTH session restore and auth restore before deciding to redirect
    if (isLoading || authLoading) return;
    if (!session || session.status === 'finished') {
      if (session?.status === 'finished') {
        setShowResults(true);
      } else {
        // Don't redirect guests who lost their session subscription mid-game.
        // Guests store their ID in sessionStorage — if it's present, keep them in-game.
        const guestId = sessionStorage.getItem('guest_player_id');
        if (!guestId) {
          navigate('/');
        }
      }
    }
  }, [session, navigate, isLoading, authLoading]);

  // Handle countdown to playing transition
  useEffect(() => {
    if (session?.status === 'countdown' && session.countdownStartTime) {
      const elapsed = Math.floor((Date.now() - session.countdownStartTime) / 1000);
      const remaining = COUNTDOWN_SECONDS - elapsed;

      if (remaining <= 0) {
        // Countdown finished - start game (only host should do this)
        if (session.host === currentPlayer?.id) {
          startGame().catch(err =>
            console.error('[GamePage] startGame error:', err)
          );
        }
      }
    }
  }, [session, currentPlayer, startGame]);

  // Preload all country flags when game starts
  useEffect(() => {
    if (session?.status === 'playing') {
      preloadAllCountryFlags();
    }
  }, [session?.status]);

  // Show toast notifications for turn changes (skip in solo mode)
  useEffect(() => {
    if (isAgainstTheClock) return;
    if (session?.status !== 'playing' || isSoloMode) return;

    // Only show toast once per turn index change
    if (isMyTurn && lastToastTurnRef.current !== currentTurnIndex) {
      lastToastTurnRef.current = currentTurnIndex;
      addToast('game', `🎯 ${t('yourTurn')}! ${t('rollDice')} 🎲`);
      playToastSound('game');
    }
  }, [currentTurnIndex, session?.status, isSoloMode, isAgainstTheClock, isMyTurn, addToast, t, playToastSound]);

  // Sync card effects when turn changes — process effects targeting the current player
  // This runs ONLY on the affected player's client, so toasts are private
  useEffect(() => {
    if (!isCardModeEnabled || !isMyTurn || !currentPlayer) {
      setCurrentCardEffects({
        extraHints: 0,
        hintsBlocked: false,
        doublePoints: false,
      });
      forcedContinentRef.current = null;
      forcedCountryRef.current = null;
      return;
    }

    if (!session?.activeCardEffects?.length) {
      setCurrentCardEffects({
        extraHints: 0,
        hintsBlocked: false,
        doublePoints: false,
      });
      forcedContinentRef.current = null;
      forcedCountryRef.current = null;
      return;
    }

    // Only process effects once per turn to avoid loops
    if (processedEffectsTurnRef.current === currentTurnIndex) return;
    processedEffectsTurnRef.current = currentTurnIndex;

    const currentTurn = session.currentTurn || 0;
    const myEffects = session.activeCardEffects.filter(
      e => e.targetPlayerId === currentPlayer.id && e.expiresAfterTurn >= currentTurn
    );

    if (myEffects.length === 0) return;

    const effectKeysToRemove: string[] = [];
    let extraHints = 0;
    let hintsBlocked = false;
    let doublePoints = false;
    let pointStrike: { targetPlayerId: string; penalty: number } | undefined;
    let timeDelta = 0;

    for (const effect of myEffects) {
      const effectKey = `${effect.sourcePlayerId}-${effect.cardType}-${effect.appliedAt}`;
      switch (effect.cardType) {
        case 'timeBoost':
          timeDelta += 15;
          effectKeysToRemove.push(effectKey);
          addToast('info', '⏱️ +15s Time Boost!');
          playToastSound('info');
          break;
        case 'timeSteal':
          timeDelta -= 15;
          effectKeysToRemove.push(effectKey);
          addToast('error', '⏳ -15s Time Stolen!');
          playToastSound('error');
          break;
        case 'extraHint':
          extraHints += 1;
          effectKeysToRemove.push(effectKey);
          addToast('info', '💡 Extra hint available this turn!');
          playToastSound('info');
          break;
        case 'hintBlock':
          hintsBlocked = true;
          effectKeysToRemove.push(effectKey);
          addToast('error', '🚫 Your hints are blocked this turn!');
          playToastSound('error');
          break;
        case 'doublePoints':
          doublePoints = true;
          effectKeysToRemove.push(effectKey);
          addToast('info', '✖️2️⃣ Double points active this turn!');
          playToastSound('info');
          break;
        case 'pointStrike':
          pointStrike = { targetPlayerId: currentPlayer.id, penalty: 10 };
          effectKeysToRemove.push(effectKey);
          addToast('error', '💣 Point Strike: -10 pts if you answer wrong!');
          playToastSound('error');
          break;
        case 'forcedContinent':
        case 'pickYourContinent':
          forcedContinentRef.current = effect.targetContinent || null;
          effectKeysToRemove.push(effectKey);
          addToast('info', `🌍 Country from ${effect.targetContinent}!`);
          playToastSound('info');
          break;
        case 'pickYourCountry':
          forcedCountryRef.current = effect.targetCountry || null;
          effectKeysToRemove.push(effectKey);
          addToast('info', '📍 Your chosen country is ready!');
          playToastSound('info');
          break;
        // skipNextPlayer is handled in moveToNextTurn before the turn starts
      }
    }

    setCurrentCardEffects({ extraHints, hintsBlocked, doublePoints, pointStrike });

    // Apply time adjustment and remove consumed effects in a single update
    const gameStateUpdate: Record<string, unknown> = {};
    if (timeDelta !== 0 && session.turnStartTime) {
      gameStateUpdate.turnStartTime = session.turnStartTime - (timeDelta * 1000);
    }
    if (effectKeysToRemove.length > 0) {
      gameStateUpdate.activeCardEffects = session.activeCardEffects.filter(
        e => !effectKeysToRemove.includes(`${e.sourcePlayerId}-${e.cardType}-${e.appliedAt}`)
      );
    }
    if (Object.keys(gameStateUpdate).length > 0) {
      updateGameState(gameStateUpdate as any).catch(err =>
        console.error('[GamePage] card effects update error:', err)
      );
    }
  }, [currentTurnIndex, isCardModeEnabled, isMyTurn, currentPlayer, session]);

  // Detect when the current player's turn was skipped by a card
  useEffect(() => {
    if (!isCardModeEnabled || !currentPlayer || isSoloMode || isAgainstTheClock) {
      prevTurnIndexRef.current = currentTurnIndex;
      return;
    }

    const prevTurn = prevTurnIndexRef.current;
    prevTurnIndexRef.current = currentTurnIndex;

    // Don't trigger on initial render
    if (prevTurn === -1 || prevTurn === currentTurnIndex) return;

    const myIndex = players.findIndex(p => p.id === currentPlayer.id);
    if (myIndex === -1) return;

    // Check if my index was the expected next but got skipped
    const expectedNext = (prevTurn + 1) % players.length;
    if (expectedNext === myIndex && currentTurnIndex !== myIndex) {
      addToast('error', '⏭️ Your turn was skipped by a card!');
      playToastSound('error');
    }
  }, [currentTurnIndex, isCardModeEnabled, currentPlayer, players, isSoloMode, isAgainstTheClock, addToast, playToastSound]);

  // No need for a separate reset effect — modalClosedForTurnRef resets
  // automatically when the turn index changes (checked inline).

  // NOTE: Modal is no longer auto-opened from session sync.
  // It only opens via explicit user actions: dice roll (handleRollDice)
  // or country click (solo mode). This prevents unwanted auto-opening
  // on page refresh or when turn state syncs from Firebase.

  // Handle solo click mode timeout (when timer expires without answer)
  const handleSoloClickTimeout = useCallback(async () => {
    if (!soloClickedCountry || !currentPlayer || !session) return;

    try {
      // Mark country as wrong
      const nextGuessedCountries = guessedCountries.includes(soloClickedCountry)
        ? guessedCountries
        : [...guessedCountries, soloClickedCountry];
      const nextWrongCountries = wrongCountries.includes(soloClickedCountry)
        ? wrongCountries
        : [...wrongCountries, soloClickedCountry];

      await updateGameState({
        guessedCountries: nextGuessedCountries,
        wrongCountries: nextWrongCountries,
      });

      addToast('error', t('timeUp'));
      playToastSound('error');
    } catch (error) {
      console.error('[GamePage] handleSoloClickTimeout error:', error);
      addToast('error', t('timeUp'));
    } finally {
      modalClosedForTurnRef.current = currentTurnIndex;
      setGuessModalOpen(false);
      setSoloClickedCountry(null);
      setSoloClickStartTime(null);
    }
  }, [soloClickedCountry, currentPlayer, session, guessedCountries, wrongCountries, updateGameState, addToast, t, playToastSound]);

  // NOTE: Turn timer useEffect is placed after handleTurnTimeout definition

  const handleRollDice = useCallback(async () => {
    // Use ref-based lock to prevent race condition between auto-roll and manual click
    if (!isMyTurn || isRolling || currentCountry || rollingLockRef.current) return;

    // Immediately lock to prevent any concurrent calls
    rollingLockRef.current = true;
    setIsRolling(true);
    playDiceSound();

    setTimeout(async () => {
      try {
        // Check for forced country from card effects
        let country: string | null = null;

        if (forcedCountryRef.current) {
          // Pick Your Country card - use the selected country
          country = forcedCountryRef.current;
          forcedCountryRef.current = null; // Clear after use
          addToast('info', '🎯 Using selected country from card!');
        } else if (forcedContinentRef.current) {
          // Pick Your Continent or Forced Continent card - get random country from that continent
          const continent = forcedContinentRef.current;
          forcedContinentRef.current = null; // Clear after use
          country = getRandomUnplayedCountryFromContinent(continent, guessedCountries);
          if (country) {
            addToast('info', `🌍 Country from ${continent}!`);
          }
        } else {
          // Normal random country
          country = getRandomUnplayedCountry(guessedCountries);
        }

        if (!country) {
          addToast('info', 'All countries have been guessed!');
          await endGame().catch(err => console.error('[GamePage] endGame error:', err));
          return;
        }

        // Preload flag so hint appears instantly
        preloadCountryFlag(country);

        const turnState: TurnState = {
          playerId: currentPlayer!.id,
          startTime: Date.now(),
          country,
          diceRolled: true,
          modalOpen: false,
          submittedAnswer: null,
          pointsEarned: null,
          isCorrect: null,
        };

        await updateTurnState(turnState);
        // Set turnStartTime NOW (country determined) — timer starts here
        await updateGameState({ turnStartTime: Date.now() });
      } catch (error) {
        console.error('[GamePage] handleRollDice error:', error);
        addToast('error', 'Failed to roll dice. Turn will advance automatically.');
      } finally {
        rollingLockRef.current = false;
        setIsRolling(false);
      }
    }, 800);
  }, [isMyTurn, isRolling, currentCountry, guessedCountries, currentPlayer, updateTurnState, updateGameState, addToast, endGame, playDiceSound]);

  // Handle player departures notifications
  useEffect(() => {
    if (!session?.players) return;

    if (prevPlayersRef.current.length > 0) {
      const removedPlayers = prevPlayersRef.current.filter(
        prev => !players.find(curr => curr.id === prev.id)
      );

      removedPlayers.forEach(p => {
        if (p.id !== currentPlayer?.id) {
          addToast('info', t('playerLeft', { player: p.username }));
          playToastSound('info');
        }
      });
    }
    prevPlayersRef.current = players;
  }, [session?.players, currentPlayer?.id, addToast, playToastSound, t, players]);

  // Auto-roll dice if not done in 3 seconds (disabled for solo mode)
  useEffect(() => {
    if (isAgainstTheClock) return;
    // Skip auto-roll for solo mode - player can choose dice or click
    if (isSoloMode) return;
    
    if (isMyTurn && !currentCountry && !isRolling && session?.status === 'playing') {
      if (autoRollCountdown === null) {
        setAutoRollCountdown(3);
        return;
      }

      if (autoRollCountdown > 0) {
        const timer = setTimeout(() => {
          setAutoRollCountdown(autoRollCountdown - 1);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        handleRollDice();
        setAutoRollCountdown(null);
      }
    } else {
      if (autoRollCountdown !== null) setAutoRollCountdown(null);
    }
  }, [isAgainstTheClock, isMyTurn, currentCountry, isRolling, session?.status, autoRollCountdown, handleRollDice, isSoloMode]);

  // Handle "Pick Your Country" card requesting map selection
  const handleRequestMapSelection = useCallback((cardId: string) => {
    setShowCardModal(false);
    setCountrySelectionMode(true);
    setPendingCountryCardId(cardId);
    setSelectedCountryForCard(null);
  }, []);

  const handleCountrySelectionConfirm = useCallback(async () => {
    if (!pendingCountryCardId || !selectedCountryForCard) return;
    try {
      await activateCard(pendingCountryCardId, { targetCountry: selectedCountryForCard });
      addToast('success', '📍 Country locked in for your next turn!');
    } catch (error) {
      addToast('error', 'Failed to activate card');
    }
    setCountrySelectionMode(false);
    setPendingCountryCardId(null);
    setSelectedCountryForCard(null);
  }, [pendingCountryCardId, selectedCountryForCard, activateCard, addToast]);

  const handleCountrySelectionCancel = useCallback(() => {
    setCountrySelectionMode(false);
    setPendingCountryCardId(null);
    setSelectedCountryForCard(null);
  }, []);

  const handleCountryClick = useCallback(async (countryName: string) => {
    // Country selection mode for Pick Your Country card
    if (countrySelectionMode) {
      if (guessedCountries.includes(countryName)) {
        addToast('info', 'This country was already guessed!');
        return;
      }
      setSelectedCountryForCard(countryName);
      return;
    }

    if (!isMyTurn) return;
    
    // Solo mode: click any unguessed country to guess it
    if (isSoloMode && !activeCountry) {
      // Check if country already guessed
      if (guessedCountries.includes(countryName)) {
        addToast('info', 'You already guessed this country!');
        return;
      }
      // Preload flag so hint appears instantly
      preloadCountryFlag(countryName);
      setSoloClickedCountry(countryName);
      // Start timer immediately when country is selected
      const startTime = Date.now();
      setSoloClickStartTime(startTime);
      setGuessModalOpen(true);
      return;
    }

    // Regular mode or dice-rolled solo: only click the highlighted country
    if (countryName !== activeCountry) {
      return;
    }

    // Preload flag before opening modal
    preloadCountryFlag(countryName);
    setGuessModalOpen(true);

    if (currentTurnState) {
      try {
        await updateTurnState({
          ...currentTurnState,
          modalOpen: true,
        });
      } catch (error) {
        console.error('[GamePage] handleCountryClick updateTurnState error:', error);
        // Modal is already open locally — continue despite sync failure
      }
    }
  }, [isMyTurn, activeCountry, currentTurnState, updateTurnState, isSoloMode, guessedCountries, addToast]);

  const moveToNextTurn = useCallback(async () => {
    try {
      const nextTurn = (currentTurnIndex + 1) % players.length;
      const nextPlayerId = players[nextTurn]?.id;

      if (!nextPlayerId) return;

      // Check for skip effect targeting the next player
      if (isCardModeEnabled && session?.activeCardEffects?.length) {
        const currentTurn = session.currentTurn || 0;
        const nextPlayerEffects = session.activeCardEffects.filter(
          e => e.targetPlayerId === nextPlayerId && e.expiresAfterTurn >= currentTurn
        );

        const hasSkip = nextPlayerEffects.some(e => e.cardType === 'skipNextPlayer');

        if (hasSkip) {
          // Remove ALL effects targeting the skipped player (they won't get a turn)
          const remainingEffects = session.activeCardEffects.filter(
            e => !(e.targetPlayerId === nextPlayerId &&
              e.expiresAfterTurn >= currentTurn &&
              nextPlayerEffects.some(ne =>
                ne.sourcePlayerId === e.sourcePlayerId &&
                ne.cardType === e.cardType &&
                ne.appliedAt === e.appliedAt
              ))
          );

          const followingTurn = (nextTurn + 1) % players.length;
          await updateGameState({
            currentTurn: followingTurn,
            currentTurnState: null,
            turnStartTime: null,
            activeCardEffects: remainingEffects,
          });
          return;
        }
      }

      // Normal turn advancement — card effects (time, hints, etc.) are processed
      // by the next player's client via the card effects useEffect
      await updateGameState({
        currentTurn: nextTurn,
        currentTurnState: null,
        turnStartTime: null,
      });
    } catch (error) {
      console.error('[GamePage] moveToNextTurn error:', error);
      // The host stale-player failsafe will handle stuck turns
    }
  }, [players.length, currentTurnIndex, updateGameState, isCardModeEnabled, session]);

  const handleTurnTimeout = useCallback(async () => {
    if (!isMyTurn || !currentPlayer || !session) return;

    // If the turn already has an outcome recorded, do nothing.
    if (session.currentTurnState?.submittedAnswer) return;

    // Process timeout at most once per (session, turn index, start time)
    const timeoutKey = `${session.code}:${currentTurnIndex}:${session.turnStartTime ?? 'null'}`;
    if (handledTimeoutKeyRef.current === timeoutKey) return;
    handledTimeoutKeyRef.current = timeoutKey;

    try {
      if (currentCountry && !guessedCountries.includes(currentCountry)) {
        await updateGameState({
          guessedCountries: [...guessedCountries, currentCountry],
          wrongCountries: [...wrongCountries, currentCountry],
        });
      }

      if (currentTurnState && currentCountry) {
        await updateTurnState({
          ...currentTurnState,
          submittedAnswer: '[TIME UP]',
          pointsEarned: 0,
          isCorrect: false,
          modalOpen: false,
        });
      }

      // Track inactivity (timeout counts as inactive)
      const currentPlayerData = session.players?.[currentPlayer.id];
      if (!currentPlayerData) return; // Guard against missing player data
      
      const newInactiveTurns = (currentPlayerData.inactiveTurns || 0) + 1;

      if (newInactiveTurns >= 3) {
        // Kick player after 3 inactive turns
        addToast('error', 'You have been kicked for inactivity (3 missed turns)');
        playToastSound('error');
        await removePlayerFromSession(session.code, currentPlayer.id);
        clearRecoveryData();
        navigate('/');
        return;
      }

      // Update inactivity count and turnsPlayed (timeout counts as a turn)
      const updatedPlayers: PlayersMap = {
        ...session.players,
        [currentPlayer.id]: {
          ...currentPlayerData,
          turnsPlayed: (currentPlayerData.turnsPlayed || 0) + 1,
          inactiveTurns: newInactiveTurns,
        }
      };
      await updateGameState({ players: updatedPlayers });

      addToast('error', t('timeUp'));
      playToastSound('error');
      modalClosedForTurnRef.current = currentTurnIndex;
      setGuessModalOpen(false);

      setTimeout(() => moveToNextTurn(), 2000);
    } catch (error) {
      console.error('[GamePage] handleTurnTimeout error:', error);
      // The stale-player failsafe will advance the turn if this player can't
      addToast('error', t('timeUp'));
      modalClosedForTurnRef.current = currentTurnIndex;
      setGuessModalOpen(false);
    }
  }, [isMyTurn, currentTurnState, currentCountry, guessedCountries, wrongCountries, updateGameState, addToast, t, moveToNextTurn, playToastSound, updateTurnState, session, currentPlayer, navigate, currentTurnIndex]);

  // Turn timer timeout - handles both dice mode and solo click mode
  // Also handles when current player hasn't rolled dice yet (prevents infinite wait)
  // This runs for ALL players to detect when current player times out
  useEffect(() => {
    if (isAgainstTheClock) return;
    // Skip timer logic in solo mode for pre-roll (player can take their time)
    if (isSoloMode && !soloClickStartTime && !currentCountry) return;
    
    // Get the effective start time - either from session (turn start) or solo click
    const effectiveStartTime = session?.turnStartTime || soloClickStartTime;
    
    if (!effectiveStartTime) return;

    const checkTimeout = () => {
      // If the turn already ended (submit/skip/timeout already recorded), don't fire again.
      if (session?.currentTurnState?.submittedAnswer) return;

      // If we've already handled the timeout for this turn, don't re-run.
      if (!isSoloMode && session) {
        const timeoutKey = `${session.code}:${currentTurnIndex}:${effectiveStartTime}`;
        if (handledTimeoutKeyRef.current === timeoutKey) return;
      }

      const elapsed = Math.floor((Date.now() - effectiveStartTime) / 1000);
      if (elapsed >= TURN_TIME_SECONDS) {
        // For solo click mode, handle timeout locally
        if (isSoloMode && soloClickedCountry && !currentTurnState?.diceRolled) {
          handleSoloClickTimeout();
        } else if (isMyTurn) {
          // Current player's turn timed out - handle it
          handleTurnTimeout();
        }
        // Non-current players: the current player's client will handle the timeout
        // and update Firebase, which will sync to all clients via real-time listener
      }
    };

    const interval = setInterval(checkTimeout, 1000);
    return () => clearInterval(interval);
  }, [isAgainstTheClock, isMyTurn, session?.turnStartTime, soloClickStartTime, currentCountry, soloClickedCountry, isSoloMode, currentTurnState?.diceRolled, handleSoloClickTimeout, handleTurnTimeout, session?.currentTurnState?.submittedAnswer, currentTurnIndex]);

  // CRITICAL: Watch for inactive current player from other players' perspective
  // If current player hasn't responded and their time is way over, force advance
  // This handles cases where the current player's client crashed, disconnected,
  // or encountered an error that prevents them from completing their turn.
  // Any player can trigger the advance to prevent games from getting stuck.
  const handledStaleKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // Only run this check for non-current players in multiplayer
    if (isAgainstTheClock || isSoloMode || isMyTurn || !session?.turnStartTime) return;
    
    // Host gets priority at 5s, other players kick in at 8s as a fallback
    const isHost = session.host === currentPlayer?.id;
    const GRACE_PERIOD = isHost ? 5000 : 8000;
    
    const checkForStalePlayer = () => {
      // If the turn already had an outcome, no need to intervene
      if (session.currentTurnState?.submittedAnswer) return;

      const elapsed = Date.now() - session.turnStartTime!;
      const expectedTimeout = (TURN_TIME_SECONDS * 1000) + GRACE_PERIOD;
      
      if (elapsed > expectedTimeout) {
        // Dedup: only attempt once per stale turn per client
        const staleKey = `${session.code}:${currentTurnIndex}:${session.turnStartTime}`;
        if (handledStaleKeyRef.current === staleKey) return;
        handledStaleKeyRef.current = staleKey;

        console.log(`[GamePage] ${isHost ? 'Host' : 'Player'} forcing turn advance due to stale player`);
        
        // Force advance the turn WITHOUT incrementing inactivity
        // The stale player's own client should have already incremented it
        // We only advance the turn to prevent the game from being stuck
        const stalePlayerId = players[currentTurnIndex]?.id;
        if (stalePlayerId) {
          const nextTurn = (currentTurnIndex + 1) % players.length;
          updateGameState({
            currentTurn: nextTurn,
            currentTurnState: null,
            turnStartTime: null,
          }).catch(err => {
            console.warn('[GamePage] Force-advance failed:', err);
            // Allow retry on failure
            handledStaleKeyRef.current = null;
          });
        }
      }
    };
    
    const interval = setInterval(checkForStalePlayer, 2000);
    return () => clearInterval(interval);
  }, [isAgainstTheClock, isSoloMode, isMyTurn, session, currentPlayer?.id, players, currentTurnIndex, updateGameState]);

  const handleSubmitGuess = useCallback(async (guess: string) => {
    // For solo click mode, use soloClickedCountry if no dice was rolled
    const countryToGuess = isSoloMode && soloClickedCountry ? soloClickedCountry : currentCountry;
    if (!countryToGuess || !currentPlayer || !isMyTurn || !session) return;

    // Validate guess input
    const validation = validateGuess(guess);
    if (!validation.valid) return;

    // Close modal immediately (do this BEFORE async work to keep UI responsive)
    modalClosedForTurnRef.current = currentTurnIndex;
    setGuessModalOpen(false);

    try {
      // Server-side scoring validation (prevents client-side score manipulation)
      const result = await validateGuessServer(guess, countryToGuess, language);

      const nextGuessedCountries = guessedCountries.includes(countryToGuess)
        ? guessedCountries
        : [...guessedCountries, countryToGuess];

      // Track correct vs wrong countries
      const nextCorrectCountries = result.correct && !correctCountries.includes(countryToGuess)
        ? [...correctCountries, countryToGuess]
        : correctCountries;
      const nextWrongCountries = !result.correct && !wrongCountries.includes(countryToGuess)
        ? [...wrongCountries, countryToGuess]
        : wrongCountries;

      // Apply card effects to points
      let finalPoints = result.points;
      if (result.correct && currentCardEffects.doublePoints) {
        finalPoints *= 2;
        addToast('info', '\u2716\ufe0f Double Points applied!');
      }

      // Handle point strike on wrong answer
      let pointStrikePenalty = 0;
      if (!result.correct && currentCardEffects.pointStrike) {
        pointStrikePenalty = currentCardEffects.pointStrike.penalty;
        addToast('error', `\ud83d\udca3 Point Strike: -${pointStrikePenalty} points!`);
      }

      // Update turn state if it exists (dice mode)
      if (currentTurnState) {
        await updateTurnState({
          ...currentTurnState,
          submittedAnswer: guess,
          pointsEarned: finalPoints,
          isCorrect: result.correct,
          modalOpen: false,
        });
      }

      setFloatingScore({ points: finalPoints, show: true });
      setTimeout(() => setFloatingScore({ points: 0, show: false }), 2000);

      // Build updated players map - reset inactivity on active participation
      const currentPlayerUid = currentPlayer.id;
      if (currentPlayerUid && session.players[currentPlayerUid]) {
        const currentPlayerData = session.players[currentPlayerUid];
        // Ensure countriesGuessed is always an array, never undefined
        // Track ALL countries the player attempted (both correct and wrong)
        const existingCountriesGuessed = currentPlayerData.countriesGuessed || [];
        const newCountriesGuessed = existingCountriesGuessed.includes(countryToGuess)
          ? existingCountriesGuessed
          : [...existingCountriesGuessed, countryToGuess];

        // Calculate new score with points penalty from point strike
        const newScore = Math.max(0, currentPlayerData.score + finalPoints - pointStrikePenalty);

        const updatedPlayers: PlayersMap = {
          ...session.players,
          [currentPlayerUid]: {
            ...currentPlayerData,
            score: newScore,
            countriesGuessed: newCountriesGuessed,
            turnsPlayed: (currentPlayerData.turnsPlayed || 0) + 1,
            inactiveTurns: 0, // Reset inactivity on active participation
          }
        };

        await updateGameState({
          players: updatedPlayers,
          guessedCountries: nextGuessedCountries,
          correctCountries: nextCorrectCountries,
          wrongCountries: nextWrongCountries,
        });
      }

      if (result.correct) {
        addToast('success', `+${finalPoints} ${t('points')} - Correct!`);
        playToastSound('success');
      } else {
        addToast('error', t('wrongGuess', { player: '' }));
        playToastSound('error');
      }

       // Update card system streak
       if (isCardModeEnabled) {
         await updateStreak(result.correct);
       }

      // Reset solo clicked country and timer after submission
      if (isSoloMode && soloClickedCountry) {
        setSoloClickedCountry(null);
        setSoloClickStartTime(null);
      }

      // In solo mode, clear turn state immediately so player can play again
      if (isSoloMode) {
        await updateTurnState(null);
      } else {
        // In multiplayer, wait then move to next turn
        setTimeout(() => moveToNextTurn(), 2000);
      }
    } catch (error) {
      console.error('[GamePage] handleSubmitGuess error:', error);
      addToast('error', 'Failed to submit guess. Turn will advance automatically.');
      // Reset local state so UI isn't stuck
      if (isSoloMode && soloClickedCountry) {
        setSoloClickedCountry(null);
        setSoloClickStartTime(null);
      }
    }
   }, [currentPlayer, isMyTurn, currentTurnState, updateTurnState, guessedCountries, correctCountries, wrongCountries, session, updateGameState, addToast, t, moveToNextTurn, playToastSound, isSoloMode, soloClickedCountry, currentCountry, isCardModeEnabled, updateStreak, currentCardEffects]);

  const handleSkip = useCallback(async () => {
    if (!isMyTurn || !currentPlayer || !session) return;

    // Use the active country - either from dice roll or solo click
    const countryToSkip = isSoloMode && soloClickedCountry ? soloClickedCountry : currentCountry;
    
    if (!countryToSkip) return; // No country to skip

    // Close modal immediately to keep UI responsive
    modalClosedForTurnRef.current = currentTurnIndex;
    setGuessModalOpen(false);

    try {
      const currentPlayerUid = currentPlayer.id;
      const currentPlayerData = session.players[currentPlayerUid];
      if (!currentPlayerData) return;

      // Track skipped country in player's countriesGuessed (for stats)
      const existingCountriesGuessed = currentPlayerData.countriesGuessed || [];
      const newCountriesGuessed = existingCountriesGuessed.includes(countryToSkip)
        ? existingCountriesGuessed
        : [...existingCountriesGuessed, countryToSkip];

      // Mark country as wrong in global lists
      const nextGuessedCountries = guessedCountries.includes(countryToSkip)
        ? guessedCountries
        : [...guessedCountries, countryToSkip];
      const nextWrongCountries = wrongCountries.includes(countryToSkip)
        ? wrongCountries
        : [...wrongCountries, countryToSkip];

      // Update turn state if it exists (dice mode)
      if (currentTurnState && currentCountry) {
        await updateTurnState({
          ...currentTurnState,
          submittedAnswer: '[SKIPPED]',
          pointsEarned: 0,
          isCorrect: false,
          modalOpen: false,
        });
      }

      addToast('info', t('turnSkipped'));

      // Handle solo mode - update player stats and reset for next country
      if (isSoloMode) {
        const updatedPlayers: PlayersMap = {
          ...session.players,
          [currentPlayerUid]: {
            ...currentPlayerData,
            countriesGuessed: newCountriesGuessed,
            turnsPlayed: (currentPlayerData.turnsPlayed || 0) + 1,
          }
        };
        await updateGameState({
          players: updatedPlayers,
          guessedCountries: nextGuessedCountries,
          wrongCountries: nextWrongCountries,
        });

        setSoloClickedCountry(null);
        setSoloClickStartTime(null);
        await updateTurnState(null);
        return; // Don't move to next turn in solo mode
      }

      // Multiplayer: Skip is an ACTIVE choice, so reset inactivity counter
      const updatedPlayers: PlayersMap = {
        ...session.players,
        [currentPlayerUid]: {
          ...currentPlayerData,
          countriesGuessed: newCountriesGuessed,
          turnsPlayed: (currentPlayerData.turnsPlayed || 0) + 1,
          inactiveTurns: 0, // Reset - skip is active participation
        }
      };
      await updateGameState({
        players: updatedPlayers,
        guessedCountries: nextGuessedCountries,
        wrongCountries: nextWrongCountries,
      });

       // Reset card streak on skip (counts as wrong)
       if (isCardModeEnabled) {
         await updateStreak(false);
       }

      setTimeout(() => moveToNextTurn(), 2000);
    } catch (error) {
      console.error('[GamePage] handleSkip error:', error);
      addToast('error', 'Failed to skip turn. Turn will advance automatically.');
      if (isSoloMode && soloClickedCountry) {
        setSoloClickedCountry(null);
        setSoloClickStartTime(null);
      }
    }
   }, [isMyTurn, currentTurnState, currentCountry, guessedCountries, wrongCountries, updateGameState, addToast, t, moveToNextTurn, updateTurnState, session, currentPlayer, navigate, playToastSound, isSoloMode, soloClickedCountry, isCardModeEnabled, updateStreak]);

  // Skip turn directly from the game area (next to dice) - handles both pre-roll and post-roll
  const handleSkipTurn = useCallback(async () => {
    if (!isMyTurn || !currentPlayer || !session) return;

    // If a country was already rolled, delegate to existing handleSkip
    const countryToSkip = isSoloMode && soloClickedCountry ? soloClickedCountry : currentCountry;
    if (countryToSkip) {
      await handleSkip();
      return;
    }

    // Pre-roll skip: pass the turn entirely without rolling dice
    modalClosedForTurnRef.current = currentTurnIndex;
    setGuessModalOpen(false);

    try {
      const currentPlayerUid = currentPlayer.id;
      const currentPlayerData = session.players[currentPlayerUid];
      if (!currentPlayerData) return;

      // Update turn state to record the skip
      await updateTurnState({
        playerId: currentPlayerUid,
        startTime: Date.now(),
        country: null,
        diceRolled: false,
        modalOpen: false,
        submittedAnswer: '[SKIPPED]',
        pointsEarned: 0,
        isCorrect: false,
      });

      addToast('info', t('turnSkipped'));

      if (isSoloMode) {
        // Solo mode: just reset for next turn
        const updatedPlayers: PlayersMap = {
          ...session.players,
          [currentPlayerUid]: {
            ...currentPlayerData,
            turnsPlayed: (currentPlayerData.turnsPlayed || 0) + 1,
          }
        };
        await updateGameState({ players: updatedPlayers });
        await updateTurnState(null);
      } else {
        // Multiplayer: skip is active participation, reset inactivity
        const updatedPlayers: PlayersMap = {
          ...session.players,
          [currentPlayerUid]: {
            ...currentPlayerData,
            turnsPlayed: (currentPlayerData.turnsPlayed || 0) + 1,
            inactiveTurns: 0,
          }
        };
        await updateGameState({ players: updatedPlayers });

        if (isCardModeEnabled) {
          await updateStreak(false);
        }

        setTimeout(() => moveToNextTurn(), 1500);
      }
    } catch (error) {
      console.error('[GamePage] handleSkipTurn error:', error);
      addToast('error', 'Failed to skip turn.');
    }
  }, [isMyTurn, currentPlayer, session, currentCountry, soloClickedCountry, isSoloMode, handleSkip, updateTurnState, updateGameState, addToast, t, moveToNextTurn, isCardModeEnabled, updateStreak, currentTurnIndex]);

  // Get localized country data
  const { getCountryDisplayName, getLocalizedHints } = useLocalizedCountry();

  const handleUseHint = useCallback(async (type: 'letter' | 'famous' | 'flag'): Promise<string> => {
    // Use activeCountry which works for both dice mode and solo click mode
    const countryForHint = isSoloMode && soloClickedCountry ? soloClickedCountry : currentCountry;
    if (!countryForHint || !currentPlayer || !session) return '';

    const currentPlayerUid = currentPlayer.id;
    if (!session.players[currentPlayerUid]) return '';

    const currentPlayerData = session.players[currentPlayerUid];

    // Famous person hint costs 0.5 points, others cost 1 point
    const pointCost = type === 'famous' ? 0.5 : 1;
    const newScore = Math.max(0, currentPlayerData.score - pointCost);

    try {
      // Update ONLY the current player's score (avoids writing the whole players map)
      await updatePlayerMetadata({ score: newScore });

      // Apply flag time penalty when we have a shared turnStartTime
      if (type === 'flag') {
        if (session.turnStartTime) {
          const newTurnStartTime = session.turnStartTime - 10000;
          await updateGameState({ turnStartTime: newTurnStartTime });
          addToast('info', t('hintUsed') + ' (-1 point, -10 seconds)');
        } else {
          addToast('info', t('hintUsed') + ' (-1 point)');
        }
        return getCountryFlag(countryForHint);
      }

      if (type === 'famous') {
        addToast('info', t('hintUsed') + ' (-0.5 point)');
        const localizedHints = getLocalizedHints(countryForHint);
        return localizedHints.famousPerson || getFamousPerson(countryForHint) || 'No famous person data found';
      }

      // Letter hint - use first letter of localized country name
      addToast('info', t('hintUsed') + ' (-1 point)');
      const localizedName = getCountryDisplayName(countryForHint);
      return localizedName[0] || countryForHint[0] || '';
    } catch (error) {
      console.error('[Hints] Failed to apply hint cost:', error);
      addToast('error', t('hintFailed') || 'Failed to use hint. Please try again.');
      return '';
    }
  }, [isSoloMode, soloClickedCountry, currentCountry, currentPlayer, session, updatePlayerMetadata, updateGameState, addToast, t, getLocalizedHints, getCountryDisplayName]);

  // Handle guided hints (player, singer, capital) - with localization
  const handleUseGuidedHint = useCallback(async (type: GuidedHintType): Promise<{ value: string; timePenalty: number } | null> => {
    const countryForHint = isSoloMode && soloClickedCountry ? soloClickedCountry : currentCountry;
    if (!countryForHint || !currentPlayer || !session) return null;

    const currentPlayerUid = currentPlayer.id;
    if (!session.players[currentPlayerUid]) return null;

    const currentPlayerData = session.players[currentPlayerUid];
    
    // Get localized hints first
    const localizedHints = getLocalizedHints(countryForHint);
    
    let hintValue: string | null = null;
    let timePenalty = 0;
    let pointCost = 0;

    if (type === 'capital') {
      // Prefer localized capital, fallback to English
      hintValue = localizedHints.capital || getCountryCapital(countryForHint);
      timePenalty = 10; // 10 seconds penalty
      pointCost = 1; // 1 point cost
    } else if (type === 'player') {
      // Prefer localized player, fallback to English
      hintValue = localizedHints.famousPlayer || getFamousPlayer(countryForHint);
      timePenalty = 5; // 5 seconds penalty
      pointCost = 1; // 1 point cost
    } else if (type === 'singer') {
      // Prefer localized singer, fallback to English
      hintValue = localizedHints.famousSinger || getFamousSinger(countryForHint);
      timePenalty = 5; // 5 seconds penalty
      pointCost = 1; // 1 point cost
    }

    if (!hintValue) return null;

    // Deduct points if applicable
    const newScore = Math.max(0, currentPlayerData.score - pointCost);

    try {
      // Update ONLY the current player's score (avoids writing the whole players map)
      await updatePlayerMetadata({ score: newScore });

      // Apply time penalty (if we have a shared timer)
      if (session.turnStartTime) {
        const newTurnStartTime = session.turnStartTime - (timePenalty * 1000);
        await updateGameState({ turnStartTime: newTurnStartTime });
      }

      const costMessage = type === 'capital'
        ? `(-${timePenalty}s)`
        : `(-${pointCost}pt, -${timePenalty}s)`;
      addToast('info', `${t('hintUsed')} ${costMessage}`);

      return { value: hintValue, timePenalty };
    } catch (error) {
      console.error('[Hints] Failed to apply guided hint cost:', error);
      addToast('error', t('hintFailed') || 'Failed to use hint. Please try again.');
      return null;
    }
  }, [isSoloMode, soloClickedCountry, currentCountry, currentPlayer, session, updatePlayerMetadata, updateGameState, addToast, t, getLocalizedHints]);

  const handleLeave = useCallback(async () => {
    // Save partial game history on mid-game leave
    if (session && currentPlayer && session.status === 'playing' && !historySavedRef.current) {
      try {
        historySavedRef.current = true;
        const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
        const playerCorrect = currentPlayer.countriesGuessed.filter(c => correctCountries.includes(c)).length;
        const playerWrong = currentPlayer.countriesGuessed.filter(c => wrongCountries.includes(c)).length;
        const totalTurns = playerCorrect + playerWrong;
        const playerRank = sortedPlayers.findIndex(p => p.id === currentPlayer.id) + 1;
        const winnerScore = sortedPlayers[0]?.score || 0;

        await saveGameHistoryServer([{
          user_id: currentPlayer.id,
          session_code: session.code,
          score: currentPlayer.score,
          countries_correct: playerCorrect,
          countries_wrong: playerWrong,
          total_turns: totalTurns,
          is_winner: currentPlayer.score === winnerScore && winnerScore > 0,
          player_count: players.length,
          game_duration_minutes: session.duration,
          is_solo_mode: session.isSoloMode || false,
          rank: playerRank,
        }]);
      } catch (err) {
        console.error('Error saving mid-game history:', err);
      }
    }
    await leaveSession();
    navigate('/');
  }, [leaveSession, navigate, session, currentPlayer, players, correctCountries, wrongCountries]);

  const handleEndGame = useCallback(async () => {
    if (!session) return;

    try {
      const maxTurns = Math.max(...players.map(p => p.turnsPlayed));
      const isBalanced = players.every(p => p.turnsPlayed === maxTurns);

      if (!isBalanced) {
        if (!session.isExtraTime) {
          await updateGameState({ isExtraTime: true });
          addToast('info', t('fairnessDesc'), 10000);
          playToastSound('info');
        }
        return;
      }

      await endGame();
    } catch (error) {
      console.error('[GamePage] handleEndGame error:', error);
      // Still show results even if endGame write fails — other players
      // or the stale-player failsafe will eventually mark the session finished.
    }

    // Save current user's game results to server (only if not already saved)
    try {
      if (currentPlayer && !historySavedRef.current) {
        historySavedRef.current = true;
        const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
        const winnerScore = sortedPlayers[0]?.score || 0;
        const playerCorrect = currentPlayer.countriesGuessed.filter(c => correctCountries.includes(c)).length;
        const playerWrong = currentPlayer.countriesGuessed.filter(c => wrongCountries.includes(c)).length;
        const totalTurns = playerCorrect + playerWrong;
        const playerRank = sortedPlayers.findIndex(p => p.id === currentPlayer.id) + 1;
        
        const entries = [{
          user_id: currentPlayer.id,
          session_code: session.code,
          score: currentPlayer.score,
          countries_correct: playerCorrect,
          countries_wrong: playerWrong,
          total_turns: totalTurns,
          is_winner: currentPlayer.score === winnerScore && winnerScore > 0,
          player_count: players.length,
          game_duration_minutes: session.duration,
          is_solo_mode: session.isSoloMode || false,
          rank: playerRank,
        }];

        const { success, error: saveError } = await saveGameHistoryServer(entries);
        if (!success) {
          console.error('Failed to save game history:', saveError);
        } else {
          console.log('Game history saved successfully via server');
        }
      }
    } catch (err) {
      console.error('Error saving game history:', err);
    }

    setShowResults(true);
  }, [session, currentPlayer, players, endGame, updateGameState, addToast, t, playToastSound, correctCountries, wrongCountries]);

  const handlePlayAgain = useCallback(async () => {
    setShowResults(false);
    await leaveSession();
    navigate('/');
  }, [leaveSession, navigate]);

  if (!session) return null;

  // Show countdown overlay
  if (session.status === 'countdown') {
    return <CountdownOverlay startTime={session.countdownStartTime!} />;
  }

  // Render Against the Clock game if in that mode
  if (isAgainstTheClock && session.status === 'playing') {
    return (
      <>
        <AgainstTheClockGame onShowResults={() => setShowResults(true)} />
        <GameResults
          isOpen={showResults}
          players={players}
          onPlayAgain={handlePlayAgain}
        />
      </>
    );
  }

  // Get current player's inactivity count for warning display
  const myInactiveTurns = currentPlayer && session?.players[currentPlayer.id]?.inactiveTurns || 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Reconnection Banner */}
      <ReconnectionBanner />

      {/* Floating Score Animation */}
      {floatingScore.show && (
        <FloatingScore points={floatingScore.points} />
      )}

      {/* Inactivity Warning - shown only to the affected player */}
      {!isSoloMode && <InactivityWarning inactiveTurns={myInactiveTurns} />}

      {/* Header - Fixed navbar with blur */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-background/80 backdrop-blur-xl border-b border-primary/20 shadow-lg shadow-primary/5'
        : 'bg-card/50 backdrop-blur-sm border-b border-border'
        }`}>
        <div className="flex items-center justify-between p-3 md:p-4 max-w-7xl mx-auto">
          <Logo size="md" />

          <div className="flex items-center gap-4">
            <LanguageSwitcher />

            {/* Game Timer or Fairness Message */}
            <div className="hidden md:block w-48">
              {session.isExtraTime ? (
                <div className="bg-primary/20 border border-primary/30 rounded-lg py-1 px-3 text-center animate-pulse">
                  <p className="text-primary font-display text-xs">⚖️ {t('fairnessTitle')}</p>
                </div>
              ) : (
                <TimerProgress
                  totalSeconds={session.duration * 60}
                  startTime={session.startTime || undefined}
                  onComplete={handleEndGame}
                  label={t('timeLeft')}
                />
              )}
            </div>

            {/* Score */}
            <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="font-display text-xl text-foreground">
                {players.find(p => p.id === currentPlayer?.id)?.score || 0}
              </span>
            </div>

            {/* Sound Toggle */}
            <GameTooltip content={soundEnabled ? t('soundOn') : t('soundOff')} position="bottom">
              <Button
                variant="icon"
                size="icon"
                onClick={toggleSound}
              >
                {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </Button>
            </GameTooltip>

            {/* Leaderboard Toggle */}
            <GameTooltip content={t('tooltipLeaderboard')} position="bottom">
              <Button
                variant="icon"
                size="icon"
                onClick={() => setShowRankingModal(true)}
              >
                <Trophy className="h-5 w-5" />
              </Button>
            </GameTooltip>

             {/* Card Mode Button - Only for turn-based multiplayer */}
             {isCardModeEnabled && (
               <CardButton
                 cardPoints={cardPoints}
                 cardsCount={playerCards.filter(c => !c.isActivated).length}
                 onClick={() => setShowCardModal(true)}
               />
             )}

            {/* Leave */}
            <GameTooltip content={t('tooltipQuit')} position="bottom">
              <Button variant="outline" size="sm" onClick={handleLeave} className="gap-2">
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">{t('quitGame')}</span>
              </Button>
            </GameTooltip>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-20 md:h-24" />

      {/* Mobile Timer or Extra Time Message */}
      <div className="md:hidden p-3 border-b border-border">
        {session.isExtraTime ? (
          <div className="bg-primary/20 border border-primary/30 rounded-lg p-2 text-center animate-pulse">
            <p className="text-primary font-display text-sm">⚖️ {t('fairnessTitle')}</p>
          </div>
        ) : (
          <TimerProgress
            totalSeconds={session.duration * 60}
            startTime={session.startTime || undefined}
            onComplete={handleEndGame}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row px-2 py-2 gap-3 max-w-7xl mx-auto w-full">
        {/* Left side - Game info and controls */}
        <div className="lg:w-64 flex flex-col gap-3 shrink-0">
          {/* Turn Indicator Card - Hide in solo mode */}
          {!isSoloMode && (
          <div className={`rounded-xl p-3 border-2 transition-all ${isMyTurn
            ? 'bg-primary/10 border-primary shadow-lg shadow-primary/20 animate-pulse-glow'
            : 'bg-card border-border'
            }`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${isMyTurn ? 'bg-primary animate-ping' : 'bg-muted'}`} />
              <h3 className="font-display text-xl">
                {isMyTurn
                  ? `🎯 ${t('yourTurn')}!`
                  : `⏳ ${t('waitingTurn', { player: currentTurnPlayer?.username || '' })}`
                }
              </h3>
            </div>

            {isMyTurn && !currentCountry && !isRolling && autoRollCountdown !== null && (
              <p className="text-lg font-bold text-warning mb-2 animate-bounce">
                Rolling automatically in {autoRollCountdown}... 🎲
              </p>
            )}

            {isRolling && (
              <p className="text-sm text-warning animate-pulse">🎲 Rolling dice...</p>
            )}

            {currentCountry && (
              <>
                <div className="bg-warning/20 border border-warning rounded-lg px-3 py-2 mb-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                    {isTurnFinished ? 'Target Country' : 'Active Turn'}
                  </p>
                  <p className="font-display text-2xl text-warning">
                    {isTurnFinished ? currentCountry : '???'}
                  </p>
                </div>

                {isTurnFinished && currentTurnState?.submittedAnswer && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      Submitted:{' '}
                      <span className="font-semibold text-foreground">
                        {currentTurnState.submittedAnswer === '[TIME UP]'
                          ? 'Timed out'
                          : currentTurnState.submittedAnswer === '[SKIPPED]'
                            ? 'Skipped'
                            : currentTurnState.submittedAnswer}
                      </span>
                    </p>
                    {typeof currentTurnState?.pointsEarned === 'number' && (
                      <p>
                        Points:{' '}
                        <span className="font-semibold text-foreground">+{currentTurnState.pointsEarned}</span>
                      </p>
                    )}
                  </div>
                )}

                {isMyTurn && !isTurnFinished && (
                  <p className="text-sm text-foreground">What is the highlighted country called?</p>
                )}

                {!isMyTurn && !isTurnFinished && (
                  <p className="text-sm text-muted-foreground">Spectating - wait for your turn</p>
                )}
              </>
            )}

            {/* Turn Timer - Visible to all, starts only after dice roll (country determined) */}
            {session.turnStartTime && (
              <div className="mt-3 pt-3 border-t border-border">
                <TimerProgress
                  totalSeconds={TURN_TIME_SECONDS}
                  startTime={session.turnStartTime}
                  onComplete={isMyTurn ? handleTurnTimeout : undefined}
                  label={t('timeLeft')}
                  enableWarningSound={isMyTurn}
                />
              </div>
            )}
            {/* Fairness Extension Message in Room */}
            {session.isExtraTime && (
              <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-xs text-primary font-medium uppercase tracking-wider mb-1 flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  {t('fairnessTitle')}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('fairnessDesc')}
                </p>
              </div>
            )}
          </div>
          )}

          {/* Spectator View - Answer Display */}
          {currentTurnState?.submittedAnswer && (
            <div className={`rounded-xl p-3 border-2 ${currentTurnState.isCorrect
              ? 'bg-success/10 border-success'
              : 'bg-destructive/10 border-destructive'
              }`}>
              <p className="text-xs text-muted-foreground mb-1">
                {currentTurnPlayer?.username}'s Answer
              </p>
              <p className="font-display text-xl">
                {currentTurnState.submittedAnswer === '[TIME UP]'
                  ? '⏱️ Time Up!'
                  : currentTurnState.submittedAnswer === '[SKIPPED]'
                    ? '⏭️ Skipped'
                    : currentTurnState.submittedAnswer
                }
              </p>
              {!currentTurnState.isCorrect && currentCountry && (
                <p className="text-sm font-medium mt-1">
                  Correct Answer: <span className="text-success">{currentCountry}</span>
                </p>
              )}
              <div className={`mt-2 flex items-center gap-2 ${currentTurnState.isCorrect ? 'text-success' : 'text-destructive'
                }`}>
                {currentTurnState.isCorrect ? '✓' : '✗'}
                <span className="font-semibold">
                  {typeof currentTurnState.pointsEarned === 'number'
                    ? `+${currentTurnState.pointsEarned} points`
                    : '0 points'}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Hover the played country on the map to see its name.
              </p>
            </div>
          )}

          {/* Dice & Skip - Only for active player */}
          <div className="flex items-center justify-center gap-4 py-2">
            <Dice
              onRoll={handleRollDice}
              disabled={!isMyTurn || !!currentCountry || isRolling}
              isRolling={isRolling}
            />
            <GameTooltip content={t('tooltipSkip')} position="top">
              <button
                onClick={handleSkipTurn}
                disabled={!isMyTurn || isRolling || isTurnFinished}
                className={`
                  relative p-3 rounded-xl bg-gradient-to-br from-secondary to-card
                  border-2 transition-all duration-300 group
                  ${!isMyTurn || isRolling || isTurnFinished
                    ? 'opacity-50 cursor-not-allowed border-border'
                    : 'hover:border-warning hover:shadow-lg hover:scale-105 cursor-pointer border-border'
                  }
                `}
              >
                <SkipForward
                  className={`h-8 w-8 text-warning transition-transform duration-200 ${
                    !isMyTurn || isRolling || isTurnFinished ? '' : 'group-hover:translate-x-0.5'
                  }`}
                />
                {/* Glow effect */}
                <div className={`
                  absolute inset-0 rounded-xl bg-warning/30 blur-lg
                  transition-opacity duration-300
                  ${!isMyTurn || isRolling || isTurnFinished ? 'opacity-0' : 'opacity-0 group-hover:opacity-50'}
                `} />
                {/* Label */}
                {!(!isMyTurn || isRolling || isTurnFinished) && (
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
                    {t('turnSkipped')}
                  </span>
                )}
              </button>
            </GameTooltip>
          </div>

          {/* Mini Leaderboard for mobile */}
          <div className="lg:hidden">
            <Leaderboard
              players={players}
              currentPlayerId={currentPlayer?.id}
            />
          </div>
        </div>

        {/* Map Area - Fixed container */}
        <div className="flex-1 min-h-[400px] lg:min-h-[calc(100vh-120px)]">
          <WorldMap
            guessedCountries={guessedCountries}
            correctCountries={correctCountries}
            wrongCountries={wrongCountries}
            currentCountry={activeCountry || undefined}
            onCountryClick={handleCountryClick}
            disabled={countrySelectionMode ? false : (!isMyTurn || (!activeCountry && !isSoloMode))}
            isSoloMode={isSoloMode}
            countrySelectionMode={countrySelectionMode}
          />
        </div>

        {/* Leaderboard Sidebar - Desktop */}
        {showLeaderboard && (
          <div className="hidden lg:block w-60 shrink-0 border border-border rounded-xl p-3 bg-card/50 backdrop-blur-sm overflow-y-auto custom-scrollbar animate-fade-in">
            <Leaderboard
              players={players}
              currentPlayerId={currentPlayer?.id}
            />
          </div>
        )}
      </div>

      {/* Guess Modal - Only for active player */}
      <GuessModal
        isOpen={guessModalOpen && isMyTurn}
        onClose={() => {
          modalClosedForTurnRef.current = currentTurnIndex;
          setGuessModalOpen(false);
          // Also clear modalOpen in turn state so the sync useEffect doesn't reopen it
          if (currentTurnState?.modalOpen) {
            updateTurnState({ ...currentTurnState, modalOpen: false });
          }
        }}
        onSubmit={handleSubmitGuess}
        onSkip={handleSkip}
        onUseHint={handleUseHint}
        onUseGuidedHint={handleUseGuidedHint}
        turnTimeSeconds={TURN_TIME_SECONDS}
        turnStartTime={session.turnStartTime || soloClickStartTime || undefined}
        playerScore={currentPlayer?.score || 0}
        hasExtendedHints={hasExtendedHints(activeCountry || '')}
        hintAvailability={getHintAvailability(activeCountry || '')}
        isSoloClickMode={isSoloMode && !currentTurnState?.diceRolled}
        extraHints={currentCardEffects.extraHints}
        hintsBlocked={currentCardEffects.hintsBlocked}
      />

      {/* Ranking Modal */}
      <RankingModal
        isOpen={showRankingModal}
        onClose={() => setShowRankingModal(false)}
        players={players}
        currentPlayerId={currentPlayer?.id}
        correctCountries={correctCountries}
        wrongCountries={wrongCountries}
      />

      {/* Game Results */}
      <GameResults
        isOpen={showResults}
        players={players}
        onPlayAgain={handlePlayAgain}
        isGuest={!!currentPlayer?.isGuest}
      />

      {/* Lone Player Overlay - Not shown in solo mode */}
      {session && session.status !== 'finished' && players.length === 1 && !isSoloMode && (
        <LonePlayerOverlay
          onQuit={handleLeave}
        />
      )}

       {/* Card Modal */}
       {isCardModeEnabled && (
         <CardModal
           isOpen={showCardModal}
           onClose={() => setShowCardModal(false)}
           cardPoints={cardPoints}
           playerCards={playerCards}
           onBuyCard={buyCard}
           onActivateCard={(cardId, targetData) => activateCard(cardId, targetData)}
           onFuseCards={fuseCards}
           onRequestMapSelection={handleRequestMapSelection}
         />
       )}

       {/* Country Selection Overlay for Pick Your Country card */}
       <CountrySelectionOverlay
         isActive={countrySelectionMode}
         selectedCountry={selectedCountryForCard}
         onConfirm={handleCountrySelectionConfirm}
         onCancel={handleCountrySelectionCancel}
       />

       {/* Floating Chat Widget */}
       <FloatingChatWidget />
    </div>
  );
};

export default GamePage;
