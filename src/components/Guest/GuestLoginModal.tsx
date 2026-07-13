import React, { useState } from 'react';
import { X, User, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validateUsername, MAX_USERNAME_LENGTH } from '@/utils/inputValidation';
import { useAuth } from '@/contexts/AuthContext';

interface GuestLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSignIn?: () => void;
}

export const GuestLoginModal: React.FC<GuestLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSignIn,
}) => {
  const { signInAsGuest } = useAuth();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    const validation = validateUsername(trimmed);
    if (!validation.valid) {
      setError(validation.error || 'Invalid username');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await signInAsGuest(trimmed);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to join as guest');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="relative p-6 pb-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="text-center mb-2">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
              <User className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-display text-foreground">Play as Guest</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Choose a display name to get started
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Info banner */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-info/10 border border-info/20 text-sm text-foreground/80">
            <Clock className="h-4 w-4 text-info shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">4-hour guest session</p>
              <p className="mt-0.5 text-muted-foreground">Your session lasts 4 hours. Game history won't be saved. Create an account anytime to keep your progress.</p>
            </div>
          </div>

          {/* Username input */}
          <div className="space-y-1">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.slice(0, MAX_USERNAME_LENGTH));
                  setError('');
                }}
                placeholder="Choose a display name"
                required
                maxLength={MAX_USERNAME_LENGTH}
                autoFocus
                className="w-full pl-11 pr-4 py-3 bg-secondary border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
              />
            </div>
            {error && <p className="text-destructive text-xs pl-1">{error}</p>}
          </div>

          <Button
            type="submit"
            variant="netflix"
            className="w-full py-6"
            disabled={isLoading || !username.trim()}
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Start Playing →'}
          </Button>

          {onSignIn && (
            <>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-muted-foreground text-sm">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full py-6"
                onClick={onSignIn}
              >
                Sign in to save your progress
              </Button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
