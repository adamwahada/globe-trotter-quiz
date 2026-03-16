import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Clock, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSound } from '@/contexts/SoundContext';

interface DailyRollModalProps {
  isOpen: boolean;
  onClose: () => void;
  alreadyRolled: boolean;
  onRollComplete: (prizeIndex: number) => void;
}

export type Rarity = 'common' | 'normal' | 'rare';

export interface Prize {
  label: string;
  rarity: Rarity;
  color: string;
  bgColor: string;
  emoji: string;
}

export const PRIZES: Prize[] = [
  { label: 'Slot 1', rarity: 'common', color: 'hsl(var(--primary))', bgColor: 'hsl(142 70% 45%)', emoji: '🍀' },
  { label: 'Slot 2', rarity: 'normal', color: 'hsl(var(--primary))', bgColor: 'hsl(217 70% 50%)', emoji: '⚡' },
  { label: 'Slot 3', rarity: 'common', color: 'hsl(var(--primary))', bgColor: 'hsl(142 70% 45%)', emoji: '🎯' },
  { label: 'Slot 4', rarity: 'rare',   color: 'hsl(var(--primary))', bgColor: 'hsl(280 70% 50%)', emoji: '💎' },
  { label: 'Slot 5', rarity: 'common', color: 'hsl(var(--primary))', bgColor: 'hsl(142 70% 45%)', emoji: '🌟' },
  { label: 'Slot 6', rarity: 'normal', color: 'hsl(var(--primary))', bgColor: 'hsl(217 70% 50%)', emoji: '🔥' },
  { label: 'Slot 7', rarity: 'rare',   color: 'hsl(var(--primary))', bgColor: 'hsl(280 70% 50%)', emoji: '👑' },
  { label: 'Slot 8', rarity: 'normal', color: 'hsl(var(--primary))', bgColor: 'hsl(217 70% 50%)', emoji: '⏱️' },
];

const RARITY_LABELS: Record<Rarity, string> = {
  common: 'Common',
  normal: 'Normal',
  rare: 'Rare',
};

const RARITY_COLORS: Record<Rarity, string> = {
  common: 'text-green-400',
  normal: 'text-blue-400',
  rare: 'text-purple-400',
};

const RARITY_BG: Record<Rarity, string> = {
  common: 'bg-green-400/20 border-green-400/40',
  normal: 'bg-blue-400/20 border-blue-400/40',
  rare: 'bg-purple-400/20 border-purple-400/40',
};

const SEGMENT_COLORS: Record<Rarity, string> = {
  common: '#22c55e',
  normal: '#3b82f6',
  rare: '#a855f7',
};

const getTimeUntilMidnight = (): string => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
};

// Pick a weighted random index (rare=1, normal=2, common=3 weight)
const pickWeightedIndex = (): number => {
  const weights = PRIZES.map(p =>
    p.rarity === 'common' ? 3 : p.rarity === 'normal' ? 2 : 1
  );
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return 0;
};

export const DailyRollModal: React.FC<DailyRollModalProps> = ({
  isOpen,
  onClose,
  alreadyRolled,
  onRollComplete,
}) => {
  const { t } = useLanguage();
  const { playDiceSound } = useSound();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [countdown, setCountdown] = useState(getTimeUntilMidnight());
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;
    setCountdown(getTimeUntilMidnight());
    const interval = setInterval(() => setCountdown(getTimeUntilMidnight()), 60_000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Draw wheel on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 4;
    const segmentAngle = (2 * Math.PI) / PRIZES.length;

    ctx.clearRect(0, 0, size, size);

    PRIZES.forEach((prize, i) => {
      const startAngle = i * segmentAngle;
      const endAngle = startAngle + segmentAngle;

      // Segment fill
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = SEGMENT_COLORS[prize.rarity];
      ctx.globalAlpha = i % 2 === 0 ? 0.85 : 0.65;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Segment border
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Emoji text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + segmentAngle / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '24px serif';
      ctx.fillText(prize.emoji, radius * 0.65, 0);
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(center, center, 20, 0, 2 * Math.PI);
    ctx.fillStyle = 'hsl(0 0% 10%)';
    ctx.fill();
    ctx.strokeStyle = 'hsl(0 0% 30%)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, []);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setSpinning(false);
      setResult(null);
      setRotation(0);
    }
  }, [isOpen]);

  const handleSpin = useCallback(() => {
    if (spinning || alreadyRolled) return;
    setResult(null);
    setSpinning(true);
    playDiceSound();

    const targetIndex = pickWeightedIndex();
    const segmentAngle = 360 / PRIZES.length;
    // Land in the middle of the target segment, pointer is at top (270° or -90°)
    const targetAngle = 360 - (targetIndex * segmentAngle + segmentAngle / 2);
    const fullSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full rotations
    const finalRotation = fullSpins * 360 + targetAngle;

    setRotation(finalRotation);

    setTimeout(() => {
      setSpinning(false);
      setResult(targetIndex);
      onRollComplete(targetIndex);
    }, 4000);
  }, [spinning, alreadyRolled, playDiceSound, onRollComplete]);

  if (!isOpen) return null;

  const wonPrize = result !== null ? PRIZES[result] : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary/20 to-transparent p-5 pb-3 text-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
          <Gift className="h-8 w-8 text-primary mx-auto mb-1" />
          <h2 className="text-lg font-bold text-foreground">{t('dailyRollTitle')}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t('dailyRollSubtitle')}</p>
        </div>

        {/* Wheel */}
        <div className="flex flex-col items-center px-6 py-5">
          <div className="relative">
            {/* Pointer triangle */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
              <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-primary drop-shadow-lg" />
            </div>

            {/* Spinning wheel */}
            <div
              className="rounded-full border-4 border-border shadow-xl"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning
                  ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
                  : 'none',
              }}
            >
              <canvas
                ref={canvasRef}
                width={240}
                height={240}
                className="w-[240px] h-[240px] rounded-full"
              />
            </div>
          </div>

          {/* Result display */}
          {wonPrize && !spinning && (
            <div className={`mt-4 px-4 py-2 rounded-xl border text-center animate-scale-in ${RARITY_BG[wonPrize.rarity]}`}>
              <span className="text-2xl">{wonPrize.emoji}</span>
              <p className="text-sm font-semibold text-foreground mt-1">{wonPrize.label}</p>
              <span className={`text-xs font-medium ${RARITY_COLORS[wonPrize.rarity]}`}>
                {RARITY_LABELS[wonPrize.rarity]}
              </span>
            </div>
          )}
        </div>

        {/* Action */}
        <div className="px-6 pb-5 space-y-3">
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
              onClick={handleSpin}
              disabled={spinning}
            >
              {spinning ? t('dailyRolling') : t('dailyRollAction')}
            </Button>
          )}

          {/* Legend */}
          <div className="flex justify-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Common</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Normal</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Rare</span>
          </div>
        </div>
      </div>
    </div>
  );
};
