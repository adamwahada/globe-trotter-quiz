import React, { useEffect, useState, useMemo } from 'react';
import { X, Trophy, Target, Award, Star, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { fetchGameHistoryServer } from '@/services/scoringService';

interface GameHistoryEntry {
  id: string;
  session_code: string;
  score: number;
  countries_correct: number;
  countries_wrong: number;
  total_turns: number;
  is_winner: boolean;
  player_count: number;
  game_duration_minutes: number;
  is_solo_mode: boolean;
  rank: number;
  created_at: string;
}

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      setLoading(true);
      fetchGameHistoryServer()
        .then(({ data }) => setHistory(data || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, user]);

  const stats = useMemo(() => {
    const totalGames = history.length;
    const soloGames = history.filter(g => g.is_solo_mode).length;
    const multiGames = history.filter(g => !g.is_solo_mode).length;

    // Average accuracy only for multiplayer sessions
    const multiHistory = history.filter(g => !g.is_solo_mode);
    const multiAccuracies = multiHistory.map(g => {
      const total = g.countries_correct + g.countries_wrong;
      return total > 0 ? (g.countries_correct / total) * 100 : 0;
    });
    const avgMultiAccuracy = multiAccuracies.length > 0
      ? Math.round(multiAccuracies.reduce((s, a) => s + a, 0) / multiAccuracies.length)
      : 0;

    // Win rate: only multiplayer wins
    const multiWins = multiHistory.filter(g => g.is_winner).length;
    const winRate = multiGames > 0 ? Math.round((multiWins / multiGames) * 100) : 0;

    const firstPlaceCount = multiHistory.filter(g => g.rank === 1).length;

    // Games by specific mode — we can distinguish by game_duration_minutes or player_count
    // For now: solo, multiplayer standard (Speed Race), Against the Clock
    // Against the Clock games typically have different duration patterns
    // Since we don't have a mode column, we'll just show solo vs multiplayer
    const top5Scores = [...history].sort((a, b) => b.score - a.score).slice(0, 5);

    return { totalGames, soloGames, multiGames, avgMultiAccuracy, winRate, firstPlaceCount, top5Scores };
  }, [history]);

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-display text-foreground flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {t('achievements')}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">{t('loading')}</div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Global Stats */}
              <div>
                <h3 className="text-sm font-display text-foreground mb-2 flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-primary" />
                  {t('statistics')}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <StatCard label={t('totalGames')} value={stats.totalGames} icon="🎮" />
                  <StatCard label="Avg Accuracy (MP)" value={`${stats.avgMultiAccuracy}%`} icon="🎯" />
                  <StatCard label={t('winRate')} value={`${stats.winRate}%`} icon="🏆" />
                  <StatCard label={t('avgScore')} value={
                    history.length > 0
                      ? (history.reduce((s, g) => s + g.score, 0) / history.length).toFixed(1)
                      : '0'
                  } icon="⭐" />
                </div>
              </div>

              {/* Games by Mode */}
              <div>
                <h3 className="text-sm font-display text-foreground mb-2 flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-primary" />
                  Games by Mode
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <StatCard label="Solo" value={stats.soloGames} icon="🧍" />
                  <StatCard label="Multiplayer" value={stats.multiGames} icon="👥" />
                </div>
              </div>

              {/* 1st Place */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-podium-gold/10 border border-podium-gold/30">
                <div className="text-2xl">🥇</div>
                <div className="flex-1">
                  <p className="text-sm font-display text-foreground">1st Place Finishes</p>
                  <p className="text-xs text-muted-foreground">Multiplayer games won</p>
                </div>
                <p className="text-2xl font-display text-podium-gold">{stats.firstPlaceCount}</p>
              </div>

              {/* Top 5 Scores */}
              <div>
                <h3 className="text-sm font-display text-foreground mb-2 flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-podium-gold" />
                  Top 5 Best Scores
                </h3>
                {stats.top5Scores.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-3">{t('noGamesYet')}</p>
                ) : (
                  <div className="space-y-1.5">
                    {stats.top5Scores.map((game, i) => {
                      const totalAttempts = game.countries_correct + game.countries_wrong;
                      const accuracy = totalAttempts > 0 ? Math.round((game.countries_correct / totalAttempts) * 100) : 0;
                      return (
                        <div key={game.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary border border-border">
                          <span className="w-6 text-center font-display text-sm">
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-display text-primary">{game.score} pts</span>
                              <span className="text-[10px] text-muted-foreground">• {accuracy}%</span>
                              {game.rank > 0 && !game.is_solo_mode && (
                                <span className="text-[10px] text-muted-foreground">• #{game.rank}/{game.player_count}</span>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground">{formatDate(game.created_at)}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                            {game.is_solo_mode ? 'Solo' : `${game.player_count}P`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-border">
          <Button variant="outline" className="w-full" onClick={onClose}>
            {t('close')}
          </Button>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string | number; icon: string }> = ({ label, value, icon }) => (
  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary border border-border">
    <span className="text-lg">{icon}</span>
    <div>
      <p className="text-base font-display text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  </div>
);
