 import React from 'react';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { GameTooltip } from '@/components/Tooltip/GameTooltip';
 import { useLanguage } from '@/contexts/LanguageContext';
 import { Sparkles } from 'lucide-react';
 
 interface CardButtonProps {
   cardPoints: number;
   cardsCount: number;
   onClick: () => void;
   disabled?: boolean;
 }
 
 export const CardButton: React.FC<CardButtonProps> = ({
   cardPoints,
   cardsCount,
   onClick,
   disabled = false,
 }) => {
   const { t } = useLanguage();
 
   return (
     <GameTooltip content={t('cardMode')} position="top">
       <Button
         variant="icon"
         size="icon"
         onClick={onClick}
         disabled={disabled}
         className="relative"
       >
         <Sparkles className="h-5 w-5" />
         
         {/* Card points badge */}
         {cardPoints > 0 && (
           <Badge 
             variant="default"
             className="absolute -top-2 -right-2 h-5 min-w-5 p-0 flex items-center justify-center text-xs bg-warning text-warning-foreground animate-pulse"
           >
             {cardPoints}
           </Badge>
         )}
         
         {/* Cards count indicator */}
         {cardsCount > 0 && (
           <span className="absolute -bottom-1 -right-1 h-4 min-w-4 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center">
             {cardsCount}
           </span>
         )}
       </Button>
     </GameTooltip>
   );
 };