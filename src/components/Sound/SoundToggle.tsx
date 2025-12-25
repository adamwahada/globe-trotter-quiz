import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useSound } from '@/contexts/SoundContext';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { useLanguage } from '@/contexts/LanguageContext';

export const SoundToggle: React.FC = () => {
  const { soundEnabled, toggleSound } = useSound();
  const { t } = useLanguage();

  return (
    <GameTooltip content={soundEnabled ? t('soundOn') : t('soundOff')} position="bottom">
      <button
        onClick={toggleSound}
        className="p-2 rounded-lg bg-secondary/50 border border-border hover:border-primary transition-all duration-200"
        aria-label={soundEnabled ? 'Disable sound' : 'Enable sound'}
      >
        {soundEnabled ? (
          <Volume2 className="h-5 w-5 text-primary" />
        ) : (
          <VolumeX className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
    </GameTooltip>
  );
};
