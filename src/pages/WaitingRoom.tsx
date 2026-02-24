import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar/Navbar';
import { Button } from '@/components/ui/button';
import { TimerProgress } from '@/components/Timer/TimerProgress';
import { AvatarSelector } from '@/components/Avatar/AvatarSelector';
import { AvatarDisplay } from '@/components/Avatar/AvatarDisplay';
import { CountdownOverlay } from '@/components/Countdown/CountdownOverlay';
import { GameStartSignInModal } from '@/components/Modal/GameStartSignInModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToastContext } from '@/contexts/ToastContext';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { LonePlayerOverlay } from '@/components/Modal/LonePlayerOverlay';
import { ReconnectionBanner } from '@/components/Banner/ReconnectionBanner';
import { useSound } from '@/contexts/SoundContext';
import { WAITING_ROOM_TIMEOUT, playersMapToArray } from '@/types/game';
import { Player } from '@/types/game';
 import { Copy, Check, Users, Clock, Play, LogOut, Link, Zap, Sparkles } from 'lucide-react';
import { kickUnreadyPlayers, clearRecoveryData } from '@/services/gameSessionService';
import { FloatingChatWidget } from '@/components/Messaging/FloatingChatWidget';
import { JoinRequestsModal } from '@/components/Modal/JoinRequestsModal';

