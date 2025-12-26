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
import { RankingModal } from '@/components/Ranking/RankingModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame, TurnState } from '@/contexts/GameContext';
import { useToastContext } from '@/contexts/ToastContext';
import { useSound } from '@/contexts/SoundContext';
import { isCorrectGuess } from '@/utils/scoring';
import { getRandomUnplayedCountry } from '@/utils/countryData';
import { TURN_TIME_SECONDS, COUNTDOWN_SECONDS } from '@/types/game';
import { Trophy, LogOut, BarChart3 } from 'lucide-react';

const GamePage = () => {
  const { t } = useLanguage();
  const { 
    session, 
    currentPlayer, 
    leaveSession, 
    endGame,
    updateGameState,
    updateTurnState,
    startGame,
  } = useGame();
  const { addToast } = useToastContext();
  const { playToastSound } = useSound();
  const navigate = useNavigate();

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [guessModalOpen, setGuessModalOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
        addToast('game', `🎯 ${t('yourTurn')}! Roll the dice 🎲`);
        playToastSound('game');
      } else {
        addToast('info', t('waitingTurn', { player: currentTurnPlayer.username }));
      }
    }
  }, [currentTurnIndex, session?.status]);

  // Sync modal state with session
  useEffect(() => {
    if (currentTurnState?.modalOpen && isMyTurn && !guessModalOpen) {
      setGuessModalOpen(true);
    }
  }, [currentTurnState?.modalOpen, isMyTurn]);

  // Auto-roll dice when it's player's turn and no country selected
  useEffect(() => {
    if (isMyTurn && !currentCountry && !isRolling && session?.status === 'playing' && !currentTurnState?.diceRolled) {
      const timer = setTimeout(() => {
        handleRollDice();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isMyTurn, currentCountry, isRolling, session?.status, currentTurnState?.diceRolled]);

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
    if (!isMyTurn || isRolling) return;
    
    setIsRolling(true);
    
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
      addToast('game', t('rollComplete'));
    }, 600);
  }, [isMyTurn, isRolling, guessedCountries, currentPlayer, updateTurnState, updateGameState, addToast, t, endGame]);

  const handleCountryClick = useCallback(async (countryName: string) => {
    if (!isMyTurn || !currentCountry) return;
    
    // Only allow clicking the selected country
    if (countryName !== currentCountry) {
      addToast('info', 'Click on the highlighted country to guess!');
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
    
    addToast('error', t('timeUp'));
    playToastSound('error');
    setGuessModalOpen(false);
    await moveToNextTurn();
  }, [isMyTurn, addToast, t, moveToNextTurn, playToastSound]);

  const handleSubmitGuess = useCallback(async (guess: string) => {
    if (!currentCountry || !currentPlayer || !isMyTurn) return;
    
    const result = isCorrectGuess(guess, currentCountry);
    
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
    
    if (result.correct) {
      const newGuessedCountries = [...guessedCountries, currentCountry];
      
      const updatedPlayers = players.map((p, idx) => 
        idx === currentTurnIndex 
          ? { ...p, score: p.score + result.points, countriesGuessed: [...p.countriesGuessed, currentCountry] }
          : p
      );
      
      await updateGameState({ 
        players: updatedPlayers,
        guessedCountries: newGuessedCountries,
      });
      
      addToast('success', `+${result.points} ${t('points')}`);
      playToastSound('success');
    } else {
      addToast('error', `${t('wrongGuess', { player: '' })} - ${currentCountry}`);
      playToastSound('error');
    }
    
    setGuessModalOpen(false);
    
    // Wait a moment to show result, then move to next turn
    setTimeout(() => moveToNextTurn(), 1500);
  }, [currentCountry, currentPlayer, isMyTurn, currentTurnState, updateTurnState, guessedCountries, players, currentTurnIndex, updateGameState, addToast, t, moveToNextTurn, playToastSound]);

  const handleSkip = useCallback(async () => {
    if (!isMyTurn) return;
    
    addToast('info', t('turnSkipped'));
    setGuessModalOpen(false);
    await moveToNextTurn();
  }, [isMyTurn, addToast, t, moveToNextTurn]);

  const handleUseHint = useCallback(() => {
    if (!currentCountry || !currentPlayer) return '';
    
    const updatedPlayers = players.map((p, idx) => 
      idx === currentTurnIndex 
        ? { ...p, score: Math.max(0, p.score - 1) }
        : p
    );
    
    // Fire and forget - optimistic update
    updateGameState({ players: updatedPlayers });
    
    addToast('info', t('hintUsed') + ' (-1 point)');
    return currentCountry[0];
  }, [currentCountry, currentPlayer, players, currentTurnIndex, updateGameState, addToast, t]);

  const handleLeave = useCallback(async () => {
    await leaveSession();
    navigate('/');
  }, [leaveSession, navigate]);

  const handleEndGame = useCallback(async () => {
    await endGame();
    setShowResults(true);
  }, [endGame]);

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
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-background/80 backdrop-blur-xl border-b border-primary/20 shadow-lg shadow-primary/5' 
          : 'bg-card/50 backdrop-blur-sm border-b border-border'
      }`}>
        <div className="flex items-center justify-between p-3 md:p-4 max-w-7xl mx-auto">
          <Logo size="md" />
          
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            
            {/* Game Timer */}
            <div className="hidden md:block w-48">
              <TimerProgress 
                totalSeconds={session.duration * 60} 
                startTime={session.startTime || undefined}
                onComplete={handleEndGame}
                label={t('timeLeft')}
              />
            </div>
            
            {/* Score */}
            <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="font-display text-xl text-foreground">
                {players.find(p => p.id === currentPlayer?.id)?.score || 0}
              </span>
            </div>
            
            {/* Ranking Modal Toggle */}
            <GameTooltip content="View Rankings" position="bottom">
              <Button 
                variant="icon" 
                size="icon"
                onClick={() => setShowRankingModal(true)}
              >
                <BarChart3 className="h-5 w-5" />
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
      <div className="h-14 md:h-16" />

      {/* Mobile Timer */}
      <div className="md:hidden p-3 border-b border-border">
        <TimerProgress 
          totalSeconds={session.duration * 60}
          startTime={session.startTime || undefined}
          onComplete={handleEndGame}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Area - Fixed container with scroll isolation */}
        <div className="flex-1 relative p-2 md:p-4 overflow-hidden">
          {/* Turn indicator */}
          <div className={`absolute top-4 left-4 z-10 backdrop-blur-sm border rounded-xl px-5 py-3 ${
            isMyTurn 
              ? 'bg-primary/20 border-primary shadow-lg shadow-primary/20' 
              : 'bg-card/90 border-border'
          }`}>
            <p className={`font-display text-lg ${isMyTurn ? 'text-primary' : 'text-muted-foreground'}`}>
              {isMyTurn ? `🎯 ${t('yourTurn')}` : `⏳ ${t('waitingTurn', { player: currentTurnPlayer?.username || 'Opponent' })}`}
            </p>
            {currentCountry && isMyTurn && (
              <p className="text-sm text-foreground mt-1">
                {t('clickCountryToGuess')}
              </p>
            )}
            {/* Turn Timer */}
            {currentCountry && session.turnStartTime && (
              <div className="mt-2">
                <TimerProgress 
                  totalSeconds={TURN_TIME_SECONDS}
                  startTime={session.turnStartTime}
                  onComplete={isMyTurn ? handleTurnTimeout : undefined}
                />
              </div>
            )}
          </div>

          {/* Spectator Answer Display */}
          {!isMyTurn && currentTurnState?.submittedAnswer && (
            <div className={`absolute top-4 right-20 z-10 backdrop-blur-sm border rounded-xl px-5 py-3 ${
              currentTurnState.isCorrect ? 'bg-success/20 border-success' : 'bg-destructive/20 border-destructive'
            }`}>
              <p className="text-sm text-muted-foreground">Answer:</p>
              <p className="font-display text-lg">{currentTurnState.submittedAnswer}</p>
              <p className={`text-sm ${currentTurnState.isCorrect ? 'text-success' : 'text-destructive'}`}>
                {currentTurnState.isCorrect ? `+${currentTurnState.pointsEarned} points` : 'Wrong'}
              </p>
            </div>
          )}

          {/* Dice */}
          <div className="absolute bottom-4 left-4 z-10">
            <Dice 
              onRoll={handleRollDice} 
              disabled={!isMyTurn || !!currentCountry || isRolling}
              isRolling={isRolling}
            />
            {!currentCountry && isMyTurn && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {t('rollDice')}
              </p>
            )}
          </div>

          {/* Map Container */}
          <div className="w-full h-full overflow-auto rounded-xl">
            <WorldMap
              guessedCountries={guessedCountries}
              currentCountry={currentCountry || undefined}
              onCountryClick={handleCountryClick}
              disabled={!isMyTurn || !currentCountry}
            />
          </div>
        </div>

        {/* Leaderboard Sidebar */}
        {showLeaderboard && (
          <div className="w-80 border-l border-border p-4 bg-card/50 backdrop-blur-sm overflow-y-auto animate-fade-in">
            <Leaderboard 
              players={players} 
              currentPlayerId={currentPlayer?.id}
            />
          </div>
        )}
      </div>

      {/* Guess Modal */}
      <GuessModal
        isOpen={guessModalOpen && isMyTurn}
        onClose={() => setGuessModalOpen(false)}
        countryName={currentCountry || ''}
        onSubmit={handleSubmitGuess}
        onSkip={handleSkip}
        onUseHint={handleUseHint}
        turnTimeSeconds={TURN_TIME_SECONDS}
        turnStartTime={session.turnStartTime || undefined}
      />

      {/* Ranking Modal */}
      <RankingModal
        isOpen={showRankingModal}
        onClose={() => setShowRankingModal(false)}
        players={players}
        currentPlayerId={currentPlayer?.id}
      />

      {/* Game Results */}
      <GameResults
        isOpen={showResults}
        players={players}
        onPlayAgain={handlePlayAgain}
      />
    </div>
  );
};

export default GamePage;
