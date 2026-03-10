import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Star, ChevronLeft, ChevronRight, RefreshCw, Copy, Check, Search, X,
  History, MessageSquare, BarChart2, List, ChevronDown, TrendingUp, Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFirebaseIdToken } from '@/utils/firebaseToken';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';


// ─── Types ────────────────────────────────────────────────────────────────────
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

interface StatsData {
  total: number;
  avgRating: number;
  distribution: Record<number, number>;
  timeSeries: { date: string; count: number; avgRating: number }[];
}

type RatingFilter = 'good' | 'average' | 'bad';

const SUPABASE_FN = 'https://dzzeaesctendsggfdxra.supabase.co/functions/v1/admin-dashboard';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const StarRow: React.FC<{ rating: number; size?: string }> = ({ rating, size = 'h-4 w-4' }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className={`${size} ${s <= rating ? 'text-warning fill-warning' : 'text-muted-foreground/30'}`} />
    ))}
  </div>
);

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
      className="ml-1 p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
      title="Copy email"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
};

// ─── Email Compose Modal ───────────────────────────────────────────────────────
const EmailComposeModal: React.FC<{
  emails: string[];
  onClose: () => void;
}> = ({ emails, onClose }) => {
  const [copied, setCopied] = useState(false);
  const emailList = emails.join(', ');
  const mailtoLink = `mailto:${emails.join(',')}`;

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(emailList);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full p-6 flex flex-col gap-5">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-secondary transition-colors">
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg text-foreground">Send Email</h3>
          <span className="ml-auto text-xs text-muted-foreground">{emails.length} recipient{emails.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Recipients list */}
        <div className="bg-secondary/60 rounded-xl p-3 max-h-40 overflow-y-auto custom-scrollbar space-y-1.5">
          {emails.map((email) => (
            <div key={email} className="flex items-center justify-between gap-2">
              <span className="text-sm font-mono text-foreground truncate">{email}</span>
              <CopyButton text={email} />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <a
            href={mailtoLink}
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Mail className="h-4 w-4" />
            Open in Mail App
          </a>
          <button
            onClick={handleCopyAll}
            className="flex items-center justify-center gap-2 bg-secondary text-foreground rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors border border-border"
          >
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy all emails'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Note: Only users who provided an email are included.
        </p>
      </div>
    </div>
  );
};

// ─── Comment Modal ─────────────────────────────────────────────────────────────
const CommentModal: React.FC<{ comment: string; onClose: () => void }> = ({ comment, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[80vh] flex flex-col">
      <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-secondary transition-colors">
        <X className="h-5 w-5 text-muted-foreground" />
      </button>
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="font-display text-lg text-foreground">Full Comment</h3>
      </div>
      <div className="overflow-y-auto flex-1 custom-scrollbar">
        <p className="text-foreground whitespace-pre-wrap leading-relaxed break-words">{comment}</p>
      </div>
    </div>
  </div>
);

// ─── User History Modal ────────────────────────────────────────────────────────
const UserHistoryModal: React.FC<{
  userId: string;
  username: string | null;
  email: string | null;
  onClose: () => void;
}> = ({ userId, username, email, onClose }) => {
  const [history, setHistory] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [openComment, setOpenComment] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getFirebaseIdToken();
        if (!token) return;
        const res = await fetch(
          `${SUPABASE_FN}?action=user-feedback-history&user_id=${encodeURIComponent(userId)}`,
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
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[80vh] flex flex-col">
          <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full hover:bg-secondary transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <History className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg text-foreground">Feedback History</h3>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            {username || 'Anonymous'}{email ? ` · ${email}` : ''}
          </p>
          <div className="overflow-y-auto flex-1 space-y-3 pr-1 custom-scrollbar">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
              ))
            ) : history.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No feedback history</p>
            ) : (
              history.map((fb) => (
                <div
                  key={fb.id}
                  className="bg-muted/30 rounded-lg p-4 border border-border cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => fb.comment && setOpenComment(fb.comment)}
                  title={fb.comment ? 'Click to read full comment' : undefined}
                >
                  <div className="flex items-center justify-between mb-2">
                    <StarRow rating={fb.rating} />
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {new Date(fb.created_at).toLocaleDateString()} {new Date(fb.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {fb.comment ? (
                    <p className="text-sm text-foreground break-words whitespace-pre-wrap line-clamp-3">{fb.comment}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No comment</p>
                  )}
                  {fb.comment && fb.comment.length > 150 && (
                    <p className="text-xs text-primary mt-1">Click to read full message</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      {openComment && <CommentModal comment={openComment} onClose={() => setOpenComment(null)} />}
    </>
  );
};

// ─── Stats View ────────────────────────────────────────────────────────────────
const StatsView: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState<'day' | 'week'>('week');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getFirebaseIdToken();
      if (!token) return;
      const res = await fetch(`${SUPABASE_FN}?action=feedback-stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const fmt = (iso: string) => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  // Get Monday of the week containing a given date
  const getMondayOf = (date: Date): Date => {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    const day = d.getUTCDay(); // 0=Sun,1=Mon,...
    const diff = (day + 6) % 7;
    d.setUTCDate(d.getUTCDate() - diff);
    return d;
  };

  const toIso = (d: Date) => d.toISOString().substring(0, 10);

  // Build continuous chart data with NO gaps
  const chartData = useMemo(() => {
    if (!stats || stats.timeSeries.length === 0) return [];

    // Build lookup: date -> { count, avgRating }
    const lookup: Record<string, { count: number; avgRating: number }> = {};
    for (const d of stats.timeSeries) {
      lookup[d.date] = { count: d.count, avgRating: d.avgRating };
    }

    // Determine effective range
    const allDates = stats.timeSeries.map((d) => d.date).sort();
    const rawStart = dateFrom || allDates[0];
    const rawEnd = dateTo || allDates[allDates.length - 1];

    if (!rawStart || !rawEnd) return [];

    if (granularity === 'day') {
      // Fill every day from start to end
      const result: { date: string; dateLabel: string; count: number; avgRating: number }[] = [];
      const cur = new Date(rawStart + 'T00:00:00Z');
      const end = new Date(rawEnd + 'T00:00:00Z');
      while (cur <= end) {
        const iso = toIso(cur);
        const entry = lookup[iso];
        result.push({
          date: fmt(iso),
          dateLabel: fmt(iso),
          count: entry?.count ?? 0,
          avgRating: entry?.avgRating ?? 0,
        });
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
      return result;
    }

    // Weekly: Monday → Sunday, no gaps
    const startMonday = getMondayOf(new Date(rawStart + 'T00:00:00Z'));
    const endDate = new Date(rawEnd + 'T00:00:00Z');

    const result: { date: string; dateLabel: string; count: number; avgRating: number }[] = [];
    const cur = new Date(startMonday);

    while (cur <= endDate) {
      const mondayIso = toIso(cur);
      const sundayDate = new Date(cur);
      sundayDate.setUTCDate(cur.getUTCDate() + 6);
      const sundayIso = toIso(sundayDate);

      // Sum all days in this Mon-Sun window
      let totalCount = 0;
      let totalWeightedRating = 0;
      const dayCursor = new Date(cur);
      for (let i = 0; i < 7; i++) {
        const dayIso = toIso(dayCursor);
        const entry = lookup[dayIso];
        if (entry) {
          totalCount += entry.count;
          totalWeightedRating += entry.avgRating * entry.count;
        }
        dayCursor.setUTCDate(dayCursor.getUTCDate() + 1);
      }

      result.push({
        date: fmt(mondayIso),
        dateLabel: `${fmt(mondayIso)} – ${fmt(sundayIso)}`,
        count: totalCount,
        avgRating: totalCount > 0 ? Math.round((totalWeightedRating / totalCount) * 10) / 10 : 0,
      });

      // Next Monday
      cur.setUTCDate(cur.getUTCDate() + 7);
    }

    return result;
  }, [stats, granularity, dateFrom, dateTo]);

  const filteredTotal = useMemo(() => chartData.reduce((s, d) => s + d.count, 0), [chartData]);
  const filteredAvg = useMemo(() => {
    if (!chartData.length) return 0;
    const totalWeighted = chartData.reduce((s, d) => s + d.avgRating * d.count, 0);
    const totalCount = chartData.reduce((s, d) => s + d.count, 0);
    return totalCount > 0 ? Math.round((totalWeighted / totalCount) * 10) / 10 : 0;
  }, [chartData]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!stats) return <p className="text-muted-foreground">Failed to load stats.</p>;

  return (
    <div className="space-y-6">
      {/* Header row with Refresh */}
      <div className="flex items-center justify-end">
        <Button variant="outline" size="sm" onClick={fetchStats} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Stats
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">Total Reviews</p>
          <p className="text-3xl font-display text-foreground">{stats.total}</p>
          {(dateFrom || dateTo) ? (
            <p className="text-xs text-primary mt-1">Period: {filteredTotal}</p>
          ) : null}
        </div>
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Avg Rating</p>
          <p className="text-3xl font-display text-foreground">{stats.avgRating}</p>
          <StarRow rating={Math.round(stats.avgRating)} size="h-3.5 w-3.5" />
          {(dateFrom || dateTo) && filteredAvg !== stats.avgRating ? (
            <p className="text-xs text-primary">Period: {filteredAvg}</p>
          ) : null}
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">5★ Reviews</p>
          <p className="text-3xl font-display text-foreground">{stats.distribution[5] || 0}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.total > 0 ? Math.round(((stats.distribution[5] || 0) / stats.total) * 100) : 0}% of total
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1">Poor Reviews (≤2★)</p>
          <p className="text-3xl font-display text-foreground text-destructive">
            {(stats.distribution[1] || 0) + (stats.distribution[2] || 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.total > 0 ? Math.round((((stats.distribution[1] || 0) + (stats.distribution[2] || 0)) / stats.total) * 100) : 0}% of total
          </p>
        </div>
      </div>

      {/* Time Series Controls */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h3 className="font-display text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Evolution Over Time
          </h3>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Date Range */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
              />
              <span className="text-xs text-muted-foreground">→</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
              />
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {/* Granularity */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(['day', 'week'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  className={`px-3 py-1 text-xs transition-colors capitalize ${granularity === g ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}
                >
                  {g === 'day' ? 'Day' : 'Week'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {chartData.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 text-sm">No data for the selected period.</p>
        ) : (
          <div className="space-y-8">
            {/* Avg Rating Chart */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Average Rating</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, 5]}
                    ticks={[0, 1, 2, 3, 4, 5]}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: 4 }}
                    formatter={(value: number) => [`${value} ★`, 'Avg Rating']}
                    labelFormatter={(_: unknown, payload: unknown[]) => {
                      const p = payload as Array<{ payload: { dateLabel: string } }>;
                      return p?.[0]?.payload?.dateLabel ?? '';
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgRating"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                    activeDot={{ r: 7, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Review Count Chart */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Number of Reviews</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: 4 }}
                    formatter={(value: number) => [`${value}`, 'Reviews']}
                    labelFormatter={(_: unknown, payload: unknown[]) => {
                      const p = payload as Array<{ payload: { dateLabel: string } }>;
                      return p?.[0]?.payload?.dateLabel ?? '';
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--warning))"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: 'hsl(var(--warning))', strokeWidth: 0 }}
                    activeDot={{ r: 7, fill: 'hsl(var(--warning))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Table View ───────────────────────────────────────────────────────────────
const TableView: React.FC = () => {
  const [allFeedbacks, setAllFeedbacks] = useState<Feedback[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  // Filters (client-side on current page)
  const [ratingFilters, setRatingFilters] = useState<Set<RatingFilter>>(new Set());
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'day' | '3days' | 'week'>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Modals
  const [commentModal, setCommentModal] = useState<string | null>(null);
  const [historyModal, setHistoryModal] = useState<Feedback | null>(null);
  const [emailModal, setEmailModal] = useState(false);

  const fetchFeedbacks = useCallback(async (p: number, ps: number) => {
    setLoading(true);
    try {
      const token = await getFirebaseIdToken();
      if (!token) return;
      const res = await fetch(
        `${SUPABASE_FN}?action=feedbacks&page=${p}&pageSize=${ps}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data: FeedbackResponse = await res.json();
        setAllFeedbacks(data.feedbacks);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Failed to fetch feedbacks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFeedbacks(page, pageSize); }, [page, pageSize, fetchFeedbacks]);

  // Reset page when pageSize changes
  const handlePageSizeChange = (ps: number) => { setPageSize(ps); setPage(0); };

  // Client-side filtering
  const filtered = useMemo(() => {
    let list = [...allFeedbacks];
    if (dateFilter !== 'all') {
      const ms = dateFilter === 'day' ? 86400000 : dateFilter === '3days' ? 259200000 : 604800000;
      list = list.filter((fb) => Date.now() - new Date(fb.created_at).getTime() <= ms);
    }
    if (ratingFilters.size > 0) {
      list = list.filter((fb) => {
        if (ratingFilters.has('good') && fb.rating >= 4) return true;
        if (ratingFilters.has('average') && fb.rating === 3) return true;
        if (ratingFilters.has('bad') && fb.rating <= 2) return true;
        return false;
      });
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (fb) => (fb.username || '').toLowerCase().includes(q) || (fb.email || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [allFeedbacks, dateFilter, ratingFilters, search]);

  const totalPages = Math.ceil(total / pageSize);
  const activeFilterCount = (dateFilter !== 'all' ? 1 : 0) + ratingFilters.size + (search ? 1 : 0);

  // Selection
  const allFilteredSelected = filtered.length > 0 && filtered.every((fb) => selected.has(fb.id));
  const toggleAll = () => {
    setSelected((prev) => {
      const n = new Set(prev);
      allFilteredSelected ? filtered.forEach((fb) => n.delete(fb.id)) : filtered.forEach((fb) => n.add(fb.id));
      return n;
    });
  };
  const toggleOne = (id: string) => setSelected((prev) => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const toggleRating = (r: RatingFilter) => setRatingFilters((prev) => {
    const n = new Set(prev); n.has(r) ? n.delete(r) : n.add(r); return n;
  });

  const clearFilters = () => { setDateFilter('all'); setRatingFilters(new Set()); setSearch(''); };

  // Get emails from selected feedbacks
  const selectedEmails = useMemo(() => {
    const emails: string[] = [];
    for (const fb of allFeedbacks) {
      if (selected.has(fb.id) && fb.email) {
        emails.push(fb.email);
      }
    }
    return [...new Set(emails)]; // deduplicate
  }, [selected, allFeedbacks]);

  const DATE_OPTIONS = [
    { key: 'all' as const, label: 'All time' },
    { key: 'day' as const, label: 'Last 24h' },
    { key: '3days' as const, label: 'Last 3 days' },
    { key: 'week' as const, label: 'Last week' },
  ];
  const RATING_OPTIONS: { key: RatingFilter; label: string }[] = [
    { key: 'good', label: '⭐ Good (4-5★)' },
    { key: 'average', label: '⭐ Average (3★)' },
    { key: 'bad', label: '⭐ Bad (1-2★)' },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Panel */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters & Search</span>
            {activeFilterCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
        </button>

        {filtersOpen && (
          <div className="px-5 pb-5 pt-2 border-t border-border space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by username or email…"
                className="w-full pl-9 pr-9 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Date filter */}
              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1.5">Date range</label>
                <div className="relative">
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
                    className="w-full appearance-none bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary pr-8"
                  >
                    {DATE_OPTIONS.map((o) => (
                      <option key={o.key} value={o.key}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Rating filter */}
              <div>
                <label className="text-xs text-muted-foreground font-medium block mb-1.5">Rating</label>
                <div className="flex flex-wrap gap-2">
                  {RATING_OPTIONS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => toggleRating(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                        ratingFilters.has(key)
                          ? key === 'good'
                            ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/50'
                            : key === 'average'
                            ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/50'
                            : 'bg-destructive/10 text-destructive border-destructive/50'
                          : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-primary">{filtered.length} result{filtered.length !== 1 ? 's' : ''} on this page</span>
                <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground underline">
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selection bar */}
      {selected.size > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl px-5 py-3 flex items-center gap-3 flex-wrap">
          <p className="text-sm font-medium text-primary">{selected.size} selected</p>
          {selectedEmails.length > 0 && (
            <button
              onClick={() => setEmailModal(true)}
              className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              <Mail className="h-3.5 w-3.5" />
              Send email ({selectedEmails.length})
            </button>
          )}
          {selectedEmails.length === 0 && selected.size > 0 && (
            <span className="text-xs text-muted-foreground italic">No emails available for selected users</span>
          )}
          <button onClick={() => setSelected(new Set())} className="text-muted-foreground hover:text-foreground ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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
                Array.from({ length: pageSize }).map((_, i) => (
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
                    onClick={() => setHistoryModal(fb)}
                    className={`border-b border-border transition-colors hover:bg-muted/10 cursor-pointer ${selected.has(fb.id) ? 'bg-primary/5' : ''}`}
                  >
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(fb.id)}
                        onChange={() => toggleOne(fb.id)}
                        className="rounded cursor-pointer accent-primary"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground font-medium">
                      <div className="flex items-center gap-1 text-primary">
                        <History className="h-3.5 w-3.5 opacity-50" />
                        {fb.username || 'Anonymous'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground" onClick={(e) => e.stopPropagation()}>
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
                      <StarRow rating={fb.rating} />
                    </td>
                    <td className="px-4 py-4 text-sm text-foreground max-w-xs" onClick={(e) => { e.stopPropagation(); if (fb.comment) setCommentModal(fb.comment); }}>
                      {fb.comment ? (
                        <span className="truncate max-w-[200px] block text-left hover:text-primary transition-colors cursor-pointer" title="Click to read full comment">
                          {fb.comment}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">No comment</span>
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
        <div className="flex items-center justify-between px-5 py-4 border-t border-border flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="appearance-none bg-secondary border border-border rounded-lg px-3 py-1 text-sm text-foreground focus:outline-none focus:border-primary pr-7"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Page <span className="font-medium text-foreground">{page + 1}</span> of <span className="font-medium text-foreground">{Math.max(1, totalPages)}</span>
              <span className="ml-2 opacity-60">({total} total)</span>
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage(0)} disabled={page === 0} className="px-2">
                <ChevronLeft className="h-3.5 w-3.5" /><ChevronLeft className="h-3.5 w-3.5 -ml-2" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} className="px-2">
                <ChevronRight className="h-3.5 w-3.5" /><ChevronRight className="h-3.5 w-3.5 -ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {commentModal && <CommentModal comment={commentModal} onClose={() => setCommentModal(null)} />}
      {historyModal && (
        <UserHistoryModal
          userId={historyModal.user_id}
          username={historyModal.username}
          email={historyModal.email}
          onClose={() => setHistoryModal(null)}
        />
      )}
      {emailModal && (
        <EmailComposeModal
          emails={selectedEmails}
          onClose={() => setEmailModal(false)}
        />
      )}
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export const AdminFeedback: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'table' | 'stats'>('table');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display text-foreground">Feedback</h1>
          <p className="text-muted-foreground mt-1">User reviews and ratings</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-muted/30 border border-border rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setActiveTab('table')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'table'
              ? 'bg-card shadow text-foreground border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <List className="h-4 w-4" />
          Reviews Table
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'stats'
              ? 'bg-card shadow text-foreground border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart2 className="h-4 w-4" />
          Statistics
        </button>
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === 'table' && <TableView />}
        {activeTab === 'stats' && <StatsView />}
      </div>
    </div>
  );
};
