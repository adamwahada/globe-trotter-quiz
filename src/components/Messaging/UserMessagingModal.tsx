import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, X, Send, Loader2, ArrowDown } from 'lucide-react';
import { getFirebaseIdToken } from '@/utils/firebaseToken';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const MESSAGES_FN = `https://dzzeaesctendsggfdxra.supabase.co/functions/v1/user-messages`;

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  is_admin_reply: boolean;
  is_read: boolean;
  created_at: string;
}

function formatTime(isoString: string) {
  const d = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// Decode HTML entities from sanitized content
function decodeHtml(str: string) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
}

interface UserMessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
}

export const UserMessagingModal: React.FC<UserMessagingModalProps> = ({ isOpen, onClose, onUnreadChange }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const channelRef = useRef<any>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getFirebaseIdToken();
      if (!token) { setError('Not authenticated'); return; }
      const res = await fetch(`${MESSAGES_FN}?action=get-messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to load'); return; }
      setMessages(data.messages || []);
      onUnreadChange?.(0);
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  }, [user, onUnreadChange]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!isOpen || !user) return;
    fetchMessages();

    // Realtime subscription
    channelRef.current = supabase
      .channel(`messages-user-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${user.id}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (newMsg.is_admin_reply) onUnreadChange?.(0);
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isOpen, user, fetchMessages]);

  // Scroll to bottom on new messages
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [messages, isOpen, scrollToBottom]);

  // Track scroll position to show/hide scroll-down button
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollDown(distFromBottom > 80);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || !user || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);
    try {
      const token = await getFirebaseIdToken();
      if (!token) return;
      const res = await fetch(`${MESSAGES_FN}?action=send-message`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, sender_name: user.username }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages(prev => {
          if (prev.find(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    } catch {
      setError('Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen || !user) return null;

  return createPortal(
    // Modal — fixed floating panel, no backdrop so navbar stays accessible
    <div ref={modalRef} className="fixed z-[9991] bottom-0 right-0 sm:bottom-4 sm:right-4 w-full sm:w-[380px] h-[80vh] sm:h-[500px] flex flex-col bg-card border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-gradient-to-r from-red-600/20 to-transparent flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-red-600/20 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Support</p>
            <p className="text-xs text-muted-foreground">Message the admin team</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages area */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar relative"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
              <div className="w-16 h-16 rounded-full bg-red-600/10 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-red-400/60" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No messages yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Send a message to the admin team — we'll get back to you!
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = !msg.is_admin_reply;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && (
                      <span className="text-xs text-muted-foreground px-1 font-medium">Admin</span>
                    )}
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                        isMe
                          ? 'bg-red-600 text-white rounded-br-sm'
                          : 'bg-secondary/80 text-foreground rounded-bl-sm border border-white/5'
                      }`}
                    >
                      {decodeHtml(msg.content)}
                    </div>
                    <span className="text-[10px] text-muted-foreground px-1">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          {error && (
            <div className="text-center text-xs text-destructive bg-destructive/10 rounded-lg p-2">
              {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Scroll-to-bottom button */}
        {showScrollDown && (
          <button
            onClick={() => scrollToBottom()}
            className="absolute bottom-[76px] right-4 z-10 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/30 hover:bg-red-500 transition-all hover:scale-110 active:scale-95 animate-bounce"
            aria-label="Scroll to latest messages"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        )}

        {/* Input area */}
        <div className="flex-shrink-0 border-t border-white/10 bg-secondary/20 px-3 py-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              maxLength={1000}
              className="flex-1 resize-none bg-background/80 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50 max-h-24 overflow-y-auto"
              style={{ minHeight: '42px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center hover:bg-red-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 px-1">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
    </div>,
    document.body
  );
};
