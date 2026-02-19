import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import { getFirebaseIdToken } from '@/utils/firebaseToken';
import { useAuth } from '@/contexts/AuthContext';
import { UserMessagingModal } from '@/components/Messaging/UserMessagingModal';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { supabase } from '@/integrations/supabase/client';

const MESSAGES_FN = `https://dzzeaesctendsggfdxra.supabase.co/functions/v1/user-messages`;

export const MessageIcon: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchUnread = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getFirebaseIdToken();
      if (!token) return;
      const res = await fetch(`${MESSAGES_FN}?action=unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch { /* silent */ }
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    fetchUnread();

    const interval = setInterval(fetchUnread, 30000);

    const channel = supabase
      .channel(`msg-badge-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${user.id}`,
      }, (payload: any) => {
        if (payload.new.is_admin_reply && !isOpen) {
          setUnreadCount(prev => prev + 1);
        }
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user, fetchUnread, isOpen]);

  if (!isAuthenticated) return null;

  return (
    <>
      <GameTooltip content={unreadCount > 0 ? `Messages (${unreadCount} unread)` : 'Messages'} position="bottom">
        <button
          onClick={() => setIsOpen(true)}
          className="relative p-2 rounded-lg bg-secondary/50 border border-border hover:border-primary transition-all duration-200"
          aria-label="Messages"
        >
          <MessageSquare className="h-5 w-5 text-primary" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-1 leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </GameTooltip>

      <UserMessagingModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setUnreadCount(0);
        }}
        onUnreadChange={setUnreadCount}
      />
    </>
  );
};
