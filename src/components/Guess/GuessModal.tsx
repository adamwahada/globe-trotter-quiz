import React, { useState, useEffect } from 'react';
import { X, Lightbulb, User, Send, SkipForward, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { TimerProgress } from '@/components/Timer/TimerProgress';

interface GuessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (guess: string) => void;
  onSkip: () => void;
  onUseHint: (type: 'letter' | 'famous' | 'flag') => string;
  turnTimeSeconds?: number;
  turnStartTime?: number;
}

export const GuessModal: React.FC<GuessModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSkip,
  onUseHint,
  turnTimeSeconds = 35,
  turnStartTime,
}) => {
  const { t } = useLanguage();
  const [guess, setGuess] = useState('');
  const [hintUsed, setHintUsed] = useState(false);
  const [famousPersonUsed, setFamousPersonUsed] = useState(false);
  const [flagUsed, setFlagUsed] = useState(false);
  const [firstLetter, setFirstLetter] = useState('');
  const [famousPerson, setFamousPerson] = useState('');
  const [countryFlag, setCountryFlag] = useState('');

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

  const handleSubmit = () => {
    if (guess.trim()) {
      onSubmit(guess.trim());
    }
  };

  const handleSkip = () => {
    onSkip();
  };

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
              <span className="text-destructive font-semibold ml-2">0</span> wrong/skip •
              <span className="text-destructive font-semibold ml-2">-1</span> per hint
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

            {/* Hint buttons */}
            <div className="grid grid-cols-3 gap-3">
              <GameTooltip content={t('tooltipHint')} position="top">
                <Button
                  variant="outline"
                  onClick={handleHint}
                  disabled={hintUsed}
                  className="gap-2 py-3 text-sm font-medium hover:bg-primary/10 hover:border-primary"
                >
                  <Lightbulb className="h-5 w-5" />
                  {t('useHint')} {hintUsed && '✓'}
                </Button>
              </GameTooltip>

              <GameTooltip content={t('tooltipFamousPerson')} position="top">
                <Button
                  variant="outline"
                  onClick={handleFamousPerson}
                  disabled={famousPersonUsed}
                  className="gap-2 py-3 text-sm font-medium hover:bg-primary/10 hover:border-primary"
                >
                  <User className="h-5 w-5" />
                  {t('famousPerson')} {famousPersonUsed && '✓'}
                </Button>
              </GameTooltip>

              <GameTooltip content="Show country flag" position="top">
                <Button
                  variant="outline"
                  onClick={handleFlag}
                  disabled={flagUsed}
                  className="gap-2 py-3 text-sm font-medium hover:bg-primary/10 hover:border-primary"
                >
                  <Flag className="h-5 w-5" />
                  Flag {flagUsed && '✓'}
                </Button>
              </GameTooltip>
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
