import React, { useState, useEffect } from 'react';
import { X, Lightbulb, User, Send, SkipForward, Flag, Music, Dribbble, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { TimerProgress } from '@/components/Timer/TimerProgress';

// Hint costs
const HINT_COST_LETTER = 1;
const HINT_COST_FAMOUS = 0.5;
const HINT_COST_FLAG = 1;
const HINT_COST_GUIDED = 1; // Player or Singer hint
const HINT_COST_CAPITAL = 1; // Capital costs 1 point + time
const GUIDED_TIME_PENALTY = 5; // seconds
const CAPITAL_TIME_PENALTY = 10; // seconds
const MAX_TOTAL_HINTS = 2; // Maximum total hints per round (across ALL hint types)

export type GuidedHintType = 'player' | 'singer' | 'capital';

interface GuessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (guess: string) => void;
  onSkip: () => void;
  onUseHint: (type: 'letter' | 'famous' | 'flag') => string;
  onUseGuidedHint?: (type: GuidedHintType) => { value: string; timePenalty: number } | null;
  turnTimeSeconds?: number;
  turnStartTime?: number;
  playerScore?: number;
  hasExtendedHints?: boolean;
  isSoloClickMode?: boolean; // For solo mode without dice roll
}

export const GuessModal: React.FC<GuessModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSkip,
  onUseHint,
  onUseGuidedHint,
  turnTimeSeconds = 35,
  turnStartTime,
  playerScore = 0,
  hasExtendedHints = false,
  isSoloClickMode = false,
}) => {
  const { t } = useLanguage();
  const [guess, setGuess] = useState('');
  const [hintUsed, setHintUsed] = useState(false);
  const [famousPersonUsed, setFamousPersonUsed] = useState(false);
  const [flagUsed, setFlagUsed] = useState(false);
  const [firstLetter, setFirstLetter] = useState('');
  const [famousPerson, setFamousPerson] = useState('');
  const [countryFlag, setCountryFlag] = useState('');
  
  // Guided hints state
  const [playerHint, setPlayerHint] = useState('');
  const [singerHint, setSingerHint] = useState('');
  const [capitalHint, setCapitalHint] = useState('');
  const [timePenaltyApplied, setTimePenaltyApplied] = useState(0);
  const [showGuidedMenu, setShowGuidedMenu] = useState(false);
  
  // Track total hints used across ALL types (max 2 per round)
  const [totalHintsUsed, setTotalHintsUsed] = useState(0);
  
  // Track if we've initialized for this turn (to prevent re-init on modal reopen)
  const [lastTurnStartTime, setLastTurnStartTime] = useState<number | undefined>(undefined);

  // Reset state only when a NEW turn starts (turnStartTime changes), not when modal reopens
  useEffect(() => {
    if (isOpen && turnStartTime !== lastTurnStartTime) {
      // New turn - reset everything
      setGuess('');
      setHintUsed(false);
      setFamousPersonUsed(false);
      setFlagUsed(false);
      setFirstLetter('');
      setFamousPerson('');
      setCountryFlag('');
      setTotalHintsUsed(0);
      setPlayerHint('');
      setSingerHint('');
      setCapitalHint('');
      setTimePenaltyApplied(0);
      setShowGuidedMenu(false);
      setLastTurnStartTime(turnStartTime);
    } else if (isOpen) {
      // Just reopening same turn - only reset the guess input
      setGuess('');
      setShowGuidedMenu(false);
    }
  }, [isOpen, turnStartTime, lastTurnStartTime]);

  if (!isOpen) return null;

  // Check if max hints reached (2 total per round)
  const maxHintsReached = totalHintsUsed >= MAX_TOTAL_HINTS;

  // Check if a specific hint can be used
  const canUseHint = (type: 'letter' | 'famous' | 'flag' | GuidedHintType): boolean => {
    if (maxHintsReached) return false;
    
    // Check if already used
    if (type === 'letter' && hintUsed) return false;
    if (type === 'famous' && famousPersonUsed) return false;
    if (type === 'flag' && flagUsed) return false;
    if (type === 'player' && playerHint) return false;
    if (type === 'singer' && singerHint) return false;
    if (type === 'capital' && capitalHint) return false;
    
    // Check cost
    let cost = 0;
    if (type === 'letter') cost = HINT_COST_LETTER;
    else if (type === 'famous') cost = HINT_COST_FAMOUS;
    else if (type === 'flag') cost = HINT_COST_FLAG;
    else if (type === 'capital') cost = HINT_COST_CAPITAL;
    else cost = HINT_COST_GUIDED;
    
    return playerScore >= cost;
  };

  const handleHint = () => {
    if (!canUseHint('letter')) return;
    const letter = onUseHint('letter');
    setFirstLetter(letter);
    setHintUsed(true);
    setTotalHintsUsed(prev => prev + 1);
  };

  const handleFamousPerson = () => {
    if (!canUseHint('famous')) return;
    const name = onUseHint('famous');
    setFamousPersonUsed(true);
    setFamousPerson(name);
    setTotalHintsUsed(prev => prev + 1);
  };

  const handleFlag = () => {
    if (!canUseHint('flag')) return;
    const flag = onUseHint('flag');
    setFlagUsed(true);
    setCountryFlag(flag);
    setTotalHintsUsed(prev => prev + 1);
  };

  const handleGuidedHint = (type: GuidedHintType) => {
    if (!onUseGuidedHint || !canUseHint(type)) return;

    const result = onUseGuidedHint(type);
    if (result) {
      setTotalHintsUsed(prev => prev + 1);
      setTimePenaltyApplied(prev => prev + result.timePenalty);
      
      if (type === 'player') {
        setPlayerHint(result.value);
      } else if (type === 'singer') {
        setSingerHint(result.value);
      } else if (type === 'capital') {
        setCapitalHint(result.value);
      }
    }
    setShowGuidedMenu(false);
  };

  const handleSubmit = () => {
    if (guess.trim()) {
      onSubmit(guess.trim());
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  // Calculate adjusted time for timer - turnStartTime is now always provided by GamePage
  const adjustedTurnTime = turnTimeSeconds - timePenaltyApplied;
  
  // Adjust start time when time penalty is applied
  const adjustedStartTime = turnStartTime 
    ? turnStartTime - (timePenaltyApplied * 1000) 
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        <div className="p-6">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2.5 rounded-full bg-secondary border border-border hover:bg-destructive hover:text-white hover:border-destructive transition-all duration-200 z-10 shadow-lg"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Timer */}
          <div className="mb-6">
            <TimerProgress
              totalSeconds={turnTimeSeconds}
              startTime={adjustedStartTime}
              onComplete={handleSkip}
              label={t('timeLeft')}
              enableWarningSound={true}
              isActive={isOpen}
            />
          </div>

          <h2 className="text-3xl font-display text-foreground text-center mb-2">
            {t('guessCountry')}
          </h2>

          <p className="text-sm text-muted-foreground text-center mb-6">
            What is the name of the highlighted country?
          </p>

          {/* Scoring info */}
          <div className="bg-secondary/50 rounded-lg p-3 mb-6 text-center">
            <p className="text-xs text-muted-foreground">
              <span className="text-success font-semibold">+3</span> correct •
              <span className="text-warning font-semibold ml-2">+2</span> close •
              <span className="text-destructive font-semibold ml-2">0</span> wrong/skip
            </p>
          </div>

          {/* Hints display */}
          <div className="space-y-3 mb-6">
            {firstLetter && (
              <div className="bg-info/20 border border-info/30 rounded-lg p-3 text-center animate-fade-in">
                <p className="text-sm text-info">
                  {t('revealLetter')}: <span className="font-bold text-xl">{firstLetter}</span>
                </p>
              </div>
            )}

            {famousPerson && (
              <div className="bg-primary/20 border border-primary/30 rounded-lg p-3 text-center animate-fade-in">
                <p className="text-sm text-primary">
                  🎭 {famousPerson}
                </p>
              </div>
            )}

            {countryFlag && (
              <div className="bg-warning/20 border border-warning/30 rounded-lg p-4 text-center animate-fade-in">
                {countryFlag.startsWith('http') ? (
                  <img
                    src={countryFlag}
                    alt="Country flag"
                    className="w-32 h-auto mx-auto rounded shadow-lg"
                    onError={() => setCountryFlag('🏳️')}
                  />
                ) : (
                  <div
                    className="text-6xl leading-none"
                    aria-label="Country flag"
                    role="img"
                  >
                    {countryFlag}
                  </div>
                )}
              </div>
            )}

            {/* Guided hints display */}
            {capitalHint && (
              <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3 text-center animate-fade-in">
                <p className="text-sm text-purple-400">
                  🏛️ {t('capital')}: <span className="font-bold">{capitalHint}</span>
                </p>
              </div>
            )}

            {playerHint && (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-center animate-fade-in">
                <p className="text-sm text-green-400">
                  ⚽ {t('famousPlayer')}: <span className="font-bold">{playerHint}</span>
                </p>
              </div>
            )}

            {singerHint && (
              <div className="bg-pink-500/20 border border-pink-500/30 rounded-lg p-3 text-center animate-fade-in">
                <p className="text-sm text-pink-400">
                  🎤 {t('famousSinger')}: <span className="font-bold">{singerHint}</span>
                </p>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="space-y-4">
            <input
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder={t('enterGuess')}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-4 bg-secondary border border-border rounded-lg text-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
              autoFocus
            />

            {/* Hints remaining indicator */}
            {totalHintsUsed > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                {t('hintsRemaining')}: {MAX_TOTAL_HINTS - totalHintsUsed}/{MAX_TOTAL_HINTS}
              </p>
            )}

            {/* Hint buttons - compact icons with tooltips */}
            <div className="flex justify-center gap-3 flex-wrap">
              <GameTooltip content={maxHintsReached ? t('maxHintsReached') : (!canUseHint('letter') ? t('notEnoughPoints') : t('tooltipHint'))} position="top">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleHint}
                  disabled={!canUseHint('letter')}
                  className={`h-12 w-12 ${hintUsed ? 'bg-warning/20 border-warning' : !canUseHint('letter') ? 'opacity-50 cursor-not-allowed' : 'hover:bg-warning/10 hover:border-warning'}`}
                >
                  {hintUsed ? (
                    <span className="text-warning font-bold">✓</span>
                  ) : (
                    <Lightbulb className="h-5 w-5 text-warning" />
                  )}
                </Button>
              </GameTooltip>

              <GameTooltip content={maxHintsReached ? t('maxHintsReached') : (!canUseHint('flag') ? t('notEnoughPoints') : t('tooltipFlag'))} position="top">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleFlag}
                  disabled={!canUseHint('flag')}
                  className={`h-12 w-12 ${flagUsed ? 'bg-destructive/20 border-destructive' : !canUseHint('flag') ? 'opacity-50 cursor-not-allowed' : 'hover:bg-destructive/10 hover:border-destructive'}`}
                >
                  {flagUsed ? (
                    <span className="text-destructive font-bold">✓</span>
                  ) : (
                    <Flag className="h-5 w-5 text-destructive" />
                  )}
                </Button>
              </GameTooltip>

              {/* Capital hint - standalone button (available for countries with extended hints) */}
              {hasExtendedHints && (
                <GameTooltip content={maxHintsReached ? t('maxHintsReached') : (!canUseHint('capital') ? t('notEnoughPoints') : `${t('hintCapital')} (-1pt -10s)`)} position="top">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleGuidedHint('capital')}
                    disabled={!canUseHint('capital')}
                    className={`h-12 w-12 ${capitalHint ? 'bg-purple-500/20 border-purple-500' : !canUseHint('capital') ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-500/10 hover:border-purple-500'}`}
                  >
                    {capitalHint ? (
                      <span className="text-purple-400 font-bold">✓</span>
                    ) : (
                      <Building className="h-5 w-5 text-purple-400" />
                    )}
                  </Button>
                </GameTooltip>
              )}

              {/* Famous Persons Menu - Only show if country has extended hints */}
              {hasExtendedHints && (
                <div className="relative">
                  <GameTooltip content={maxHintsReached ? t('maxHintsReached') : t('tooltipGuidedHints')} position="top">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowGuidedMenu(!showGuidedMenu)}
                      disabled={maxHintsReached}
                      className={`h-12 w-12 ${maxHintsReached ? 'opacity-50 cursor-not-allowed' : 'hover:bg-info/10 hover:border-info'}`}
                    >
                      <User className="h-5 w-5 text-info" />
                    </Button>
                  </GameTooltip>

                  {/* Famous persons dropdown */}
                  {showGuidedMenu && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-card border border-border rounded-lg shadow-xl p-2 min-w-52 z-20 animate-fade-in">
                      <p className="text-xs text-muted-foreground mb-2 px-2">
                        {t('chooseFamousPerson')} ({t('hintsRemaining')}: {MAX_TOTAL_HINTS - totalHintsUsed})
                      </p>
                      
                      <button
                        onClick={handleFamousPerson}
                        disabled={!canUseHint('famous')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          canUseHint('famous') 
                            ? 'hover:bg-info/20 text-foreground' 
                            : 'opacity-50 cursor-not-allowed text-muted-foreground'
                        }`}
                      >
                        <User className="h-4 w-4 text-info" />
                        <span>{t('famousPerson')}</span>
                        <span className="ml-auto text-xs text-muted-foreground">-0.5pt</span>
                      </button>

                      <button
                        onClick={() => handleGuidedHint('player')}
                        disabled={!canUseHint('player')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          canUseHint('player') 
                            ? 'hover:bg-green-500/20 text-foreground' 
                            : 'opacity-50 cursor-not-allowed text-muted-foreground'
                        }`}
                      >
                        <Dribbble className="h-4 w-4 text-green-400" />
                        <span>{t('hintPlayer')}</span>
                        <span className="ml-auto text-xs text-muted-foreground">-1pt -5s</span>
                      </button>

                      <button
                        onClick={() => handleGuidedHint('singer')}
                        disabled={!canUseHint('singer')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          canUseHint('singer') 
                            ? 'hover:bg-pink-500/20 text-foreground' 
                            : 'opacity-50 cursor-not-allowed text-muted-foreground'
                        }`}
                      >
                        <Music className="h-4 w-4 text-pink-400" />
                        <span>{t('hintSinger')}</span>
                        <span className="ml-auto text-xs text-muted-foreground">-1pt -5s</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Simple Famous Person hint for countries without extended hints */}
              {!hasExtendedHints && (
                <GameTooltip content={maxHintsReached ? t('maxHintsReached') : (!canUseHint('famous') ? t('notEnoughPoints') : t('tooltipFamousPerson'))} position="top">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleFamousPerson}
                    disabled={!canUseHint('famous')}
                    className={`h-12 w-12 ${famousPersonUsed ? 'bg-info/20 border-info' : !canUseHint('famous') ? 'opacity-50 cursor-not-allowed' : 'hover:bg-info/10 hover:border-info'}`}
                  >
                    {famousPersonUsed ? (
                      <span className="text-info font-bold">✓</span>
                    ) : (
                      <User className="h-5 w-5 text-info" />
                    )}
                  </Button>
                </GameTooltip>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <GameTooltip content={t('tooltipSkip')} position="top">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1 gap-2"
                >
                  <SkipForward className="h-4 w-4" />
                  {t('skip')}
                </Button>
              </GameTooltip>

              <GameTooltip content={t('tooltipSubmit')} position="top">
                <Button
                  variant="netflix"
                  onClick={handleSubmit}
                  disabled={!guess.trim()}
                  className="flex-1 gap-2"
                >
                  <Send className="h-4 w-4" />
                  {t('submit')}
                </Button>
              </GameTooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
