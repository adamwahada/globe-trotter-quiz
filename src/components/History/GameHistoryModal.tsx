import React, { useEffect, useState } from 'react';
import { X, Trophy, Target, Calendar, Users, Clock, CheckCircle, XCircle, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  created_at: string;
}

interface GameHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameHistoryModal: React.FC<GameHistoryModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [history, setHistory] = useState<GameHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      fetchHistory();
    }
  }, [isOpen, user]);

  const fetchHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('game_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching game history:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden max-h-[85vh] flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-display text-foreground flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {t('gameHistory')}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('loading')}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{t('noGamesYet')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('startPlayingToSeeHistory')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((game) => (
                <div 
                  key={game.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    game.is_winner 
                      ? 'bg-podium-gold/10 border-podium-gold/30' 
                      : 'bg-secondary border-border'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {game.is_winner && <Crown className="h-4 w-4 text-podium-gold" />}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(game.created_at)}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                      {game.is_solo_mode ? t('soloModeShort') : `${game.player_count} ${t('playersCount')}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-xl font-display text-primary">{game.score}</p>
                      <p className="text-xs text-muted-foreground">{t('score')}</p>
                    </div>
                    <div>
                      <p className="text-xl font-display text-success">{game.countries_correct}</p>
                      <p className="text-xs text-muted-foreground">{t('correct')}</p>
                    </div>
                    <div>
                      <p className="text-xl font-display text-destructive">{game.countries_wrong}</p>
                      <p className="text-xs text-muted-foreground">{t('wrong')}</p>
                    </div>
                    <div>
                      <p className="text-xl font-display text-info">{game.total_turns}</p>
                      <p className="text-xs text-muted-foreground">{t('turnsCount')}</p>
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
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border">
          <Button variant="outline" className="w-full" onClick={onClose}>
            {t('close')}
          </Button>
        </div>
      </div>
    </div>
  );
};
