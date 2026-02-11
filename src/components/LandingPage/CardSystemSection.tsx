import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CARD_DEFINITIONS, CardType } from '@/types/cards';
import { Clock, Lightbulb, Settings2, Trophy, Sparkles } from 'lucide-react';

const cardCategories = [
  {
    category: 'time' as const,
    cards: ['timeBoost', 'timeSteal'] as CardType[],
    icon: Clock,
  },
  {
    category: 'hints' as const,
    cards: ['extraHint', 'hintBlock'] as CardType[],
    icon: Lightbulb,
  },
  {
    category: 'control' as const,
    cards: ['skipNextPlayer', 'pickYourCountry', 'pickYourContinent', 'forcedContinent'] as CardType[],
    icon: Settings2,
  },
  {
    category: 'score' as const,
    cards: ['doublePoints', 'pointStrike'] as CardType[],
    icon: Trophy,
  },
  {
    category: 'wild' as const,
    cards: ['joker'] as CardType[],
    icon: Sparkles,
  },
];

const categoryAccents: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  time: {
    border: 'border-info/40 group-hover:border-info/70',
    bg: 'bg-info/10',
    text: 'text-info',
    glow: 'group-hover:shadow-info/20',
  },
  hints: {
    border: 'border-warning/40 group-hover:border-warning/70',
    bg: 'bg-warning/10',
    text: 'text-warning',
    glow: 'group-hover:shadow-warning/20',
  },
  control: {
    border: 'border-primary/40 group-hover:border-primary/70',
    bg: 'bg-primary/10',
    text: 'text-primary',
    glow: 'group-hover:shadow-primary/20',
  },
  score: {
    border: 'border-success/40 group-hover:border-success/70',
    bg: 'bg-success/10',
    text: 'text-success',
    glow: 'group-hover:shadow-success/20',
  },
  wild: {
    border: 'border-accent-foreground/40 group-hover:border-accent-foreground/70',
    bg: 'bg-accent/20',
    text: 'text-accent-foreground',
    glow: 'group-hover:shadow-accent/20',
  },
};

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

const categoryNameKeys: Record<string, string> = {
  time: 'cardCategoryTime',
  hints: 'cardCategoryHints',
  control: 'cardCategoryControl',
  score: 'cardCategoryScore',
  wild: 'cardCategoryWild',
};

export const CardSystemSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section id="card-system" className="relative z-10 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-display text-foreground text-center mb-4">
          {t('cardSystemTitle' as any)}
        </h2>
        <p className="text-center text-muted-foreground mb-4 max-w-2xl mx-auto">
          {t('cardSystemSubtitle' as any)}
        </p>
        <p className="text-center text-sm text-muted-foreground mb-14 max-w-2xl mx-auto">
          {t('cardSystemHow' as any)}
        </p>

        <div className="space-y-14">
          {cardCategories.map((cat) => {
            const accent = categoryAccents[cat.category];
            const Icon = cat.icon;

            return (
              <div key={cat.category}>
                {/* Chapter header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-10 h-10 rounded-xl ${accent.bg} border ${accent.border.split(' ')[0]} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${accent.text}`} />
                  </div>
                  <h3 className="text-2xl font-display text-foreground">
                    {t(categoryNameKeys[cat.category] as any)}
                  </h3>
                  <div className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent ml-4" />
                </div>

                {/* Cards grid */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {cat.cards.map((cardType) => {
                    const def = CARD_DEFINITIONS[cardType];
                    return (
                      <div
                        key={cardType}
                        className={`group relative bg-gradient-to-br from-card/90 via-card/70 to-card/50 backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${accent.border} ${accent.glow}`}
                      >
                        {/* Hover glow overlay */}
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${accent.bg}`} />

                        <div className="relative flex flex-col items-center text-center gap-3">
                          {/* Large centered icon */}
                          <div className={`w-16 h-16 rounded-xl ${accent.bg} border ${accent.border.split(' ')[0]} flex items-center justify-center text-4xl transition-transform duration-300 group-hover:scale-110`}>
                            {def.icon}
                          </div>

                          <div>
                            <h4 className="font-semibold text-foreground text-base mb-1">
                              {t(cardNameKeys[cardType] as any)}
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {t(cardDescKeys[cardType] as any)}
                            </p>
                          </div>
                        </div>

                        {/* Bottom accent line */}
                        <div className={`absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-gradient-to-r from-transparent via-current to-transparent opacity-20 ${accent.text}`} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Fusion & Joker info */}
        <div className="mt-14 bg-gradient-to-br from-accent/50 via-card/50 to-accent/20 border border-accent-foreground/20 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-accent/30 border border-accent-foreground/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-7 w-7 text-accent-foreground" />
          </div>
          <p className="text-xl font-display text-foreground mb-3">
            {t('cardFusionTitle' as any)}
          </p>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {t('cardFusionDesc' as any)}
          </p>
        </div>
      </div>
    </section>
  );
};
