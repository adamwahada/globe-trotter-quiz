import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CARD_DEFINITIONS, CardType } from '@/types/cards';

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

const GlassCard: React.FC<{ cardType: CardType; t: any; isRTL: boolean }> = ({ cardType, t, isRTL }) => {
  const def = CARD_DEFINITIONS[cardType];

  return (
    <div className="group relative flex-shrink-0 w-[220px] sm:w-[260px] cursor-default select-none" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Outer glow on hover */}
      <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-white/20 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm" />

      <div className="relative h-[300px] sm:h-[340px] rounded-3xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.25)] overflow-hidden transition-all duration-500 ease-out group-hover:scale-[1.03] group-hover:shadow-[0_16px_48px_rgba(0,0,0,0.35)] group-hover:border-white/[0.15]">
        {/* Inner subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-white/[0.02] pointer-events-none" />

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center px-5 sm:px-6 text-center gap-4">
          {/* Icon */}
          <div className="text-6xl sm:text-7xl transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-translate-y-1">
            {def.icon}
          </div>

          {/* Text */}
          <div className="space-y-2 w-full">
            <h3 className={`text-base sm:text-lg font-semibold text-foreground/90 tracking-tight ${isRTL ? 'font-sans' : ''}`}>
              {t(cardNameKeys[cardType] as any)}
            </h3>
            <p className={`text-[11px] sm:text-xs text-muted-foreground/70 leading-relaxed line-clamp-3 ${isRTL ? 'font-sans leading-loose' : ''}`}>
              {t(cardDescKeys[cardType] as any)}
            </p>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </div>
  );
};

// Split cards into two rows
const row1Cards: CardType[] = allCards.slice(0, 6);
const row2Cards: CardType[] = allCards.slice(6).concat(allCards.slice(0, 4));

export const CardSystemSection: React.FC = () => {
  const { t, isRTL } = useLanguage();

  return (
    <section
      id="card-system"
      className="relative z-10 min-h-screen flex flex-col items-center justify-center py-28 overflow-hidden"
    >
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative text-center mb-16 px-4">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-display text-foreground tracking-tight mb-4">
          {t('cardSystemTitle' as any)}
        </h2>
        <p className="text-muted-foreground/60 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          {t('cardSystemSubtitle' as any)}
        </p>
      </div>

      {/* Marquee rows */}
      <div className="relative w-full space-y-6">
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 sm:w-40 z-10 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 sm:w-40 z-10 bg-gradient-to-l from-background to-transparent" />

        {/* Row 1 — left to right */}
        <div className="group/row overflow-hidden">
          <div className="flex gap-5 w-max animate-marquee-right hover:[animation-play-state:paused]">
            {[...row1Cards, ...row1Cards, ...row1Cards, ...row1Cards, ...row1Cards].map((cardType, i) => (
              <GlassCard key={`r1-${i}`} cardType={cardType} t={t} isRTL={isRTL} />
            ))}
          </div>
        </div>

        {/* Row 2 — right to left */}
        <div className="group/row overflow-hidden">
          <div className="flex gap-5 w-max animate-marquee-left hover:[animation-play-state:paused]">
            {[...row2Cards, ...row2Cards, ...row2Cards, ...row2Cards, ...row2Cards].map((cardType, i) => (
              <GlassCard key={`r2-${i}`} cardType={cardType} t={t} isRTL={isRTL} />
            ))}
          </div>
        </div>
      </div>

      {/* How it works note */}
      <div className="relative mt-14 max-w-lg mx-auto px-4">
        <div className="rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-sm px-6 py-4 text-center">
          <p className="text-sm text-muted-foreground leading-relaxed italic">
            {t('cardSystemHow' as any)}
          </p>
        </div>
      </div>
    </section>
  );
};
