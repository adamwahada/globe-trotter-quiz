import React, { useState } from 'react';
import { X, Lightbulb, User, Send, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { getFamousPerson } from '@/utils/countryData';
import { TimerProgress } from '@/components/Timer/TimerProgress';

interface GuessModalProps {
  isOpen: boolean;
  onClose: () => void;
  countryName: string;
  onSubmit: (guess: string) => void;
  onSkip: () => void;
  onUseHint: () => string;
  turnTimeSeconds?: number;
  turnStartTime?: number;
}

export const GuessModal: React.FC<GuessModalProps> = ({
  isOpen,
  onClose,
  countryName,
  onSubmit,
  onSkip,
  onUseHint,
  turnTimeSeconds = 30,
  turnStartTime,
}) => {
  const { t } = useLanguage();
  const [guess, setGuess] = useState('');
  const [hintUsed, setHintUsed] = useState(false);
  const [famousPersonUsed, setFamousPersonUsed] = useState(false);
  const [firstLetter, setFirstLetter] = useState('');
  const [famousPerson, setFamousPerson] = useState('');

  if (!isOpen) return null;

  const handleHint = () => {
    if (!hintUsed) {
      const letter = onUseHint();
      setFirstLetter(letter);
      setHintUsed(true);
    }
  };

  const handleFamousPerson = () => {
    if (!famousPersonUsed) {
      const person = getFamousPerson(countryName);
      setFamousPerson(person || 'Unknown');
      setFamousPersonUsed(true);
      onUseHint(); // Deduct point
    }
  };

  const handleSubmit = () => {
    if (guess.trim()) {
      onSubmit(guess.trim());
      setGuess('');
      setHintUsed(false);
      setFamousPersonUsed(false);
      setFirstLetter('');
      setFamousPerson('');
    }
  };

  const handleSkip = () => {
    onSkip();
    setGuess('');
    setHintUsed(false);
    setFamousPersonUsed(false);
    setFirstLetter('');
    setFamousPerson('');
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
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Timer */}
          <div className="mb-6">
            <TimerProgress 
              totalSeconds={turnTimeSeconds}
              startTime={turnStartTime}
              onComplete={handleSkip}
              label={t('timeLeft')}
            />
          </div>

          <h2 className="text-3xl font-display text-foreground text-center mb-6">
            {t('guessCountry')}
          </h2>

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
                  {t('famousPerson')}: <span className="font-bold">{famousPerson}</span>
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

            {/* Hint buttons */}
            <div className="flex gap-2">
              <GameTooltip content={t('tooltipHint')} position="top">
                <Button
                  variant="outline"
                  onClick={handleHint}
                  disabled={hintUsed}
                  className="flex-1 gap-2"
                >
                  <Lightbulb className="h-4 w-4" />
                  {t('useHint')}
                </Button>
              </GameTooltip>

              <GameTooltip content={t('tooltipFamousPerson')} position="top">
                <Button
                  variant="outline"
                  onClick={handleFamousPerson}
                  disabled={famousPersonUsed}
                  className="flex-1 gap-2"
                >
                  <User className="h-4 w-4" />
                  {t('famousPerson')}
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
