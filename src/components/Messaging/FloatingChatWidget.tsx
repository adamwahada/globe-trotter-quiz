import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Smile, Bell, BellOff } from 'lucide-react';
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

// ── Floating Chat Widget ───────────────────────────────────────────────────────

export const FloatingChatWidget: React.FC = () => {
  const { session, currentPlayer } = useGame();
  const { t } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [pulse, setPulse] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSeenCountRef = useRef(0);
  const prevMessageCountRef = useRef(0);

  const sessionCode = session?.code;
  const myId = currentPlayer?.id;

  // ── Subscribe to chat messages ─────────────────────────────────────────────

  useEffect(() => {
    if (!sessionCode || !database) return;

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

      const totalMessages = msgs.length;

      if (isOpen) {
        lastSeenCountRef.current = totalMessages;
        setUnreadCount(0);
      } else if (notificationsEnabled) {
        const newMessages = totalMessages - lastSeenCountRef.current;
        const unread = Math.max(0, newMessages);
        setUnreadCount(unread);

        // Trigger pulse animation when new messages arrive
        if (totalMessages > prevMessageCountRef.current) {
          setPulse(true);
          setTimeout(() => setPulse(false), 2000);
        }
      } else {
        // Notifications disabled — track seen count but show no badge
        lastSeenCountRef.current = totalMessages;
        setUnreadCount(0);
      }

      prevMessageCountRef.current = totalMessages;
    });

    return () => unsub();
  }, [sessionCode, isOpen, notificationsEnabled]);

  // ── Auto-scroll on new messages ────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [messages.length, isOpen]);

  // ── Focus input when panel opens ───────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      lastSeenCountRef.current = messages.length;
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // ── Send message ───────────────────────────────────────────────────────────

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

  // Don't render if no session/player
  if (!session || !currentPlayer) return null;

  return (
    <>
      {/* ── Floating Toggle Button ──────────────────────────────────── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`
            chat-toggle-btn
            fixed bottom-24 left-4 z-[9999]
            w-14 h-14 rounded-full
            bg-red-600 hover:bg-red-500
            text-white
            flex items-center justify-center
            shadow-lg shadow-red-600/40
            transition-all duration-300 ease-out
            hover:scale-110 hover:shadow-xl hover:shadow-red-600/50
            active:scale-95
            ${pulse ? 'chat-pulse' : ''}
          `}
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />

          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[22px] h-[22px] rounded-full bg-white text-red-600 text-[11px] font-bold flex items-center justify-center px-1.5 shadow-md border-2 border-red-600 animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}

          {/* Glow ring */}
          <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping pointer-events-none" style={{ animationDuration: '3s' }} />
        </button>
      )}

      {/* ── Chat Panel (slides from left) ───────────────────────────── */}
      {isOpen && (
        <>
          {/* Invisible backdrop to allow closing by clicking outside */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />

          <div
            className="
              chat-panel-slide
              fixed left-0 top-0 z-[9999]
              w-[88vw] sm:w-[380px] md:w-[30vw] md:min-w-[360px] md:max-w-[480px]
              h-[75vh] max-h-[80vh] min-h-[60vh]
              mt-[12vh]
              ml-3 sm:ml-4
              flex flex-col
              rounded-2xl
              bg-card/90 backdrop-blur-xl
              border border-white/10
              shadow-2xl shadow-black/30
              overflow-hidden
            "
          >
            {/* ── Header ────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-gradient-to-r from-red-600/20 to-transparent flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-red-600/20 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-red-400" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {t('sessionChat' as any) || 'Session Chat'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {session.code} · {Object.keys(session.players || {}).length} {t('participants' as any) || 'players'}
                </p>
              </div>

              {/* Notification toggle */}
              <button
                onClick={() => {
                  const next = !notificationsEnabled;
                  setNotificationsEnabled(next);
                  if (!next) {
                    // Immediately clear badge when muting
                    setUnreadCount(0);
                    lastSeenCountRef.current = messages.length;
                    setPulse(false);
                  }
                }}
                className={`p-1.5 rounded-full transition-colors ${
                  notificationsEnabled
                    ? 'text-red-400 hover:bg-red-600/20'
                    : 'text-muted-foreground hover:bg-secondary'
                }`}
                title={notificationsEnabled ? 'Mute notifications' : 'Enable notifications'}
              >
                {notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </button>

              {/* Close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ── Messages area ─────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 scrollbar-thin">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6 py-8">
                  <div className="w-14 h-14 rounded-full bg-red-600/10 flex items-center justify-center">
                    <MessageCircle className="h-7 w-7 text-red-400/60" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t('chatEmpty' as any) || 'No messages yet'}
                    </p>
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
                              ? 'bg-red-600 text-white rounded-br-sm'
                              : 'bg-secondary/80 text-foreground rounded-bl-sm border border-white/5'
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

            {/* ── Quick emoji panel ─────────────────────────────────── */}
            {showEmojis && (
              <div className="flex-shrink-0 border-t border-white/10 bg-secondary/30 px-3 py-2">
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

            {/* ── Error ─────────────────────────────────────────────── */}
            {error && (
              <div className="px-3 py-1.5 flex-shrink-0">
                <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-1.5 text-center">
                  {error}
                </p>
              </div>
            )}

            {/* ── Input area ────────────────────────────────────────── */}
            <div className="flex-shrink-0 border-t border-white/10 bg-secondary/20 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEmojis(!showEmojis)}
                  className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                    showEmojis
                      ? 'bg-red-600 text-white'
                      : 'bg-background border border-border text-muted-foreground hover:text-foreground hover:border-red-500'
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
                  className="flex-1 bg-background/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50 h-[36px]"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="flex-shrink-0 w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center hover:bg-red-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <div className="flex justify-end mt-1 px-1">
                <p className={`text-[10px] ${input.length > MAX_MESSAGE_LENGTH - 20 ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                  {input.length}/{MAX_MESSAGE_LENGTH}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
