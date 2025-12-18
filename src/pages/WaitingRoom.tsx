import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo/Logo';
import { Button } from '@/components/ui/button';
import { TimerProgress } from '@/components/Timer/TimerProgress';
import { AvatarSelector } from '@/components/Avatar/AvatarSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { useToastContext } from '@/contexts/ToastContext';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { Copy, Check, Users, Clock, Play, LogOut } from 'lucide-react';

const WaitingRoom = () => {
  const { t } = useLanguage();
  const { session, currentPlayer, setReady, startGame, leaveSession } = useGame();
  const { addToast } = useToastContext();
  const navigate = useNavigate();

  const [copied, setCopied] = useState(false);
  const [avatar, setAvatar] = useState(currentPlayer?.avatar || '🌍');
  const [color, setColor] = useState(currentPlayer?.color || '#E50914');

  useEffect(() => {
    if (!session) {
      navigate('/');
    }
  }, [session, navigate]);

  const copyCode = () => {
    if (session) {
      navigator.clipboard.writeText(session.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVoteReady = () => {
    setReady(!currentPlayer?.isReady);
    if (!currentPlayer?.isReady) {
      addToast('success', 'You are ready!');
    }
  };

  const handleStartGame = () => {
    startGame();
    navigate('/game');
    addToast('game', t('gameStarting'));
  };

  const handleLeave = () => {
    leaveSession();
    navigate('/');
  };

  const allReady = session?.players.every(p => p.isReady);
  const isHost = session?.host === currentPlayer?.id;

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="flex items-center justify-between p-4 md:p-6 border-b border-border">
        <Logo size="md" />
        
        <GameTooltip content={t('tooltipQuit')} position="bottom">
          <Button variant="outline" onClick={handleLeave} className="gap-2">
            <LogOut className="h-4 w-4" />
            {t('quitGame')}
          </Button>
        </GameTooltip>
      </nav>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Session Info */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-display text-foreground mb-4">
            {t('waitingRoom')}
          </h1>
          
          {/* Session Code */}
          <div className="inline-flex items-center gap-4 bg-card border border-border rounded-xl p-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{t('sessionCode')}</p>
              <p className="text-4xl font-display tracking-[0.3em] text-primary">
                {session.code}
              </p>
            </div>
            <GameTooltip content="Copy code" position="top">
              <Button variant="icon" size="icon" onClick={copyCode}>
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </Button>
            </GameTooltip>
          </div>

          <p className="text-muted-foreground">{t('shareCode')}</p>
        </div>

        {/* Timer */}
        <div className="mb-8">
          <TimerProgress 
            totalSeconds={300} 
            onComplete={handleStartGame}
            label={t('timeRemaining')}
          />
        </div>

        {/* Game Settings Summary */}
        <div className="flex justify-center gap-8 mb-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-5 w-5" />
            <span>{session.players.length}/{session.maxPlayers} {t('participants')}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-5 w-5" />
            <span>{session.duration} {t('minutes')}</span>
          </div>
        </div>

        {/* Players Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Current Player */}
          <div className="card-netflix p-6">
            <h3 className="text-xl font-display text-foreground mb-4">Your Avatar</h3>
            <AvatarSelector
              selectedAvatar={avatar}
              selectedColor={color}
              onAvatarChange={setAvatar}
              onColorChange={setColor}
            />
          </div>

          {/* Other Players */}
          <div className="card-netflix p-6">
            <h3 className="text-xl font-display text-foreground mb-4">
              {t('playersJoined')}
            </h3>
            <div className="space-y-3">
              {session.players.map((player) => (
                <div 
                  key={player.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border transition-colors
                    ${player.isReady 
                      ? 'bg-success/10 border-success/30' 
                      : 'bg-secondary border-border'}
                  `}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {player.username}
                      {player.id === session.host && (
                        <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                          Host
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {player.isReady ? '✓ Ready' : 'Waiting...'}
                    </p>
                  </div>
                </div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: session.maxPlayers - session.players.length }).map((_, i) => (
                <div 
                  key={`empty-${i}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border"
                >
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <Users className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">{t('waitingForPlayers')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant={currentPlayer?.isReady ? 'outline' : 'netflix'}
            size="lg"
            onClick={handleVoteReady}
            className="gap-2"
          >
            <Check className="h-5 w-5" />
            {currentPlayer?.isReady ? 'Not Ready' : t('voteYes')}
          </Button>

          {isHost && (
            <Button
              variant="hero"
              size="lg"
              onClick={handleStartGame}
              disabled={!allReady || session.players.length < 2}
              className="gap-2"
            >
              <Play className="h-5 w-5" />
              {t('startGame2')}
            </Button>
          )}
        </div>

        {!allReady && (
          <p className="text-center text-muted-foreground mt-4">
            Waiting for all players to be ready...
          </p>
        )}
      </div>
    </div>
  );
};

export default WaitingRoom;
