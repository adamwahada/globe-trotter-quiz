import React from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Player } from '@/contexts/GameContext';

interface LeaderboardProps {
  players: Player[];
  currentPlayerId?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ players, currentPlayerId }) => {
  const { t } = useLanguage();
  
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-5 w-5 text-podium-gold" />;
      case 1:
        return <Medal className="h-5 w-5 text-podium-silver" />;
      case 2:
        return <Award className="h-5 w-5 text-podium-bronze" />;
      default:
        return <span className="text-muted-foreground font-medium">{index + 1}</span>;
    }
  };

  const getRankBg = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-podium-gold/10 border-podium-gold/30';
      case 1:
        return 'bg-podium-silver/10 border-podium-silver/30';
      case 2:
        return 'bg-podium-bronze/10 border-podium-bronze/30';
      default:
        return 'bg-secondary border-border';
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        <h3 className="font-display text-xl text-foreground">{t('leaderboard')}</h3>
      </div>
      
      <div className="divide-y divide-border">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`
              flex items-center gap-3 p-4 transition-colors
              ${getRankBg(index)}
              ${player.id === currentPlayerId ? 'ring-1 ring-primary' : ''}
            `}
          >
            {/* Rank */}
            <div className="w-8 flex justify-center">
              {getRankIcon(index)}
            </div>
            
            {/* Avatar */}
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: player.color }}
            >
              {player.avatar}
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{player.username}</p>
              <p className="text-xs text-muted-foreground">
                {player.countriesGuessed.length} {t('countriesGuessed')}
              </p>
            </div>
            
            {/* Score */}
            <div className="text-right">
              <p className="text-2xl font-display text-primary">{player.score}</p>
              <p className="text-xs text-muted-foreground">{t('score')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
