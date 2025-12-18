import React, { useState } from 'react';
import { Dices } from 'lucide-react';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { useLanguage } from '@/contexts/LanguageContext';

interface DiceProps {
  onRoll: () => void;
  disabled?: boolean;
  isRolling?: boolean;
}

export const Dice: React.FC<DiceProps> = ({ onRoll, disabled = false, isRolling = false }) => {
  const { t } = useLanguage();
  const [rolling, setRolling] = useState(false);

  const handleRoll = () => {
    if (disabled || rolling) return;
    
    setRolling(true);
    setTimeout(() => {
      setRolling(false);
      onRoll();
    }, 600);
  };

  return (
    <GameTooltip content={t('tooltipDice')} position="top">
      <button
        onClick={handleRoll}
        disabled={disabled || rolling}
        className={`
          relative p-4 rounded-xl bg-secondary border-2 border-border
          transition-all duration-300 
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:shadow-lg cursor-pointer'}
          ${rolling || isRolling ? 'dice-roll' : ''}
        `}
      >
        <Dices 
          className={`h-12 w-12 text-primary ${rolling || isRolling ? 'animate-spin' : ''}`} 
        />
        
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-xl bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </GameTooltip>
  );
};
