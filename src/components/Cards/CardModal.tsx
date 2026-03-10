import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { useToastContext } from '@/contexts/ToastContext';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { CardInputModal } from '@/components/Cards/CardInputModal';
import { 
  CardType, 
  CARD_DEFINITIONS, 
  getShopCards, 
  canAffordCard, 
  canBuyCard,
  canFuseCards,
  MAX_HAND_SIZE,
  PlayerCard
} from '@/types/cards';
import { ShoppingCart, Package, Sparkles, Zap, Clock, Lightbulb, Gamepad2, Target, Wand2 } from 'lucide-react';

interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardPoints: number;
  playerCards: PlayerCard[];
  onBuyCard: (cardType: CardType) => Promise<void>;
  onActivateCard: (cardId: string, targetData?: {
    targetPlayerId?: string;
    targetContinent?: string;
    targetCountry?: string;
    targetCardId?: string;
  }) => Promise<void>;
  onFuseCards: (cardId1: string, cardId2: string) => Promise<void>;
  onRequestMapSelection?: (cardId: string) => void;
}

// Category config
const CATEGORIES = [
  { key: 'time', icon: Clock, label: 'Time', color: 'text-info' },
  { key: 'hints', icon: Lightbulb, label: 'Hints', color: 'text-warning' },
  { key: 'control', icon: Gamepad2, label: 'Control', color: 'text-success' },
  { key: 'score', icon: Target, label: 'Score', color: 'text-primary' },
  { key: 'wild', icon: Wand2, label: 'Wild', color: 'text-purple-400' },
] as const;

const CATEGORY_BG: Record<string, string> = {
  time: 'border-info/30 hover:border-info/60',
  hints: 'border-warning/30 hover:border-warning/60',
  control: 'border-success/30 hover:border-success/60',
  score: 'border-primary/30 hover:border-primary/60',
  wild: 'border-purple-400/30 hover:border-purple-400/60',
};

const CATEGORY_ACCENT: Record<string, string> = {
  time: 'bg-info/20 text-info',
  hints: 'bg-warning/20 text-warning',
  control: 'bg-success/20 text-success',
  score: 'bg-primary/20 text-primary',
  wild: 'bg-purple-400/20 text-purple-400',
};

