 import React, { useState } from 'react';
 import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Badge } from '@/components/ui/badge';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { useGame } from '@/contexts/GameContext';
 import { useToastContext } from '@/contexts/ToastContext';
 import { GameTooltip } from '@/components/Tooltip/GameTooltip';
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
 import { ShoppingCart, Package, Sparkles, Zap } from 'lucide-react';
 
 interface CardModalProps {
   isOpen: boolean;
   onClose: () => void;
   cardPoints: number;
   playerCards: PlayerCard[];
   onBuyCard: (cardType: CardType) => Promise<void>;
   onActivateCard: (cardId: string) => Promise<void>;
   onFuseCards: (cardId1: string, cardId2: string) => Promise<void>;
 }
 
 export const CardModal: React.FC<CardModalProps> = ({
   isOpen,
   onClose,
   cardPoints,
   playerCards,
   onBuyCard,
   onActivateCard,
   onFuseCards,
 }) => {
   const { t } = useLanguage();
   const { session, currentPlayer, getPlayersArray } = useGame();
   const { addToast } = useToastContext();
   
   const [selectedTab, setSelectedTab] = useState<'shop' | 'myCards'>('shop');
   const [fusionMode, setFusionMode] = useState(false);
   const [selectedForFusion, setSelectedForFusion] = useState<string[]>([]);
   const [isProcessing, setIsProcessing] = useState(false);
 
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
 
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-card border-border/50 p-0 overflow-hidden [&>button]:top-4 [&>button]:right-4 [&>button]:z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-warning" />
            <DialogTitle className="text-xl font-display">{t('cardMode')}</DialogTitle>
          </div>
          <Badge variant="secondary" className="text-sm px-3 py-1.5 mr-8">
            <Zap className="h-3.5 w-3.5 mr-1.5 text-warning" />
            {cardPoints} {t('cardPoints')}
          </Badge>
        </div>

        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'shop' | 'myCards')}>
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2 h-10">
              <TabsTrigger value="shop" className="gap-2 text-sm">
                <ShoppingCart className="h-3.5 w-3.5" />
                {t('shop')}
              </TabsTrigger>
              <TabsTrigger value="myCards" className="gap-2 text-sm">
                <Package className="h-3.5 w-3.5" />
                {t('myCards')} ({unusedCards.length}/{MAX_HAND_SIZE})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="shop" className="mt-0 px-6 pb-6 pt-4">
            <div className="grid grid-cols-3 gap-2.5">
              {shopCards.map((cardType) => {
                const card = CARD_DEFINITIONS[cardType];
                const affordable = canAffordCard(cardPoints, cardType);
                const canBuy = canBuyCard(
                  { cardPoints, correctStreak: 0, cards: playerCards, pendingEffects: [] },
                  cardType
                );
                const isJokerBlocked = cardType === 'joker' && hasJoker;

                return (
                  <GameTooltip
                    key={cardType}
                    content={
                      !affordable 
                        ? `${card.cost} ${t('cardPoints')} ${t('cannotAfford')}`
                        : handFull 
                          ? t('handFull')
                          : isJokerBlocked
                            ? 'Max 1 Joker'
                            : card.description
                    }
                    position="top"
                  >
                    <button
                      onClick={() => canBuy && handleBuyCard(cardType)}
                      disabled={!canBuy || isProcessing}
                      className={`
                        relative flex flex-col items-center p-3 rounded-lg border transition-all duration-200
                        ${canBuy 
                          ? 'bg-secondary/30 border-border/50 hover:border-primary/60 hover:bg-secondary/60 hover:scale-[1.03] cursor-pointer' 
                          : 'bg-muted/20 border-muted/30 opacity-40 cursor-not-allowed'}
                      `}
                    >
                      <div className="text-2xl mb-1.5">{card.icon}</div>
                      <p className="font-medium text-xs text-foreground leading-tight text-center">{card.name}</p>
                      <span className={`mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${affordable ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                        {card.cost} pts
                      </span>
                    </button>
                  </GameTooltip>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="myCards" className="mt-0 px-6 pb-6 pt-4">
            {/* Fusion Controls */}
            {canFuse && (
              <div className="mb-3 p-3 bg-secondary/30 rounded-lg border border-border/50">
                {fusionMode ? (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      Select 2 cards to fuse ({selectedForFusion.length}/2)
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={cancelFusion} className="h-7 text-xs">
                        {t('cancel')}
                      </Button>
                      <Button
                        size="sm"
                        variant="netflix"
                        onClick={handleFuse}
                        disabled={selectedForFusion.length !== 2 || isProcessing}
                        className="h-7 text-xs"
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
                    className="w-full gap-2 h-8 text-xs"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    {t('fuseCards')} - {t('fuseCardsDesc')}
                  </Button>
                )}
              </div>
            )}

            {unusedCards.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No cards yet. Buy from the shop!</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2.5">
                {unusedCards.map((playerCard) => {
                  const card = CARD_DEFINITIONS[playerCard.cardType];
                  const isSelectedForFusion = selectedForFusion.includes(playerCard.id);
                  const isJoker = playerCard.cardType === 'joker';

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
                        relative flex flex-col items-center p-3 rounded-lg border transition-all duration-200
                        ${isSelectedForFusion 
                          ? 'border-primary bg-primary/15 ring-1 ring-primary' 
                          : 'bg-secondary/30 border-border/50 hover:border-primary/60 hover:bg-secondary/60 hover:scale-[1.03]'}
                        ${fusionMode && isJoker ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <div className="text-2xl mb-1.5">{card.icon}</div>
                      <p className="font-medium text-xs text-foreground leading-tight text-center">{card.name}</p>
                      {!fusionMode && (
                        <span className="mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent/50 text-accent-foreground">
                          {t('activateCard')}
                        </span>
                      )}
                      {isSelectedForFusion && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-[10px] font-bold">
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
  );
 };