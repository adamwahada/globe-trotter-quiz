import React, { useState, useEffect, useRef } from 'react';
import { X, UserCheck, UserX, Bell, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSound } from '@/contexts/SoundContext';
import { useToastContext } from '@/contexts/ToastContext';
import { subscribeToJoinRequests, approveJoinRequest, rejectJoinRequest } from '@/services/gameSessionService';
import type { JoinRequest } from '@/types/game';

interface JoinRequestsModalProps {
  sessionCode: string;
  isHost: boolean;
  maxPlayers: number;
  currentPlayerCount: number;
}

export const JoinRequestsModal: React.FC<JoinRequestsModalProps> = ({
  sessionCode,
  isHost,
  maxPlayers,
  currentPlayerCount,
}) => {
  const { t } = useLanguage();
  const { playToastSound } = useSound();
  const { addToast } = useToastContext();

  const [isOpen, setIsOpen] = useState(false);
  const [requests, setRequests] = useState<{ [id: string]: JoinRequest }>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const prevPendingCountRef = useRef(0);

  // Subscribe to join requests in real-time
  useEffect(() => {
    if (!isHost || !sessionCode) return;
    const unsubscribe = subscribeToJoinRequests(sessionCode, (data) => {
      setRequests(data || {});
    });
    return unsubscribe;
  }, [sessionCode, isHost]);

  // Calculate pending requests
  const pendingRequests = Object.entries(requests).filter(
    ([, req]) => req.status === 'pending'
  );
  const pendingCount = pendingRequests.length;

  // Play notification sound when a new request arrives
  useEffect(() => {
    if (pendingCount > prevPendingCountRef.current && prevPendingCountRef.current >= 0) {
      playToastSound('game');
      if (!isOpen) {
        const newestRequest = pendingRequests[pendingRequests.length - 1];
        if (newestRequest) {
          addToast('info', `${newestRequest[1].username} ${t('playerWantsToJoin' as any)}`);
        }
      }
    }
    prevPendingCountRef.current = pendingCount;
  }, [pendingCount, playToastSound, addToast, t, isOpen, pendingRequests]);

  const handleApprove = async (playerId: string) => {
    setProcessing(playerId);
    try {
      const success = await approveJoinRequest(sessionCode, playerId);
      if (success) {
        addToast('success', `${requests[playerId]?.username} approved!`);
      } else {
        addToast('error', 'Could not approve — session may be full');
      }
    } catch {
      addToast('error', 'Failed to approve player');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (playerId: string) => {
    setProcessing(playerId);
    try {
      await rejectJoinRequest(sessionCode, playerId);
      addToast('info', `${requests[playerId]?.username} rejected`);
    } catch {
      addToast('error', 'Failed to reject player');
    } finally {
      setProcessing(null);
    }
  };

  if (!isHost) return null;

  const isFull = currentPlayerCount >= maxPlayers;

  return (
    <>
      {/* Floating button with badge */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="gap-2 relative"
      >
        <Bell className="h-4 w-4" />
        {t('joinRequests' as any)}
        {pendingCount > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[20px] h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center px-1 animate-pulse">
            {pendingCount}
          </span>
        )}
      </Button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-display text-foreground">{t('joinRequests' as any)}</h3>
                    <p className="text-xs text-muted-foreground">
                      {pendingCount} {t('pendingRequests' as any).toLowerCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              {/* Requests list */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">{t('noRequests' as any)}</p>
                  </div>
                ) : (
                  pendingRequests.map(([playerId, req]) => (
                    <div
                      key={playerId}
                      className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border"
                    >
                      {/* Avatar circle */}
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: req.color + '33', borderColor: req.color, borderWidth: 2 }}
                      >
                        {req.avatar}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {req.username}
                          {req.isGuest && (
                            <span className="ml-2 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                              Guest
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="netflix"
                          size="sm"
                          onClick={() => handleApprove(playerId)}
                          disabled={processing === playerId || isFull}
                          className="gap-1 h-8 px-3"
                        >
                          {processing === playerId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <UserCheck className="h-3.5 w-3.5" />
                          )}
                          {t('approvePlayer' as any)}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(playerId)}
                          disabled={processing === playerId}
                          className="gap-1 h-8 px-3 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          {t('rejectPlayer' as any)}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {isFull && pendingCount > 0 && (
                <p className="text-xs text-warning text-center mt-4">
                  Session is full ({currentPlayerCount}/{maxPlayers}). New players cannot be approved.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
