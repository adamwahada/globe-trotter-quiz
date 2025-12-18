import React from 'react';
import { Trophy, Medal, Award, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Player } from '@/contexts/GameContext';
import { useNavigate } from 'react-router-dom';

interface GameResultsProps {
  isOpen: boolean;
  players: Player[];
  onPlayAgain: () => void;
}

export const GameResults: React.FC<GameResultsProps> = ({ isOpen, players, onPlayAgain }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  const getPodiumPosition = (index: number) => {
    switch (index) {
      case 0: return { icon: Trophy, color: 'text-podium-gold', bg: 'bg-podium-gold/20', height: 'h-32' };
      case 1: return { icon: Medal, color: 'text-podium-silver', bg: 'bg-podium-silver/20', height: 'h-24' };
      case 2: return { icon: Award, color: 'text-podium-bronze', bg: 'bg-podium-bronze/20', height: 'h-20' };
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-md" />
      
      <div className="relative w-full max-w-2xl mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-display text-primary mb-2">{t('gameOver')}</h1>
            <p className="text-xl text-muted-foreground">{t('finalResults')}</p>
          </div>

          {/* Winner celebration */}
          <div className="text-center mb-8 animate-bounce-subtle">
            <div 
              className="inline-flex items-center justify-center w-24 h-24 rounded-full text-5xl mb-4"
              style={{ backgroundColor: winner.color }}
            >
              {winner.avatar}
            </div>
            <h2 className="text-3xl font-display text-foreground mb-1">{winner.username}</h2>
            <p className="text-muted-foreground">{t('winner')}</p>
            <p className="text-4xl font-display text-primary mt-2">{winner.score} pts</p>
          </div>

          {/* Podium */}
          <div className="flex justify-center items-end gap-4 mb-8">
            {/* Second place */}
            {sortedPlayers[1] && (
              <div className="flex flex-col items-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2"
                  style={{ backgroundColor: sortedPlayers[1].color }}
                >
                  {sortedPlayers[1].avatar}
                </div>
                <p className="text-sm font-medium text-foreground">{sortedPlayers[1].username}</p>
                <p className="text-lg font-display text-podium-silver">{sortedPlayers[1].score}</p>
                <div className="w-24 h-24 bg-podium-silver/20 rounded-t-lg mt-2 flex items-center justify-center">
                  <Medal className="h-8 w-8 text-podium-silver" />
                </div>
              </div>
            )}

            {/* First place */}
            <div className="flex flex-col items-center">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl mb-2 ring-4 ring-podium-gold"
                style={{ backgroundColor: winner.color }}
              >
                {winner.avatar}
              </div>
              <p className="text-sm font-medium text-foreground">{winner.username}</p>
              <p className="text-xl font-display text-podium-gold">{winner.score}</p>
              <div className="w-28 h-32 bg-podium-gold/20 rounded-t-lg mt-2 flex items-center justify-center">
                <Trophy className="h-10 w-10 text-podium-gold" />
              </div>
            </div>

            {/* Third place */}
            {sortedPlayers[2] && (
              <div className="flex flex-col items-center">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl mb-2"
                  style={{ backgroundColor: sortedPlayers[2].color }}
                >
                  {sortedPlayers[2].avatar}
                </div>
                <p className="text-sm font-medium text-foreground">{sortedPlayers[2].username}</p>
                <p className="text-lg font-display text-podium-bronze">{sortedPlayers[2].score}</p>
                <div className="w-20 h-20 bg-podium-bronze/20 rounded-t-lg mt-2 flex items-center justify-center">
                  <Award className="h-6 w-6 text-podium-bronze" />
                </div>
              </div>
            )}
          </div>

          {/* Full rankings */}
          {sortedPlayers.length > 3 && (
            <div className="bg-secondary rounded-lg p-4 mb-8">
              {sortedPlayers.slice(3).map((player, index) => (
                <div 
                  key={player.id}
                  className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                >
                  <span className="text-muted-foreground w-8">{index + 4}.</span>
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.avatar}
                  </div>
                  <span className="flex-1 text-foreground">{player.username}</span>
                  <span className="font-display text-primary">{player.score}</span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex-1 gap-2"
            >
              <Home className="h-4 w-4" />
              {t('backToHome')}
            </Button>
            <Button
              variant="netflix"
              onClick={onPlayAgain}
              className="flex-1 gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {t('playAgain')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
