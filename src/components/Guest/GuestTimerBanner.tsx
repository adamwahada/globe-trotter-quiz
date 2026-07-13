import React, { useState } from 'react';
import { Clock, UserPlus, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from '@/components/Auth/AuthModal';

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
};

export const GuestTimerBanner: React.FC = () => {
  const { isGuest, guestTimeRemaining } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!isGuest || guestTimeRemaining === null || dismissed) return null;

  const isUrgent = guestTimeRemaining < 30 * 60 * 1000; // < 30 min
  const isWarning = guestTimeRemaining < 60 * 60 * 1000; // < 1 hour

  return (
    <>
      <div
        className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-4 py-2.5 rounded-xl border shadow-lg backdrop-blur-md transition-all ${
          isUrgent
            ? 'bg-destructive/20 border-destructive/40 text-destructive'
            : isWarning
            ? 'bg-warning/20 border-warning/40 text-warning'
            : 'bg-card/90 border-border text-foreground'
        }`}
      >
        <Clock className={`h-4 w-4 shrink-0 ${isUrgent ? 'animate-pulse' : ''}`} />
        <span className="text-sm font-medium whitespace-nowrap">
          Guest · <span className="font-display tabular-nums">{formatTime(guestTimeRemaining)}</span> left
        </span>

        <button
          onClick={() => setAuthOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          <UserPlus className="h-3 w-3" />
          Sign Up
        </button>

        <button
          onClick={() => setDismissed(true)}
          className="p-0.5 rounded hover:bg-secondary/50 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode="signup"
      />
    </>
  );
};
