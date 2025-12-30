import React from 'react';
import { X, CheckCircle, XCircle, TrendingUp, Target, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Player } from '@/types/game';
import { useLanguage } from '@/contexts/LanguageContext';

interface PlayerStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  correctCountries: string[];
  wrongCountries: string[];
}

export const PlayerStatsModal: React.FC<PlayerStatsModalProps> = ({
  isOpen,
  onClose,
  player,
  correctCountries,
  wrongCountries,
}) => {
  const { t } = useLanguage();

  if (!isOpen || !player) return null;

  // Get all countries this player guessed
  const allPlayerGuesses = player.countriesGuessed || [];
  const playerTotalGuesses = player.turnsPlayed || 0;
  
  // Filter to get correct and wrong guesses by cross-referencing with session data
  const playerCorrectCountries = allPlayerGuesses.filter(c => correctCountries.includes(c));
  const playerWrongCountries = allPlayerGuesses.filter(c => wrongCountries.includes(c));
  
  // Calculate accuracy based on countries guessed correctly vs total guesses
  const totalAnswered = playerCorrectCountries.length + playerWrongCountries.length;
  const accuracy = totalAnswered > 0 
    ? Math.round((playerCorrectCountries.length / totalAnswered) * 100) 
    : 0;

  // Average points per turn
  const avgPointsPerTurn = playerTotalGuesses > 0 
    ? (player.score / playerTotalGuesses).toFixed(1) 
    : '0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden max-h-[85vh] flex flex-col">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: player.color }}
          >
            {player.avatar}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-display text-foreground">{player.username}</h2>
            <p className="text-sm text-muted-foreground">{t('score')}: {player.score}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-success/10 border border-success/30 rounded-lg p-3 text-center">
              <CheckCircle className="h-5 w-5 text-success mx-auto mb-1" />
              <p className="text-2xl font-display text-success">{playerCorrectCountries.length}</p>
              <p className="text-xs text-muted-foreground">{t('correct')}</p>
            </div>
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-center">
              <XCircle className="h-5 w-5 text-destructive mx-auto mb-1" />
              <p className="text-2xl font-display text-destructive">{playerWrongCountries.length}</p>
              <p className="text-xs text-muted-foreground">{t('wrong')}</p>
            </div>
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-center">
              <Percent className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-display text-primary">{accuracy}%</p>
              <p className="text-xs text-muted-foreground">{t('accuracy')}</p>
            </div>
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-center">
              <TrendingUp className="h-5 w-5 text-warning mx-auto mb-1" />
              <p className="text-2xl font-display text-warning">{avgPointsPerTurn}</p>
              <p className="text-xs text-muted-foreground">{t('avgPoints')}</p>
            </div>
          </div>

          {/* Countries Guessed Correctly */}
          {playerCorrectCountries.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-success" />
                {t('countriesGuessedCorrectly')} ({playerCorrectCountries.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {playerCorrectCountries.map((country) => (
                  <span 
                    key={country} 
                    className="px-2 py-1 bg-success/20 text-success text-xs rounded-full border border-success/30"
                  >
                    {country}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Total Turns Info */}
          <div className="bg-secondary/50 rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">
              <Target className="h-4 w-4 inline mr-1" />
              {t('totalTurns')}: <span className="font-medium text-foreground">{playerTotalGuesses}</span>
            </p>
          </div>
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
