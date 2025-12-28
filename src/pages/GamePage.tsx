import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo/Logo';
import { Button } from '@/components/ui/button';
import { WorldMap } from '@/components/Map/WorldMap';
import { Dice } from '@/components/Dice/Dice';
import { Leaderboard } from '@/components/Leaderboard/Leaderboard';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame, TurnState, Player } from '@/contexts/GameContext';
import { useToastContext } from '@/contexts/ToastContext';
import { useSound } from '@/contexts/SoundContext';
import { isCorrectGuess } from '@/utils/scoring';
import { getRandomUnplayedCountry, getFamousPerson, getMapCountryName, getCountryFlag } from '@/utils/countryData';
import { hasExtendedHints, getFamousPlayer, getFamousSinger, getCountryCapital } from '@/utils/countryHints';
import { GuidedHintType } from '@/components/Guess/GuessModal';
import { TURN_TIME_SECONDS, COUNTDOWN_SECONDS, playersMapToArray, PlayersMap } from '@/types/game';
import { Trophy, LogOut, Volume2, VolumeX, Users, Clock } from 'lucide-react';
import { removePlayerFromSession, clearRecoveryData } from '@/services/gameSessionService';

const GamePage = () => {
  const { t } = useLanguage();
  const {
    session,
    currentPlayer,
    leaveSession,
    updateGameState,
    updateTurnState,
    endGame,
    startGame,
    getPlayersArray,
  } = useGame();
  const { addToast } = useToastContext();
  const { playToastSound, playDiceSound, toggleSound, soundEnabled } = useSound();
  const navigate = useNavigate();

  const prevPlayersRef = useRef<Player[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [guessModalOpen, setGuessModalOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [autoRollCountdown, setAutoRollCountdown] = useState<number | null>(null);
  const [floatingScore, setFloatingScore] = useState<{ points: number; show: boolean }>({ points: 0, show: false });
  const [isRolling, setIsRolling] = useState(false);

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

  // For solo mode, store the country clicked by the player for click-to-guess mode
  const [soloClickedCountry, setSoloClickedCountry] = useState<string | null>(null);

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
    if (!session || session.status === 'finished') {
      if (session?.status === 'finished') {
        setShowResults(true);
      } else {
        navigate('/');
      }
    }
  }, [session, navigate]);

  // Handle countdown to playing transition
  useEffect(() => {
    if (session?.status === 'countdown' && session.countdownStartTime) {
      const elapsed = Math.floor((Date.now() - session.countdownStartTime) / 1000);
      const remaining = COUNTDOWN_SECONDS - elapsed;

      if (remaining <= 0) {
        // Countdown finished - start game (only host should do this)
        if (session.host === currentPlayer?.id) {
          startGame();
        }
      }
    }
  }, [session, currentPlayer, startGame]);

  // Show toast notifications for turn changes
  useEffect(() => {
    if (session?.status === 'playing' && currentTurnPlayer) {
      if (isMyTurn) {
        addToast('game', `🎯 ${t('yourTurn')}! ${t('rollDice')} 🎲`);
        playToastSound('game');
      }
    }
  }, [currentTurnIndex, session?.status]);

  // Sync modal state with session
  useEffect(() => {
    if (currentTurnState?.modalOpen && isMyTurn && !guessModalOpen) {
      setGuessModalOpen(true);
    }
  }, [currentTurnState?.modalOpen, isMyTurn]);

  // Turn timer timeout (not used in solo mode for click-to-guess)
  useEffect(() => {
    if (!isMyTurn || !session?.turnStartTime || !activeCountry) return;
    // In solo mode with click-to-guess (no dice roll), skip turn timer
    if (isSoloMode && !currentTurnState?.diceRolled) return;

    const checkTimeout = () => {
      const elapsed = Math.floor((Date.now() - session.turnStartTime!) / 1000);
      if (elapsed >= TURN_TIME_SECONDS) {
        handleTurnTimeout();
      }
    };

    const interval = setInterval(checkTimeout, 1000);
    return () => clearInterval(interval);
  }, [isMyTurn, session?.turnStartTime, activeCountry, isSoloMode, currentTurnState?.diceRolled]);

  const handleRollDice = useCallback(async () => {
    if (!isMyTurn || isRolling || currentCountry) return;

    setIsRolling(true);
    playDiceSound();

    setTimeout(async () => {
      const country = getRandomUnplayedCountry(guessedCountries);
      if (!country) {
        addToast('info', 'All countries have been guessed!');
        await endGame();
        return;
      }

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
      await updateGameState({ turnStartTime: Date.now() });

      setIsRolling(false);
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
  }, [isMyTurn, currentCountry, isRolling, session?.status, autoRollCountdown, handleRollDice, isSoloMode]);

  const handleCountryClick = useCallback(async (countryName: string) => {
    if (!isMyTurn) return;
    
    // Solo mode: click any unguessed country to guess it
    if (isSoloMode && !activeCountry) {
      // Check if country already guessed
      if (guessedCountries.includes(countryName)) {
        addToast('info', 'You already guessed this country!');
        return;
      }
      setSoloClickedCountry(countryName);
      setGuessModalOpen(true);
      return;
    }

    // Regular mode or dice-rolled solo: only click the highlighted country
    if (countryName !== activeCountry) {
      return;
    }

    setGuessModalOpen(true);

    if (currentTurnState) {
      await updateTurnState({
        ...currentTurnState,
        modalOpen: true,
      });
    }
  }, [isMyTurn, activeCountry, currentTurnState, updateTurnState, isSoloMode, guessedCountries, addToast]);

  const moveToNextTurn = useCallback(async () => {
    const nextTurn = (currentTurnIndex + 1) % players.length;

    await updateGameState({
      currentTurn: nextTurn,
      currentTurnState: null,
      turnStartTime: null,
    });
  }, [players.length, currentTurnIndex, updateGameState]);

  const handleTurnTimeout = useCallback(async () => {
    if (!isMyTurn || !currentPlayer || !session) return;

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
    const currentPlayerData = session.players[currentPlayer.id];
    const newInactiveTurns = (currentPlayerData?.inactiveTurns || 0) + 1;

    if (newInactiveTurns >= 3) {
      // Kick player after 3 inactive turns
      addToast('error', 'You have been kicked for inactivity (3 missed turns)');
      playToastSound('error');
      await removePlayerFromSession(session.code, currentPlayer.id);
      clearRecoveryData();
      navigate('/');
      return;
    }

    // Update inactivity count
    const updatedPlayers: PlayersMap = {
      ...session.players,
      [currentPlayer.id]: {
        ...currentPlayerData,
        inactiveTurns: newInactiveTurns,
      }
    };
    await updateGameState({ players: updatedPlayers });

    addToast('error', t('timeUp'));
    playToastSound('error');
    setGuessModalOpen(false);

    setTimeout(() => moveToNextTurn(), 2000);
  }, [isMyTurn, currentTurnState, currentCountry, guessedCountries, wrongCountries, updateGameState, addToast, t, moveToNextTurn, playToastSound, updateTurnState, session, currentPlayer, navigate]);

  const handleSubmitGuess = useCallback(async (guess: string) => {
    // For solo click mode, use soloClickedCountry if no dice was rolled
    const countryToGuess = isSoloMode && soloClickedCountry ? soloClickedCountry : currentCountry;
    if (!countryToGuess || !currentPlayer || !isMyTurn || !session) return;

    const result = isCorrectGuess(guess, countryToGuess);

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

    // Close modal immediately
    setGuessModalOpen(false);

    // Update turn state if it exists (dice mode)
    if (currentTurnState) {
      await updateTurnState({
        ...currentTurnState,
        submittedAnswer: guess,
        pointsEarned: result.points,
        isCorrect: result.correct,
        modalOpen: false,
      });
    }

    setFloatingScore({ points: result.points, show: true });
    setTimeout(() => setFloatingScore({ points: 0, show: false }), 2000);

    // Build updated players map - reset inactivity on active participation
    const currentPlayerUid = currentPlayer.id;
    if (currentPlayerUid && session.players[currentPlayerUid]) {
      const currentPlayerData = session.players[currentPlayerUid];
      // Ensure countriesGuessed is always an array, never undefined
      const existingCountriesGuessed = currentPlayerData.countriesGuessed || [];
      const newCountriesGuessed = result.correct
        ? [...existingCountriesGuessed, countryToGuess]
        : existingCountriesGuessed;
      
      const updatedPlayers: PlayersMap = {
        ...session.players,
        [currentPlayerUid]: {
          ...currentPlayerData,
          score: currentPlayerData.score + result.points,
          countriesGuessed: newCountriesGuessed,
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
      addToast('success', `+${result.points} ${t('points')} - Correct!`);
      playToastSound('success');
    } else {
      addToast('error', t('wrongGuess', { player: '' }));
      playToastSound('error');
    }
    
    // Reset solo clicked country after submission
    if (isSoloMode && soloClickedCountry) {
      setSoloClickedCountry(null);
    }

    // In solo mode, clear turn state immediately so player can play again
    if (isSoloMode) {
      await updateTurnState(null);
    } else {
      // In multiplayer, wait then move to next turn
      setTimeout(() => moveToNextTurn(), 2000);
    }
  }, [currentPlayer, isMyTurn, currentTurnState, updateTurnState, guessedCountries, correctCountries, wrongCountries, session, updateGameState, addToast, t, moveToNextTurn, playToastSound, isSoloMode, soloClickedCountry, currentCountry]);

  const handleSkip = useCallback(async () => {
    if (!isMyTurn || !currentPlayer || !session) return;

    if (currentCountry && !guessedCountries.includes(currentCountry)) {
      await updateGameState({
        guessedCountries: [...guessedCountries, currentCountry],
        wrongCountries: [...wrongCountries, currentCountry],
      });
    }

    if (currentTurnState && currentCountry) {
      await updateTurnState({
        ...currentTurnState,
        submittedAnswer: '[SKIPPED]',
        pointsEarned: 0,
        isCorrect: false,
        modalOpen: false,
      });
    }

    // Track inactivity (skip counts as inactive)
    const currentPlayerData = session.players[currentPlayer.id];
    const newInactiveTurns = (currentPlayerData?.inactiveTurns || 0) + 1;

    if (newInactiveTurns >= 3) {
      // Kick player after 3 inactive turns
      addToast('error', 'You have been kicked for inactivity (3 skipped turns)');
      playToastSound('error');
      await removePlayerFromSession(session.code, currentPlayer.id);
      clearRecoveryData();
      navigate('/');
      return;
    }

    // Update inactivity count
    const updatedPlayers: PlayersMap = {
      ...session.players,
      [currentPlayer.id]: {
        ...currentPlayerData,
        inactiveTurns: newInactiveTurns,
      }
    };
    await updateGameState({ players: updatedPlayers });

    addToast('info', t('turnSkipped'));
    setGuessModalOpen(false);

    setTimeout(() => moveToNextTurn(), 2000);
  }, [isMyTurn, currentTurnState, currentCountry, guessedCountries, wrongCountries, updateGameState, addToast, t, moveToNextTurn, updateTurnState, session, currentPlayer, navigate, playToastSound]);

  const handleUseHint = useCallback((type: 'letter' | 'famous' | 'flag') => {
    // Use activeCountry which works for both dice mode and solo click mode
    const countryForHint = isSoloMode && soloClickedCountry ? soloClickedCountry : currentCountry;
    if (!countryForHint || !currentPlayer || !session) return '';

    const currentPlayerUid = currentPlayer.id;
    if (!session.players[currentPlayerUid]) return '';

    const currentPlayerData = session.players[currentPlayerUid];
    
    // Famous person hint costs 0.5 points, others cost 1 point
    const pointCost = type === 'famous' ? 0.5 : 1;
    const newScore = Math.max(0, currentPlayerData.score - pointCost);

    const updatedPlayers: PlayersMap = {
      ...session.players,
      [currentPlayerUid]: {
        ...currentPlayerData,
        score: newScore,
      }
    };

    if (type === 'flag' && session.turnStartTime) {
      const newTurnStartTime = session.turnStartTime - 10000;
      updateGameState({ players: updatedPlayers, turnStartTime: newTurnStartTime });
      addToast('info', t('hintUsed') + ' (-1 point, -10 seconds)');
      return getCountryFlag(countryForHint);
    }

    updateGameState({ players: updatedPlayers });

    if (type === 'famous') {
      addToast('info', t('hintUsed') + ' (-0.5 point)');
      return getFamousPerson(countryForHint) || 'No famous person data found';
    }

    addToast('info', t('hintUsed') + ' (-1 point)');
    return countryForHint[0];
  }, [currentCountry, currentPlayer, session, updateGameState, addToast, t, isSoloMode, soloClickedCountry]);

  // Handle guided hints (player, singer, capital)
  const handleUseGuidedHint = useCallback((type: GuidedHintType): { value: string; timePenalty: number } | null => {
    const countryForHint = isSoloMode && soloClickedCountry ? soloClickedCountry : currentCountry;
    if (!countryForHint || !currentPlayer || !session) return null;

    const currentPlayerUid = currentPlayer.id;
    if (!session.players[currentPlayerUid]) return null;

    const currentPlayerData = session.players[currentPlayerUid];
    
    let hintValue: string | null = null;
    let timePenalty = 0;
    let pointCost = 0;

    if (type === 'capital') {
      hintValue = getCountryCapital(countryForHint);
      timePenalty = 10; // 10 seconds penalty
      pointCost = 0; // Capital costs only time
    } else if (type === 'player') {
      hintValue = getFamousPlayer(countryForHint);
      timePenalty = 5; // 5 seconds penalty
      pointCost = 1; // 1 point cost
    } else if (type === 'singer') {
      hintValue = getFamousSinger(countryForHint);
      timePenalty = 5; // 5 seconds penalty
      pointCost = 1; // 1 point cost
    }

    if (!hintValue) return null;

    // Deduct points if applicable
    const newScore = Math.max(0, currentPlayerData.score - pointCost);

    const updatedPlayers: PlayersMap = {
      ...session.players,
      [currentPlayerUid]: {
        ...currentPlayerData,
        score: newScore,
      }
    };

    // Apply time penalty
    if (session.turnStartTime) {
      const newTurnStartTime = session.turnStartTime - (timePenalty * 1000);
      updateGameState({ players: updatedPlayers, turnStartTime: newTurnStartTime });
    } else {
      updateGameState({ players: updatedPlayers });
    }

    const costMessage = type === 'capital' 
      ? `(-${timePenalty}s)` 
      : `(-${pointCost}pt, -${timePenalty}s)`;
    addToast('info', `${t('hintUsed')} ${costMessage}`);

    return { value: hintValue, timePenalty };
  }, [currentCountry, currentPlayer, session, updateGameState, addToast, t, isSoloMode, soloClickedCountry]);

  const handleLeave = useCallback(async () => {
    await leaveSession();
    navigate('/');
  }, [leaveSession, navigate]);

  const handleEndGame = useCallback(async () => {
    if (!session) return;

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
    setShowResults(true);
  }, [session, players, endGame, updateGameState, addToast, t, playToastSound]);

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
                onClick={() => setShowLeaderboard(!showLeaderboard)}
              >
                <Trophy className="h-5 w-5" />
              </Button>
            </GameTooltip>

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
      <div className="h-24 md:h-32" />

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
      <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4 max-w-7xl mx-auto w-full">
        {/* Left side - Game info and controls */}
        <div className="lg:w-80 flex flex-col gap-4 shrink-0">
          {/* Turn Indicator Card */}
          <div className={`rounded-xl p-4 border-2 transition-all ${isMyTurn
            ? 'bg-primary/10 border-primary shadow-lg shadow-primary/20 animate-pulse-glow'
            : 'bg-card border-border'
            }`}>
            <div className="flex items-center gap-3 mb-3">
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

            {/* Turn Timer - Visible to all */}
            {currentCountry && session.turnStartTime && (
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

          {/* Spectator View - Answer Display */}
          {currentTurnState?.submittedAnswer && (
            <div className={`rounded-xl p-4 border-2 ${currentTurnState.isCorrect
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

          {/* Dice - Only for active player */}
          <div className="flex justify-center py-4">
            <Dice
              onRoll={handleRollDice}
              disabled={!isMyTurn || !!currentCountry || isRolling}
              isRolling={isRolling}
            />
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
        <div className="flex-1 min-h-[500px] lg:min-h-[700px]">
          <WorldMap
            guessedCountries={guessedCountries}
            correctCountries={correctCountries}
            wrongCountries={wrongCountries}
            currentCountry={activeCountry || undefined}
            onCountryClick={handleCountryClick}
            disabled={!isMyTurn || (!activeCountry && !isSoloMode)}
            isSoloMode={isSoloMode}
          />
        </div>

        {/* Leaderboard Sidebar - Desktop */}
        {showLeaderboard && (
          <div className="hidden lg:block w-72 shrink-0 border border-border rounded-xl p-4 bg-card/50 backdrop-blur-sm overflow-y-auto animate-fade-in">
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
        onClose={() => setGuessModalOpen(false)}
        onSubmit={handleSubmitGuess}
        onSkip={handleSkip}
        onUseHint={handleUseHint}
        onUseGuidedHint={handleUseGuidedHint}
        turnTimeSeconds={TURN_TIME_SECONDS}
        turnStartTime={session.turnStartTime || undefined}
        playerScore={currentPlayer?.score || 0}
        hasExtendedHints={hasExtendedHints(activeCountry || '')}
      />

      {/* Game Results */}
      <GameResults
        isOpen={showResults}
        players={players}
        onPlayAgain={handlePlayAgain}
      />

      {/* Lone Player Overlay - Not shown in solo mode */}
      {session && session.status !== 'finished' && players.length === 1 && !isSoloMode && (
        <LonePlayerOverlay
          onQuit={handleLeave}
        />
      )}
    </div>
  );
};

export default GamePage;
