import React, { useEffect, useRef, useState } from 'react';
import { Trophy, Medal, Award, TrendingUp, TrendingDown } from 'lucide-react';
import { AvatarDisplay } from '@/components/Avatar/AvatarDisplay';
import { useLanguage } from '@/contexts/LanguageContext';
import { Player } from '@/contexts/GameContext';
import { cn } from '@/lib/utils';

interface LiveLeaderboardProps {
  players: Player[];
  currentPlayerId?: string;
}

interface RankChange {
  playerId: string;
  direction: 'up' | 'down' | 'none';
  positions: number;
}

export const LiveLeaderboard: React.FC<LiveLeaderboardProps> = ({ players, currentPlayerId }) => {
  const { t } = useLanguage();
  const previousRanksRef = useRef<Map<string, number>>(new Map());
  const [rankChanges, setRankChanges] = useState<Map<string, RankChange>>(new Map());
  
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // Track rank changes for animations
  useEffect(() => {
    const newRankChanges = new Map<string, RankChange>();
    
    sortedPlayers.forEach((player, currentRank) => {
      const previousRank = previousRanksRef.current.get(player.id);
      
      if (previousRank !== undefined && previousRank !== currentRank) {
        const positions = previousRank - currentRank;
        newRankChanges.set(player.id, {
          playerId: player.id,
          direction: positions > 0 ? 'up' : 'down',
          positions: Math.abs(positions),
        });
      }
    });

    if (newRankChanges.size > 0) {
      setRankChanges(newRankChanges);
      
      // Clear animations after 2 seconds
      const timer = setTimeout(() => {
        setRankChanges(new Map());
      }, 2000);
      
      return () => clearTimeout(timer);
    }

    // Update previous ranks
    const newPreviousRanks = new Map<string, number>();
    sortedPlayers.forEach((player, rank) => {
      newPreviousRanks.set(player.id, rank);
    });
    previousRanksRef.current = newPreviousRanks;
  }, [sortedPlayers.map(p => `${p.id}:${p.score}`).join(',')]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-podium-gold" />;
      case 1:
        return <Medal className="h-5 w-5 text-podium-silver" />;
      case 2:
        return <Award className="h-5 w-5 text-podium-bronze" />;
      default:
        return <span className="text-muted-foreground font-medium w-5 text-center">{index + 1}</span>;
    }
  };

  const getRankBg = (index: number, isCurrentPlayer: boolean) => {
    const base = isCurrentPlayer ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : '';
    
    switch (index) {
      case 0:
        return cn('bg-podium-gold/10 border-podium-gold/30', base);
      case 1:
        return cn('bg-podium-silver/10 border-podium-silver/30', base);
      case 2:
        return cn('bg-podium-bronze/10 border-podium-bronze/30', base);
      default:
        return cn('bg-secondary/50 border-border', base);
    }
  };

  const getRankChangeIndicator = (playerId: string) => {
    const change = rankChanges.get(playerId);
    if (!change) return null;

    return (
      <div className={cn(
        'flex items-center gap-0.5 text-xs font-medium animate-bounce',
        change.direction === 'up' ? 'text-success' : 'text-destructive'
      )}>
        {change.direction === 'up' ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        <span>{change.positions}</span>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-lg">
      <div className="p-3 border-b border-border bg-gradient-to-r from-primary/10 to-transparent flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary animate-pulse" />
        <h3 className="font-display text-lg text-foreground">{t('leaderboard')}</h3>
        <span className="text-xs text-muted-foreground ml-auto">LIVE</span>
        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
      </div>
      
      <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
        {sortedPlayers.map((player, index) => {
          const isCurrentPlayer = player.id === currentPlayerId;
          const hasRankChange = rankChanges.has(player.id);
          
          return (
            <div
              key={player.id}
              className={cn(
                'flex items-center gap-2 p-3 transition-all duration-500',
                getRankBg(index, isCurrentPlayer),
                hasRankChange && 'animate-pulse bg-primary/5'
              )}
            >
              {/* Rank */}
              <div className="w-6 flex justify-center shrink-0">
                {getRankIcon(index)}
              </div>
              
              {/* Rank Change Indicator */}
              <div className="w-6 shrink-0">
                {getRankChangeIndicator(player.id)}
              </div>
              
              {/* Avatar */}
              <AvatarDisplay
                avatarId={player.avatar}
                color={player.color}
                size={32}
                className="flex-shrink-0 hover:scale-110 transition-transform"
              />
              
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'font-medium truncate text-sm',
                  isCurrentPlayer ? 'text-primary' : 'text-foreground'
                )}>
                  {player.username}
                  {isCurrentPlayer && <span className="text-xs ml-1">(you)</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {player.countriesGuessed?.length || 0} {t('countriesGuessed')}
                </p>
              </div>
              
              {/* Score */}
              <div className="text-right shrink-0">
                <p className={cn(
                  'text-xl font-display transition-all',
                  hasRankChange ? 'text-success scale-110' : 'text-primary'
                )}>
                  {player.score}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
