import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Smile } from 'lucide-react';
import { database, ref, push, onValue } from '@/lib/firebase';
import { useGame } from '@/contexts/GameContext';
import { useLanguage } from '@/contexts/LanguageContext';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  content: string;
  timestamp: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const MAX_MESSAGE_LENGTH = 100;
const MAX_MESSAGES_DISPLAYED = 80;
const LINK_REGEX = /https?:\/\/|www\.|\.com|\.org|\.net|\.io|\.gg|\.co|ftp:\/\//i;

const QUICK_EMOJIS = [
  '😂', '🔥', '👏', '💀', '😭',
  '🎉', '👀', '🤔', '😎', '🥳',
  '💪', '😱', '🤣', '❤️', '👍',
  '🗺️', '🌍', '🎲', '🏆', '⏩',
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function sanitize(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

function containsLink(text: string): boolean {
  return LINK_REGEX.test(text);
}

// ── Component ──────────────────────────────────────────────────────────────────

interface SessionChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SessionChat: React.FC<SessionChatProps> = ({ isOpen, onClose }) => {
  const { session, currentPlayer } = useGame();
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sessionCode = session?.code;

  // Subscribe to chat messages via Firebase realtime
  useEffect(() => {
    if (!isOpen || !sessionCode || !database) return;

    const chatRef = ref(database, `sessions/${sessionCode}/chat`);
    const unsub = onValue(chatRef, (snapshot) => {
      if (!snapshot.exists()) {
        setMessages([]);
        return;
      }
      const data = snapshot.val() as Record<string, Omit<ChatMessage, 'id'>>;
      const msgs: ChatMessage[] = Object.entries(data)
        .map(([id, m]) => ({ id, ...m }))
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-MAX_MESSAGES_DISPLAYED);
      setMessages(msgs);
    });

    return () => unsub();
  }, [isOpen, sessionCode]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [messages.length, isOpen]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !sessionCode || !currentPlayer || !database) return;

    const content = input.trim();

    if (content.length > MAX_MESSAGE_LENGTH) {
      setError(t('chatTooLong' as any) || `Max ${MAX_MESSAGE_LENGTH} characters`);
      return;
    }
    if (containsLink(content)) {
      setError(t('chatNoLinks' as any) || 'Links are not allowed');
      return;
    }

    setError(null);
    setInput('');
    setShowEmojis(false);

    try {
      const chatRef = ref(database, `sessions/${sessionCode}/chat`);
      await push(chatRef, {
        senderId: currentPlayer.id,
        senderName: currentPlayer.username,
        senderColor: currentPlayer.color || '#E85D04',
        content: sanitize(content),
        timestamp: Date.now(),
      });
    } catch {
      setError('Failed to send');
    }
  }, [input, sessionCode, currentPlayer, t]);

  const sendEmoji = useCallback(async (emoji: string) => {
    if (!sessionCode || !currentPlayer || !database) return;
    setShowEmojis(false);
    try {
      const chatRef = ref(database, `sessions/${sessionCode}/chat`);
      await push(chatRef, {
        senderId: currentPlayer.id,
        senderName: currentPlayer.username,
        senderColor: currentPlayer.color || '#E85D04',
        content: emoji,
        timestamp: Date.now(),
      });
    } catch {
      // Silent fail for emoji
    }
  }, [sessionCode, currentPlayer]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen || !session || !currentPlayer) return null;

  const myId = currentPlayer.id;

  return (
    <>
      {/* Semi-transparent backdrop — game visible behind, click to close */}
      <div className="fixed inset-0 z-40 bg-background/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Floating chat panel — bottom-right corner, overlaying the game */}
      <div className="fixed bottom-4 right-4 z-50 w-[340px] sm:w-[380px] max-h-[min(520px,calc(100vh-6rem))] flex flex-col bg-card/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-secondary/40 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{t('sessionChat' as any) || 'Session Chat'}</p>
            <p className="text-[11px] text-muted-foreground">
              {session.code} · {Object.keys(session.players || {}).length} {t('participants' as any) || 'players'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6 py-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-primary/60" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{t('chatEmpty' as any) || 'No messages yet'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('chatEmptyDesc' as any) || 'Say hi to the other players! 👋'}
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === myId;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && (
                      <span
                        className="text-[11px] font-medium px-1 truncate max-w-[140px]"
                        style={{ color: msg.senderColor }}
                      >
                        {msg.senderName}
                      </span>
                    )}
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-secondary text-foreground rounded-bl-sm border border-border'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-muted-foreground px-1">
                      {formatTimestamp(msg.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick emoji panel */}
        {showEmojis && (
          <div className="flex-shrink-0 border-t border-border bg-secondary/30 px-3 py-2">
            <div className="grid grid-cols-10 gap-1">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendEmoji(emoji)}
                  className="w-7 h-7 flex items-center justify-center text-base rounded-lg hover:bg-secondary transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-3 py-1.5 flex-shrink-0">
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-1.5 text-center">
              {error}
            </p>
          </div>
        )}

        {/* Input area */}
        <div className="flex-shrink-0 border-t border-border bg-secondary/20 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEmojis(!showEmojis)}
              className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                showEmojis
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background border border-border text-muted-foreground hover:text-foreground hover:border-primary'
              }`}
            >
              <Smile className="h-4 w-4" />
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => {
                if (e.target.value.length <= MAX_MESSAGE_LENGTH) {
                  setInput(e.target.value);
                  setError(null);
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={t('chatPlaceholder' as any) || 'Type a message...'}
              maxLength={MAX_MESSAGE_LENGTH}
              className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 h-[36px]"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="flex justify-end mt-1 px-1">
            <p className={`text-[10px] ${input.length > MAX_MESSAGE_LENGTH - 20 ? 'text-warning' : 'text-muted-foreground'}`}>
              {input.length}/{MAX_MESSAGE_LENGTH}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
