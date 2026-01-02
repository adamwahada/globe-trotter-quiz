import React, { useState, useEffect } from 'react';
import { X, Lightbulb, User, Send, SkipForward, Flag, MapPin, Music, Dribbble, Building } from 'lucide-react';
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
  usedHints?: { // New prop for persistence
    letter?: string;
    famous?: string;
    flag?: string;
    player?: string;
    singer?: string;
    capital?: string;
  };
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
  usedHints: usedHintsProp = {}, // Renamed prop to usedHintsProp
}) => {
  const { t } = useLanguage();
  // State derived from props to manage UI
  const [guess, setGuess] = useState('');
  const [showGuidedMenu, setShowGuidedMenu] = useState(false);

  // Hints state from props (or empty default)
  // const usedHints = usedHintsProp || {}; // This line is removed as usedHintsProp is already defaulted

  // Local state for immediate feedback (optimistic UI)
  const [localFirstLetter, setLocalFirstLetter] = useState('');
  const [localFamousPerson, setLocalFamousPerson] = useState('');
  const [localCountryFlag, setLocalCountryFlag] = useState('');

  // Derived state (combines props and local state)
  const hintUsed = !!usedHintsProp.letter || !!localFirstLetter;
  const famousPersonUsed = !!usedHintsProp.famous || !!localFamousPerson;
  const flagUsed = !!usedHintsProp.flag || !!localCountryFlag;

  const playerHint = usedHintsProp.player || '';
  const singerHint = usedHintsProp.singer || '';
  const capitalHint = usedHintsProp.capital || '';

  const firstLetter = usedHintsProp.letter || localFirstLetter;
  const famousPerson = usedHintsProp.famous || localFamousPerson;
  const countryFlag = usedHintsProp.flag || localCountryFlag;

  // Calculate total hints used, considering both persisted and locally revealed hints
  const totalHintsUsed = Object.keys(usedHintsProp).length +
    (localFirstLetter && !usedHintsProp.letter ? 1 : 0) +
    (localFamousPerson && !usedHintsProp.famous ? 1 : 0) +
    (localCountryFlag && !usedHintsProp.flag ? 1 : 0);

  // Local timer for solo click mode
  const [localStartTime, setLocalStartTime] = useState<number | null>(null);

  // Image error state
  const [imageError, setImageError] = useState(false);

  // Maintain local time penalty state for smoother UI updates if needed
  const timePenaltyApplied = 0;

  // Reset guess when modal opens
  useEffect(() => {
    if (isOpen) {
      setGuess('');
      setShowGuidedMenu(false);
      setImageError(false);
      setLocalFirstLetter('');
      setLocalFamousPerson('');
      setLocalCountryFlag('');

      // Set local start time for solo click mode (when no turnStartTime is provided)
      if (isSoloClickMode && !turnStartTime) {
        setLocalStartTime(Date.now());
      } else {
        setLocalStartTime(null);
      }
    }
  }, [isOpen, isSoloClickMode, turnStartTime]);

  if (!isOpen) return null;

  // Check if max hints reached (2 total per round)
  const maxHintsReached = totalHintsUsed >= MAX_TOTAL_HINTS;

  // Check if a specific hint can be used
  const canUseHint = (type: 'letter' | 'famous' | 'flag' | GuidedHintType): boolean => {
    // If already used, return false
    if (type === 'letter' && hintUsed) return false;
    if (type === 'famous' && famousPersonUsed) return false;
    if (type === 'flag' && flagUsed) return false;
    if (type === 'player' && playerHint) return false;
    if (type === 'singer' && singerHint) return false;
    if (type === 'capital' && capitalHint) return false;

    if (maxHintsReached) return false;

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
    const res = onUseHint('letter');
    if (res) setLocalFirstLetter(res);
  };

  const handleFamousPerson = () => {
    if (!canUseHint('famous')) return;
    const res = onUseHint('famous');
    if (res) setLocalFamousPerson(res);
  };

  const handleFlag = () => {
    if (!canUseHint('flag')) return;
    const res = onUseHint('flag');
    if (res) setLocalCountryFlag(res);
  };

  const handleGuidedHint = (type: GuidedHintType) => {
    if (!onUseGuidedHint || !canUseHint(type)) return;
    onUseGuidedHint(type);
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

  // Calculate adjusted time for timer
  const adjustedTurnTime = turnTimeSeconds - timePenaltyApplied;

  // Use local start time for solo click mode if no turnStartTime provided
  const effectiveStartTime = isSoloClickMode && localStartTime ? localStartTime : turnStartTime;

  // Adjust local start time when time penalty is applied
  const adjustedStartTime = effectiveStartTime
    ? effectiveStartTime - (timePenaltyApplied * 1000)
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
              <div className="bg-muted/30 border border-border rounded-xl p-6 text-center animate-fade-in shadow-inner">
                {countryFlag.startsWith('http') && !imageError ? (
                  <div className="relative group">
                    <img
                      src={countryFlag}
                      alt="Country flag"
                      className="w-48 h-auto mx-auto rounded-md shadow-2xl border-4 border-white/10 transition-transform duration-300 group-hover:scale-105"
                      onError={() => setImageError(true)}
                    />
                    <div className="absolute inset-0 rounded-md shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] pointer-events-none" />
                  </div>
                ) : (
                  <div
                    className="text-7xl drop-shadow-lg"
                    aria-label="Country flag"
                    role="img"
                  >
                    {imageError ? '🏳️' : countryFlag}
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

              {/* Guided Hints Button - Only show if country has extended hints */}
              {hasExtendedHints && (
                <div className="relative">
                  <GameTooltip content={maxHintsReached ? t('maxHintsReached') : t('tooltipGuidedHints')} position="top">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowGuidedMenu(!showGuidedMenu)}
                      disabled={maxHintsReached}
                      className={`h-12 w-12 ${maxHintsReached ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-500/10 hover:border-purple-500'}`}
                    >
                      <MapPin className="h-5 w-5 text-purple-400" />
                    </Button>
                  </GameTooltip>

                  {/* Guided hints dropdown */}
                  {showGuidedMenu && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-card border border-border rounded-lg shadow-xl p-2 min-w-48 z-20 animate-fade-in">
                      <p className="text-xs text-muted-foreground mb-2 px-2">
                        {t('hintsRemaining')}: {MAX_TOTAL_HINTS - totalHintsUsed}
                      </p>

                      <button
                        onClick={() => handleGuidedHint('capital')}
                        disabled={!canUseHint('capital')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${canUseHint('capital')
                          ? 'hover:bg-purple-500/20 text-foreground'
                          : 'opacity-50 cursor-not-allowed text-muted-foreground'
                          }`}
                      >
                        <Building className="h-4 w-4 text-purple-400" />
                        <span>{t('hintCapital')}</span>
                        <span className="ml-auto text-xs text-muted-foreground">-1pt -10s</span>
                      </button>

                      <button
                        onClick={() => handleGuidedHint('player')}
                        disabled={!canUseHint('player')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${canUseHint('player')
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
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${canUseHint('singer')
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
