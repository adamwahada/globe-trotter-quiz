import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, Clock, Sparkles, Dice5, Timer, Trophy, Zap, Shield, Heart } from 'lucide-react';

export const GameModesSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section className="relative z-10 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-display text-foreground text-center mb-4">
          {t('gameModesTitle' as any)}
        </h2>
        <p className="text-center text-muted-foreground mb-12">
          {t('gameModesSubtitle' as any)}
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Turn-Based Mode Card */}
          <div className="group relative bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl rounded-2xl p-6 border border-primary/30 transition-all duration-300 hover:scale-[1.02] hover:border-primary/60 hover:shadow-lg hover:shadow-primary/20">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center mb-5">
              <Dice5 className="h-7 w-7 text-primary" />
            </div>
            <h3 className="relative text-xl font-display text-foreground mb-2">{t('turnBasedMode')}</h3>
            <p className="relative text-muted-foreground mb-5 leading-relaxed text-sm">{t('turnBasedLandingDesc' as any)}</p>
            <div className="relative space-y-2 mb-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4 text-primary shrink-0" /><span>{t('turnBasedFeature1')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Timer className="h-4 w-4 text-primary shrink-0" /><span>{t('turnBasedFeature2')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Trophy className="h-4 w-4 text-primary shrink-0" /><span>{t('turnBasedFeature3' as any)}</span>
              </div>
            </div>
            <div className="relative bg-warning/10 border border-warning/30 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-warning mb-0.5">{t('cardModeAvailable' as any)}</p>
                  <p className="text-xs text-muted-foreground">{t('cardModeAvailableDesc' as any)}</p>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          </div>

          {/* Against the Clock Mode Card */}
          <div className="group relative bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl rounded-2xl p-6 border border-warning/30 transition-all duration-300 hover:scale-[1.02] hover:border-warning/60 hover:shadow-lg hover:shadow-warning/20">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-warning/10 via-transparent to-warning/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative w-14 h-14 rounded-full bg-warning/20 border border-warning/30 flex items-center justify-center mb-5">
              <Clock className="h-7 w-7 text-warning" />
            </div>
            <h3 className="relative text-xl font-display text-foreground mb-2">{t('againstTheClockMode')}</h3>
            <p className="relative text-muted-foreground mb-5 leading-relaxed text-sm">{t('clockLandingDesc' as any)}</p>
            <div className="relative space-y-2 mb-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4 text-warning shrink-0" /><span>{t('clockFeature1')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Trophy className="h-4 w-4 text-warning shrink-0" /><span>{t('clockFeature2')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-warning shrink-0" /><span>{t('clockLandingFeature3' as any)}</span>
              </div>
            </div>
            <div className="relative bg-warning/10 border border-warning/30 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-warning mb-0.5">{t('clockMultiplayerOnly' as any)}</p>
                  <p className="text-xs text-muted-foreground">{t('clockMultiplayerOnlyDesc' as any)}</p>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-transparent via-warning/40 to-transparent" />
          </div>

          {/* Speed Race Mode Card */}
          <div className="group relative bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl rounded-2xl p-6 border border-success/30 transition-all duration-300 hover:scale-[1.02] hover:border-success/60 hover:shadow-lg hover:shadow-success/20">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-success/10 via-transparent to-success/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative w-14 h-14 rounded-full bg-success/20 border border-success/30 flex items-center justify-center mb-5">
              <Zap className="h-7 w-7 text-success" />
            </div>
            <h3 className="relative text-xl font-display text-foreground mb-2">{t('speedRaceMode' as any)}</h3>
            <p className="relative text-muted-foreground mb-5 leading-relaxed text-sm">{t('speedRaceLandingDesc' as any)}</p>
            <div className="relative space-y-2 mb-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4 text-success shrink-0" /><span>{t('speedRaceFeature1' as any)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4 text-success shrink-0" /><span>{t('speedRaceFeature2' as any)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Trophy className="h-4 w-4 text-success shrink-0" /><span>{t('speedRaceFeature3' as any)}</span>
              </div>
            </div>
            <div className="relative bg-success/10 border border-success/30 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-success mb-0.5">{t('speedRaceMultiplayerOnly' as any)}</p>
                  <p className="text-xs text-muted-foreground">{t('speedRaceMultiplayerOnlyDesc' as any)}</p>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-transparent via-success/40 to-transparent" />
          </div>

          {/* Last Man Standing Mode Card */}
          <div className="group relative bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl rounded-2xl p-6 border border-destructive/30 transition-all duration-300 hover:scale-[1.02] hover:border-destructive/60 hover:shadow-lg hover:shadow-destructive/20">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-destructive/10 via-transparent to-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute top-4 right-4 px-2 py-0.5 text-xs font-bold rounded-full bg-destructive/20 text-destructive border border-destructive/30">
              NEW
            </div>
            <div className="relative w-14 h-14 rounded-full bg-destructive/20 border border-destructive/30 flex items-center justify-center mb-5">
              <Shield className="h-7 w-7 text-destructive" />
            </div>
            <h3 className="relative text-xl font-display text-foreground mb-2">{t('lastManStandingMode' as any)}</h3>
            <p className="relative text-muted-foreground mb-5 leading-relaxed text-sm">{t('lmsLandingDesc' as any)}</p>
            <div className="relative space-y-2 mb-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="h-4 w-4 text-destructive shrink-0" /><span>{t('lmsFeature1' as any)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-destructive shrink-0" /><span>{t('lmsFeature2' as any)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Trophy className="h-4 w-4 text-destructive shrink-0" /><span>{t('lmsLandingFeature3' as any)}</span>
              </div>
            </div>
            <div className="relative bg-destructive/10 border border-destructive/30 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-destructive mb-0.5">{t('lmsMultiplayerOnly' as any)}</p>
                  <p className="text-xs text-muted-foreground">{t('lmsMultiplayerOnlyDesc' as any)}</p>
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-transparent via-destructive/40 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
};
