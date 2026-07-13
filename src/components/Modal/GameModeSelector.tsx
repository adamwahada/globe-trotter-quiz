import React from 'react';
import { Clock, Users, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { GameMode } from '@/types/game';

interface GameModeSelectorProps {
  onSelect: (mode: GameMode) => void;
  onBack: () => void;
}

export const GameModeSelector: React.FC<GameModeSelectorProps> = ({ onSelect, onBack }) => {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-display text-foreground text-center">
        {t('selectGameMode')}
      </h2>

      <div className="grid grid-cols-1 gap-3">
        {/* Turn-Based Mode */}
        <button
          onClick={() => onSelect('turnBased')}
          className="group relative p-5 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Users className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {t('turnBasedMode')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('turnBasedModeDesc')}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">
                  {t('turnBasedFeature1')}
                </span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">
                  {t('turnBasedFeature2')}
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* Against the Clock Mode */}
        <button
          onClick={() => onSelect('againstTheClock')}
          className="group relative p-5 rounded-xl border-2 border-border bg-card hover:border-warning/50 hover:bg-warning/5 transition-all text-left overflow-hidden"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-warning/10 text-warning group-hover:bg-warning group-hover:text-warning-foreground transition-colors">
              <Clock className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {t('againstTheClockMode')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('againstTheClockModeDesc')}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">
                  {t('clockFeature1')}
                </span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">
                  {t('clockFeature2')}
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* Speed Race Mode */}
        <button
          onClick={() => onSelect('speedRace')}
          className="group relative p-5 rounded-xl border-2 border-border bg-card hover:border-[hsl(var(--success))]/50 hover:bg-[hsl(var(--success))]/5 transition-all text-left overflow-hidden"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] group-hover:bg-[hsl(var(--success))] group-hover:text-white transition-colors">
              <Zap className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {t('speedRaceMode' as any)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('speedRaceModeDesc' as any)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">
                  {t('speedRaceFeature1' as any)}
                </span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">
                  {t('speedRaceFeature2' as any)}
                </span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">
                  {t('speedRaceFeature3' as any)}
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* Last Man Standing Mode */}
        <button
          onClick={() => onSelect('lastManStanding')}
          className="group relative p-5 rounded-xl border-2 border-border bg-card hover:border-destructive/50 hover:bg-destructive/5 transition-all text-left overflow-hidden"
        >
          <div className="absolute top-2 right-2 px-2 py-0.5 text-xs font-medium rounded-full bg-destructive/20 text-destructive">
            NEW
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive group-hover:bg-destructive group-hover:text-white transition-colors">
              <Shield className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {t('lastManStandingMode' as any)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('lastManStandingModeDesc' as any)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">
                  {t('lmsFeature1' as any)}
                </span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">
                  {t('lmsFeature2' as any)}
                </span>
                <span className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground">
                  {t('lmsFeature3' as any)}
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>

      <Button variant="outline" onClick={onBack} className="w-full">
        {t('back')}
      </Button>
    </div>
  );
};
