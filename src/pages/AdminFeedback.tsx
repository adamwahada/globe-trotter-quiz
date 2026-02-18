import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Star, ChevronLeft, ChevronRight, RefreshCw, Copy, Check, Search, X, History, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFirebaseIdToken } from '@/utils/firebaseToken';

interface Feedback {
  id: string;
  rating: number;
  comment: string | null;
  username: string | null;
  email: string | null;
  user_id: string;
  created_at: string;
}

interface FeedbackResponse {
  feedbacks: Feedback[];
  total: number;
  avgRating: number;
  page: number;
}

type DateFilter = 'all' | 'day' | '3days' | 'week';
type RatingFilter = 'good' | 'average' | 'bad';

// ─── Comment Modal ───────────────────────────────────────────────────────────
const CommentModal: React.FC<{ comment: string; onClose: () => void }> = ({ comment, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6">
      <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-secondary transition-colors">
        <X className="h-5 w-5 text-muted-foreground" />
      </button>
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg text-foreground">Full Comment</h3>
      </div>
      <p className="text-foreground whitespace-pre-wrap leading-relaxed">{comment}</p>
    </div>
  </div>
);

// ─── User History Modal ──────────────────────────────────────────────────────
const UserHistoryModal: React.FC<{
  userId: string;
  username: string | null;
  email: string | null;
  onClose: () => void;
}> = ({ userId, username, email, onClose }) => {
  const [history, setHistory] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getFirebaseIdToken();
        if (!token) return;
        const res = await fetch(
          `https://dzzeaesctendsggfdxra.supabase.co/functions/v1/admin-dashboard?action=user-feedback-history&user_id=${encodeURIComponent(userId)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 max-h-[80vh] flex flex-col">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-secondary transition-colors">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2 mb-1">
          <History className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg text-foreground">Feedback history</h3>
        </div>
        <p className="text-muted-foreground text-sm mb-4">
          {username || 'Anonymous'}{email ? ` · ${email}` : ''}
        </p>
        <div className="overflow-y-auto flex-1 space-y-3 pr-1">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))
          ) : history.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No feedback history</p>
          ) : (
            history.map((fb) => (
              <div key={fb.id} className="bg-muted/30 rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`h-4 w-4 ${s <= fb.rating ? 'text-warning fill-warning' : 'text-muted-foreground/30'}`} />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(fb.created_at).toLocaleDateString()} {new Date(fb.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {fb.comment ? (
                  <p className="text-sm text-foreground">{fb.comment}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No comment</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Copy Button ─────────────────────────────────────────────────────────────
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-1 p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
      title="Copy email"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export const AdminFeedback: React.FC = () => {
  const [allFeedbacks, setAllFeedbacks] = useState<Feedback[]>([]);
  const [total, setTotal] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [ratingFilters, setRatingFilters] = useState<Set<RatingFilter>>(new Set());
  const [search, setSearch] = useState('');

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Modals
  const [commentModal, setCommentModal] = useState<string | null>(null);
  const [historyModal, setHistoryModal] = useState<Feedback | null>(null);

  const fetchFeedbacks = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const token = await getFirebaseIdToken();
      if (!token) return;
      const res = await fetch(
        `https://dzzeaesctendsggfdxra.supabase.co/functions/v1/admin-dashboard?action=feedbacks&page=${p}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data: FeedbackResponse = await res.json();
        setAllFeedbacks(data.feedbacks);
        setTotal(data.total);
        setAvgRating(data.avgRating);
      }
    } catch (err) {
      console.error('Failed to fetch feedbacks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFeedbacks(page); }, [page, fetchFeedbacks]);

  // ── Client-side filtering ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...allFeedbacks];

    // Date filter
    if (dateFilter !== 'all') {
      const now = Date.now();
      const ms = dateFilter === 'day' ? 86400000 : dateFilter === '3days' ? 259200000 : 604800000;
      list = list.filter((fb) => now - new Date(fb.created_at).getTime() <= ms);
    }

    // Rating filter
    if (ratingFilters.size > 0) {
      list = list.filter((fb) => {
        if (ratingFilters.has('good') && fb.rating >= 4) return true;
        if (ratingFilters.has('average') && fb.rating === 3) return true;
        if (ratingFilters.has('bad') && fb.rating <= 2) return true;
        return false;
      });
    }

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (fb) =>
          (fb.username || '').toLowerCase().includes(q) ||
          (fb.email || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [allFeedbacks, dateFilter, ratingFilters, search]);

  const totalPages = Math.ceil(total / 20);

  // ── Selection helpers ──────────────────────────────────────────────────────
  const allFilteredSelected = filtered.length > 0 && filtered.every((fb) => selected.has(fb.id));
  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelected((prev) => { const n = new Set(prev); filtered.forEach((fb) => n.delete(fb.id)); return n; });
    } else {
      setSelected((prev) => { const n = new Set(prev); filtered.forEach((fb) => n.add(fb.id)); return n; });
    }
  };
  const toggleOne = (id: string) => {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  // ── Filter pills ───────────────────────────────────────────────────────────
  const toggleRating = (r: RatingFilter) => {
    setRatingFilters((prev) => { const n = new Set(prev); n.has(r) ? n.delete(r) : n.add(r); return n; });
  };

  const activeFilterCount = (dateFilter !== 'all' ? 1 : 0) + ratingFilters.size + (search ? 1 : 0);

  const DATE_LABELS: { key: DateFilter; label: string }[] = [
    { key: 'all', label: 'All time' },
    { key: 'day', label: 'Last 24h' },
    { key: '3days', label: 'Last 3 days' },
    { key: 'week', label: 'Last week' },
  ];
  const RATING_LABELS: { key: RatingFilter; label: string; color: string }[] = [
    { key: 'good', label: '⭐ Good (4-5)', color: 'text-emerald-400 border-emerald-400/50 bg-emerald-400/10' },
    { key: 'average', label: '⭐ Average (3)', color: 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10' },
    { key: 'bad', label: '⭐ Bad (1-2)', color: 'text-red-400 border-red-400/50 bg-red-400/10' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display text-foreground">Feedback</h1>
          <p className="text-muted-foreground mt-1">User reviews and ratings</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchFeedbacks(page)} disabled={loading} className="gap-2 mt-1">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border px-5 py-4 flex items-center gap-3">
          <Star className="h-5 w-5 text-warning fill-warning" />
          <div>
            <p className="text-2xl font-display text-foreground">{avgRating}</p>
            <p className="text-xs text-muted-foreground">Avg Rating</p>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border px-5 py-4">
          <p className="text-2xl font-display text-foreground">{total}</p>
          <p className="text-xs text-muted-foreground">Total Reviews</p>
        </div>
        {selected.size > 0 && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl px-5 py-4 flex items-center gap-2">
            <p className="text-sm font-medium text-primary">{selected.size} selected</p>
            <button onClick={() => setSelected(new Set())} className="text-muted-foreground hover:text-foreground ml-2">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Filter Section */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or email…"
            className="w-full pl-9 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Date pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium mr-1">Date:</span>
          {DATE_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setDateFilter(key)}
              className={`px-3 py-1 rounded-full text-xs border transition-all ${
                dateFilter === key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Rating pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium mr-1">Rating:</span>
          {RATING_LABELS.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => toggleRating(key)}
              className={`px-3 py-1 rounded-full text-xs border transition-all ${
                ratingFilters.has(key) ? color : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Active filter summary */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-primary font-medium">{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active</span>
            <button
              onClick={() => { setDateFilter('all'); setRatingFilters(new Set()); setSearch(''); }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear all
            </button>
            <span className="text-xs text-muted-foreground ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleAll}
                    className="rounded cursor-pointer accent-primary"
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Rating</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Comment</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No feedback matches your filters
                  </td>
                </tr>
              ) : (
                filtered.map((fb) => (
                  <tr
                    key={fb.id}
                    className={`border-b border-border transition-colors hover:bg-muted/10 ${selected.has(fb.id) ? 'bg-primary/5' : ''}`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selected.has(fb.id)}
                        onChange={() => toggleOne(fb.id)}
                        className="rounded cursor-pointer accent-primary"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground font-medium">
                      <button
                        onClick={() => setHistoryModal(fb)}
                        className="hover:text-primary hover:underline flex items-center gap-1 transition-colors"
                        title="View feedback history"
                      >
                        {fb.username || 'Anonymous'}
                        <History className="h-3.5 w-3.5 opacity-50" />
                      </button>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {fb.email ? (
                        <div className="flex items-center">
                          <span className="font-mono text-xs">{fb.email}</span>
                          <CopyButton text={fb.email} />
                        </div>
                      ) : (
                        <span className="italic text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-4 w-4 ${s <= fb.rating ? 'text-warning fill-warning' : 'text-muted-foreground/30'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground max-w-xs">
                      {fb.comment ? (
                        <button
                          onClick={() => setCommentModal(fb.comment!)}
                          className="truncate max-w-[240px] block text-left hover:text-primary transition-colors"
                          title="Click to read full comment"
                        >
                          {fb.comment}
                        </button>
                      ) : (
                        <span className="text-muted-foreground italic">No comment</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(fb.created_at).toLocaleDateString()}{' '}
                      <span className="text-xs opacity-60">
                        {new Date(fb.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <p className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Comment Modal */}
      {commentModal && <CommentModal comment={commentModal} onClose={() => setCommentModal(null)} />}

      {/* User History Modal */}
      {historyModal && (
        <UserHistoryModal
          userId={historyModal.user_id}
          username={historyModal.username}
          email={historyModal.email}
          onClose={() => setHistoryModal(null)}
        />
      )}
    </div>
  );
};
