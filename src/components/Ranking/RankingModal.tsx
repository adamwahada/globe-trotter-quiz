import React from 'react';
import { Trophy, Medal, Award, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Player } from '@/types/game';

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  currentPlayerId?: string;
}

export const RankingModal: React.FC<RankingModalProps> = ({ isOpen, onClose, players, currentPlayerId }) => {
  if (!isOpen) return null;

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="h-5 w-5 text-podium-gold" />;
      case 1: return <Medal className="h-5 w-5 text-podium-silver" />;
      case 2: return <Award className="h-5 w-5 text-podium-bronze" />;
      default: return <span className="text-muted-foreground">{index + 1}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display text-foreground">Current Rankings</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-3">
            {sortedPlayers.map((player, index) => (
              <div 
                key={player.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  player.id === currentPlayerId 
                    ? 'bg-primary/10 border-primary/30' 
                    : 'bg-secondary border-border'
                }`}
              >
                <div className="w-8 flex justify-center">
                  {getRankIcon(index)}
                </div>
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{ backgroundColor: player.color }}
                >
                  {player.avatar}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{player.username}</p>
                  <p className="text-xs text-muted-foreground">
                    {player.countriesGuessed.length} countries
                  </p>
                </div>
                <div className="text-xl font-display text-primary">
                  {player.score}
                </div>
              </div>
            ))}
          </div>

          <Button variant="outline" className="w-full mt-6" onClick={onClose}>
            Back to Game
          </Button>
        </div>
      </div>
    </div>
  );
};
