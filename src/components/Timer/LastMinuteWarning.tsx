import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface LastMinuteWarningProps {
  remainingSeconds: number;
  isVisible: boolean;
}

export const LastMinuteWarning: React.FC<LastMinuteWarningProps> = ({ 
  remainingSeconds, 
  isVisible 
}) => {
  const { t } = useLanguage();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div
      className={cn(
        'fixed top-20 left-1/2 -translate-x-1/2 z-50',
        'bg-gradient-to-r from-destructive via-warning to-destructive',
        'px-6 py-3 rounded-full shadow-2xl',
        'flex items-center gap-3',
        'animate-pulse',
        isAnimating && 'animate-bounce'
      )}
    >
      <AlertTriangle className="h-6 w-6 text-white animate-pulse" />
      <div className="text-white font-display text-lg">
        {t('lastChance')}
      </div>
      <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
        <Clock className="h-4 w-4 text-white" />
        <span className="text-white font-bold">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  );
};
