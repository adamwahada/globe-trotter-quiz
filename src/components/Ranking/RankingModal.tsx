import React, { useState } from 'react';
import { Trophy, Medal, Award, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Player } from '@/types/game';
import { PlayerStatsModal } from './PlayerStatsModal';
import { useLanguage } from '@/contexts/LanguageContext';

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  currentPlayerId?: string;
  correctCountries?: string[];
  wrongCountries?: string[];
}

export const RankingModal: React.FC<RankingModalProps> = ({ 
  isOpen, 
  onClose, 
  players, 
  currentPlayerId,
  correctCountries = [],
  wrongCountries = [],
}) => {
  const { t } = useLanguage();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

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

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display text-foreground">{t('currentRankings')}</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground mb-4 text-center">
              {t('clickPlayerForStats')}
            </p>

            <div className="space-y-3">
              {sortedPlayers.map((player, index) => (
                <button 
                  key={player.id}
                  onClick={() => handlePlayerClick(player)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all hover:scale-[1.02] cursor-pointer ${
                    player.id === currentPlayerId 
                      ? 'bg-primary/10 border-primary/30 hover:bg-primary/20' 
                      : 'bg-secondary border-border hover:bg-secondary/80'
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
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">{player.username}</p>
                    <p className="text-xs text-muted-foreground">
                      {player.countriesGuessed?.length || 0} {t('countriesGuessed')}
                    </p>
                  </div>
                  <div className="text-xl font-display text-primary">
                    {player.score}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>

            <Button variant="outline" className="w-full mt-6" onClick={onClose}>
              {t('backToGame')}
            </Button>
          </div>
        </div>
      </div>

      <PlayerStatsModal
        isOpen={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        player={selectedPlayer}
        correctCountries={correctCountries}
        wrongCountries={wrongCountries}
      />
    </>
  );
};
