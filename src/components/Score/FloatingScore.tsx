import React from 'react';

interface FloatingScoreProps {
  points: number;
}

export const FloatingScore: React.FC<FloatingScoreProps> = ({ points }) => {
  const isPositive = points > 0;
  
  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-float-up">
      <div className={`text-8xl font-display ${isPositive ? 'text-success' : 'text-destructive'} drop-shadow-[0_0_30px_currentColor]`}>
        {isPositive ? `+${points}` : points}
      </div>
    </div>
  );
};
