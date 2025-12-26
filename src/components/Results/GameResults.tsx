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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-md" />
      
      <div className="relative w-full max-w-3xl mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-display text-primary mb-2">{t('gameOver')}</h1>
            <p className="text-lg text-muted-foreground">{t('finalResults')}</p>
          </div>

          {/* Winner celebration */}
          <div className="text-center mb-6">
            <div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-full text-4xl mb-3 ring-4 ring-primary shadow-lg shadow-primary/30"
              style={{ backgroundColor: winner.color }}
            >
              {winner.avatar}
            </div>
            <h2 className="text-2xl font-display text-foreground mb-1">{winner.username}</h2>
            <p className="text-muted-foreground text-sm">{t('winner')} 🏆</p>
            <p className="text-3xl font-display text-primary mt-2">{winner.score} pts</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-secondary rounded-xl p-4 text-center">
              <Globe className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-display text-foreground">{totalGuessed}</p>
              <p className="text-xs text-muted-foreground">Countries Found</p>
            </div>
            <div className="bg-secondary rounded-xl p-4 text-center">
              <Target className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="text-2xl font-display text-foreground">{calculateAccuracy(winner)}%</p>
              <p className="text-xs text-muted-foreground">Winner Accuracy</p>
            </div>
            <div className="bg-secondary rounded-xl p-4 text-center">
              <Trophy className="h-6 w-6 text-warning mx-auto mb-2" />
              <p className="text-2xl font-display text-foreground">{winner.score}</p>
              <p className="text-xs text-muted-foreground">Top Score</p>
            </div>
            <div className="bg-secondary rounded-xl p-4 text-center">
              <TrendingUp className="h-6 w-6 text-info mx-auto mb-2" />
              <p className="text-2xl font-display text-foreground">{players.length}</p>
              <p className="text-xs text-muted-foreground">Players</p>
            </div>
          </div>

          {/* Player Stats Table */}
          <div className="bg-secondary/50 rounded-xl overflow-hidden mb-6">
            <div className="grid grid-cols-12 gap-2 p-3 bg-secondary text-xs text-muted-foreground font-medium">
              <div className="col-span-1">#</div>
              <div className="col-span-4">Player</div>
              <div className="col-span-2 text-center">Countries</div>
              <div className="col-span-3 text-center">Accuracy</div>
              <div className="col-span-2 text-right">Score</div>
            </div>
            
            {sortedPlayers.map((player, index) => {
              const accuracy = calculateAccuracy(player);
              const countriesCount = player.countriesGuessed?.length || 0;
              const rankIcon = index === 0 ? <Trophy className="h-4 w-4 text-yellow-500" /> 
                             : index === 1 ? <Medal className="h-4 w-4 text-gray-400" />
                             : index === 2 ? <Award className="h-4 w-4 text-amber-600" />
                             : null;
              
              return (
                <div 
                  key={player.id}
                  className={`grid grid-cols-12 gap-2 p-3 items-center border-t border-border/50 ${
                    index === 0 ? 'bg-primary/10' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="col-span-1 flex items-center justify-center">
                    {rankIcon || <span className="text-muted-foreground">{index + 1}</span>}
                  </div>
                  
                  {/* Player */}
                  <div className="col-span-4 flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.avatar}
                    </div>
                    <span className="text-foreground font-medium truncate">{player.username}</span>
                  </div>
                  
                  {/* Countries */}
                  <div className="col-span-2 text-center">
                    <span className="inline-flex items-center gap-1 text-foreground">
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      {countriesCount}
                    </span>
                  </div>
                  
                  {/* Accuracy */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            accuracy >= 80 ? 'bg-success' : accuracy >= 50 ? 'bg-warning' : 'bg-destructive'
                          }`}
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-10 text-right">{accuracy}%</span>
                    </div>
                  </div>
                  
                  {/* Score */}
                  <div className="col-span-2 text-right">
                    <span className="font-display text-lg text-primary">{player.score}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Podium - Compact version */}
          <div className="flex justify-center items-end gap-2 mb-6">
            {/* Second place */}
            {sortedPlayers[1] && (
              <div className="flex flex-col items-center">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg mb-1"
                  style={{ backgroundColor: sortedPlayers[1].color }}
                >
                  {sortedPlayers[1].avatar}
                </div>
                <div className="w-16 h-16 bg-gray-400/20 rounded-t-lg flex items-center justify-center">
                  <Medal className="h-6 w-6 text-gray-400" />
                </div>
              </div>
            )}

            {/* First place */}
            <div className="flex flex-col items-center">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl mb-1 ring-2 ring-yellow-500"
                style={{ backgroundColor: winner.color }}
              >
                {winner.avatar}
              </div>
              <div className="w-20 h-20 bg-yellow-500/20 rounded-t-lg flex items-center justify-center">
                <Trophy className="h-8 w-8 text-yellow-500" />
              </div>
            </div>

            {/* Third place */}
            {sortedPlayers[2] && (
              <div className="flex flex-col items-center">
                <div 
                  className="w-9 h-9 rounded-full flex items-center justify-center text-base mb-1"
                  style={{ backgroundColor: sortedPlayers[2].color }}
                >
                  {sortedPlayers[2].avatar}
                </div>
                <div className="w-14 h-12 bg-amber-600/20 rounded-t-lg flex items-center justify-center">
                  <Award className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            )}
          </div>

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
