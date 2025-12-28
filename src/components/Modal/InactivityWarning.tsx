import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface InactivityWarningProps {
  inactiveTurns: number;
}

export const InactivityWarning: React.FC<InactivityWarningProps> = ({ inactiveTurns }) => {
  const { t } = useLanguage();
  
  if (inactiveTurns < 2) return null;

  const turnsLeft = 3 - inactiveTurns;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-bounce">
      <div className="bg-destructive/90 backdrop-blur-sm border-2 border-destructive text-destructive-foreground rounded-xl px-6 py-4 shadow-2xl max-w-md">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 shrink-0" />
          <div>
            <h4 className="font-display text-lg font-bold">⚠️ Inactivity Warning!</h4>
            <p className="text-sm opacity-90">
              You must be active to stay in this session. 
              {turnsLeft > 0 
                ? ` You have ${turnsLeft} turn${turnsLeft > 1 ? 's' : ''} left before being kicked.`
                : ' You will be kicked after this turn if inactive!'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
