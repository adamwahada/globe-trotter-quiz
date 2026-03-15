import React, { useState, useEffect, useCallback } from 'react';
import { X, Gift, Star, Zap, Trophy, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSound } from '@/contexts/SoundContext';

interface DailyRollModalProps {
  isOpen: boolean;
  onClose: () => void;
  alreadyRolled: boolean;
  onRollComplete: () => void;
}

const PRIZES = [
  { icon: Star, label: '+5 Bonus Points', color: 'text-yellow-400', bg: 'bg-yellow-400/20' },
  { icon: Zap, label: 'Double Score Next Game', color: 'text-blue-400', bg: 'bg-blue-400/20' },
  { icon: Trophy, label: 'Mystery Reward', color: 'text-purple-400', bg: 'bg-purple-400/20' },
  { icon: Gift, label: 'Extra Hint', color: 'text-green-400', bg: 'bg-green-400/20' },
  { icon: Sparkles, label: 'Lucky Charm', color: 'text-pink-400', bg: 'bg-pink-400/20' },
  { icon: Star, label: '+10 Bonus Points', color: 'text-amber-400', bg: 'bg-amber-400/20' },
];

const getTimeUntilMidnight = (): string => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

export const DailyRollModal: React.FC<DailyRollModalProps> = ({
  isOpen,
  onClose,
  alreadyRolled,
  onRollComplete,
}) => {
  const { t } = useLanguage();
  const { playDiceSound } = useSound();
  const [rolling, setRolling] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(getTimeUntilMidnight());

  // Update countdown every minute
  useEffect(() => {
    if (!isOpen) return;
    setCountdown(getTimeUntilMidnight());
    const interval = setInterval(() => setCountdown(getTimeUntilMidnight()), 60_000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Roller animation
  useEffect(() => {
    if (!rolling) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % PRIZES.length);
    }, 120);
    return () => clearInterval(interval);
  }, [rolling]);

  const handleRoll = useCallback(() => {
    if (rolling || alreadyRolled) return;
    setResult(null);
    setRolling(true);
    playDiceSound();

    // Slow down and land after ~2s
    setTimeout(() => {
      setRolling(false);
      const finalIndex = Math.floor(Math.random() * PRIZES.length);
      setCurrentIndex(finalIndex);
      setResult(finalIndex);
      onRollComplete();
    }, 2000);
  }, [rolling, alreadyRolled, playDiceSound, onRollComplete]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setRolling(false);
      setResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPrize = PRIZES[currentIndex];
  const PrizeIcon = currentPrize.icon;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary/20 to-transparent p-6 pb-4 text-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
          <Gift className="h-10 w-10 text-primary mx-auto mb-2" />
          <h2 className="text-xl font-bold text-foreground">{t('dailyRollTitle')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('dailyRollSubtitle')}</p>
        </div>

        {/* Roller display */}
        <div className="px-6 py-8">
          <div className={`
            relative mx-auto w-48 h-48 rounded-2xl border-2 flex flex-col items-center justify-center gap-3
            transition-all duration-300
            ${rolling
              ? 'border-primary shadow-lg shadow-primary/30 animate-pulse'
              : result !== null
                ? 'border-primary/60 shadow-lg shadow-primary/20'
                : 'border-border'
            }
            ${currentPrize.bg}
          `}>
            <PrizeIcon className={`h-16 w-16 transition-all duration-150 ${currentPrize.color} ${rolling ? 'animate-bounce' : ''}`} />
            <span className={`text-sm font-semibold text-center px-2 ${result !== null ? 'text-foreground' : 'text-muted-foreground'}`}>
              {currentPrize.label}
            </span>

            {/* Spinning border effect */}
            {rolling && (
              <div className="absolute inset-0 rounded-2xl border-2 border-primary animate-spin opacity-30" />
            )}
          </div>

          {/* Result message */}
          {result !== null && !rolling && (
            <p className="text-center mt-4 text-sm text-primary font-medium animate-fade-in">
              {t('dailyRollWon')}
            </p>
          )}
        </div>

        {/* Action */}
        <div className="px-6 pb-6 space-y-3">
          {alreadyRolled && result === null ? (
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">{t('dailyRollUsed')}</p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{t('dailyRollResets')} {countdown}</span>
              </div>
            </div>
          ) : result !== null ? (
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">{t('dailyRollComingSoon')}</p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{t('dailyRollResets')} {countdown}</span>
              </div>
            </div>
          ) : (
            <Button
              variant="netflix"
              className="w-full"
              onClick={handleRoll}
              disabled={rolling}
            >
              {rolling ? t('dailyRolling') : t('dailyRollAction')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
