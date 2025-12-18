import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface TimerProgressProps {
  totalSeconds: number;
  onComplete?: () => void;
  isActive?: boolean;
  label?: string;
  startTime?: number; // Unix timestamp when timer started (for shared timers)
}

export const TimerProgress: React.FC<TimerProgressProps> = ({
  totalSeconds,
  onComplete,
  isActive = true,
  label,
  startTime,
}) => {
  const calculateRemainingSeconds = () => {
    if (startTime) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      return Math.max(0, totalSeconds - elapsed);
    }
    return totalSeconds;
  };

  const [remainingSeconds, setRemainingSeconds] = useState(calculateRemainingSeconds);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const newRemaining = calculateRemainingSeconds();
      setRemainingSeconds(newRemaining);
      
      if (newRemaining <= 0) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, onComplete, startTime, totalSeconds]);

  useEffect(() => {
    setRemainingSeconds(calculateRemainingSeconds());
  }, [totalSeconds, startTime]);

  const percentage = (remainingSeconds / totalSeconds) * 100;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

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
            <Clock className="h-4 w-4" />
            {label}
          </span>
          <span className="font-display text-lg text-foreground">
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      )}
      
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${getProgressColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
