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
const HINT_COST_CAPITAL = 0; // Capital costs time only
const GUIDED_TIME_PENALTY = 5; // seconds
const CAPITAL_TIME_PENALTY = 10; // seconds
const MAX_GUIDED_HINTS = 2; // Maximum guided hints per round

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
  const [guidedHintsUsed, setGuidedHintsUsed] = useState(0);
  const [playerHint, setPlayerHint] = useState('');
  const [singerHint, setSingerHint] = useState('');
  const [capitalHint, setCapitalHint] = useState('');
  const [timePenaltyApplied, setTimePenaltyApplied] = useState(0);
  const [showGuidedMenu, setShowGuidedMenu] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setGuess('');
      setHintUsed(false);
      setFamousPersonUsed(false);
      setFlagUsed(false);
      setFirstLetter('');
      setFamousPerson('');
      setCountryFlag('');
      setGuidedHintsUsed(0);
      setPlayerHint('');
      setSingerHint('');
      setCapitalHint('');
      setTimePenaltyApplied(0);
      setShowGuidedMenu(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleHint = () => {
    if (!hintUsed) {
      const letter = onUseHint('letter');
      setFirstLetter(letter);
      setHintUsed(true);
    }
  };

  const handleFamousPerson = () => {
    if (!famousPersonUsed) {
      const name = onUseHint('famous');
      setFamousPersonUsed(true);
      setFamousPerson(name);
    }
  };

  const handleFlag = () => {
    if (!flagUsed) {
      const flag = onUseHint('flag');
      setFlagUsed(true);
      setCountryFlag(flag);
    }
  };

  const handleGuidedHint = (type: GuidedHintType) => {
    if (!onUseGuidedHint || guidedHintsUsed >= MAX_GUIDED_HINTS) return;
    
    // Check if this specific hint was already used
    if (type === 'player' && playerHint) return;
    if (type === 'singer' && singerHint) return;
    if (type === 'capital' && capitalHint) return;

    const result = onUseGuidedHint(type);
    if (result) {
      setGuidedHintsUsed(prev => prev + 1);
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

  const canUseGuidedHint = (type: GuidedHintType): boolean => {
    if (guidedHintsUsed >= MAX_GUIDED_HINTS) return false;
    if (type === 'player' && playerHint) return false;
    if (type === 'singer' && singerHint) return false;
    if (type === 'capital' && capitalHint) return false;
    
    const cost = type === 'capital' ? HINT_COST_CAPITAL : HINT_COST_GUIDED;
    return playerScore >= cost;
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
              totalSeconds={adjustedTurnTime}
              startTime={turnStartTime}
              onComplete={handleSkip}
              label={t('timeLeft')}
              enableWarningSound={true}
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
                <img
                  src={countryFlag}
                  alt="Country Flag"
                  className="w-32 h-auto mx-auto rounded shadow-lg"
                />
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

            {/* Hint buttons - compact icons with tooltips */}
            <div className="flex justify-center gap-3 flex-wrap">
              <GameTooltip content={playerScore < HINT_COST_LETTER ? t('notEnoughPoints') : t('tooltipHint')} position="top">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleHint}
                  disabled={hintUsed || playerScore < HINT_COST_LETTER}
                  className={`h-12 w-12 ${hintUsed ? 'bg-warning/20 border-warning' : playerScore < HINT_COST_LETTER ? 'opacity-50 cursor-not-allowed' : 'hover:bg-warning/10 hover:border-warning'}`}
                >
                  {hintUsed ? (
                    <span className="text-warning font-bold">✓</span>
                  ) : (
                    <Lightbulb className="h-5 w-5 text-warning" />
                  )}
                </Button>
              </GameTooltip>

              <GameTooltip content={playerScore < HINT_COST_FAMOUS ? t('notEnoughPoints') : t('tooltipFamousPerson')} position="top">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleFamousPerson}
                  disabled={famousPersonUsed || playerScore < HINT_COST_FAMOUS}
                  className={`h-12 w-12 ${famousPersonUsed ? 'bg-info/20 border-info' : playerScore < HINT_COST_FAMOUS ? 'opacity-50 cursor-not-allowed' : 'hover:bg-info/10 hover:border-info'}`}
                >
                  {famousPersonUsed ? (
                    <span className="text-info font-bold">✓</span>
                  ) : (
                    <User className="h-5 w-5 text-info" />
                  )}
                </Button>
              </GameTooltip>

              <GameTooltip content={playerScore < HINT_COST_FLAG ? t('notEnoughPoints') : t('tooltipFlag')} position="top">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleFlag}
                  disabled={flagUsed || playerScore < HINT_COST_FLAG}
                  className={`h-12 w-12 ${flagUsed ? 'bg-destructive/20 border-destructive' : playerScore < HINT_COST_FLAG ? 'opacity-50 cursor-not-allowed' : 'hover:bg-destructive/10 hover:border-destructive'}`}
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
                  <GameTooltip content={guidedHintsUsed >= MAX_GUIDED_HINTS ? t('maxHintsReached') : t('tooltipGuidedHints')} position="top">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowGuidedMenu(!showGuidedMenu)}
                      disabled={guidedHintsUsed >= MAX_GUIDED_HINTS}
                      className={`h-12 w-12 ${guidedHintsUsed >= MAX_GUIDED_HINTS ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-500/10 hover:border-purple-500'}`}
                    >
                      <MapPin className="h-5 w-5 text-purple-400" />
                    </Button>
                  </GameTooltip>

                  {/* Guided hints dropdown */}
                  {showGuidedMenu && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-card border border-border rounded-lg shadow-xl p-2 min-w-48 z-20 animate-fade-in">
                      <p className="text-xs text-muted-foreground mb-2 px-2">
                        {t('guidedHintsRemaining')}: {MAX_GUIDED_HINTS - guidedHintsUsed}
                      </p>
                      
                      <button
                        onClick={() => handleGuidedHint('capital')}
                        disabled={!canUseGuidedHint('capital')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          canUseGuidedHint('capital') 
                            ? 'hover:bg-purple-500/20 text-foreground' 
                            : 'opacity-50 cursor-not-allowed text-muted-foreground'
                        }`}
                      >
                        <Building className="h-4 w-4 text-purple-400" />
                        <span>{t('hintCapital')}</span>
                        <span className="ml-auto text-xs text-muted-foreground">-10s</span>
                      </button>

                      <button
                        onClick={() => handleGuidedHint('player')}
                        disabled={!canUseGuidedHint('player')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          canUseGuidedHint('player') 
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
                        disabled={!canUseGuidedHint('singer')}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          canUseGuidedHint('singer') 
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
