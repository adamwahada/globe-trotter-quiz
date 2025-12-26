import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { useSound } from '@/contexts/SoundContext';

interface TimerProgressProps {
  totalSeconds: number;
  onComplete?: () => void;
  isActive?: boolean;
  label?: string;
  startTime?: number; // Unix timestamp when timer started (for shared timers)
  enableWarningSound?: boolean;
}

export const TimerProgress: React.FC<TimerProgressProps> = ({
  totalSeconds,
  onComplete,
  isActive = true,
  label,
  startTime,
  enableWarningSound = false,
}) => {
  const { playTimerWarning } = useSound();
  const onCompleteRef = useRef(onComplete);
  const hasCompletedRef = useRef(false);
  const lastWarnedSecondRef = useRef<number | null>(null);
  
  // Update ref when onComplete changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Reset warning ref when timer restarts
  useEffect(() => {
    lastWarnedSecondRef.current = null;
    hasCompletedRef.current = false;
  }, [startTime]);

  const calculateRemainingSeconds = useCallback(() => {
    if (startTime) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      return Math.max(0, totalSeconds - elapsed);
    }
    return totalSeconds;
  }, [startTime, totalSeconds]);

  const [remainingSeconds, setRemainingSeconds] = useState(calculateRemainingSeconds);

  useEffect(() => {
    if (!isActive) return;
    hasCompletedRef.current = false;

    const interval = setInterval(() => {
      const newRemaining = calculateRemainingSeconds();
      setRemainingSeconds(newRemaining);
      
      // Play warning sounds in the last 5 seconds
      if (enableWarningSound && newRemaining <= 5 && newRemaining >= 0) {
        if (lastWarnedSecondRef.current !== newRemaining) {
          lastWarnedSecondRef.current = newRemaining;
          playTimerWarning(newRemaining);
        }
      }
      
      if (newRemaining <= 0 && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        clearInterval(interval);
        onCompleteRef.current?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, startTime, totalSeconds, calculateRemainingSeconds, enableWarningSound, playTimerWarning]);

  useEffect(() => {
    setRemainingSeconds(calculateRemainingSeconds());
  }, [totalSeconds, startTime, calculateRemainingSeconds]);

  const percentage = (remainingSeconds / totalSeconds) * 100;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const isWarning = remainingSeconds <= 5 && remainingSeconds > 0;

  const getProgressColor = () => {
    if (percentage > 50) return 'bg-success';
    if (percentage > 25) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className="w-full space-y-2">
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-2">
            <Clock className={`h-4 w-4 ${isWarning ? 'animate-pulse text-destructive' : ''}`} />
            {label}
          </span>
          <span className={`font-display text-lg ${isWarning ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      )}
      
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${getProgressColor()} ${isWarning ? 'animate-pulse' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
