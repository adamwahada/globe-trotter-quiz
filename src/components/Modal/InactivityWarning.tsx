import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface InactivityWarningProps {
  inactiveTurns: number;
}

export const InactivityWarning: React.FC<InactivityWarningProps> = ({ inactiveTurns }) => {
  const { t } = useLanguage();
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Only show after 2 timeouts (not skips), and allow dismiss
  if (inactiveTurns < 2 || isDismissed) return null;

  const turnsLeft = 3 - inactiveTurns;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
      <div className="bg-destructive/95 backdrop-blur-sm border-2 border-destructive text-destructive-foreground rounded-xl px-4 py-3 shadow-2xl max-w-sm relative">
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute -top-2 -right-2 bg-background border border-border rounded-full p-1 hover:bg-muted transition-colors"
          aria-label="Dismiss warning"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 shrink-0" />
          <div>
            <h4 className="font-display text-base font-bold">⚠️ Inactivity Warning</h4>
            <p className="text-xs opacity-90">
              {turnsLeft > 0 
                ? `${turnsLeft} timeout${turnsLeft > 1 ? 's' : ''} left before kick`
                : 'Next timeout = kicked!'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
