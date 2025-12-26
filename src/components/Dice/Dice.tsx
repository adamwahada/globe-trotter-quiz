import React, { useState, useEffect } from 'react';
import { Dices } from 'lucide-react';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSound } from '@/contexts/SoundContext';

interface DiceProps {
  onRoll: () => void;
  disabled?: boolean;
  isRolling?: boolean;
}

export const Dice: React.FC<DiceProps> = ({ onRoll, disabled = false, isRolling = false }) => {
  const { t } = useLanguage();
  const { playDiceSound } = useSound();
  const [rolling, setRolling] = useState(false);
  const [diceValue, setDiceValue] = useState<number>(1);

  // Animate dice faces during roll
  useEffect(() => {
    if (rolling || isRolling) {
      const interval = setInterval(() => {
        setDiceValue(Math.floor(Math.random() * 6) + 1);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [rolling, isRolling]);

  const handleRoll = () => {
    if (disabled || rolling) return;
    
    setRolling(true);
    playDiceSound();
    
    // Extended animation for better effect
    setTimeout(() => {
      setRolling(false);
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      onRoll();
    }, 800);
  };

  const isActive = rolling || isRolling;

  return (
    <GameTooltip content={t('tooltipDice')} position="top">
      <button
        onClick={handleRoll}
        disabled={disabled || rolling}
        className={`
          relative p-5 rounded-2xl bg-gradient-to-br from-secondary to-card 
          border-2 transition-all duration-300 group
          ${disabled 
            ? 'opacity-50 cursor-not-allowed border-border' 
            : 'hover:border-primary hover:shadow-xl hover:scale-105 cursor-pointer border-border'
          }
          ${isActive ? 'dice-roll border-primary shadow-lg shadow-primary/30' : ''}
        `}
      >
        {/* Dice face indicator */}
        <div className={`
          absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary 
          flex items-center justify-center text-sm font-bold text-primary-foreground
          transition-all duration-200
          ${isActive ? 'scale-110 animate-bounce' : 'scale-100'}
        `}>
          {diceValue}
        </div>

        <Dices 
          className={`h-14 w-14 text-primary transition-transform duration-200 ${
            isActive ? 'animate-spin' : 'group-hover:rotate-12'
          }`} 
        />
        
        {/* Glow effect */}
        <div className={`
          absolute inset-0 rounded-2xl bg-primary/30 blur-xl 
          transition-opacity duration-300
          ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'}
        `} />

        {/* Roll text */}
        {!disabled && !isActive && (
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
            {t('rollDice')}
          </span>
        )}
      </button>
    </GameTooltip>
  );
};