export const CardModal: React.FC<CardModalProps> = ({
  isOpen,
  onClose,
  cardPoints,
  playerCards,
  onBuyCard,
  onActivateCard,
  onFuseCards,
  onRequestMapSelection,
}) => {
  const { t } = useLanguage();
  const { session, currentPlayer, getPlayersArray } = useGame();
  const { addToast } = useToastContext();
  
  const [selectedTab, setSelectedTab] = useState<'shop' | 'myCards'>('shop');
  const [fusionMode, setFusionMode] = useState(false);
  const [selectedForFusion, setSelectedForFusion] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State for cards requiring input
  const [pendingActivation, setPendingActivation] = useState<{ cardId: string; cardType: CardType } | null>(null);

  const shopCards = getShopCards();
  const unusedCards = playerCards.filter(c => !c.isActivated);
  const handFull = playerCards.length >= MAX_HAND_SIZE;
  const hasJoker = playerCards.some(c => c.cardType === 'joker');
  
  const canFuse = canFuseCards({ 
    cardPoints, 
    correctStreak: 0, 
    cards: playerCards, 
    pendingEffects: [] 
  });

  const handleBuyCard = async (cardType: CardType) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onBuyCard(cardType);
      addToast('success', t('cardPurchased'));
    } catch (error) {
      addToast('error', 'Failed to buy card');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActivateCard = async (cardId: string) => {
    if (isProcessing) return;
    
    // Find the card
    const playerCard = playerCards.find(c => c.id === cardId);
    if (!playerCard) return;
    
    const cardDef = CARD_DEFINITIONS[playerCard.cardType];
    
    // If card requires country input, use map selection instead of modal
    if (cardDef.requiresInput === 'country' && onRequestMapSelection) {
      onRequestMapSelection(cardId);
      return;
    }
    
    // If card requires other input, show input modal instead of activating directly
    if (cardDef.requiresInput) {
      setPendingActivation({ cardId, cardType: playerCard.cardType });
      return;
    }
    
    // Direct activation for cards without input requirements
    setIsProcessing(true);
    try {
      await onActivateCard(cardId);
      addToast('success', t('cardActivated'));
    } catch (error) {
      addToast('error', 'Failed to activate card');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputConfirm = async (targetData: {
    targetPlayerId?: string;
    targetContinent?: string;
    targetCountry?: string;
    targetCardId?: string;
  }) => {
    if (!pendingActivation || isProcessing) return;
    setIsProcessing(true);
    try {
      await onActivateCard(pendingActivation.cardId, targetData);
      addToast('success', t('cardActivated'));
      setPendingActivation(null);
    } catch (error) {
      addToast('error', 'Failed to activate card');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardClickForFusion = (cardId: string) => {
    if (selectedForFusion.includes(cardId)) {
      setSelectedForFusion(prev => prev.filter(id => id !== cardId));
    } else if (selectedForFusion.length < 2) {
      setSelectedForFusion(prev => [...prev, cardId]);
    }
  };

  const handleFuse = async () => {
    if (selectedForFusion.length !== 2 || isProcessing) return;
    setIsProcessing(true);
    try {
      await onFuseCards(selectedForFusion[0], selectedForFusion[1]);
      addToast('success', t('cardsFused'));
      setFusionMode(false);
      setSelectedForFusion([]);
    } catch (error) {
      addToast('error', 'Failed to fuse cards');
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelFusion = () => {
    setFusionMode(false);
    setSelectedForFusion([]);
  };

  // Group shop cards by category
  const groupedShopCards = CATEGORIES.map(cat => ({
    ...cat,
    cards: shopCards.filter(ct => CARD_DEFINITIONS[ct].category === cat.key),
  })).filter(g => g.cards.length > 0);

  // Determine input type for CardInputModal
  const getInputType = (cardType: CardType) => {
    const def = CARD_DEFINITIONS[cardType];
    return def.requiresInput || 'player';
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md bg-card border-border/50 p-0 [&>button]:top-3 [&>button]:right-3 [&>button]:z-10 max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-warning" />
              <DialogTitle className="text-lg font-display">{t('cardMode')}</DialogTitle>
            </div>
            <Badge variant="secondary" className="text-sm px-3 py-1.5 mr-8 gap-1.5">
              <Zap className="h-3.5 w-3.5 text-warning" />
              {cardPoints} pts
            </Badge>
          </div>

          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'shop' | 'myCards')} className="flex flex-col flex-1 min-h-0">
            <div className="px-5 shrink-0">
              <TabsList className="grid w-full grid-cols-2 h-9">
                <TabsTrigger value="shop" className="gap-1.5 text-xs">
                  <ShoppingCart className="h-3.5 w-3.5" />
                  {t('shop')}
                </TabsTrigger>
                <TabsTrigger value="myCards" className="gap-1.5 text-xs">
                  <Package className="h-3.5 w-3.5" />
                  {t('myCards')} ({unusedCards.length}/{MAX_HAND_SIZE})
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Shop Tab */}
            <TabsContent value="shop" className="mt-0 px-5 pb-5 pt-3 flex-1 overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                {groupedShopCards.map(({ key, icon: Icon, label, color, cards }) => (
                  <div key={key}>
                    {/* Category header */}
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                      <span className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</span>
                      <div className="flex-1 h-px bg-border/50" />
                    </div>
                    {/* Cards grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {cards.map((cardType) => {
                        const card = CARD_DEFINITIONS[cardType];
                        const affordable = canAffordCard(cardPoints, cardType);
                        const canBuy = canBuyCard(
                          { cardPoints, correctStreak: 0, cards: playerCards, pendingEffects: [] },
                          cardType
                        );
                        const isJokerBlocked = cardType === 'joker' && hasJoker;

                        return (
                          <button
                            key={cardType}
                            onClick={() => canBuy && handleBuyCard(cardType)}
                            disabled={!canBuy || isProcessing}
                            className={`
                              relative flex items-start gap-2.5 p-2.5 rounded-lg border transition-all duration-200 text-left
                              ${canBuy 
                                ? `bg-secondary/20 ${CATEGORY_BG[key]} hover:bg-secondary/40 hover:scale-[1.02] cursor-pointer` 
                                : 'bg-muted/10 border-muted/20 opacity-35 cursor-not-allowed'}
                            `}
                          >
                            <span className="text-xl shrink-0 mt-0.5">{card.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs text-foreground leading-tight">{card.name}</p>
                              <p className="text-[10px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">{card.description}</p>
                              <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${affordable ? CATEGORY_ACCENT[key] : 'bg-destructive/20 text-destructive'}`}>
                                {card.cost} pt{card.cost > 1 ? 's' : ''}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* My Cards Tab */}
            <TabsContent value="myCards" className="mt-0 px-5 pb-5 pt-3 flex-1 overflow-y-auto custom-scrollbar">
              {/* Fusion Controls */}
              {canFuse && (
                <div className="mb-3 p-2.5 bg-secondary/20 rounded-lg border border-border/40">
                  {fusionMode ? (
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-muted-foreground">
                        Select 2 cards ({selectedForFusion.length}/2)
                      </p>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" onClick={cancelFusion} className="h-6 text-[10px] px-2">
                          {t('cancel')}
                        </Button>
                        <Button
                          size="sm"
                          variant="netflix"
                          onClick={handleFuse}
                          disabled={selectedForFusion.length !== 2 || isProcessing}
                          className="h-6 text-[10px] px-2"
                        >
                          {t('fuseCards')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setFusionMode(true)}
                      className="w-full gap-1.5 h-7 text-[11px]"
                    >
                      <Zap className="h-3 w-3" />
                      {t('fuseCards')} → 🃏 Joker
                    </Button>
                  )}
                </div>
              )}

              {unusedCards.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No cards yet. Buy from the shop!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {unusedCards.map((playerCard) => {
                    const card = CARD_DEFINITIONS[playerCard.cardType];
                    const isSelectedForFusion = selectedForFusion.includes(playerCard.id);
                    const isJoker = playerCard.cardType === 'joker';
                    const catConfig = CATEGORIES.find(c => c.key === card.category);
                    const needsInput = !!card.requiresInput;

                    return (
                      <button
                        key={playerCard.id}
                        onClick={() => {
                          if (fusionMode && !isJoker) {
                            handleCardClickForFusion(playerCard.id);
                          } else if (!fusionMode) {
                            handleActivateCard(playerCard.id);
                          }
                        }}
                        disabled={isProcessing || (fusionMode && isJoker)}
                        className={`
                          w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 text-left
                          ${isSelectedForFusion 
                            ? 'border-primary bg-primary/15 ring-1 ring-primary' 
                            : `bg-secondary/20 ${CATEGORY_BG[card.category]} hover:bg-secondary/40 hover:scale-[1.01]`}
                          ${fusionMode && isJoker ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        <span className="text-2xl shrink-0">{card.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground">{card.name}</p>
                          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{card.description}</p>
                        </div>
                        {!fusionMode && (
                          <span className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-md ${CATEGORY_ACCENT[card.category]}`}>
                            {needsInput ? '⚡ Use' : '⚡ Activate'}
                          </span>
                        )}
                        {isSelectedForFusion && (
                          <div className="shrink-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-[10px] font-bold">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Input Modal for targeted cards */}
      {pendingActivation && (
        <CardInputModal
          isOpen={true}
          onClose={() => setPendingActivation(null)}
          cardType={pendingActivation.cardType}
          inputType={getInputType(pendingActivation.cardType)}
          onConfirm={handleInputConfirm}
        />
      )}
    </>
  );
};
