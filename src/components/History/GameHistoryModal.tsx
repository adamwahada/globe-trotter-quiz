import React, { useEffect, useState, useMemo } from 'react';
import { X, Trophy, Target, Calendar, Clock, Crown, Hash, ArrowUpDown, ChevronDown } from 'lucide-react';
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

interface GameHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SortType = 'date' | 'score' | 'rank';

export const GameHistoryModal: React.FC<GameHistoryModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setLoading(true);
      fetchGameHistoryServer()
        .then(({ data }) => setHistory(data || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, user]);

  const sortedHistory = useMemo(() => {
    const sorted = [...history];
    switch (sortBy) {
      case 'score': return sorted.sort((a, b) => b.score - a.score);
      case 'rank': return sorted.sort((a, b) => (a.rank || 99) - (b.rank || 99));
      default: return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [history, sortBy]);

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
            {t('gameHistory')}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">{t('loading')}</div>
          ) : sortedHistory.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{t('noGamesYet')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('startPlayingToSeeHistory')}</p>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {/* Sort controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowUpDown className="h-3 w-3" />
                  Sort
                  <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
                {showFilters && (
                  <div className="flex gap-1.5 animate-fade-in">
                    {(['date', 'score', 'rank'] as SortType[]).map(s => (
                      <button
                        key={s}
                        onClick={() => setSortBy(s)}
                        className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                          sortBy === s
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {s === 'date' ? '📅 Date' : s === 'score' ? '⭐ Score' : '🏆 Rank'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Game entries */}
              {sortedHistory.map((game) => {
                const totalAttempts = game.countries_correct + game.countries_wrong;
                const accuracy = totalAttempts > 0 ? Math.round((game.countries_correct / totalAttempts) * 100) : 0;

                return (
                  <div
                    key={game.id}
                    className={`p-3 rounded-xl border transition-colors ${
                      game.is_winner
                        ? 'bg-podium-gold/10 border-podium-gold/30'
                        : 'bg-secondary border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {game.is_winner && <Crown className="h-4 w-4 text-podium-gold" />}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(game.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {game.rank > 0 && !game.is_solo_mode && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {game.rank}/{game.player_count}
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                          {game.is_solo_mode ? t('soloModeShort') : `${game.player_count} ${t('playersCount')}`}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className="text-lg font-display text-primary">{game.score}</p>
                        <p className="text-[10px] text-muted-foreground">{t('score')}</p>
                      </div>
                      <div>
                        <p className="text-lg font-display text-success">{game.countries_correct}</p>
                        <p className="text-[10px] text-muted-foreground">{t('correct')}</p>
                      </div>
                      <div>
                        <p className="text-lg font-display text-destructive">{game.countries_wrong}</p>
                        <p className="text-[10px] text-muted-foreground">{t('wrong')}</p>
                      </div>
                      <div>
                        <p className="text-lg font-display text-info">{accuracy}%</p>
                        <p className="text-[10px] text-muted-foreground">{game.countries_correct}/{totalAttempts}</p>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {game.game_duration_minutes} {t('minutesShort')}
                      </span>
                      <span>#{game.session_code}</span>
                    </div>
                  </div>
                );
              })}
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
