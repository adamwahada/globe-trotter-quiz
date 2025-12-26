import React, { useState, useEffect } from 'react';
import { COUNTDOWN_SECONDS } from '@/types/game';
import { useSound } from '@/contexts/SoundContext';

interface CountdownOverlayProps {
  startTime: number;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ startTime }) => {
  const { playToastSound } = useSound();
  const [count, setCount] = useState(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    return Math.max(0, COUNTDOWN_SECONDS - elapsed);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, COUNTDOWN_SECONDS - elapsed);
      setCount(remaining);
      
      if (remaining > 0 && remaining <= 5) {
        playToastSound('game');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, playToastSound]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl">
      <div className="text-center animate-fade-in">
        <h2 className="text-2xl md:text-3xl font-display text-muted-foreground mb-8">
          Game Starting In
        </h2>
        <div className="relative">
          <div className="text-[12rem] md:text-[16rem] font-display text-primary drop-shadow-[0_0_60px_hsl(var(--primary))]">
            {count}
          </div>
          <div className="absolute inset-0 animate-ping text-[12rem] md:text-[16rem] font-display text-primary/30">
            {count}
          </div>
        </div>
        <p className="text-lg text-muted-foreground mt-8">
          Get ready to test your geography knowledge!
        </p>
      </div>
    </div>
  );
};
