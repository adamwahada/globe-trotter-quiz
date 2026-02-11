import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CARD_DEFINITIONS, CardType } from '@/types/cards';
import { Sparkles } from 'lucide-react';

const allCards: CardType[] = [
  'timeBoost', 'timeSteal', 'extraHint', 'hintBlock',
  'forcedContinent', 'pickYourCountry', 'pickYourContinent',
  'skipNextPlayer', 'doublePoints', 'pointStrike', 'joker',
];

const cardNameKeys: Record<CardType, string> = {
  timeBoost: 'cardTimeBoost',
  timeSteal: 'cardTimeSteal',
  extraHint: 'cardExtraHint',
  hintBlock: 'cardHintBlock',
  forcedContinent: 'cardForcedContinent',
  pickYourCountry: 'cardPickYourCountry',
  pickYourContinent: 'cardPickYourContinent',
  skipNextPlayer: 'cardSkipNextPlayer',
  doublePoints: 'cardDoublePoints',
  pointStrike: 'cardPointStrike',
  joker: 'cardJoker',
};

const cardDescKeys: Record<CardType, string> = {
  timeBoost: 'cardTimeBoostLandingDesc',
  timeSteal: 'cardTimeStealLandingDesc',
  extraHint: 'cardExtraHintLandingDesc',
  hintBlock: 'cardHintBlockLandingDesc',
  forcedContinent: 'cardForcedContinentLandingDesc',
  pickYourCountry: 'cardPickYourCountryLandingDesc',
  pickYourContinent: 'cardPickYourContinentLandingDesc',
  skipNextPlayer: 'cardSkipNextPlayerLandingDesc',
  doublePoints: 'cardDoublePointsLandingDesc',
  pointStrike: 'cardPointStrikeLandingDesc',
  joker: 'cardJokerLandingDesc',
};

const MinimalCard: React.FC<{ cardType: CardType; t: (key: any) => string }> = ({ cardType, t }) => {
  const def = CARD_DEFINITIONS[cardType];

  return (
    <div className="group relative flex-shrink-0 w-[260px] bg-card/60 backdrop-blur-sm rounded-2xl border border-border/40 p-6 transition-all duration-500 hover:scale-[1.05] hover:-translate-y-2 hover:border-primary/40 hover:shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.15)]">
      {/* Icon area */}
      <div className="w-14 h-14 rounded-xl bg-secondary/60 flex items-center justify-center text-3xl mb-5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
        {def.icon}
      </div>

      {/* Title */}
      <h4 className="font-display text-lg text-foreground mb-2 tracking-wide">
        {t(cardNameKeys[cardType] as any)}
      </h4>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        {t(cardDescKeys[cardType] as any)}
      </p>

      {/* Cost badge */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-primary/80 bg-primary/10 px-2.5 py-1 rounded-full">
          {def.cost} {t('cardPoints')}
        </span>
      </div>

      {/* Subtle bottom accent on hover */}
      <div className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full bg-primary/0 transition-all duration-500 group-hover:bg-primary/40" />
    </div>
  );
};

export const CardSystemSection: React.FC = () => {
  const { t } = useLanguage();

  // Duplicate cards for seamless infinite scroll
  const row1 = [...allCards, ...allCards];
  const row2 = [...[...allCards].reverse(), ...[...allCards].reverse()];

  return (
    <section id="card-system" className="relative z-10 py-20 overflow-hidden">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center px-4 mb-14">
        <h2 className="text-4xl md:text-5xl font-display text-foreground mb-4">
          {t('cardSystemTitle' as any)}
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          {t('cardSystemSubtitle' as any)}
        </p>
      </div>

      {/* Infinite marquee - Row 1 (left to right) */}
      <div className="relative mb-6">
        <div className="flex gap-5 animate-marquee-left hover:[animation-play-state:paused]">
          {row1.map((cardType, i) => (
            <MinimalCard key={`r1-${i}`} cardType={cardType} t={t} />
          ))}
        </div>
      </div>

      {/* Infinite marquee - Row 2 (right to left) */}
      <div className="relative">
        <div className="flex gap-5 animate-marquee-right hover:[animation-play-state:paused]">
          {row2.map((cardType, i) => (
            <MinimalCard key={`r2-${i}`} cardType={cardType} t={t} />
          ))}
        </div>
      </div>

      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

      {/* Fusion info */}
      <div className="max-w-2xl mx-auto mt-16 px-4">
        <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <p className="text-lg font-display text-foreground mb-2">
            {t('cardFusionTitle' as any)}
          </p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            {t('cardFusionDesc' as any)}
          </p>
        </div>
      </div>
    </section>
  );
};
