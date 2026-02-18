import React, { useState } from 'react';
import { X, User, Loader2, UserCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validateUsername, MAX_USERNAME_LENGTH } from '@/utils/inputValidation';

interface GuestJoinModalProps {
  isOpen: boolean;
  sessionCode: string;
  onJoin: (username: string) => Promise<void>;
  onClose: () => void;
  onSignIn: () => void;
}

const GUEST_AVATARS = ['🗺️', '🌍', '🌎', '🌏', '🧭', '🏔️', '🌊', '🏝️', '🌋', '🌵'];
const GUEST_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export const GuestJoinModal: React.FC<GuestJoinModalProps> = ({
  isOpen,
  sessionCode,
  onJoin,
  onClose,
  onSignIn,
}) => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleJoin = async (e: React.FormEvent) => {
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
      await onJoin(trimmed);
    } catch (err: any) {
      setError(err?.message || 'Failed to join session');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
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
              <UserCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-display text-foreground">Join as Guest</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Session <span className="text-primary font-display tracking-wider">{sessionCode}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleJoin} className="p-6 space-y-4">
          {/* Guest info banner */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm text-foreground/80">
            <span className="text-warning shrink-0 mt-0.5">ℹ️</span>
            <p>You're joining as a <strong>guest</strong>. Your game history won't be saved. After the game you'll have 30 seconds to view results before the page closes.</p>
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
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Join Session →'}
          </Button>

          {/* Divider */}
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
        </form>
      </div>
    </div>
  );
};
