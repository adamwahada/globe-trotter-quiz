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
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { useToastContext } from '@/contexts/ToastContext';
import { isCorrectGuess } from '@/utils/scoring';
import { getRandomCountry } from '@/utils/countryData';
import { Trophy, LogOut } from 'lucide-react';

const TURN_TIME_SECONDS = 30;

const GamePage = () => {
  const { t } = useLanguage();
  const { 
    session, 
    currentPlayer, 
    leaveSession, 
    endGame,
    updateGameState,
  } = useGame();
  const { addToast } = useToastContext();
  const navigate = useNavigate();

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [guessModalOpen, setGuessModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [currentCountry, setCurrentCountry] = useState<string | null>(session?.currentCountry || null);
  const [guessedCountries, setGuessedCountries] = useState<string[]>(session?.guessedCountries || []);
  const [isRolling, setIsRolling] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Turn management - synced with session
  const [currentTurnIndex, setCurrentTurnIndex] = useState(session?.currentTurn || 0);
  const [turnStartTime, setTurnStartTime] = useState<number | null>(null);
  const [players, setPlayers] = useState(() => 
    session?.players.map(p => ({ ...p })) || []
  );
  
  const turnTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle scroll for navbar blur effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync local state with Firebase session
  useEffect(() => {
    if (session) {
      setCurrentTurnIndex(session.currentTurn);
      setCurrentCountry(session.currentCountry);
      setGuessedCountries(session.guessedCountries || []);
      setPlayers(session.players.map(p => ({ ...p })));
    }
  }, [session]);

  // Check if it's current player's turn
  const isMyTurn = session ? players[currentTurnIndex]?.id === currentPlayer?.id : false;
  const currentTurnPlayer = players[currentTurnIndex];

  useEffect(() => {
    if (!session || session.status !== 'playing') {
      navigate('/');
    }
  }, [session, navigate]);

  // Auto roll dice at turn start (when it's player's turn and no country selected)
  useEffect(() => {
    if (isMyTurn && !currentCountry && !isRolling && session?.status === 'playing') {
      const timer = setTimeout(() => {
        handleRollDice();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isMyTurn, currentCountry, isRolling, session?.status, currentTurnIndex]);

  // Turn timer - auto skip if time runs out without modal open
  useEffect(() => {
    if (currentCountry && !guessModalOpen && isMyTurn) {
      setTurnStartTime(Date.now());
      
      turnTimerRef.current = setTimeout(() => {
        handleTurnTimeout();
      }, TURN_TIME_SECONDS * 1000);
      
      return () => {
        if (turnTimerRef.current) {
          clearTimeout(turnTimerRef.current);
        }
      };
    }
  }, [currentCountry, guessModalOpen, isMyTurn]);

  const handleRollDice = useCallback(() => {
    setIsRolling(true);
    setTimeout(async () => {
      const country = getRandomCountry();
      setCurrentCountry(country);
      setIsRolling(false);
      setTurnStartTime(Date.now());
      
      // Sync to Firebase
      await updateGameState({ currentCountry: country });
      
      addToast('game', t('rollComplete'));
    }, 600);
  }, [addToast, t, updateGameState]);

  const handleCountryClick = (countryName: string) => {
    if (!isMyTurn || !currentCountry) return;
    setSelectedCountry(countryName);
    setGuessModalOpen(true);
    
    if (turnTimerRef.current) {
      clearTimeout(turnTimerRef.current);
    }
  };

  const moveToNextTurn = useCallback(async () => {
    const nextTurn = (currentTurnIndex + 1) % players.length;
    
    setCurrentCountry(null);
    setSelectedCountry(null);
    setTurnStartTime(null);
    setCurrentTurnIndex(nextTurn);
    
    // Sync to Firebase
    await updateGameState({ 
      currentTurn: nextTurn, 
      currentCountry: null,
      players: players,
      guessedCountries: guessedCountries,
    });
    
    addToast('game', t('nextPlayerTurn', { player: players[nextTurn]?.username || 'Next player' }));
  }, [players, currentTurnIndex, addToast, t, updateGameState, guessedCountries]);

  const handleTurnTimeout = useCallback(() => {
    addToast('error', t('timeUp'));
    moveToNextTurn();
  }, [addToast, t, moveToNextTurn]);

  const handleSubmitGuess = async (guess: string) => {
    if (!currentCountry) return;
    
    const result = isCorrectGuess(guess, currentCountry);
    
    if (result.correct) {
      const newGuessedCountries = [...guessedCountries, currentCountry];
      setGuessedCountries(newGuessedCountries);
      
      const updatedPlayers = players.map((p, idx) => 
        idx === currentTurnIndex 
          ? { ...p, score: p.score + result.points, countriesGuessed: [...p.countriesGuessed, currentCountry] }
          : p
      );
      setPlayers(updatedPlayers);
      
      addToast('success', `+${result.points} ${t('points')}`);
    } else {
      addToast('error', `${t('wrongGuess', { player: '' })} - ${currentCountry}`);
    }
    
    setGuessModalOpen(false);
    moveToNextTurn();
  };

  const handleSkip = () => {
    addToast('info', t('turnSkipped'));
    setGuessModalOpen(false);
    moveToNextTurn();
  };

  const handleUseHint = () => {
    if (currentCountry) {
      const updatedPlayers = players.map((p, idx) => 
        idx === currentTurnIndex 
          ? { ...p, score: Math.max(0, p.score - 1) }
          : p
      );
      setPlayers(updatedPlayers);
      addToast('info', t('hintUsed'));
      return currentCountry[0];
    }
    return '';
  };

  const handleLeave = async () => {
    await leaveSession();
    navigate('/');
  };

  const handleEndGame = async () => {
    await endGame();
    setShowResults(true);
  };

  const handlePlayAgain = async () => {
    setShowResults(false);
    setGuessedCountries([]);
    setCurrentCountry(null);
    await leaveSession();
    navigate('/');
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Fixed navbar with blur */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-background/80 backdrop-blur-xl border-b border-primary/20 shadow-lg shadow-primary/5' 
          : 'bg-card/50 backdrop-blur-sm border-b border-border'
      }`}>
        <div className="flex items-center justify-between p-3 md:p-4 max-w-7xl mx-auto">
          <Logo size="sm" />
          
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
          {/* Turn indicator - more prominent */}
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
          </div>

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

          {/* Map Container - scrollable/fixed box */}
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
        isOpen={guessModalOpen}
        onClose={() => setGuessModalOpen(false)}
        countryName={currentCountry || ''}
        onSubmit={handleSubmitGuess}
        onSkip={handleSkip}
        onUseHint={handleUseHint}
        turnTimeSeconds={30}
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