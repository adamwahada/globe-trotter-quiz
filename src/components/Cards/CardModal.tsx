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
       <DialogContent className="max-w-2xl bg-card border-border">
         <DialogHeader>
           <DialogTitle className="flex items-center gap-3 text-2xl font-display">
             <Sparkles className="h-6 w-6 text-warning" />
             {t('cardMode')}
             <Badge variant="secondary" className="ml-auto text-lg px-3 py-1">
               <Zap className="h-4 w-4 mr-1 text-warning" />
               {cardPoints} {t('cardPoints')}
             </Badge>
           </DialogTitle>
         </DialogHeader>
 
         <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'shop' | 'myCards')}>
           <TabsList className="grid w-full grid-cols-2">
             <TabsTrigger value="shop" className="gap-2">
               <ShoppingCart className="h-4 w-4" />
               {t('shop')}
             </TabsTrigger>
             <TabsTrigger value="myCards" className="gap-2">
               <Package className="h-4 w-4" />
               {t('myCards')} ({unusedCards.length}/{MAX_HAND_SIZE})
             </TabsTrigger>
           </TabsList>
 
           <TabsContent value="shop" className="mt-4">
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-1">
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
                         relative p-4 rounded-xl border transition-all duration-300
                         ${canBuy 
                           ? 'bg-secondary/50 border-border hover:border-primary hover:scale-105 hover:shadow-lg hover:shadow-primary/20 cursor-pointer' 
                           : 'bg-muted/30 border-muted opacity-50 cursor-not-allowed'}
                       `}
                     >
                       <div className="text-3xl mb-2">{card.icon}</div>
                       <p className="font-medium text-sm text-foreground">{card.name}</p>
                       <Badge 
                         variant={affordable ? 'default' : 'destructive'} 
                         className="mt-2 text-xs"
                       >
                         {card.cost} pts
                       </Badge>
                     </button>
                   </GameTooltip>
                 );
               })}
             </div>
           </TabsContent>
 
           <TabsContent value="myCards" className="mt-4">
             {/* Fusion Controls */}
             {canFuse && (
               <div className="mb-4 p-3 bg-secondary/50 rounded-lg border border-border">
                 {fusionMode ? (
                   <div className="flex items-center justify-between">
                     <p className="text-sm text-muted-foreground">
                       Select 2 cards to fuse into a Joker ({selectedForFusion.length}/2)
                     </p>
                     <div className="flex gap-2">
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={cancelFusion}
                       >
                         {t('cancel')}
                       </Button>
                       <Button
                         size="sm"
                         variant="netflix"
                         onClick={handleFuse}
                         disabled={selectedForFusion.length !== 2 || isProcessing}
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
                     className="w-full gap-2"
                   >
                     <Zap className="h-4 w-4" />
                     {t('fuseCards')} - {t('fuseCardsDesc')}
                   </Button>
                 )}
               </div>
             )}
 
             {unusedCards.length === 0 ? (
               <div className="text-center py-12 text-muted-foreground">
                 <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                 <p>No cards yet. Buy from the shop!</p>
               </div>
             ) : (
               <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-1">
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
                         relative p-4 rounded-xl border transition-all duration-300
                         ${isSelectedForFusion 
                           ? 'border-primary bg-primary/20 ring-2 ring-primary' 
                           : 'bg-secondary/50 border-border hover:border-primary hover:scale-105'}
                         ${fusionMode && isJoker ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                       `}
                     >
                       <div className="text-3xl mb-2">{card.icon}</div>
                       <p className="font-medium text-sm text-foreground">{card.name}</p>
                       {!fusionMode && (
                         <Badge variant="secondary" className="mt-2 text-xs">
                           {t('activateCard')}
                         </Badge>
                       )}
                       {isSelectedForFusion && (
                         <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-bold">
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