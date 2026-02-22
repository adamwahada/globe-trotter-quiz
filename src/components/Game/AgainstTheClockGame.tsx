import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo/Logo';
import { Button } from '@/components/ui/button';
import { WorldMap } from '@/components/Map/WorldMap';
import { LiveLeaderboard } from '@/components/Leaderboard/LiveLeaderboard';
import { validateGuess } from '@/utils/inputValidation';
import { validateGuessServer, saveGameHistoryServer } from '@/services/scoringService';
import { RankingModal } from '@/components/Ranking/RankingModal';
import { GuessModal } from '@/components/Guess/GuessModal';
import { GameResults } from '@/components/Results/GameResults';
import { TimerProgress } from '@/components/Timer/TimerProgress';
import { LastMinuteWarning } from '@/components/Timer/LastMinuteWarning';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { LanguageSwitcher } from '@/components/LanguageSwitcher/LanguageSwitcher';
import { FloatingScore } from '@/components/Score/FloatingScore';
import { ReconnectionBanner } from '@/components/Banner/ReconnectionBanner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame, Player, PlayersMap } from '@/contexts/GameContext';
import { useToastContext } from '@/contexts/ToastContext';
import { useSound } from '@/contexts/SoundContext';
import { useLocalizedCountry } from '@/hooks/useLocalizedCountry';
import { isCorrectGuess as localIsCorrectGuess } from '@/utils/scoring';
import { getCountryFlag, preloadCountryFlag, preloadAllCountryFlags, getFamousPerson } from '@/utils/countryData';
import { hasExtendedHints, getFamousPlayer, getFamousSinger, getCountryCapital, getHintAvailability } from '@/utils/countryHints';
import { GuidedHintType } from '@/components/Guess/GuessModal';
import { playersMapToArray, TURN_TIME_SECONDS } from '@/types/game';
import { Trophy, LogOut, Volume2, VolumeX, Clock, Zap } from 'lucide-react';
import { clearRecoveryData } from '@/services/gameSessionService';
import { supabase } from '@/integrations/supabase/client'; // kept for other uses

interface AgainstTheClockGameProps {
  onShowResults: () => void;
}

