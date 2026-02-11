import React, { useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CARD_DEFINITIONS, CardType } from '@/types/cards';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

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
    <div className="group relative flex-shrink-0 w-[220px] bg-card/50 backdrop-blur-sm rounded-2xl border border-border/30 p-5 transition-all duration-500 hover:scale-[1.06] hover:-translate-y-3 hover:border-primary/40 hover:shadow-[0_24px_60px_-12px_hsl(var(--primary)/0.2)] cursor-default">
      {/* Large centered icon */}
      <div className="flex items-center justify-center h-24 mb-4">
        <span className="text-5xl transition-transform duration-500 group-hover:scale-125 group-hover:-rotate-6 select-none">
          {def.icon}
        </span>
      </div>

      {/* Title */}
      <h4 className="font-display text-lg text-foreground text-center mb-2 tracking-wide">
        {t(cardNameKeys[cardType] as any)}
      </h4>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed text-center">
        {t(cardDescKeys[cardType] as any)}
      </p>

      {/* Subtle bottom accent on hover */}
      <div className="absolute bottom-0 left-5 right-5 h-[2px] rounded-full bg-primary/0 transition-all duration-500 group-hover:bg-primary/40" />
    </div>
  );
};

export const CardSystemSection: React.FC = () => {
  const { t } = useLanguage();
  const scrollRef1 = useRef<HTMLDivElement>(null);
  const scrollRef2 = useRef<HTMLDivElement>(null);

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, dir: 'left' | 'right') => {
    ref.current?.scrollBy({ left: dir === 'left' ? -260 : 260, behavior: 'smooth' });
  };

  // Duplicate for infinite marquee
  const row1 = [...allCards, ...allCards];
  const row2 = [...[...allCards].reverse(), ...[...allCards].reverse()];

  return (
    <section id="card-system" className="relative z-10 py-20 overflow-hidden">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center px-4 mb-12">
        <h2 className="text-4xl md:text-5xl font-display text-foreground mb-4">
          {t('cardSystemTitle' as any)}
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          {t('cardSystemSubtitle' as any)}
        </p>
      </div>

      {/* Row 1 - scrollable + auto-marquee */}
      <div className="relative mb-5 group/row">
        {/* Scroll buttons */}
        <button
          onClick={() => scroll(scrollRef1, 'left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-card/80 backdrop-blur border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors opacity-0 group-hover/row:opacity-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => scroll(scrollRef1, 'right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-card/80 backdrop-blur border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors opacity-0 group-hover/row:opacity-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div
          ref={scrollRef1}
          className="flex gap-5 overflow-x-auto scrollbar-hide px-6 py-2 animate-marquee-left hover:[animation-play-state:paused]"
        >
          {row1.map((cardType, i) => (
            <MinimalCard key={`r1-${i}`} cardType={cardType} t={t} />
          ))}
        </div>
      </div>

      {/* Row 2 - scrollable + auto-marquee (reverse) */}
      <div className="relative group/row">
        <button
          onClick={() => scroll(scrollRef2, 'left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-card/80 backdrop-blur border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors opacity-0 group-hover/row:opacity-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => scroll(scrollRef2, 'right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-card/80 backdrop-blur border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors opacity-0 group-hover/row:opacity-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div
          ref={scrollRef2}
          className="flex gap-5 overflow-x-auto scrollbar-hide px-6 py-2 animate-marquee-right hover:[animation-play-state:paused]"
        >
          {row2.map((cardType, i) => (
            <MinimalCard key={`r2-${i}`} cardType={cardType} t={t} />
          ))}
        </div>
      </div>

      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />

      {/* Fusion info */}
      <div className="max-w-2xl mx-auto mt-14 px-4">
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
