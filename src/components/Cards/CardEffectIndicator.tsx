 import React from 'react';
 import { Badge } from '@/components/ui/badge';
 import { GameTooltip } from '@/components/Tooltip/GameTooltip';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { ActiveCardEffect, CARD_DEFINITIONS } from '@/types/cards';
 
 interface CardEffectIndicatorProps {
   effects: ActiveCardEffect[];
   playerId: string;
 }
 
 export const CardEffectIndicator: React.FC<CardEffectIndicatorProps> = ({
   effects,
   playerId,
 }) => {
   const { t } = useLanguage();
 
   // Filter effects targeting this player
   const activeEffects = effects.filter(e => e.targetPlayerId === playerId);
 
   if (activeEffects.length === 0) return null;
 
   return (
     <div className="flex flex-wrap gap-1">
       {activeEffects.map((effect, index) => {
         const card = CARD_DEFINITIONS[effect.cardType];
         
         return (
           <GameTooltip key={index} content={card.description} position="top">
             <Badge 
               variant="outline" 
               className="text-xs px-1.5 py-0.5 bg-warning/10 border-warning/30 text-warning"
             >
               {card.icon}
             </Badge>
           </GameTooltip>
         );
       })}
     </div>
   );
 };