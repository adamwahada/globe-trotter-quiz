import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CARD_DEFINITIONS, CardType } from '@/types/cards';

const cardCategories = [
  {
    category: 'time' as const,
    cards: ['timeBoost', 'timeSteal'] as CardType[],
  },
  {
    category: 'hints' as const,
    cards: ['extraHint', 'hintBlock'] as CardType[],
  },
  {
    category: 'control' as const,
    cards: ['skipNextPlayer', 'pickYourCountry', 'pickYourContinent', 'forcedContinent'] as CardType[],
  },
  {
    category: 'score' as const,
    cards: ['doublePoints', 'pointStrike'] as CardType[],
  },
  {
    category: 'wild' as const,
    cards: ['joker'] as CardType[],
  },
];

const categoryColors: Record<string, string> = {
  time: 'border-info/40 hover:border-info/70',
  hints: 'border-warning/40 hover:border-warning/70',
  control: 'border-primary/40 hover:border-primary/70',
  score: 'border-success/40 hover:border-success/70',
  wild: 'border-accent-foreground/40 hover:border-accent-foreground/70',
};

const categoryBgColors: Record<string, string> = {
  time: 'bg-info/10',
  hints: 'bg-warning/10',
  control: 'bg-primary/10',
  score: 'bg-success/10',
  wild: 'bg-accent/20',
};

// Map card type to translation key for card name
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

// Map card type to translation key for card description on landing page
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

// Map category name to translation key
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
        <p className="text-center text-muted-foreground mb-4">
          {t('cardSystemSubtitle' as any)}
        </p>
        <p className="text-center text-sm text-muted-foreground mb-12 max-w-2xl mx-auto">
          {t('cardSystemHow' as any)}
        </p>

        {/* Card categories */}
        <div className="space-y-8">
          {cardCategories.map((cat) => (
            <div key={cat.category}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${categoryBgColors[cat.category]} text-foreground border ${categoryColors[cat.category].split(' ')[0]}`}>
                  {t(categoryNameKeys[cat.category] as any)}
                </div>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {cat.cards.map((cardType) => {
                  const def = CARD_DEFINITIONS[cardType];
                  return (
                    <div
                      key={cardType}
                      className={`group relative bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl rounded-xl p-4 border transition-all duration-300 hover:shadow-md ${categoryColors[cat.category]}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg ${categoryBgColors[cat.category]} flex items-center justify-center shrink-0 text-xl`}>
                          {def.icon}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-foreground text-sm mb-1">
                            {t(cardNameKeys[cardType] as any)}
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {t(cardDescKeys[cardType] as any)}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs font-medium text-primary">
                              {def.cost} {t('cardPoints')}
                            </span>
                            {def.requiresInput && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                                {t('cardRequiresInput' as any)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Fusion & Joker info */}
        <div className="mt-10 bg-gradient-to-br from-accent/50 via-card/50 to-accent/20 border border-accent-foreground/20 rounded-2xl p-6 text-center">
          <p className="text-lg font-display text-foreground mb-2">
            {t('cardFusionTitle' as any)}
          </p>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            {t('cardFusionDesc' as any)}
          </p>
        </div>
      </div>
    </section>
  );
};
