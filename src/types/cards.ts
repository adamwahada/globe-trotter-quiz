 // Card system types for multiplayer turn-based mode
 
 export type CardType = 
   | 'timeBoost'
   | 'timeSteal'
   | 'extraHint'
   | 'hintBlock'
   | 'forcedContinent'
   | 'pickYourCountry'
   | 'pickYourContinent'
   | 'skipNextPlayer'
   | 'doublePoints'
   | 'pointStrike'
   | 'joker';
 
 export interface Card {
   id: string;
   type: CardType;
   name: string;
   description: string;
   cost: number; // Card points needed to buy
   icon: string; // Emoji or icon name
   category: 'time' | 'hints' | 'control' | 'score' | 'wild';
   requiresInput?: 'country' | 'continent' | 'player' | 'playerCard';
 }
 
 export interface PlayerCard {
   id: string; // Unique instance ID
   cardType: CardType;
   acquiredAt: number;
   isActivated: boolean;
   activatedAt?: number;
   // For cards requiring input, store the selection
   targetPlayerId?: string;
   targetContinent?: string;
   targetCountry?: string;
   targetCardId?: string;
 }
 
 export interface ActiveCardEffect {
   cardType: CardType;
   sourcePlayerId: string;
   targetPlayerId: string;
   expiresAfterTurn: number; // Turn index when effect expires
   appliedAt: number;
   // Effect-specific data
   targetContinent?: string;
   targetCountry?: string;
   targetCardId?: string;
 }
 
 export interface PlayerCardState {
   cardPoints: number;
   correctStreak: number; // Consecutive correct answers
   cards: PlayerCard[];
   pendingEffects: ActiveCardEffect[]; // Effects to apply on next turn
 }
 
 // Card definitions
 export const CARD_DEFINITIONS: Record<CardType, Omit<Card, 'id'>> = {
   timeBoost: {
     type: 'timeBoost',
     name: 'Time Boost',
     description: 'Gain +15 seconds on your next turn',
     cost: 1,
     icon: '⏱️',
     category: 'time',
   },
   timeSteal: {
     type: 'timeSteal',
     name: 'Time Steal',
     description: 'Steal 15 seconds from the next player',
     cost: 1,
     icon: '⏳',
     category: 'time',
   },
   extraHint: {
     type: 'extraHint',
     name: 'Extra Hint',
     description: '+1 free hint on your next attempt',
     cost: 1,
     icon: '💡',
     category: 'hints',
   },
   hintBlock: {
     type: 'hintBlock',
     name: 'Hint Block',
     description: 'Next player cannot use hints on their next attempt',
     cost: 1,
     icon: '🚫',
     category: 'hints',
   },
   forcedContinent: {
     type: 'forcedContinent',
     name: 'Forced Continent',
     description: 'Next country comes from a continent you choose',
     cost: 1,
     icon: '🌍',
     category: 'control',
     requiresInput: 'continent',
   },
   pickYourCountry: {
     type: 'pickYourCountry',
     name: 'Pick Your Country',
     description: 'Choose your next country to guess',
     cost: 1,
     icon: '📍',
     category: 'control',
     requiresInput: 'country',
   },
   pickYourContinent: {
     type: 'pickYourContinent',
     name: 'Pick Your Continent',
     description: 'Choose continent for your next country',
     cost: 1,
     icon: '🗺️',
     category: 'control',
     requiresInput: 'continent',
   },
   skipNextPlayer: {
     type: 'skipNextPlayer',
     name: 'Skip Next Player',
     description: "Skip the next player's turn",
     cost: 1,
     icon: '⏭️',
     category: 'control',
   },
   doublePoints: {
     type: 'doublePoints',
     name: 'Double Points',
     description: 'Next correct answer gives x2 points',
     cost: 1,
     icon: '✖️2️⃣',
     category: 'score',
   },
   pointStrike: {
     type: 'pointStrike',
     name: 'Point Strike',
     description: 'Target player loses 10 points if they answer wrong',
     cost: 1,
     icon: '💣',
     category: 'score',
     requiresInput: 'player',
   },
   joker: {
     type: 'joker',
     name: 'Joker',
     description: 'Steal any unused card from another player',
     cost: 2,
     icon: '🃏',
     category: 'wild',
     requiresInput: 'playerCard',
   },
 };
 
 export const MAX_HAND_SIZE = 3;
 export const MAX_JOKERS = 1;
 export const STREAK_FOR_POINT = 3;
 
 // Helper functions
 export const getCardDefinition = (type: CardType): Card => ({
   id: type,
   ...CARD_DEFINITIONS[type],
 });
 
 export const canAffordCard = (points: number, cardType: CardType): boolean => {
   return points >= CARD_DEFINITIONS[cardType].cost;
 };
 
 export const canBuyCard = (state: PlayerCardState, cardType: CardType): boolean => {
   if (state.cards.length >= MAX_HAND_SIZE) return false;
   if (!canAffordCard(state.cardPoints, cardType)) return false;
   if (cardType === 'joker' && state.cards.some(c => c.cardType === 'joker')) return false;
   return true;
 };
 
 export const canFuseCards = (state: PlayerCardState): boolean => {
   const unusedCards = state.cards.filter(c => !c.isActivated && c.cardType !== 'joker');
   const hasJoker = state.cards.some(c => c.cardType === 'joker');
   return unusedCards.length >= 2 && !hasJoker;
 };
 
 export const getShopCards = (): CardType[] => [
   'timeBoost',
   'timeSteal',
   'extraHint',
   'hintBlock',
   'forcedContinent',
   'pickYourCountry',
   'pickYourContinent',
   'skipNextPlayer',
   'doublePoints',
   'pointStrike',
   'joker',
 ];