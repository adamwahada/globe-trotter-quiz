import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Award, Home, RotateCcw, Target, Globe, TrendingUp, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AvatarDisplay } from '@/components/Avatar/AvatarDisplay';
import { useLanguage } from '@/contexts/LanguageContext';
import { Player } from '@/contexts/GameContext';
import { useNavigate } from 'react-router-dom';

interface GameResultsProps {
  isOpen: boolean;
  players: Player[];
  onPlayAgain: () => void;
  totalCountries?: number;
  isGuest?: boolean;
}

// Calculate accuracy: (score earned / max possible score) * 100
// Max possible = 3 points per country guessed
const calculateAccuracy = (player: Player): number => {
  const countriesGuessed = player.countriesGuessed?.length || 0;
  if (countriesGuessed === 0) return 0;
  const maxPossible = countriesGuessed * 3;
  return Math.round((player.score / maxPossible) * 100);
};

const GUEST_CLOSE_SECONDS = 30;

export const GameResults: React.FC<GameResultsProps> = ({ isOpen, players, onPlayAgain, totalCountries = 195, isGuest = false }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(GUEST_CLOSE_SECONDS);

  // Auto-close countdown for guests
  useEffect(() => {
    if (!isOpen || !isGuest) return;
    setCountdown(GUEST_CLOSE_SECONDS);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Clear guest session data and close
          sessionStorage.removeItem('guest_player_id');
          sessionStorage.removeItem('guest_session_code');
          sessionStorage.removeItem('guest_username');
          localStorage.removeItem('gameSessionCode');
          localStorage.removeItem('currentPlayerId');
          window.close();
          // Fallback: navigate home if window.close() doesn't work
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isGuest, navigate]);

  if (!isOpen) return null;

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const totalGuessed = players.reduce((sum, p) => sum + (p.countriesGuessed?.length || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-background/90 backdrop-blur-md" />
      
      <div className="relative w-full max-w-xl mx-4 bg-card border border-border rounded-xl shadow-2xl animate-scale-in overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
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
                  <AvatarDisplay
                    avatarId={player.avatar}
                    color={player.color}
                    size={24}
                    className="flex-shrink-0"
                  />
                  <span className="text-sm text-foreground truncate flex-1">{player.username}</span>
                  <span className="text-xs text-muted-foreground">{countriesCount} 🌍</span>
                  <span className="text-xs text-muted-foreground w-10">{accuracy}%</span>
                  <span className="font-display text-sm text-primary w-12 text-right">{player.score}</span>
                </div>
              );
            })}
          </div>

          {/* Guest auto-close countdown */}
          {isGuest && (
            <div className="flex items-center gap-2 p-3 mb-3 rounded-lg bg-warning/10 border border-warning/20 text-sm text-foreground/80">
              <Timer className="h-4 w-4 text-warning shrink-0" />
              <p>
                As a guest, this page will close in{' '}
                <span className="font-display text-warning text-base">{countdown}s</span>. 
                {' '}Sign up to save your history!
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!isGuest && (
              <>
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
              </>
            )}
            {isGuest && (
              <Button
                variant="netflix"
                size="sm"
                onClick={() => navigate('/')}
                className="flex-1 gap-2"
              >
                <Home className="h-4 w-4" />
                Create an account to play again
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

