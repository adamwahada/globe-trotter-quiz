import React from 'react';
import { Trophy, Medal, Award, Home, RotateCcw, Target, Globe, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Player } from '@/contexts/GameContext';
import { useNavigate } from 'react-router-dom';

interface GameResultsProps {
  isOpen: boolean;
  players: Player[];
  onPlayAgain: () => void;
  totalCountries?: number;
}

// Calculate accuracy: (score earned / max possible score) * 100
// Max possible = 3 points per country guessed
const calculateAccuracy = (player: Player): number => {
  const countriesGuessed = player.countriesGuessed?.length || 0;
  if (countriesGuessed === 0) return 0;
  const maxPossible = countriesGuessed * 3;
  return Math.round((player.score / maxPossible) * 100);
};

export const GameResults: React.FC<GameResultsProps> = ({ isOpen, players, onPlayAgain, totalCountries = 195 }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const totalGuessed = players.reduce((sum, p) => sum + (p.countriesGuessed?.length || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-md" />
      
      <div className="relative w-full max-w-xl mx-4 bg-card border border-border rounded-xl shadow-2xl animate-scale-in overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-4">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-2xl md:text-3xl font-display text-primary mb-1">{t('gameOver')}</h1>
            <p className="text-sm text-muted-foreground">{t('finalResults')}</p>
          </div>

          {/* Winner celebration */}
          <div className="text-center mb-4">
            <div 
              className="inline-flex items-center justify-center w-14 h-14 rounded-full text-2xl mb-2 ring-2 ring-primary shadow-lg shadow-primary/30"
              style={{ backgroundColor: winner.color }}
            >
              {winner.avatar}
            </div>
            <h2 className="text-lg font-display text-foreground">{winner.username} 🏆</h2>
            <p className="text-xl font-display text-primary">{winner.score} pts</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-secondary rounded-lg p-2 text-center">
              <Globe className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-lg font-display text-foreground">{totalGuessed}</p>
              <p className="text-[10px] text-muted-foreground">Found</p>
            </div>
            <div className="bg-secondary rounded-lg p-2 text-center">
              <Target className="h-4 w-4 text-success mx-auto mb-1" />
              <p className="text-lg font-display text-foreground">{calculateAccuracy(winner)}%</p>
              <p className="text-[10px] text-muted-foreground">Accuracy</p>
            </div>
            <div className="bg-secondary rounded-lg p-2 text-center">
              <Trophy className="h-4 w-4 text-warning mx-auto mb-1" />
              <p className="text-lg font-display text-foreground">{winner.score}</p>
              <p className="text-[10px] text-muted-foreground">Top</p>
            </div>
            <div className="bg-secondary rounded-lg p-2 text-center">
              <TrendingUp className="h-4 w-4 text-info mx-auto mb-1" />
              <p className="text-lg font-display text-foreground">{players.length}</p>
              <p className="text-[10px] text-muted-foreground">Players</p>
            </div>
          </div>

          {/* Player Stats Table - Compact */}
          <div className="bg-secondary/50 rounded-lg overflow-hidden mb-4 max-h-32 overflow-y-auto">
            {sortedPlayers.map((player, index) => {
              const accuracy = calculateAccuracy(player);
              const countriesCount = player.countriesGuessed?.length || 0;
              const rankIcon = index === 0 ? <Trophy className="h-3 w-3 text-yellow-500" /> 
                             : index === 1 ? <Medal className="h-3 w-3 text-gray-400" />
                             : index === 2 ? <Award className="h-3 w-3 text-amber-600" />
                             : null;
              
              return (
                <div 
                  key={player.id}
                  className={`flex items-center gap-2 px-2 py-1.5 border-b border-border/30 last:border-0 ${
                    index === 0 ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="w-5 flex justify-center">
                    {rankIcon || <span className="text-xs text-muted-foreground">{index + 1}</span>}
                  </div>
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.avatar}
                  </div>
                  <span className="text-sm text-foreground truncate flex-1">{player.username}</span>
                  <span className="text-xs text-muted-foreground">{countriesCount} 🌍</span>
                  <span className="text-xs text-muted-foreground w-10">{accuracy}%</span>
                  <span className="font-display text-sm text-primary w-12 text-right">{player.score}</span>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="flex-1 gap-2"
            >
              <Home className="h-4 w-4" />
              {t('backToHome')}
            </Button>
            <Button
              variant="netflix"
              size="sm"
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
