import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Send, Loader2, ArrowLeft, Clock, ChevronDown } from 'lucide-react';
import { getFirebaseIdToken } from '@/utils/firebaseToken';
import { supabase } from '@/integrations/supabase/client';
import { useOutletContext, useLocation } from 'react-router-dom';
import { PlayerProfileModal } from '@/components/Admin/PlayerProfileModal';

const ADMIN_FN = `https://dzzeaesctendsggfdxra.supabase.co/functions/v1/admin-messages`;

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  is_admin_reply: boolean;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  sender_id: string;
  sender_name: string;
  sender_email: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
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

function decodeHtml(str: string) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
}

interface OutletContext {
  setMessagesUnread?: (n: number) => void;
}

export const AdminMessages: React.FC = () => {
  const outletCtx = useOutletContext<OutletContext | null>();
  const location = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [profileUser, setProfileUser] = useState<{ userId: string; userName: string; userEmail: string | null } | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 100);
  };

  const fetchConversations = useCallback(async () => {
    setLoadingConvs(true);
    try {
      const token = await getFirebaseIdToken();
      if (!token) return;
      const res = await fetch(`${ADMIN_FN}?action=conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const convs: Conversation[] = data.conversations || [];
        convs.sort((a, b) => {
          if (b.unread_count !== a.unread_count) return b.unread_count - a.unread_count;
          return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
        });
        setConversations(convs);
        const totalUnread = convs.reduce((acc, c) => acc + c.unread_count, 0);
        outletCtx?.setMessagesUnread?.(totalUnread);
        return convs;
      }
    } finally {
      setLoadingConvs(false);
    }
    return [];
  }, [outletCtx]);

  useEffect(() => {
    fetchConversations().then((convs) => {
      // Auto-open user from navigation state (e.g. from PlayerProfileModal)
      const state = location.state as any;
      if (state?.openUserId && convs && convs.length > 0) {
        const conv = convs.find((c: Conversation) => c.sender_id === state.openUserId);
        if (conv) loadConversation(conv);
      }
    });

    channelRef.current = supabase
      .channel('admin-messages-all')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchConversations();
        setSelectedConv(prev => {
          if (prev) loadConversation(prev);
          return prev;
        });
      })
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [fetchConversations]);

  const loadConversation = async (conv: Conversation) => {
    setSelectedConv(conv);
    setLoadingMsgs(true);
    try {
      const token = await getFirebaseIdToken();
      if (!token) return;
      const res = await fetch(`${ADMIN_FN}?action=conversation&user_id=${encodeURIComponent(conv.sender_id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setConversations(prev => prev.map(c =>
          c.sender_id === conv.sender_id ? { ...c, unread_count: 0 } : c
        ));
        fetchConversations();
      }
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => {
    setTimeout(() => scrollToBottom(), 100);
  }, [messages]);

  const sendReply = async () => {
    if (!reply.trim() || !selectedConv || sending) return;
    const content = reply.trim();
    setReply('');
    setSending(true);
    try {
      const token = await getFirebaseIdToken();
      if (!token) return;
      const res = await fetch(`${ADMIN_FN}?action=reply`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_user_id: selectedConv.sender_id,
          target_user_name: selectedConv.sender_name,
          content,
        }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages(prev => {
          if (prev.find(m => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); }
  };

  const totalUnread = conversations.reduce((acc, c) => acc + c.unread_count, 0);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-display text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Messages
            {totalUnread > 0 && (
              <span className="ml-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => fetchConversations()}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-secondary border border-border"
        >
          <Clock className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Conversations list */}
        <div className={`flex flex-col gap-2 overflow-y-auto custom-scrollbar ${selectedConv ? 'hidden lg:flex lg:w-72 flex-shrink-0' : 'w-full'}`}>
          {loadingConvs ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
            ))
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-16">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-primary/40" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No messages yet</p>
                <p className="text-xs text-muted-foreground mt-1">User messages will appear here</p>
              </div>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.sender_id}
                onClick={() => loadConversation(conv)}
                className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all hover:shadow-sm ${
                  selectedConv?.sender_id === conv.sender_id
                    ? 'border-primary/40 bg-primary/5'
                    : conv.unread_count > 0
                      ? 'border-primary/30 bg-primary/5 hover:border-primary/50'
                      : 'border-border hover:border-primary/20 bg-card hover:bg-secondary/30'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 text-lg font-bold text-primary">
                  {conv.sender_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">{conv.sender_name}</span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {formatTime(conv.last_message_time)}
                    </span>
                  </div>
                  {conv.sender_email && (
                    <p className="text-[10px] text-muted-foreground truncate">{conv.sender_email}</p>
                  )}
                  <p className={`text-xs truncate mt-0.5 ${conv.unread_count > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {decodeHtml(conv.last_message)}
                  </p>
                </div>
                {conv.unread_count > 0 && (
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {conv.unread_count}
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Conversation view */}
        {selectedConv && (
          <div className="flex flex-col flex-1 min-h-0 bg-card border border-border rounded-xl overflow-hidden">
            {/* Conv header - clickable to open profile */}
            <div
              className="flex items-center gap-3 px-4 py-3 border-b border-border bg-secondary/40 flex-shrink-0 cursor-pointer hover:bg-secondary/60 transition-colors"
              onClick={() => setProfileUser({
                userId: selectedConv.sender_id,
                userName: selectedConv.sender_name,
                userEmail: selectedConv.sender_email,
              })}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedConv(null); }}
                className="lg:hidden p-1.5 rounded-full hover:bg-secondary transition-colors text-muted-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">
                {selectedConv.sender_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{selectedConv.sender_name}</p>
                {selectedConv.sender_email && (
                  <p className="text-xs text-muted-foreground">{selectedConv.sender_email}</p>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground">Click for profile</span>
            </div>

            {/* Messages - fixed height scrollable */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar relative"
            >
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                </div>
              ) : (
                messages.map((msg) => {
                  const isAdmin = msg.is_admin_reply;
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] flex flex-col gap-1 ${isAdmin ? 'items-end' : 'items-start'}`}>
                        <span className="text-xs text-muted-foreground px-1 font-medium">
                          {isAdmin ? 'You (Admin)' : msg.sender_name}
                        </span>
                        <div
                          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                            isAdmin
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-secondary text-foreground rounded-bl-sm border border-border'
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
              <div ref={bottomRef} />
            </div>

            {/* Scroll to bottom button */}
            {showScrollBtn && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10" style={{ position: 'sticky', bottom: '76px', display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={scrollToBottom}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity text-xs font-medium"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                  Scroll to bottom
                </button>
              </div>
            )}

            {/* Reply input */}
            <div className="flex-shrink-0 border-t border-border bg-secondary/20 px-3 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Reply to ${selectedConv.sender_name}...`}
                  rows={1}
                  maxLength={2000}
                  className="flex-1 resize-none bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 max-h-24 overflow-y-auto"
                  style={{ minHeight: '42px' }}
                />
                <button
                  onClick={sendReply}
                  disabled={!reply.trim() || sending}
                  className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Player Profile Modal */}
      {profileUser && (
        <PlayerProfileModal
          userId={profileUser.userId}
          userName={profileUser.userName}
          userEmail={profileUser.userEmail}
          onClose={() => setProfileUser(null)}
        />
      )}
    </div>
  );
};