export const AgainstTheClockGame: React.FC<AgainstTheClockGameProps> = ({ onShowResults }) => {
  const { t, language } = useLanguage();
  const {
    session,
    currentPlayer,
    leaveSession,
    updateGameState,
    endGame,
    getPlayersArray,
  } = useGame();
  const { addToast } = useToastContext();
  const { playToastSound, toggleSound, soundEnabled } = useSound();
  const navigate = useNavigate();

  const [guessModalOpen, setGuessModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [floatingScore, setFloatingScore] = useState<{ points: number; show: boolean }>({ points: 0, show: false });
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [countrySelectTime, setCountrySelectTime] = useState<number | null>(null);
  const [showLastMinuteWarning, setShowLastMinuteWarning] = useState(false);
  const [remainingGameSeconds, setRemainingGameSeconds] = useState(0);
  const lastMinuteTriggeredRef = useRef(false);
  const historySavedRef = useRef(false);

  // Per-player tracking: each player sees only their own correct/wrong on the map
  const [myCorrectCountries, setMyCorrectCountries] = useState<string[]>([]);
  const [myWrongCountries, setMyWrongCountries] = useState<string[]>([]);

  const players = getPlayersArray ? getPlayersArray() : playersMapToArray(session?.players);
  
  // Per-player guessed countries - only what THIS player has guessed
  const currentPlayerData = currentPlayer?.id ? session?.players[currentPlayer.id] : null;
  const myGuessedCountries = currentPlayerData?.countriesGuessed || [];

  // Handle scroll for navbar blur effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Preload all country flags when game starts
  useEffect(() => {
    if (session?.status === 'playing') {
      preloadAllCountryFlags();
    }
  }, [session?.status]);

  // Track remaining game time and show last minute warning
  useEffect(() => {
    if (!session?.startTime) return;

    const updateRemainingTime = () => {
      const elapsed = Math.floor((Date.now() - session.startTime!) / 1000);
      const remaining = Math.max(0, (session.duration * 60) - elapsed);
      setRemainingGameSeconds(remaining);

      // Show last minute warning once
      if (remaining <= 60 && remaining > 0 && !lastMinuteTriggeredRef.current) {
        lastMinuteTriggeredRef.current = true;
        setShowLastMinuteWarning(true);
        addToast('game', t('lastChance'));
      }
    };

    updateRemainingTime();
    const interval = setInterval(updateRemainingTime, 1000);
    return () => clearInterval(interval);
  }, [session?.startTime, session?.duration, addToast, t, playToastSound]);

  // Get localized country data
  const { getCountryDisplayName, getLocalizedHints } = useLocalizedCountry();

  // Handle country click - player selects a country to guess
  const handleCountryClick = useCallback(async (countryName: string) => {
    if (!currentPlayer || !session) return;

    // Check if country already guessed by THIS player only (independent per-player maps)
    if (myGuessedCountries.includes(countryName)) {
      addToast('info', 'You already guessed this country!');
      return;
    }

    preloadCountryFlag(countryName);
    setSelectedCountry(countryName);
    setCountrySelectTime(Date.now());
    setGuessModalOpen(true);
  }, [currentPlayer, session, myGuessedCountries, addToast, t]);

  // Handle guess submission
  const handleSubmitGuess = useCallback(async (guess: string) => {
    if (!selectedCountry || !currentPlayer || !session) return;

    // Validate guess input
    const validation = validateGuess(guess);
    if (!validation.valid) return;

    // Server-side scoring validation
    const result = await validateGuessServer(guess, selectedCountry, language);

    // Close modal immediately
    setGuessModalOpen(false);

    // Update player's countries guessed list and score
    const playerData = session.players[currentPlayer.id];
    if (!playerData) return;

    const newCountriesGuessed = [...(playerData.countriesGuessed || []), selectedCountry];

    // Update LOCAL per-player correct/wrong tracking for map display
    if (result.correct) {
      setMyCorrectCountries(prev => [...prev, selectedCountry]);
    } else {
      setMyWrongCountries(prev => [...prev, selectedCountry]);
    }

    const updatedPlayers: PlayersMap = {
      ...session.players,
      [currentPlayer.id]: {
        ...playerData,
        score: playerData.score + result.points,
        countriesGuessed: newCountriesGuessed,
        turnsPlayed: (playerData.turnsPlayed || 0) + 1,
      }
    };

    // Only update players in session - no global correct/wrong tracking needed
    await updateGameState({
      players: updatedPlayers,
    });

    setFloatingScore({ points: result.points, show: true });
    setTimeout(() => setFloatingScore({ points: 0, show: false }), 2000);

    if (result.correct) {
      addToast('success', `+${result.points} ${t('points')} - Correct!`);
      playToastSound('success');
    } else {
      addToast('error', t('wrongGuess', { player: '' }));
      playToastSound('error');
    }

    setSelectedCountry(null);
    setCountrySelectTime(null);
  }, [selectedCountry, currentPlayer, session, language, updateGameState, addToast, t, playToastSound]);

  // Handle skip
  const handleSkip = useCallback(async () => {
    if (!selectedCountry || !currentPlayer || !session) return;

    setGuessModalOpen(false);

    const playerData = session.players[currentPlayer.id];
    if (!playerData) return;

    const newCountriesGuessed = [...(playerData.countriesGuessed || []), selectedCountry];
    
    // Track as wrong for this player's map
    setMyWrongCountries(prev => [...prev, selectedCountry]);

    const updatedPlayers: PlayersMap = {
      ...session.players,
      [currentPlayer.id]: {
        ...playerData,
        countriesGuessed: newCountriesGuessed,
        turnsPlayed: (playerData.turnsPlayed || 0) + 1,
      }
    };

    await updateGameState({
      players: updatedPlayers,
    });

    addToast('info', t('countrySkipped'));
    setSelectedCountry(null);
    setCountrySelectTime(null);
  }, [selectedCountry, currentPlayer, session, updateGameState, addToast, t]);

  // Handle timeout (timer expired while guessing)
  const handleGuessTimeout = useCallback(async () => {
    if (!selectedCountry || !currentPlayer || !session) return;

    const playerData = session.players[currentPlayer.id];
    if (!playerData) return;

    const newCountriesGuessed = [...(playerData.countriesGuessed || []), selectedCountry];
    
    // Track as wrong for this player's map
    setMyWrongCountries(prev => [...prev, selectedCountry]);

    const updatedPlayers: PlayersMap = {
      ...session.players,
      [currentPlayer.id]: {
        ...playerData,
        countriesGuessed: newCountriesGuessed,
        turnsPlayed: (playerData.turnsPlayed || 0) + 1,
      }
    };

    await updateGameState({
      players: updatedPlayers,
    });

    addToast('error', t('timeUp'));
    playToastSound('error');
    setGuessModalOpen(false);
    setSelectedCountry(null);
    setCountrySelectTime(null);
  }, [selectedCountry, currentPlayer, session, updateGameState, addToast, t, playToastSound]);

  // Handle hints - async with error handling to prevent point deduction on failure
  const handleUseHint = useCallback(async (type: 'letter' | 'famous' | 'flag'): Promise<string> => {
    if (!selectedCountry || !currentPlayer || !session) return '';

    const playerData = session.players[currentPlayer.id];
    if (!playerData) return '';

    const pointCost = type === 'famous' ? 0.5 : 1;
    const newScore = Math.max(0, playerData.score - pointCost);

    const updatedPlayers: PlayersMap = {
      ...session.players,
      [currentPlayer.id]: {
        ...playerData,
        score: newScore,
      }
    };

    try {
      if (type === 'flag') {
        await updateGameState({ players: updatedPlayers });
        if (countrySelectTime) {
          setCountrySelectTime(countrySelectTime - 10000);
        }
        addToast('info', t('hintUsed') + ' (-1 point, -10 seconds)');
        return getCountryFlag(selectedCountry);
      }

      await updateGameState({ players: updatedPlayers });

      if (type === 'famous') {
        addToast('info', t('hintUsed') + ' (-0.5 point)');
        const localizedHints = getLocalizedHints(selectedCountry);
        return localizedHints.famousPerson || getFamousPerson(selectedCountry) || 'No famous person data found';
      }

      addToast('info', t('hintUsed') + ' (-1 point)');
      const localizedName = getCountryDisplayName(selectedCountry);
      return localizedName[0] || selectedCountry[0] || '';
    } catch (error) {
      console.error('Failed to use hint:', error);
      addToast('error', t('hintFailed') || 'Failed to use hint. Please try again.');
      return '';
    }
  }, [selectedCountry, currentPlayer, session, countrySelectTime, updateGameState, addToast, t, getLocalizedHints, getCountryDisplayName]);

  // Handle guided hints - async with error handling
  const handleUseGuidedHint = useCallback(async (type: GuidedHintType): Promise<{ value: string; timePenalty: number } | null> => {
    if (!selectedCountry || !currentPlayer || !session) return null;

    const playerData = session.players[currentPlayer.id];
    if (!playerData) return null;

    const localizedHints = getLocalizedHints(selectedCountry);
    
    let hintValue: string | null = null;
    let timePenalty = 0;
    let pointCost = 0;

    if (type === 'capital') {
      hintValue = localizedHints.capital || getCountryCapital(selectedCountry);
      timePenalty = 10;
      pointCost = 1;
    } else if (type === 'player') {
      hintValue = localizedHints.famousPlayer || getFamousPlayer(selectedCountry);
      timePenalty = 5;
      pointCost = 1;
    } else if (type === 'singer') {
      hintValue = localizedHints.famousSinger || getFamousSinger(selectedCountry);
      timePenalty = 5;
      pointCost = 1;
    }

    if (!hintValue) return null;

    const newScore = Math.max(0, playerData.score - pointCost);

    const updatedPlayers: PlayersMap = {
      ...session.players,
      [currentPlayer.id]: {
        ...playerData,
        score: newScore,
      }
    };

    try {
      await updateGameState({ players: updatedPlayers });
      if (countrySelectTime) {
        setCountrySelectTime(countrySelectTime - (timePenalty * 1000));
      }

      const costMessage = type === 'capital' 
        ? `(-${timePenalty}s)` 
        : `(-${pointCost}pt, -${timePenalty}s)`;
      addToast('info', `${t('hintUsed')} ${costMessage}`);

      return { value: hintValue, timePenalty };
    } catch (error) {
      console.error('Failed to use guided hint:', error);
      addToast('error', t('hintFailed') || 'Failed to use hint. Please try again.');
      return null;
    }
  }, [selectedCountry, currentPlayer, session, countrySelectTime, updateGameState, addToast, t, getLocalizedHints]);

  const handleLeave = useCallback(async () => {
    // Save partial game history on mid-game leave
    if (session && currentPlayer && session.status === 'playing' && !historySavedRef.current) {
      try {
        historySavedRef.current = true;
        const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
        const totalTurns = currentPlayer.countriesGuessed.length;
        const estimatedCorrect = Math.floor(currentPlayer.score / 2.5);
        const estimatedWrong = Math.max(0, totalTurns - estimatedCorrect);
        const playerRank = sortedPlayers.findIndex(p => p.id === currentPlayer.id) + 1;
        const winnerScore = sortedPlayers[0]?.score || 0;

        await saveGameHistoryServer([{
          user_id: currentPlayer.id,
          session_code: session.code,
          score: currentPlayer.score,
          countries_correct: estimatedCorrect,
          countries_wrong: estimatedWrong,
          total_turns: totalTurns,
          is_winner: currentPlayer.score === winnerScore && winnerScore > 0,
          player_count: players.length,
          game_duration_minutes: session.duration,
          is_solo_mode: false,
          rank: playerRank,
        }]);
      } catch (err) {
        console.error('Error saving mid-game history:', err);
      }
    }
    await leaveSession();
    navigate('/');
  }, [leaveSession, navigate, session, currentPlayer, players]);

  const handleEndGame = useCallback(async () => {
    if (!session) return;

    await endGame();

    // Save current user's game results
    try {
      const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
      const winnerScore = sortedPlayers[0]?.score || 0;
      
      if (currentPlayer && !historySavedRef.current) {
        historySavedRef.current = true;
        const totalTurns = currentPlayer.countriesGuessed.length;
        const estimatedCorrect = Math.floor(currentPlayer.score / 2.5);
        const estimatedWrong = Math.max(0, totalTurns - estimatedCorrect);
        const playerRank = sortedPlayers.findIndex(p => p.id === currentPlayer.id) + 1;
        
        const entries = [{
          user_id: currentPlayer.id,
          session_code: session.code,
          score: currentPlayer.score,
          countries_correct: estimatedCorrect,
          countries_wrong: estimatedWrong,
          total_turns: totalTurns,
          is_winner: currentPlayer.score === winnerScore && winnerScore > 0,
          player_count: players.length,
          game_duration_minutes: session.duration,
          is_solo_mode: false,
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

    onShowResults();
  }, [session, currentPlayer, players, endGame, onShowResults]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Reconnection Banner */}
      <ReconnectionBanner />

      {/* Last Minute Warning */}
      <LastMinuteWarning 
        remainingSeconds={remainingGameSeconds} 
        isVisible={showLastMinuteWarning && remainingGameSeconds <= 60 && remainingGameSeconds > 0} 
      />

      {/* Floating Score Animation */}
      {floatingScore.show && (
        <FloatingScore points={floatingScore.points} />
      )}

      {/* Header */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? 'bg-background/80 backdrop-blur-xl border-b border-warning/20 shadow-lg shadow-warning/5'
        : 'bg-card/50 backdrop-blur-sm border-b border-border'
        }`}>
        <div className="flex items-center justify-between p-3 md:p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <span className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-warning/20 text-warning text-sm font-medium">
              <Zap className="h-4 w-4" />
              {t('raceMode')}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />

            {/* Global Game Timer */}
            <div className="hidden md:block w-48">
              <TimerProgress
                totalSeconds={session.duration * 60}
                startTime={session.startTime || undefined}
                onComplete={handleEndGame}
                label={t('globalTimeRemaining')}
              />
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

      {/* Mobile Timer */}
      <div className="md:hidden p-3 border-b border-border">
        <TimerProgress
          totalSeconds={session.duration * 60}
          startTime={session.startTime || undefined}
          onComplete={handleEndGame}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4 max-w-7xl mx-auto w-full">
        {/* Left side - Live Leaderboard */}
        <div className="lg:w-80 flex flex-col gap-4 shrink-0">
          {/* Instructions Card */}
          <div className="rounded-xl p-4 border-2 border-warning/30 bg-warning/5">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-warning" />
              <h3 className="font-display text-lg text-warning">{t('againstTheClockMode')}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('clickAnyCountry')}
            </p>
          </div>

          {/* Live Leaderboard */}
          <LiveLeaderboard
            players={players}
            currentPlayerId={currentPlayer?.id}
          />
        </div>

        {/* Map Area - Uses per-player tracking */}
        <div className="flex-1 min-h-[500px] lg:min-h-[700px]">
          <WorldMap
            guessedCountries={myGuessedCountries}
            correctCountries={myCorrectCountries}
            wrongCountries={myWrongCountries}
            currentCountry={selectedCountry || undefined}
            onCountryClick={handleCountryClick}
            disabled={false}
            isSoloMode={true} // Enable clicking on any country
          />
        </div>
      </div>

      {/* Guess Modal */}
      <GuessModal
        isOpen={guessModalOpen}
        onClose={() => {
          setGuessModalOpen(false);
          setSelectedCountry(null);
          setCountrySelectTime(null);
        }}
        onSubmit={handleSubmitGuess}
        onSkip={handleSkip}
        onUseHint={handleUseHint}
        onUseGuidedHint={handleUseGuidedHint}
        turnTimeSeconds={TURN_TIME_SECONDS}
        turnStartTime={countrySelectTime || undefined}
        playerScore={currentPlayer?.score || 0}
        hasExtendedHints={hasExtendedHints(selectedCountry || '')}
        hintAvailability={getHintAvailability(selectedCountry || '')}
        isSoloClickMode={true}
        enableWarningSound={false}
      />

      {/* Ranking Modal */}
      <RankingModal
        isOpen={showRankingModal}
        onClose={() => setShowRankingModal(false)}
        players={players}
        currentPlayerId={currentPlayer?.id}
        correctCountries={myCorrectCountries}
        wrongCountries={myWrongCountries}
      />
    </div>
  );
};
