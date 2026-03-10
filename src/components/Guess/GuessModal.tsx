import React, { useState, useEffect } from 'react';
import { X, Lightbulb, User, Send, SkipForward, Flag, Music, Dribbble, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { TimerProgress } from '@/components/Timer/TimerProgress';
import type { HintAvailability } from '@/utils/countryHints';
import { validateGuess, MAX_GUESS_LENGTH } from '@/utils/inputValidation';

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
  onUseHint: (type: 'letter' | 'famous' | 'flag') => string | Promise<string>;
  onUseGuidedHint?: (type: GuidedHintType) => { value: string; timePenalty: number } | null | Promise<{ value: string; timePenalty: number } | null>;
  turnTimeSeconds?: number;
  turnStartTime?: number;
  playerScore?: number;
  hasExtendedHints?: boolean;
  hintAvailability?: HintAvailability;
  isSoloClickMode?: boolean; // For solo mode without dice roll
  enableWarningSound?: boolean; // Enable/disable timer warning sounds
  // Card effects
  extraHints?: number; // Extra hints from cards (e.g., Extra Hint card)
  hintsBlocked?: boolean; // Whether hints are blocked by a card (e.g., Hint Block card)
}

const defaultHintAvailability: HintAvailability = {
  hasFlag: true,
  hasCapital: false,
  hasPlayer: false,
  hasSinger: false,
  hasFamousPerson: true,
};

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
  hintAvailability = defaultHintAvailability,
  isSoloClickMode = false,
  enableWarningSound = true,
  extraHints = 0,
  hintsBlocked = false,
}) => {
  const { t } = useLanguage();

  // Calculate effective max hints based on card effects
  const effectiveMaxHints = MAX_TOTAL_HINTS + extraHints;
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
  
  // Track remaining time to disable time-costly hints when time is too low
  const [remainingSeconds, setRemainingSeconds] = useState(turnTimeSeconds);
  
  // Buffer seconds - hints are disabled when remaining time < penalty + buffer
  const TIME_BUFFER = 5;

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
      setRemainingSeconds(turnTimeSeconds);
    } else if (isOpen) {
      // Just reopening same turn - only reset the guess input
      setGuess('');
      setShowGuidedMenu(false);
    }
  }, [isOpen, turnStartTime, lastTurnStartTime, turnTimeSeconds]);

  // Track remaining time to disable time-costly hints
  useEffect(() => {
    if (!isOpen || !turnStartTime) return;
    
    const calculateRemaining = () => {
      const adjustedStart = turnStartTime - (timePenaltyApplied * 1000);
      const elapsed = Math.floor((Date.now() - adjustedStart) / 1000);
      return Math.max(0, turnTimeSeconds - elapsed);
    };
    
    // Initial calculation
    setRemainingSeconds(calculateRemaining());
    
    // Update every second
    const interval = setInterval(() => {
      setRemainingSeconds(calculateRemaining());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isOpen, turnStartTime, turnTimeSeconds, timePenaltyApplied]);

  if (!isOpen) return null;

  // Check if max hints reached (2 + extra hints from cards total per round)
  const maxHintsReached = totalHintsUsed >= effectiveMaxHints;

  // Check if hints are blocked by card effect
  const hintsAreBlocked = hintsBlocked;

  // Check if a specific hint can be used
  const canUseHint = (type: 'letter' | 'famous' | 'flag' | GuidedHintType): boolean => {
    // Hints blocked by card effect
    if (hintsAreBlocked) return false;
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
    
    if (playerScore < cost) return false;
    
    // Check time constraints for time-costly hints
    // Disable hint if remaining time < time_penalty + buffer
    if (type === 'capital' && remainingSeconds <= CAPITAL_TIME_PENALTY + TIME_BUFFER) {
      return false;
    }
    if ((type === 'player' || type === 'singer') && remainingSeconds <= GUIDED_TIME_PENALTY + TIME_BUFFER) {
      return false;
    }
    
    return true;
  };
  
  // Check if hint is disabled due to time constraint (for tooltip messages)
  const isTimeConstrained = (type: GuidedHintType): boolean => {
    if (type === 'capital') {
      return remainingSeconds <= CAPITAL_TIME_PENALTY + TIME_BUFFER;
    }
    if (type === 'player' || type === 'singer') {
      return remainingSeconds <= GUIDED_TIME_PENALTY + TIME_BUFFER;
    }
    return false;
  };

  // Get the appropriate tooltip message for a hint type
  const getHintTooltip = (type: 'letter' | 'famous' | 'flag' | GuidedHintType, defaultText: string): string => {
    // Check if already used
    if (type === 'letter' && hintUsed) return t('alreadyUsed');
    if (type === 'famous' && famousPersonUsed) return t('alreadyUsed');
    if (type === 'flag' && flagUsed) return t('alreadyUsed');
    if (type === 'player' && playerHint) return t('alreadyUsed');
    if (type === 'singer' && singerHint) return t('alreadyUsed');
    if (type === 'capital' && capitalHint) return t('alreadyUsed');
    
    // Check max hints
    if (maxHintsReached) return t('maxHintsReached');
    
    // Check time constraint for time-costly hints
    if ((type === 'capital' || type === 'player' || type === 'singer') && isTimeConstrained(type as GuidedHintType)) {
      return t('notEnoughTime');
    }
    
    // Check points
    if (!canUseHint(type)) return t('notEnoughPoints');
    
    return defaultText;
  };

  const handleHint = async () => {
    if (!canUseHint('letter')) return;
    const result = onUseHint('letter');
    const letter = result instanceof Promise ? await result : result;
    if (letter) {
      setFirstLetter(letter);
      setHintUsed(true);
      setTotalHintsUsed(prev => prev + 1);
    }
  };

  const handleFamousPerson = async () => {
    if (!canUseHint('famous')) return;
    const result = onUseHint('famous');
    const name = result instanceof Promise ? await result : result;
    if (name) {
      setFamousPersonUsed(true);
      setFamousPerson(name);
      setTotalHintsUsed(prev => prev + 1);
    }
  };

  const handleFlag = async () => {
    if (!canUseHint('flag')) return;
    const result = onUseHint('flag');
    const flag = result instanceof Promise ? await result : result;
    if (flag) {
      setFlagUsed(true);
      setCountryFlag(flag);
      setTotalHintsUsed(prev => prev + 1);
    }
  };

  const handleGuidedHint = async (type: GuidedHintType) => {
    if (!onUseGuidedHint || !canUseHint(type)) return;

    const resultOrPromise = onUseGuidedHint(type);
    const result = resultOrPromise instanceof Promise ? await resultOrPromise : resultOrPromise;
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
    const trimmed = guess.trim();
    const validation = validateGuess(trimmed);
    if (validation.valid) {
      onSubmit(trimmed);
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-16">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="p-6 sm:p-8">
          {/* Timer - full width at top */}
          <div className="mb-6 pr-12">
            <TimerProgress
              totalSeconds={turnTimeSeconds}
              startTime={adjustedStartTime}
              onComplete={handleSkip}
              label={t('timeLeft')}
              enableWarningSound={enableWarningSound}
              isActive={isOpen}
            />
          </div>

          {/* Close button - positioned after timer so it doesn't overlap */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-secondary border border-border hover:bg-destructive hover:text-white hover:border-destructive transition-all duration-200 z-10 shadow-lg"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="text-3xl font-display text-foreground text-center mb-2">
            {t('guessCountry')}
          </h2>

          <p className="text-sm text-muted-foreground text-center mb-6">
            {t('guessModalQuestion')}
          </p>

          {/* Scoring info */}
          <div className="bg-secondary/50 rounded-lg p-3 mb-6 text-center">
            <p className="text-xs text-muted-foreground">
              <span className="text-success font-semibold">{t('scoringCorrect')}</span> {t('scoringLabelCorrect')} •
              <span className="text-warning font-semibold ml-2">{t('scoringClose')}</span> {t('scoringLabelClose')} •
              <span className="text-destructive font-semibold ml-2">{t('scoringWrongSkip')}</span> {t('scoringLabelWrongSkip')}
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
              onChange={(e) => setGuess(e.target.value.slice(0, MAX_GUESS_LENGTH))}
              placeholder={t('enterGuess')}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              maxLength={MAX_GUESS_LENGTH}
              className="w-full px-4 py-4 bg-secondary border border-border rounded-lg text-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
              autoFocus
            />

            {/* Hints remaining indicator */}
            {totalHintsUsed > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                {t('hintsRemaining')}: {effectiveMaxHints - totalHintsUsed}/{effectiveMaxHints}
              </p>
            )}

            {/* Hint buttons - compact icons with tooltips */}
            <div className="flex justify-center gap-3 flex-wrap">
              {/* First letter hint - always available */}
              <GameTooltip content={hintUsed ? t('alreadyUsed') : (maxHintsReached ? t('maxHintsReached') : (!canUseHint('letter') ? t('notEnoughPoints') : t('tooltipHint')))} position="top">
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

              {/* Flag hint - only show if flag data available */}
              {hintAvailability.hasFlag && (
                <GameTooltip content={flagUsed ? t('alreadyUsed') : (maxHintsReached ? t('maxHintsReached') : (!canUseHint('flag') ? t('notEnoughPoints') : t('tooltipFlag')))} position="top">
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
              )}

              {/* Capital hint - only show if capital data available */}
              {hasExtendedHints && hintAvailability.hasCapital && (
                <GameTooltip content={getHintTooltip('capital', `${t('hintCapital')} (-1pt -10s)`)} position="top">
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

              {/* Famous Persons Menu - Only show if at least one option is available */}
              {(hintAvailability.hasFamousPerson || hintAvailability.hasPlayer || hintAvailability.hasSinger) && (
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
                      
                      {/* Famous person hint - only show if data available */}
                      {hintAvailability.hasFamousPerson && (
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
                      )}

                      {/* Famous player hint - only show if data available */}
                      {hintAvailability.hasPlayer && (
                        <button
                          onClick={() => handleGuidedHint('player')}
                          disabled={!canUseHint('player')}
                          title={!canUseHint('player') ? (isTimeConstrained('player') ? t('notEnoughTime') : (playerHint ? t('alreadyUsed') : t('notEnoughPoints'))) : ''}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            canUseHint('player') 
                              ? 'hover:bg-green-500/20 text-foreground' 
                              : 'opacity-50 cursor-not-allowed text-muted-foreground'
                          }`}
                        >
                          <Dribbble className="h-4 w-4 text-green-400" />
                          <span>{t('hintPlayer')}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {isTimeConstrained('player') ? t('notEnoughTime') : '-1pt -5s'}
                          </span>
                        </button>
                      )}

                      {/* Famous singer hint - only show if data available */}
                      {hintAvailability.hasSinger && (
                        <button
                          onClick={() => handleGuidedHint('singer')}
                          disabled={!canUseHint('singer')}
                          title={!canUseHint('singer') ? (isTimeConstrained('singer') ? t('notEnoughTime') : (singerHint ? t('alreadyUsed') : t('notEnoughPoints'))) : ''}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            canUseHint('singer') 
                              ? 'hover:bg-pink-500/20 text-foreground' 
                              : 'opacity-50 cursor-not-allowed text-muted-foreground'
                          }`}
                        >
                          <Music className="h-4 w-4 text-pink-400" />
                          <span>{t('hintSinger')}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {isTimeConstrained('singer') ? t('notEnoughTime') : '-1pt -5s'}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Simple Famous Person hint for countries without extended hints */}
              {!hasExtendedHints && (
                <GameTooltip content={famousPersonUsed ? t('alreadyUsed') : (maxHintsReached ? t('maxHintsReached') : (!canUseHint('famous') ? t('notEnoughPoints') : t('tooltipFamousPerson')))} position="top">
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
            <div className="flex gap-3 pt-2 justify-between">
              <GameTooltip content={t('tooltipSkip')} position="top">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="gap-2"
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
                  className="gap-2"
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
