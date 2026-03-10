import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, ShieldOff, UserX, Loader2, RefreshCw, Search, X, Clock, AlertTriangle, CheckCircle2, Ban, Users, History } from 'lucide-react';
import { getFirebaseIdToken } from '@/utils/firebaseToken';
import { Button } from '@/components/ui/button';
import { PlayerProfileModal } from '@/components/Admin/PlayerProfileModal';

const SUPABASE_URL = 'https://dzzeaesctendsggfdxra.supabase.co/functions/v1';
const BANS_FN = `${SUPABASE_URL}/admin-bans`;
const DASHBOARD_FN = `${SUPABASE_URL}/admin-dashboard`;

interface BanRecord {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string | null;
  reason: string | null;
  ban_type: '1day' | '3days' | '7days' | 'permanent';
  banned_at: string;
  expires_at: string | null;
  is_active: boolean;
}

interface SearchUser {
  user_id: string;
  name: string;
  email: string | null;
  active_ban: { ban_type: string; expires_at: string | null } | null;
}

const BAN_TYPE_LABELS: Record<string, string> = {
  '1day': '1 Day',
  '3days': '3 Days',
  '7days': '1 Week',
  'permanent': 'Permanent',
};

const BAN_TYPE_COLORS: Record<string, string> = {
  '1day': 'text-warning bg-warning/10 border-warning/30',
  '3days': 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  '7days': 'text-destructive bg-destructive/10 border-destructive/30',
  'permanent': 'text-destructive bg-destructive/20 border-destructive/50',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function timeRemaining(expiresAt: string | null): string {
  if (!expiresAt) return 'Permanent';
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h remaining`;
  return `${hours}h remaining`;
}

/* ───── Ban Modal ───── */
interface BanModalProps {
  userId: string;
  userName: string;
  userEmail: string | null;
  onClose: () => void;
  onBanned: () => void;
}

const BanModal: React.FC<BanModalProps> = ({ userId, userName, userEmail, onClose, onBanned }) => {
  const [banType, setBanType] = useState<string>('1day');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBan = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getFirebaseIdToken();
      if (!token) { setError('Not authenticated'); return; }
      const res = await fetch(`${BANS_FN}?action=ban`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, user_name: userName, user_email: userEmail, ban_type: banType, reason }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to ban'); return; }
      onBanned();
      onClose();
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-5">
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 p-1 rounded-full hover:bg-secondary transition-colors">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <Ban className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-display text-lg text-foreground">Ban User</h3>
            <p className="text-sm text-muted-foreground">{userName}{userEmail ? ` · ${userEmail}` : ''}</p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Ban Duration</label>
          <div className="grid grid-cols-2 gap-2">
            {(['1day', '3days', '7days', 'permanent'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setBanType(type)}
                className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  banType === type
                    ? type === 'permanent'
                      ? 'bg-destructive text-destructive-foreground border-destructive'
                      : 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary/40 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {BAN_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Reason <span className="text-muted-foreground font-normal">(optional)</span></label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this user is being banned..."
            rows={3}
            maxLength={500}
            className="w-full resize-none bg-background border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        {banType === 'permanent' && (
          <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-xl px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">This is a permanent ban. The user will be unable to sign in and will see a ban notice.</p>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            onClick={handleBan}
            disabled={loading}
            className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
            Ban User
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ───── Ban History Modal ───── */
const BanHistoryModal: React.FC<{
  userId: string;
  userName: string;
  userEmail: string | null;
  onClose: () => void;
}> = ({ userId, userName, userEmail, onClose }) => {
  const [history, setHistory] = useState<BanRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getFirebaseIdToken();
        if (!token) return;
        const res = await fetch(`${BANS_FN}?action=user-ban-history&user_id=${encodeURIComponent(userId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[80vh] flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-secondary transition-colors">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <History className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-display text-lg text-foreground">Ban History</h3>
            <p className="text-sm text-muted-foreground">{userName}{userEmail ? ` · ${userEmail}` : ''}</p>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 space-y-3 mt-4 pr-1 custom-scrollbar">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
            ))
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No ban history for this user</p>
            </div>
          ) : (
            history.map((ban) => {
              const isExpired = ban.expires_at && new Date(ban.expires_at) <= new Date();
              const isActive = ban.is_active && !isExpired;
              return (
                <div
                  key={ban.id}
                  className={`p-4 rounded-xl border ${
                    isActive ? 'bg-destructive/5 border-destructive/30' : 'bg-muted/20 border-border/50'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${BAN_TYPE_COLORS[ban.ban_type]}`}>
                      {BAN_TYPE_LABELS[ban.ban_type]}
                    </span>
                    {isActive ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/30">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                        {isExpired ? 'Expired' : 'Lifted'}
                      </span>
                    )}
                  </div>
                  {ban.reason && <p className="text-xs text-muted-foreground italic mb-2">"{ban.reason}"</p>}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(ban.banned_at)}
                    </span>
                    {ban.expires_at && (
                      <span>→ {formatDate(ban.expires_at)}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

/* ───── Main Page ───── */
export const AdminBans: React.FC = () => {
  const [bans, setBans] = useState<BanRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [unbanning, setUnbanning] = useState<string | null>(null);
  const [banModal, setBanModal] = useState<{ userId: string; userName: string; userEmail: string | null } | null>(null);
  const [banHistoryModal, setBanHistoryModal] = useState<{ userId: string; userName: string; userEmail: string | null } | null>(null);
  const [profileUser, setProfileUser] = useState<{ userId: string; userName: string; userEmail: string | null } | null>(null);

  // User search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchBans = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getFirebaseIdToken();
      if (!token) return;
      const res = await fetch(`${BANS_FN}?action=list-bans&show_all=${showAll}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBans(data.bans || []);
      }
    } finally {
      setLoading(false);
    }
  }, [showAll]);

  useEffect(() => { fetchBans(); }, [fetchBans]);

  // Live search with debounce
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const token = await getFirebaseIdToken();
        if (!token) return;
        const res = await fetch(`${DASHBOARD_FN}?action=search-users&q=${encodeURIComponent(searchQuery.trim())}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        }
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery]);

  const handleUnban = async (userId: string) => {
    setUnbanning(userId);
    try {
      const token = await getFirebaseIdToken();
      if (!token) return;
      await fetch(`${BANS_FN}?action=unban`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      fetchBans();
      if (searchQuery.trim().length >= 2) {
        setSearchQuery(prev => prev);
      }
    } finally {
      setUnbanning(null);
    }
  };

  const handleBanned = () => {
    fetchBans();
    if (searchQuery.trim().length >= 2) {
      const q = searchQuery;
      setSearchQuery('');
      setTimeout(() => setSearchQuery(q), 100);
    }
  };

  const handleProfileBan = (userId: string, userName: string, userEmail: string | null) => {
    setBanModal({ userId, userName, userEmail });
  };

  const activeBans = bans.filter(b => {
    if (!b.is_active) return false;
    if (!b.expires_at) return true;
    return new Date(b.expires_at) > new Date();
  });

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-destructive" />
            User Bans
            {activeBans.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                {activeBans.length}
              </span>
            )}
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">{activeBans.length} active ban{activeBans.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAll(v => !v)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${showAll ? 'bg-secondary text-foreground border-border' : 'text-muted-foreground border-border hover:bg-secondary'}`}
          >
            {showAll ? 'Active only' : 'Show all'}
          </button>
          <button
            onClick={fetchBans}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-secondary border border-border"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Search users section */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Search &amp; Ban Users
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, email or user ID..."
            className="w-full pl-9 pr-10 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Clear search">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {searching && (
          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Searching...
          </div>
        )}

        {!searching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">No users found matching "{searchQuery}"</p>
        )}

        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
            {searchResults.map((user) => (
              <div key={user.user_id} className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border hover:border-primary/20 transition-colors">
                <button
                  onClick={() => setProfileUser({ userId: user.user_id, userName: user.name, userEmail: user.email })}
                  className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-foreground flex-shrink-0 hover:ring-2 hover:ring-primary/50 transition-all"
                  title="View profile"
                >
                  {user.name.charAt(0).toUpperCase()}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-sm font-semibold text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                      onClick={() => setProfileUser({ userId: user.user_id, userName: user.name, userEmail: user.email })}
                    >
                      {user.name}
                    </span>
                    {user.active_ban && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${BAN_TYPE_COLORS[user.active_ban.ban_type] || 'text-destructive bg-destructive/10 border-destructive/30'}`}>
                        Banned – {BAN_TYPE_LABELS[user.active_ban.ban_type] || user.active_ban.ban_type}
                      </span>
                    )}
                  </div>
                  {user.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
                  <p className="text-[10px] text-muted-foreground/60 truncate">{user.user_id}</p>
                </div>
                {user.active_ban ? (
                  <button
                    onClick={() => handleUnban(user.user_id)}
                    disabled={unbanning === user.user_id}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs font-medium border border-border disabled:opacity-50"
                  >
                    {unbanning === user.user_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldOff className="h-3.5 w-3.5" />}
                    Unban
                  </button>
                ) : (
                  <button
                    onClick={() => setBanModal({ userId: user.user_id, userName: user.name, userEmail: user.email })}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors text-xs font-medium border border-destructive/30 hover:border-destructive"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Ban
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active bans list */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <UserX className="h-4 w-4 text-destructive" />
          {showAll ? 'All Bans' : 'Active Bans'}
        </h3>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : bans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-foreground">No bans found</p>
            <p className="text-xs text-muted-foreground">No active bans at the moment</p>
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto custom-scrollbar">
            {bans.map((ban) => {
              const isExpired = ban.expires_at && new Date(ban.expires_at) <= new Date();
              const isActive = ban.is_active && !isExpired;
              return (
                <div
                  key={ban.id}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                    isActive
                      ? 'bg-card border-border hover:border-primary/20'
                      : 'bg-muted/20 border-border/50 opacity-60'
                  }`}
                >
                  <button
                    onClick={() => setProfileUser({ userId: ban.user_id, userName: ban.user_name, userEmail: ban.user_email })}
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold hover:ring-2 hover:ring-primary/50 transition-all ${isActive ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}
                  >
                    {ban.user_name.charAt(0).toUpperCase()}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                        onClick={() => setProfileUser({ userId: ban.user_id, userName: ban.user_name, userEmail: ban.user_email })}
                      >
                        {ban.user_name}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${BAN_TYPE_COLORS[ban.ban_type]}`}>
                        {BAN_TYPE_LABELS[ban.ban_type]}
                      </span>
                      {!isActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border text-muted-foreground bg-muted/50 border-border">
                          {isExpired ? 'Expired' : 'Lifted'}
                        </span>
                      )}
                    </div>
                    {ban.user_email && <p className="text-xs text-muted-foreground mt-0.5">{ban.user_email}</p>}
                    {ban.reason && <p className="text-xs text-muted-foreground mt-1 italic">"{ban.reason}"</p>}
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Banned {formatDate(ban.banned_at)}
                      </span>
                      {ban.expires_at && (
                        <span className={isExpired ? 'text-muted-foreground' : 'text-warning'}>
                          {timeRemaining(ban.expires_at)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setBanHistoryModal({ userId: ban.user_id, userName: ban.user_name, userEmail: ban.user_email })}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-xs font-medium border border-border"
                      title="View ban history"
                    >
                      <History className="h-3.5 w-3.5" />
                    </button>
                    {isActive && (
                      <button
                        onClick={() => handleUnban(ban.user_id)}
                        disabled={unbanning === ban.user_id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs font-medium border border-border disabled:opacity-50"
                      >
                        {unbanning === ban.user_id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ShieldOff className="h-3.5 w-3.5" />
                        )}
                        Unban
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {banModal && (
        <BanModal
          userId={banModal.userId}
          userName={banModal.userName}
          userEmail={banModal.userEmail}
          onClose={() => setBanModal(null)}
          onBanned={handleBanned}
        />
      )}

      {banHistoryModal && (
        <BanHistoryModal
          userId={banHistoryModal.userId}
          userName={banHistoryModal.userName}
          userEmail={banHistoryModal.userEmail}
          onClose={() => setBanHistoryModal(null)}
        />
      )}

      {profileUser && (
        <PlayerProfileModal
          userId={profileUser.userId}
          userName={profileUser.userName}
          userEmail={profileUser.userEmail}
          onClose={() => setProfileUser(null)}
          onBan={handleProfileBan}
        />
      )}
    </div>
  );
};