const WaitingRoom = () => {
  const { t } = useLanguage();
  const { session, currentPlayer, isLoading, setReady, updatePlayerMetadata, startCountdown, startGame, leaveSession, getPlayersArray } = useGame();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { addToast } = useToastContext();
  const { playToastSound } = useSound();
  const navigate = useNavigate();

  const prevPlayersRef = useRef<Player[]>([]);

  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [avatar, setAvatar] = useState(currentPlayer?.avatar || 'lion');
  const [color, setColor] = useState(currentPlayer?.color || '#E85D04');
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(!currentPlayer?.isReady);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  // Get players as array for rendering
  const players = getPlayersArray ? getPlayersArray() : playersMapToArray(session?.players);

  // Sync state with currentPlayer when it loads
  useEffect(() => {
    if (currentPlayer) {
      setAvatar(currentPlayer.avatar || 'lion');
      setColor(currentPlayer.color || '#E85D04');
    }
  }, [currentPlayer?.id, currentPlayer?.avatar, currentPlayer?.color]);

  useEffect(() => {
    // Wait for BOTH session restore and auth restore before deciding to redirect
    if (isLoading || authLoading) return;
    if (!session) {
      // Don't redirect guests if their session subscription temporarily drops
      const guestId = sessionStorage.getItem('guest_player_id');
      if (!guestId) {
        navigate('/');
      }
    }
  }, [session, navigate, isLoading, authLoading]);

  // Navigate to game when status changes to playing
  useEffect(() => {
    if (session?.status === 'playing') {
      navigate('/game');
    }
  }, [session?.status, navigate]);

  // Auto-start countdown when all players join
  useEffect(() => {
    if (session?.status === 'waiting' &&
      players.length === session.maxPlayers &&
      players.every(p => p.isReady) &&
      session.host === currentPlayer?.id) {
      // All players joined and ready - start countdown
      startCountdown();
    }
  }, [session, currentPlayer, startCountdown, players]);

  // Handle player departures notifications
  useEffect(() => {
    if (!session?.players) return;

    if (prevPlayersRef.current.length > 0) {
      const removedPlayers = prevPlayersRef.current.filter(
        prev => !players.find(curr => curr.id === prev.id)
      );

      removedPlayers.forEach(p => {
        if (p.id !== currentPlayer?.id) {
          addToast('info', t('playerLeft', { player: p.username }));
          playToastSound('info');
        }
      });
    }
    prevPlayersRef.current = players;
  }, [session?.players, currentPlayer?.id, addToast, playToastSound, t, players]);

  // Detect if current player was kicked (removed from session)
  useEffect(() => {
    if (session && currentPlayer?.id && session.players) {
      const stillInSession = session.players[currentPlayer.id];
      if (!stillInSession) {
        // Player was removed from session (kicked)
        addToast('error', 'You were removed from the session');
        clearRecoveryData();
        navigate('/');
      }
    }
  }, [session?.players, currentPlayer?.id, navigate, addToast]);

  // Handle countdown completion — CountdownOverlay fires onComplete instantly at 0,
  // so we no longer need a polling useEffect. The overlay's onComplete callback is used instead.

  const copyCode = () => {
    if (session) {
      navigator.clipboard.writeText(session.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyInviteLink = () => {
    if (session) {
      const inviteUrl = `${window.location.origin}/?join=${session.code}`;
      navigator.clipboard.writeText(inviteUrl);
      setLinkCopied(true);
      addToast('success', 'Invite link copied!');
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleVoteReady = async () => {
    await setReady(!currentPlayer?.isReady);
    if (!currentPlayer?.isReady) {
      addToast('success', 'You are ready!');
    }
  };

  const handleTimerComplete = async () => {
    // If current player is not ready, they get kicked
    if (!currentPlayer?.isReady) {
      addToast('error', 'You were removed from the session for not being ready');
      clearRecoveryData();
      navigate('/');
      return;
    }

    // Host kicks unready players and starts the game
    if (isHost && session) {
      const kickedIds = await kickUnreadyPlayers(session.code);
      if (kickedIds.length > 0) {
        addToast('info', `${kickedIds.length} player(s) removed for not being ready`);
      }
      // Start the game with ready players
      await startCountdown();
      addToast('game', t('gameStarting'));
    }
  };

  const handleStartGame = async () => {
    if (!isAuthenticated) {
      setIsSignInModalOpen(true);
      return;
    }
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

  const handleAvatarConfirm = async (confirmedAvatar: string, confirmedColor: string) => {
    // Update metadata with final avatar and color
    await updatePlayerMetadata({ avatar: confirmedAvatar, color: confirmedColor });
    // Set player as ready
    await setReady(true);
    // Close the modal
    setIsAvatarSelectorOpen(false);
    addToast('success', 'Avatar confirmed! You\'re ready to play.');
  };

  const handleToggleReady = async () => {
    if (currentPlayer?.isReady) {
      // If ready, allow clicking "Not Ready" to edit avatar
      await setReady(false);
      setIsAvatarSelectorOpen(true);
    }
  };

  const handleSignInClick = () => {
    setIsSignInModalOpen(false);
    navigate('/');
  };

  const handleJoinClick = () => {
    setIsSignInModalOpen(false);
    navigate('/');
  };

  const handleLeave = async () => {
    await leaveSession();
    navigate('/');
  };

  const readyPlayers = players.filter(p => p.isReady);
  const allReady = players.every(p => p.isReady);
  const isHost = session?.host === currentPlayer?.id;
  const isFull = players.length === session?.maxPlayers;

  if (!session) return null;

  // Show countdown overlay
  if (session.status === 'countdown' && session.countdownStartTime) {
    return (
      <CountdownOverlay
        startTime={session.countdownStartTime}
        onComplete={isHost ? startGame : undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Reconnection Banner */}
      <ReconnectionBanner />

      {/* Header */}
      <Navbar
        rightContent={
          <div className="flex items-center gap-2">
            {/* Join Request Management (host only, closed rooms) */}
            {isHost && session.isOpenRoom === false && (
              <JoinRequestsModal
                sessionCode={session.code}
                isHost={isHost}
                maxPlayers={session.maxPlayers}
                currentPlayerCount={players.length}
              />
            )}
            <GameTooltip content={t('tooltipQuit')} position="bottom">
              <Button variant="outline" onClick={handleLeave} className="gap-2">
                <LogOut className="h-4 w-4" />
                {t('quitGame')}
              </Button>
            </GameTooltip>
          </div>
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
            <GameTooltip content="Copy invite link" position="top">
              <Button variant="icon" size="icon" onClick={copyInviteLink}>
                {linkCopied ? <Check className="h-5 w-5 text-success" /> : <Link className="h-5 w-5" />}
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
            onComplete={handleTimerComplete}
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
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-5 w-5" />
            <span>{players.length}/{session.maxPlayers} {t('participants')}</span>
          </div>

          {/* Duration or Rounds depending on mode */}
          {session.gameMode === 'speedRace' ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-5 w-5 text-success" />
              <span className="text-success font-medium">{session.totalRounds} {t('speedRaceRounds' as any)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-5 w-5" />
              <span>{session.duration} {t('minutes')}</span>
            </div>
          )}

          {/* Game Mode Badge */}
          {session.gameMode && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              session.gameMode === 'speedRace'
                ? 'bg-success/20 text-success border border-success/30'
                : session.gameMode === 'againstTheClock'
                  ? 'bg-warning/20 text-warning border border-warning/30'
                  : 'bg-primary/20 text-primary border border-primary/30'
            }`}>
              {session.gameMode === 'speedRace' ? (
                <>
                  <Zap className="h-4 w-4" />
                  {t('speedRaceMode' as any)}
                </>
              ) : session.gameMode === 'againstTheClock' ? (
                <>
                  <Zap className="h-4 w-4" />
                  {t('againstTheClockMode')}
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  {t('turnBasedMode')}
                </>
              )}
            </div>
          )}

          {/* Card Mode Badge - Only for turn-based */}
          {session.gameMode !== 'againstTheClock' && session.gameMode !== 'speedRace' && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              session.cardModeEnabled 
                ? 'bg-warning/20 text-warning border border-warning/30' 
                : 'bg-muted/50 text-muted-foreground border border-border'
            }`}>
              <Sparkles className="h-4 w-4" />
              {session.cardModeEnabled ? t('cardModeEnabled') : t('cardModeDisabled')}
            </div>
          )}
        </div>

        {/* Avatar Modal */}
        <AvatarSelector
          isOpen={isAvatarSelectorOpen}
          selectedAvatar={avatar}
          selectedColor={color}
          onAvatarChange={handleAvatarChange}
          onColorChange={handleColorChange}
          onConfirm={handleAvatarConfirm}
          onOpenChange={setIsAvatarSelectorOpen}
        />

        {/* Sign In Modal for Game Start */}
        <GameStartSignInModal
          isOpen={isSignInModalOpen}
          onClose={() => setIsSignInModalOpen(false)}
          onSignIn={handleSignInClick}
          onJoin={handleJoinClick}
        />

        {/* Players Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Current Player */}
          <div className="card-netflix p-6">
            <h3 className="text-xl font-display text-foreground mb-4">Your Avatar</h3>
            <div className="flex flex-col items-center gap-4">
              <AvatarDisplay
                avatarId={avatar}
                color={color}
                size={64}
              />
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  {currentPlayer?.isReady ? 'Avatar Confirmed' : 'Select your avatar'}
                </p>
              </div>
            </div>
          </div>

          {/* Other Players */}
          <div className="card-netflix p-6">
            <h3 className="text-xl font-display text-foreground mb-4">
              {t('playersJoined')}
            </h3>
            <div className="space-y-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border transition-colors
                    ${player.isReady
                      ? 'bg-success/10 border-success/30'
                      : 'bg-secondary border-border'}
                  `}
                >
                  <AvatarDisplay
                    avatarId={player.avatar}
                    color={player.color}
                    size={48}
                    className="flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {player.username}
                      {player.id === session.host && (
                        <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                          Host
                        </span>
                      )}
                      {player.isGuest && (
                        <span className="ml-2 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                          Guest
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
              {Array.from({ length: session.maxPlayers - players.length }).map((_, i) => (
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
            onClick={() => {
              if (currentPlayer?.isReady) {
                handleToggleReady();
              } else {
                setIsAvatarSelectorOpen(true);
              }
            }}
            className="gap-2"
          >
            <Check className="h-5 w-5" />
            {currentPlayer?.isReady ? 'Change Avatar' : t('voteYes')}
          </Button>

          {isHost && (
            <Button
              variant="hero"
              size="lg"
              onClick={handleStartGame}
              disabled={readyPlayers.length < 2}
              className="gap-2"
            >
              <Play className="h-5 w-5" />
              {t('startGame2')}
            </Button>
          )}
        </div>

        {readyPlayers.length < 2 && (
          <p className="text-center text-muted-foreground mt-4">
            {t('waitingForPlayers')}... ({readyPlayers.length}/2 {t('participants').toLowerCase()} ready)
          </p>
        )}
      </div>

      {/* Lone Player Overlay - only show if someone left and now only 1 player remains */}
      {session && session.status !== 'finished' && players.length === 1 && prevPlayersRef.current.length > 1 && (
        <LonePlayerOverlay
          onQuit={handleLeave}
        />
      )}

      {/* Floating Chat Widget */}
      <FloatingChatWidget />
    </div>
  );
};

export default WaitingRoom;
