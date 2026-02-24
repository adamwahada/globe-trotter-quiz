import React, { useEffect, useState, useCallback } from 'react';
import { Loader2, X, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { subscribeToJoinRequestStatus, cancelJoinRequest, submitJoinRequest } from '@/services/gameSessionService';
import type { JoinRequest } from '@/types/game';

interface PendingJoinRequestModalProps {
  sessionCode: string;
  playerId: string;
  username: string;
  avatar: string;
  color: string;
  isGuest: boolean;
  onApproved: () => void;
  onCancel: () => void;
}

export const PendingJoinRequestModal: React.FC<PendingJoinRequestModalProps> = ({
  sessionCode,
  playerId,
  username,
  avatar,
  color,
  isGuest,
  onApproved,
  onCancel,
}) => {
  const { t } = useLanguage();
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | null>('pending');
  const [canReRequest, setCanReRequest] = useState(false);

  // Subscribe to request status changes
  useEffect(() => {
    if (!sessionCode || !playerId) return;

    const unsubscribe = subscribeToJoinRequestStatus(sessionCode, playerId, (request) => {
      if (!request) {
        // Request was removed (e.g., cancelled)
        setStatus(null);
        return;
      }
      setStatus(request.status);

      if (request.status === 'approved') {
        // Brief delay so player sees the "approved" state
        setTimeout(() => {
          onApproved();
        }, 800);
      }

      if (request.status === 'rejected') {
        setCanReRequest(true);
      }
    });

    return unsubscribe;
  }, [sessionCode, playerId, onApproved]);

  const handleCancel = useCallback(async () => {
    try {
      await cancelJoinRequest(sessionCode, playerId);
    } catch {
      // Ignore errors on cancel
    }
    localStorage.removeItem('pendingJoinRequest');
    onCancel();
  }, [sessionCode, playerId, onCancel]);

  const handleReRequest = useCallback(async () => {
    const requestData: JoinRequest = {
      playerId,
      username,
      avatar,
      color,
      isGuest,
      timestamp: Date.now(),
      status: 'pending',
    };
    try {
      await submitJoinRequest(sessionCode, playerId, requestData);
      setStatus('pending');
      setCanReRequest(false);
    } catch {
      // If re-request fails, keep showing rejected state
    }
  }, [sessionCode, playerId, username, avatar, color, isGuest]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        <div className="p-6 text-center">
          {status === 'pending' && (
            <>
              <div className="relative mx-auto w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
                <div className="absolute inset-2 rounded-full flex items-center justify-center text-2xl bg-card">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-display text-foreground mb-2">
                {t('requestSent' as any)}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                {t('pendingRequests' as any)}...
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-6">
                <Loader2 className="h-3 w-3 animate-spin" />
                Session: <span className="font-mono font-bold">{sessionCode}</span>
              </div>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel Request
              </Button>
            </>
          )}

          {status === 'approved' && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 animate-scale-in">
                <span className="text-3xl">✓</span>
              </div>
              <h3 className="text-lg font-display text-foreground mb-2">
                {t('requestApproved' as any)}
              </h3>
              <p className="text-sm text-muted-foreground">
                Joining game...
              </p>
              <Loader2 className="h-5 w-5 animate-spin mx-auto mt-4 text-primary" />
            </>
          )}

          {status === 'rejected' && (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4 animate-scale-in">
                <X className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-lg font-display text-foreground mb-2">
                {t('requestRejected' as any)}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                The host did not approve your request.
              </p>
              <div className="flex gap-3 justify-center">
                {canReRequest && (
                  <Button
                    variant="netflix"
                    onClick={handleReRequest}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleCancel}
                >
                  Go Back
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
