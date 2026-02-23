import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { database, ref, onValue } from '@/lib/firebase';
import { useGame } from '@/contexts/GameContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { SessionChat } from '@/components/Messaging/SessionChat';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';

export const SessionChatButton: React.FC = () => {
  const { session, currentPlayer } = useGame();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenCountRef = useRef(0);

  const sessionCode = session?.code;
  const myId = currentPlayer?.id;

  // Track total messages to compute "unread" while chat is closed
  useEffect(() => {
    if (!sessionCode || !database) return;

    const chatRef = ref(database, `sessions/${sessionCode}/chat`);
    const unsub = onValue(chatRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.val() as Record<string, unknown>;
      const totalMessages = Object.keys(data).length;

      if (isOpen) {
        // Chat is open — user is reading everything, mark as seen
        lastSeenCountRef.current = totalMessages;
        setUnreadCount(0);
      } else {
        // Chat is closed — show how many new messages appeared
        const newMessages = totalMessages - lastSeenCountRef.current;
        setUnreadCount(Math.max(0, newMessages));
      }
    });

    return () => unsub();
  }, [sessionCode, isOpen]);

  // When chat opens, reset unread
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  if (!session || !currentPlayer) return null;

  return (
    <>
      <GameTooltip content={t('sessionChat' as any) || 'Session Chat'} position="bottom">
        <button
          onClick={() => setIsOpen(true)}
          className="relative p-2 rounded-lg bg-secondary/50 border border-border hover:border-primary transition-all duration-200"
          aria-label="Session Chat"
        >
          <MessageCircle className="h-5 w-5 text-primary" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center px-1 leading-none animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </GameTooltip>

      <SessionChat
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};
