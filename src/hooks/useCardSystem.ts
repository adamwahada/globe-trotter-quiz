 import { useCallback } from 'react';
 import { useGame } from '@/contexts/GameContext';
 import { useToastContext } from '@/contexts/ToastContext';
 import { useLanguage } from '@/contexts/LanguageContext';
 import {
   CardType,
   PlayerCard,
   ActiveCardEffect,
   CARD_DEFINITIONS,
   MAX_HAND_SIZE,
   STREAK_FOR_POINT,
   canBuyCard,
 } from '@/types/cards';
 import { PlayersMap } from '@/types/game';

 export const useCardSystem = () => {
   const { session, currentPlayer, updateGameState, updatePlayerMetadata, getPlayersArray } = useGame();
   const { addToast } = useToastContext();
   const { t } = useLanguage();

   const isCardModeEnabled = session?.cardModeEnabled && session?.gameMode === 'turnBased' && !session?.isSoloMode;

   // Get current player's card state
   const cardPoints = currentPlayer?.cardPoints || 0;
   const correctStreak = currentPlayer?.correctStreak || 0;
   const playerCards: PlayerCard[] = currentPlayer?.playerCards || [];
   const activeEffects: ActiveCardEffect[] = session?.activeCardEffects || [];

   // Handle streak update after correct/wrong answer
   const updateStreak = useCallback(async (isCorrect: boolean) => {
     if (!isCardModeEnabled || !currentPlayer || !session) return;

     const currentStreak = currentPlayer.correctStreak || 0;

     if (isCorrect) {
       const newStreak = currentStreak + 1;

       // Check if we've earned a card point
       if (newStreak >= STREAK_FOR_POINT) {
         const newCardPoints = (currentPlayer.cardPoints || 0) + 1;
         await updatePlayerMetadata({
           correctStreak: 0, // Reset streak after earning point
           cardPoints: newCardPoints,
         });
         addToast('game', t('streakBonus'));
       } else {
         await updatePlayerMetadata({ correctStreak: newStreak });
       }
     } else {
       // Reset streak on wrong answer
       if (currentStreak > 0) {
         await updatePlayerMetadata({ correctStreak: 0 });
       }
     }
   }, [isCardModeEnabled, currentPlayer, session, updatePlayerMetadata, addToast, t]);

   // Buy a card from the shop
   const buyCard = useCallback(async (cardType: CardType) => {
     if (!isCardModeEnabled || !currentPlayer || !session) {
       throw new Error('Card mode not enabled');
     }

     const state = {
       cardPoints: currentPlayer.cardPoints || 0,
       correctStreak: currentPlayer.correctStreak || 0,
       cards: currentPlayer.playerCards || [],
       pendingEffects: [],
     };

     if (!canBuyCard(state, cardType)) {
       throw new Error('Cannot buy this card');
     }

     const card = CARD_DEFINITIONS[cardType];
     const newCard: PlayerCard = {
       id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
       cardType,
       acquiredAt: Date.now(),
       isActivated: false,
     };

     const currentCards = currentPlayer.playerCards || [];
     await updatePlayerMetadata({
       cardPoints: (currentPlayer.cardPoints || 0) - card.cost,
       playerCards: [...currentCards, newCard],
     });
   }, [isCardModeEnabled, currentPlayer, session, updatePlayerMetadata]);

   // Activate a card
   const activateCard = useCallback(async (cardId: string, targetData?: {
     targetPlayerId?: string;
     targetContinent?: string;
     targetCountry?: string;
     targetCardId?: string;
   }) => {
     if (!isCardModeEnabled || !currentPlayer || !session) {
       throw new Error('Card mode not enabled');
     }

     const currentCards = currentPlayer.playerCards || [];
     const cardToActivate = currentCards.find(c => c.id === cardId && !c.isActivated);

     if (!cardToActivate) {
       throw new Error('Card not found or already activated');
     }

     const players = getPlayersArray();
     const playerUids = players.map(p => p.id);
     const currentTurnIndex = session.currentTurn || 0;
     const nextPlayerIndex = (currentTurnIndex + 1) % players.length;
     const nextPlayerId = playerUids[nextPlayerIndex];

     // Create the effect based on card type
     const cardDef = CARD_DEFINITIONS[cardToActivate.cardType];
     let newEffect: ActiveCardEffect | null = null;

     // Determine target player
     let targetPlayerId = targetData?.targetPlayerId || currentPlayer.id;

     // Some cards automatically target the next player
     const nextPlayerTargetCards: CardType[] = ['timeSteal', 'hintBlock', 'skipNextPlayer'];
     if (nextPlayerTargetCards.includes(cardToActivate.cardType)) {
       targetPlayerId = nextPlayerId;
     }

     // Self-targeting cards
     const selfTargetCards: CardType[] = ['timeBoost', 'extraHint', 'doublePoints', 'pickYourCountry', 'pickYourContinent'];
     if (selfTargetCards.includes(cardToActivate.cardType)) {
       targetPlayerId = currentPlayer.id;
     }

     // Calculate when effect expires (after the affected player's next turn)
     const expiresAfterTurn = targetPlayerId === currentPlayer.id
       ? currentTurnIndex + players.length // After my next turn
       : targetPlayerId === nextPlayerId
         ? currentTurnIndex + 1 // After next player's turn
         : currentTurnIndex + players.length; // Default

      // Build effect object, excluding undefined values (Firebase rejects undefined)
      const effectBase: ActiveCardEffect = {
        cardType: cardToActivate.cardType,
        sourcePlayerId: currentPlayer.id,
        targetPlayerId,
        expiresAfterTurn,
        appliedAt: Date.now(),
      };
      if (targetData?.targetContinent) effectBase.targetContinent = targetData.targetContinent;
      if (targetData?.targetCountry) effectBase.targetCountry = targetData.targetCountry;
      if (targetData?.targetCardId) effectBase.targetCardId = targetData.targetCardId;
      newEffect = effectBase;

     // Handle Joker (steal card) immediately
     if (cardToActivate.cardType === 'joker' && targetData?.targetPlayerId && targetData?.targetCardId) {
       const targetPlayer = players.find(p => p.id === targetData.targetPlayerId);
       if (targetPlayer && targetPlayer.playerCards) {
         const targetCards = targetPlayer.playerCards || [];
         const stolenCard = targetCards.find(c => c.id === targetData.targetCardId && !c.isActivated);

         if (stolenCard) {
           // Remove from target, add to current player
           const newStolenCard: PlayerCard = {
             ...stolenCard,
             id: `${Date.now()}-stolen-${Math.random().toString(36).substr(2, 9)}`,
             acquiredAt: Date.now(),
           };

           const updatedTargetCards = targetCards.filter(c => c.id !== targetData.targetCardId);
           const updatedCurrentCards = currentCards.filter(c => c.id !== cardId);
           updatedCurrentCards.push(newStolenCard);

           // Update both players
           const updatedPlayers: PlayersMap = {
             ...session.players,
             [targetData.targetPlayerId]: {
               ...session.players[targetData.targetPlayerId],
               playerCards: updatedTargetCards,
             },
             [currentPlayer.id]: {
               ...session.players[currentPlayer.id],
               playerCards: updatedCurrentCards,
             },
           };

           await updateGameState({ players: updatedPlayers });

           // Notify the target player
           addToast('info', t('youStoleCard', { card: CARD_DEFINITIONS[stolenCard.cardType].name }));
           return;
         }
       }
     }

     // Mark card as activated and add effect
     const updatedCards = currentCards.map(c =>
       c.id === cardId ? { ...c, isActivated: true, activatedAt: Date.now() } : c
     );

     const currentEffects = session.activeCardEffects || [];
     const newEffects = newEffect ? [...currentEffects, newEffect] : currentEffects;

     await updatePlayerMetadata({ playerCards: updatedCards });
     await updateGameState({ activeCardEffects: newEffects });

     // Notify affected player if it's someone else
     if (targetPlayerId !== currentPlayer.id) {
       const effectMessages: Partial<Record<CardType, string>> = {
         timeSteal: 'timeStealApplied',
         hintBlock: 'hintsBlocked',
         skipNextPlayer: 'turnSkippedByCard',
         pointStrike: 'pointStrikeActive',
       };

       const messageKey = effectMessages[cardToActivate.cardType];
       if (messageKey) {
         // The target player will see this via real-time sync
       }
     }
   }, [isCardModeEnabled, currentPlayer, session, getPlayersArray, updatePlayerMetadata, updateGameState, addToast, t]);

   // Fuse two cards into a Joker
   const fuseCards = useCallback(async (cardId1: string, cardId2: string) => {
     if (!isCardModeEnabled || !currentPlayer) {
       throw new Error('Card mode not enabled');
     }

     const currentCards = currentPlayer.playerCards || [];
     const card1 = currentCards.find(c => c.id === cardId1 && !c.isActivated && c.cardType !== 'joker');
     const card2 = currentCards.find(c => c.id === cardId2 && !c.isActivated && c.cardType !== 'joker');

     if (!card1 || !card2) {
       throw new Error('Invalid cards for fusion');
     }

     // Check if already has joker
     if (currentCards.some(c => c.cardType === 'joker')) {
       throw new Error('Already have a Joker');
     }

     const newJoker: PlayerCard = {
       id: `${Date.now()}-joker-${Math.random().toString(36).substr(2, 9)}`,
       cardType: 'joker',
       acquiredAt: Date.now(),
       isActivated: false,
     };

     const updatedCards = currentCards
       .filter(c => c.id !== cardId1 && c.id !== cardId2)
       .concat(newJoker);

     await updatePlayerMetadata({ playerCards: updatedCards });
   }, [isCardModeEnabled, currentPlayer, updatePlayerMetadata]);

   // Get effects affecting the current player
   const getMyActiveEffects = useCallback(() => {
     if (!currentPlayer) return [];
     return activeEffects.filter(e => e.targetPlayerId === currentPlayer.id);
   }, [activeEffects, currentPlayer]);

   // Check if player has a specific effect
   const hasEffect = useCallback((cardType: CardType) => {
     return getMyActiveEffects().some(e => e.cardType === cardType);
   }, [getMyActiveEffects]);

   // Apply card effects at the start of a turn
   // Returns modifications to apply to the game state
   const applyCardEffects = useCallback(async (playerId: string): Promise<{
     timeBonusSeconds: number;
     extraHints: number;
     forcedContinent?: string;
     forcedCountry?: string;
     skipTurn: boolean;
     hintsBlocked: boolean;
     doublePoints: boolean;
     pointStrike?: { targetPlayerId: string; penalty: number };
   }> => {
     if (!session?.activeCardEffects?.length || !session) {
       return {
         timeBonusSeconds: 0,
         extraHints: 0,
         skipTurn: false,
         hintsBlocked: false,
         doublePoints: false,
       };
     }

     const currentTurn = session.currentTurn || 0;
     const playerEffects = session.activeCardEffects.filter(
       e => e.targetPlayerId === playerId && e.expiresAfterTurn >= currentTurn
     );

     const result: {
       timeBonusSeconds: number;
       extraHints: number;
       skipTurn: boolean;
       hintsBlocked: boolean;
       doublePoints: boolean;
       forcedContinent?: string;
       forcedCountry?: string;
       pointStrike?: { targetPlayerId: string; penalty: number };
     } = {
       timeBonusSeconds: 0,
       extraHints: 0,
       skipTurn: false,
       hintsBlocked: false,
       doublePoints: false,
     };

     const effectsToRemove: string[] = [];

     for (const effect of playerEffects) {
       switch (effect.cardType) {
         case 'timeBoost':
           result.timeBonusSeconds += 15;
           effectsToRemove.push(`${effect.sourcePlayerId}-${effect.cardType}-${effect.appliedAt}`);
           break;
         case 'timeSteal':
           result.timeBonusSeconds += 15;
           effectsToRemove.push(`${effect.sourcePlayerId}-${effect.cardType}-${effect.appliedAt}`);
           break;
         case 'extraHint':
           result.extraHints += 1;
           effectsToRemove.push(`${effect.sourcePlayerId}-${effect.cardType}-${effect.appliedAt}`);
           break;
         case 'hintBlock':
           result.hintsBlocked = true;
           effectsToRemove.push(`${effect.sourcePlayerId}-${effect.cardType}-${effect.appliedAt}`);
           break;
         case 'forcedContinent':
           result.forcedContinent = effect.targetContinent;
           effectsToRemove.push(`${effect.sourcePlayerId}-${effect.cardType}-${effect.appliedAt}`);
           break;
         case 'pickYourCountry':
           result.forcedCountry = effect.targetCountry;
           effectsToRemove.push(`${effect.sourcePlayerId}-${effect.cardType}-${effect.appliedAt}`);
           break;
         case 'pickYourContinent':
           result.forcedContinent = effect.targetContinent;
           effectsToRemove.push(`${effect.sourcePlayerId}-${effect.cardType}-${effect.appliedAt}`);
           break;
         case 'skipNextPlayer':
           result.skipTurn = true;
           effectsToRemove.push(`${effect.sourcePlayerId}-${effect.cardType}-${effect.appliedAt}`);
           break;
         case 'doublePoints':
           result.doublePoints = true;
           effectsToRemove.push(`${effect.sourcePlayerId}-${effect.cardType}-${effect.appliedAt}`);
           break;
         case 'pointStrike':
           result.pointStrike = { targetPlayerId: playerId, penalty: 10 };
           effectsToRemove.push(`${effect.sourcePlayerId}-${effect.cardType}-${effect.appliedAt}`);
           break;
       }
     }

     // Remove applied effects
     if (effectsToRemove.length > 0) {
       const remainingEffects = session.activeCardEffects.filter(
         e => !effectsToRemove.includes(`${e.sourcePlayerId}-${e.cardType}-${e.appliedAt}`)
       );
       await updateGameState({ activeCardEffects: remainingEffects });
     }

     return result;
   }, [session, updateGameState]);

   // Clean up expired effects (call this at the end of each turn)
   const cleanupExpiredEffects = useCallback(async () => {
     if (!session?.activeCardEffects?.length) return;

     const currentTurn = session.currentTurn || 0;
     const remainingEffects = session.activeCardEffects.filter(
       e => e.expiresAfterTurn > currentTurn
     );

     if (remainingEffects.length !== session.activeCardEffects.length) {
       await updateGameState({ activeCardEffects: remainingEffects });
     }
   }, [session, updateGameState]);

   return {
     isCardModeEnabled,
     cardPoints,
     correctStreak,
     playerCards,
     activeEffects,
     updateStreak,
     buyCard,
     activateCard,
     fuseCards,
     getMyActiveEffects,
     hasEffect,
     applyCardEffects,
     cleanupExpiredEffects,
   };
 };
