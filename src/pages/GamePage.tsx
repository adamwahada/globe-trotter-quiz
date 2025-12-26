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
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame, TurnState, Player } from '@/contexts/GameContext';
import { useToastContext } from '@/contexts/ToastContext';
import { useSound } from '@/contexts/SoundContext';
import { isCorrectGuess } from '@/utils/scoring';
import { getRandomUnplayedCountry, getFamousPerson, getMapCountryName, getCountryFlag } from '@/utils/countryData';
import { TURN_TIME_SECONDS, COUNTDOWN_SECONDS } from '@/types/game';
import { Trophy, LogOut, Volume2, VolumeX, Users, Clock } from 'lucide-react';

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
  } = useGame();
  const { addToast } = useToastContext();
  const { playToastSound, playDiceSound, toggleSound, soundEnabled } = useSound();
  const navigate = useNavigate();

  const prevPlayersRef = useRef<Player[]>([]); // Added prevPlayersRef
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [guessModalOpen, setGuessModalOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [autoRollCountdown, setAutoRollCountdown] = useState<number | null>(null);
  const [floatingScore, setFloatingScore] = useState<{ points: number; show: boolean }>({ points: 0, show: false });
  const [isRolling, setIsRolling] = useState(false);

  // Derived state from session
  const players = session?.players || [];
  const currentTurnIndex = session?.currentTurn || 0;
  const currentTurnState = session?.currentTurnState;
  const guessedCountries = session?.guessedCountries || [];
  const currentCountry = currentTurnState?.country || null;

  // Check if it's current player's turn
  const isMyTurn = session ? players[currentTurnIndex]?.id === currentPlayer?.id : false;
  const currentTurnPlayer = players[currentTurnIndex];

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
      } else {
        // Don't show toast for other player's turn - reduces noise
      }
    }
  }, [currentTurnIndex, session?.status]);

  // Sync modal state with session
  useEffect(() => {
    if (currentTurnState?.modalOpen && isMyTurn && !guessModalOpen) {
      setGuessModalOpen(true);
    }
  }, [currentTurnState?.modalOpen, isMyTurn]);

  // Turn timer timeout
  useEffect(() => {
    if (!isMyTurn || !session?.turnStartTime || !currentCountry) return;

    const checkTimeout = () => {
      const elapsed = Math.floor((Date.now() - session.turnStartTime!) / 1000);
      if (elapsed >= TURN_TIME_SECONDS) {
        handleTurnTimeout();
      }
    };

    const interval = setInterval(checkTimeout, 1000);
    return () => clearInterval(interval);
  }, [isMyTurn, session?.turnStartTime, currentCountry]);

  const handleRollDice = useCallback(async () => {
    if (!isMyTurn || isRolling || currentCountry) return;

    setIsRolling(true);
    playDiceSound(); // Play dice roll sound

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
        modalOpen: false, // Do NOT auto-open modal
        submittedAnswer: null,
        pointsEarned: null,
        isCorrect: null,
      };

      await updateTurnState(turnState);
      await updateGameState({ turnStartTime: Date.now() });

      setIsRolling(false);
      // Country selected - no toast needed, visual highlight is enough
    }, 800);
  }, [isMyTurn, isRolling, currentCountry, guessedCountries, currentPlayer, updateTurnState, updateGameState, addToast, endGame, playDiceSound]);

  // Handle player departures notifications
  useEffect(() => {
    if (!session?.players) return;

    if (prevPlayersRef.current.length > 0) {
      const removedPlayers = prevPlayersRef.current.filter(
        prev => !session.players.find(curr => curr.id === prev.id)
      );

      removedPlayers.forEach(p => {
        if (p.id !== currentPlayer?.id) {
          addToast('info', t('playerLeft', { player: p.username }));
          playToastSound('info');
        }
      });
    }
    prevPlayersRef.current = session.players;
  }, [session?.players, currentPlayer?.id, addToast, playToastSound, t]);

  // Auto-roll dice if not done in 3 seconds
  useEffect(() => {
    if (isMyTurn && !currentCountry && !isRolling && session?.status === 'playing') {
      // Initialize countdown if not started
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
      // Reset if conditions not met
      if (autoRollCountdown !== null) setAutoRollCountdown(null);
    }
  }, [isMyTurn, currentCountry, isRolling, session?.status, autoRollCountdown, handleRollDice]);

  const handleCountryClick = useCallback(async (countryName: string) => {
    // Only active player can click
    if (!isMyTurn || !currentCountry) return;

    // Only allow clicking the selected country
    if (countryName !== currentCountry) {
      // Don't show toast - visual feedback is enough
      return;
    }

    setGuessModalOpen(true);

    // Update turn state to show modal is open
    if (currentTurnState) {
      await updateTurnState({
        ...currentTurnState,
        modalOpen: true,
      });
    }
  }, [isMyTurn, currentCountry, currentTurnState, updateTurnState, addToast]);

  const moveToNextTurn = useCallback(async () => {
    const nextTurn = (currentTurnIndex + 1) % players.length;

    await updateGameState({
      currentTurn: nextTurn,
      currentTurnState: null,
      turnStartTime: null,
    });
  }, [players.length, currentTurnIndex, updateGameState]);

  const handleTurnTimeout = useCallback(async () => {
    if (!isMyTurn) return;

    // Mark country as played so it can't be rolled again
    if (currentCountry && !guessedCountries.includes(currentCountry)) {
      await updateGameState({ guessedCountries: [...guessedCountries, currentCountry] });
    }

    // Update turn state with timeout result
    if (currentTurnState && currentCountry) {
      await updateTurnState({
        ...currentTurnState,
        submittedAnswer: '[TIME UP]',
        pointsEarned: 0,
        isCorrect: false,
        modalOpen: false,
      });
    }

    addToast('error', t('timeUp'));
    playToastSound('error');
    setGuessModalOpen(false);

    // Wait to show result, then move to next turn
    setTimeout(() => moveToNextTurn(), 2000);
  }, [isMyTurn, currentTurnState, currentCountry, guessedCountries, updateGameState, addToast, t, moveToNextTurn, playToastSound, updateTurnState]);

  const handleSubmitGuess = useCallback(async (guess: string) => {
    if (!currentCountry || !currentPlayer || !isMyTurn) return;

    const result = isCorrectGuess(guess, currentCountry);

    // Mark country as played (locked) regardless of outcome
    const nextGuessedCountries = guessedCountries.includes(currentCountry)
      ? guessedCountries
      : [...guessedCountries, currentCountry];

    // Update turn state with result (visible to all players)
    if (currentTurnState) {
      await updateTurnState({
        ...currentTurnState,
        submittedAnswer: guess,
        pointsEarned: result.points,
        isCorrect: result.correct,
        modalOpen: false,
      });
    }

    // Show floating score
    setFloatingScore({ points: result.points, show: true });
    setTimeout(() => setFloatingScore({ points: 0, show: false }), 2000);

    // Update players + played countries
    const updatedPlayers = players.map((p, idx) =>
      idx === currentTurnIndex
        ? {
          ...p,
          score: p.score + result.points,
          countriesGuessed:
            result.correct ? [...(p.countriesGuessed || []), currentCountry] : p.countriesGuessed,
        }
        : p
    );

    await updateGameState({
      players: updatedPlayers,
      guessedCountries: nextGuessedCountries,
    });

    if (result.correct) {
      addToast('success', `+${result.points} ${t('points')} - Correct!`);
      playToastSound('success');
    } else {
      addToast('error', t('wrongGuess', { player: '' }));
      playToastSound('error');
    }

    setGuessModalOpen(false);

    // Wait a moment to show result, then move to next turn
    setTimeout(() => moveToNextTurn(), 2000);
  }, [currentCountry, currentPlayer, isMyTurn, currentTurnState, updateTurnState, guessedCountries, players, currentTurnIndex, updateGameState, addToast, t, moveToNextTurn, playToastSound]);

  const handleSkip = useCallback(async () => {
    if (!isMyTurn) return;

    // Mark country as played so it can't be rolled again
    if (currentCountry && !guessedCountries.includes(currentCountry)) {
      await updateGameState({ guessedCountries: [...guessedCountries, currentCountry] });
    }

    // Update turn state with skip result
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
    setGuessModalOpen(false);

    // Wait to show result, then move to next turn
    setTimeout(() => moveToNextTurn(), 2000);
  }, [isMyTurn, currentTurnState, currentCountry, guessedCountries, updateGameState, addToast, t, moveToNextTurn, updateTurnState]);

  const handleUseHint = useCallback((type: 'letter' | 'famous' | 'flag') => {
    if (!currentCountry || !currentPlayer || !session) return '';

    // Calculate new score (deduct 1 point, minimum 0)
    const newScore = Math.max(0, currentPlayer.score - 1);

    const updatedPlayers = players.map((p, idx) =>
      idx === currentTurnIndex
        ? { ...p, score: newScore }
        : p
    );

    // For flag hint, also subtract 10 seconds from timer
    if (type === 'flag' && session.turnStartTime) {
      const newTurnStartTime = session.turnStartTime - 10000; // Subtract 10 seconds (10000ms)
      updateGameState({ players: updatedPlayers, turnStartTime: newTurnStartTime });
      addToast('info', t('hintUsed') + ' (-1 point, -10 seconds)');
      return getCountryFlag(currentCountry);
    }

    // Update game state immediately to reflect points deduction
    updateGameState({ players: updatedPlayers });

    addToast('info', t('hintUsed') + ' (-1 point)');

    if (type === 'letter') {
      return currentCountry[0];
    } else {
      return getFamousPerson(currentCountry) || 'No famous person data found';
    }
  }, [currentCountry, currentPlayer, players, currentTurnIndex, session, updateGameState, addToast, t]);

  const handleLeave = useCallback(async () => {
    await leaveSession();
    navigate('/');
  }, [leaveSession, navigate]);

  const handleEndGame = useCallback(async () => {
    if (!session) return;

    // Check for fairness: Have all players played the same number of turns?
    const maxTurns = Math.max(...session.players.map(p => p.turnsPlayed));
    const isBalanced = session.players.every(p => p.turnsPlayed === maxTurns);

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
  }, [session, endGame, updateGameState, addToast, t, playToastSound]);

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Floating Score Animation */}
      {floatingScore.show && (
        <FloatingScore points={floatingScore.points} />
      )}

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

      {/* Spacer for fixed navbar - increased padding */}
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
            currentCountry={currentCountry || undefined}
            onCountryClick={handleCountryClick}
            disabled={!isMyTurn || !currentCountry}
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
        turnTimeSeconds={TURN_TIME_SECONDS}
        turnStartTime={session.turnStartTime || undefined}
      />

      {/* Game Results */}
      <GameResults
        isOpen={showResults}
        players={players}
        onPlayAgain={handlePlayAgain}
      />

      {/* Lone Player Overlay */}
      {session && session.status !== 'finished' && session.players.length === 1 && (
        <LonePlayerOverlay
          onQuit={handleLeave}
        />
      )}
    </div>
  );
};

export default GamePage;
