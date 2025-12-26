import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar/Navbar';
import { Button } from '@/components/ui/button';
import { TimerProgress } from '@/components/Timer/TimerProgress';
import { AvatarSelector } from '@/components/Avatar/AvatarSelector';
import { CountdownOverlay } from '@/components/Countdown/CountdownOverlay';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { useToastContext } from '@/contexts/ToastContext';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { LonePlayerOverlay } from '@/components/Modal/LonePlayerOverlay';
import { useSound } from '@/contexts/SoundContext';
import { COUNTDOWN_SECONDS, WAITING_ROOM_TIMEOUT } from '@/types/game';
import { Player } from '@/types/game';
import { Copy, Check, Users, Clock, Play, LogOut } from 'lucide-react';

const WaitingRoom = () => {
  const { t } = useLanguage();
  const { session, currentPlayer, setReady, updatePlayerMetadata, startCountdown, startGame, leaveSession } = useGame();
  const { addToast } = useToastContext();
  const { playToastSound } = useSound();
  const navigate = useNavigate();

  const prevPlayersRef = useRef<Player[]>([]);

  const [copied, setCopied] = useState(false);
  const [avatar, setAvatar] = useState(currentPlayer?.avatar || '🦁');
  const [color, setColor] = useState(currentPlayer?.color || '#E50914');

  // Sync state with currentPlayer when it loads
  useEffect(() => {
    if (currentPlayer) {
      setAvatar(currentPlayer.avatar || '🦁');
      setColor(currentPlayer.color || '#E50914');
    }
  }, [currentPlayer?.id, currentPlayer?.avatar, currentPlayer?.color]);

  useEffect(() => {
    if (!session) {
      navigate('/');
    }
  }, [session, navigate]);

  // Navigate to game when status changes to playing
  useEffect(() => {
    if (session?.status === 'playing') {
      navigate('/game');
    }
  }, [session?.status, navigate]);

  // Auto-start countdown when all players join
  useEffect(() => {
    if (session?.status === 'waiting' &&
      session.players.length === session.maxPlayers &&
      session.players.every(p => p.isReady) &&
      session.host === currentPlayer?.id) {
      // All players joined and ready - start countdown
      startCountdown();
    }
  }, [session, currentPlayer, startCountdown]);

  // Handle player departures notifications
  useEffect(() => {
    if (!session?.players) return;

    if (prevPlayersRef.current.length > 0) {
      const removedPlayers = prevPlayersRef.current.filter(
        prev => !session.players.find(curr => curr.id === prev.id)
      );

      removedPlayers.forEach(p => {
        if (p.id !== currentPlayer?.id) {
          addToast('info', t('playerLeft', { player: p.username }));
          playToastSound('info');
        }
      });
    }
    prevPlayersRef.current = session.players;
  }, [session?.players, currentPlayer?.id, addToast, playToastSound, t]);

  // Handle countdown completion
  useEffect(() => {
    if (session?.status === 'countdown' && session.countdownStartTime) {
      const elapsed = Math.floor((Date.now() - session.countdownStartTime) / 1000);
      const remaining = COUNTDOWN_SECONDS - elapsed;

      if (remaining <= 0 && session.host === currentPlayer?.id) {
        startGame();
      }
    }
  }, [session, currentPlayer, startGame]);

  const copyCode = () => {
    if (session) {
      navigator.clipboard.writeText(session.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVoteReady = async () => {
    await setReady(!currentPlayer?.isReady);
    if (!currentPlayer?.isReady) {
      addToast('success', 'You are ready!');
    }
  };

  const handleStartGame = async () => {
    await startCountdown();
    addToast('game', t('gameStarting'));
  };

  const handleAvatarChange = async (newAvatar: string) => {
    setAvatar(newAvatar);
    await updatePlayerMetadata({ avatar: newAvatar });
  };

  const handleColorChange = async (newColor: string) => {
    setColor(newColor);
    await updatePlayerMetadata({ color: newColor });
  };

  const handleLeave = async () => {
    await leaveSession();
    navigate('/');
  };

  const allReady = session?.players.every(p => p.isReady);
  const isHost = session?.host === currentPlayer?.id;
  const isFull = session?.players.length === session?.maxPlayers;

  if (!session) return null;

  // Show countdown overlay
  if (session.status === 'countdown' && session.countdownStartTime) {
    return <CountdownOverlay startTime={session.countdownStartTime} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Navbar
        rightContent={
          <GameTooltip content={t('tooltipQuit')} position="bottom">
            <Button variant="outline" onClick={handleLeave} className="gap-2">
              <LogOut className="h-4 w-4" />
              {t('quitGame')}
            </Button>
          </GameTooltip>
        }
      />

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

        {/* Timer - shared across all players based on session start time */}
        <div className="mb-8">
          <TimerProgress
            totalSeconds={WAITING_ROOM_TIMEOUT}
            startTime={session.waitingRoomStartTime}
            onComplete={handleStartGame}
            label={t('timeRemaining')}
          />
        </div>

        {/* Auto-start indicator */}
        {isFull && allReady && (
          <div className="mb-6 p-4 bg-primary/20 border border-primary/30 rounded-xl text-center animate-pulse">
            <p className="text-primary font-display text-lg">
              🎮 All players ready! Starting countdown...
            </p>
          </div>
        )}

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
              onAvatarChange={handleAvatarChange}
              onColorChange={handleColorChange}
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
                  {/* Connection indicator */}
                  <div className={`w-2 h-2 rounded-full ${player.isConnected ? 'bg-success' : 'bg-muted'}`} />
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

      {/* Lone Player Overlay - only show if someone left and now only 1 player remains */}
      {session && session.status !== 'finished' && session.players.length === 1 && prevPlayersRef.current.length > 1 && (
        <LonePlayerOverlay
          onQuit={handleLeave}
          onWait={() => { }}
        />
      )}
    </div>
  );
};

export default WaitingRoom;
