import React, { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFirebaseIdToken } from '@/utils/firebaseToken';

interface Feedback {
  id: string;
  rating: number;
  comment: string | null;
  username: string | null;
  user_id: string;
  created_at: string;
}

interface FeedbackResponse {
  feedbacks: Feedback[];
  total: number;
  avgRating: number;
  page: number;
}

export const AdminFeedback: React.FC = () => {
  const [data, setData] = useState<FeedbackResponse | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchFeedbacks = async (p: number) => {
    setLoading(true);
    try {
      const token = await getFirebaseIdToken();
      if (!token) return;

      const res = await fetch(`https://dzzeaesctendsggfdxra.supabase.co/functions/v1/admin-dashboard?action=feedbacks&page=${p}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks(page);
  }, [page]);

  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  return (
    <div>
      <h1 className="text-3xl font-display text-foreground mb-2">Feedback</h1>
      <p className="text-muted-foreground mb-8">User reviews and ratings</p>

      {/* Stats bar */}
      {data && (
        <div className="flex gap-6 mb-8">
          <div className="bg-card rounded-xl border border-border px-6 py-4 flex items-center gap-3">
            <Star className="h-5 w-5 text-warning fill-warning" />
            <div>
              <p className="text-2xl font-display text-foreground">{data.avgRating}</p>
              <p className="text-xs text-muted-foreground">Average Rating</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border px-6 py-4">
            <p className="text-2xl font-display text-foreground">{data.total}</p>
            <p className="text-xs text-muted-foreground">Total Reviews</p>
          </div>
        </div>
      )}

      {/* Feedback list */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">User</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Rating</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Comment</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-24 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-16 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-40 animate-pulse" /></td>
                    <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-20 animate-pulse" /></td>
                  </tr>
                ))
              ) : data?.feedbacks.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No feedback yet
                  </td>
                </tr>
              ) : (
                data?.feedbacks.map((fb) => (
                  <tr key={fb.id} className="border-b border-border hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground font-medium">
                      {fb.username || 'Anonymous'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-4 w-4 ${s <= fb.rating ? 'text-warning fill-warning' : 'text-muted-foreground/30'}`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground max-w-md truncate">
                      {fb.comment || <span className="text-muted-foreground italic">No comment</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(fb.created_at).toLocaleDateString()}
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
            <p className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
