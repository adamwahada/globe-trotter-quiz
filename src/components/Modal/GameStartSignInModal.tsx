import React, { useState } from 'react';
import { X, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GuestLoginModal } from '@/components/Guest/GuestLoginModal';

interface GameStartSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onJoin: () => void;
}

export const GameStartSignInModal: React.FC<GameStartSignInModalProps> = ({
  isOpen,
  onClose,
  onSignIn,
  onJoin,
}) => {
  const [guestModalOpen, setGuestModalOpen] = useState(false);

  if (!isOpen && !guestModalOpen) return null;

  return (
    <>
      {isOpen && !guestModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
          <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
            <div className="relative p-6 pb-0">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
              <h2 className="text-3xl font-display text-foreground text-center mb-2">
                Ready to Play?
              </h2>
              <p className="text-muted-foreground text-center text-sm">
                Create an account or sign in to start your journey
              </p>
            </div>

            <div className="p-6 space-y-4">
              <Button variant="netflix" className="w-full py-6" onClick={onSignIn}>
                Sign In to Account
              </Button>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-muted-foreground text-sm">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <Button variant="outline" className="w-full py-6" onClick={onJoin}>
                Create Free Account
              </Button>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-muted-foreground text-sm">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <Button
                variant="ghost"
                className="w-full py-6 border border-border"
                onClick={() => setGuestModalOpen(true)}
              >
                <UserCircle className="h-5 w-5 mr-2" />
                Play as Guest (4h)
              </Button>
            </div>

            <div className="p-6 pt-0 text-center">
              <button onClick={onClose} className="text-sm text-primary hover:underline">
                Continue browsing without account
              </button>
            </div>
          </div>
        </div>
      )}

      <GuestLoginModal
        isOpen={guestModalOpen}
        onClose={() => setGuestModalOpen(false)}
        onSuccess={onClose}
        onSignIn={() => {
          setGuestModalOpen(false);
          onSignIn();
        }}
      />
    </>
  );
};