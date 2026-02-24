import React, { useState } from 'react';
import { X, Users, Clock, Hash, Copy, Check, User, Dice5, MousePointer, Sparkles, Zap, Minus, Plus, Lock, Globe, Link } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGame, GameMode } from '@/contexts/GameContext';
import { useToastContext } from '@/contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { GameStartSignInModal } from './GameStartSignInModal';
import { GameModeSelector } from './GameModeSelector';
import { PendingJoinRequestModal } from './PendingJoinRequestModal';
import { validateSessionCode, validateUsername, MAX_USERNAME_LENGTH } from '@/utils/inputValidation';

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialJoinCode?: string | null;
}

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({ isOpen, onClose, initialJoinCode }) => {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { createSession, joinSession, joinSessionAsGuest, isLoading, error, restoreApprovedSession } = useGame();
  const { addToast } = useToastContext();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'choose' | 'multiplayer' | 'solo' | 'selectGameMode' | 'create' | 'join'>('choose');
  const [players, setPlayers] = useState(2);
  const [duration, setDuration] = useState(30);
  // Speed Race: rounds instead of duration
  const [rounds, setRounds] = useState(20);
  const [customRounds, setCustomRounds] = useState('');
  const [useCustomRounds, setUseCustomRounds] = useState(false);
  const [customPlayersInput, setCustomPlayersInput] = useState(5);
  const [useCustomPlayers, setUseCustomPlayers] = useState(false);
  const [showCustomPlayersModal, setShowCustomPlayersModal] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [guestName, setGuestName] = useState(localStorage.getItem('guest_username') || '');
  const [copied, setCopied] = useState(false);
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>('turnBased');
  const [cardModeEnabled, setCardModeEnabled] = useState(false);
  const [isOpenRoom, setIsOpenRoom] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [pendingJoinInfo, setPendingJoinInfo] = useState<{
    code: string;
    playerId: string;
    username: string;
    avatar: string;
    color: string;
    isGuest: boolean;
  } | null>(null);

  // Auto-fill session code from invite link
  React.useEffect(() => {
    if (isOpen && initialJoinCode) {
      setSessionCode(initialJoinCode);
      setMode('join');
    }
  }, [isOpen, initialJoinCode]);

  const handleClose = () => {
    setMode('choose');
    setGeneratedCode('');
    setSessionCode('');
    setSelectedGameMode('turnBased');
    setCardModeEnabled(false);
    setIsOpenRoom(true);
    setLinkCopied(false);
    setUseCustomRounds(false);
    setCustomRounds('');
    setUseCustomPlayers(false);
    setCustomPlayersInput(5);
    setShowCustomPlayersModal(false);
    setPendingJoinInfo(null);
    onClose();
  };

  if (!isOpen) return null;

  // Compute effective rounds / players for Speed Race
  const effectiveRounds = (() => {
    if (selectedGameMode !== 'speedRace') return rounds;
    if (useCustomRounds) {
      const v = parseInt(customRounds, 10);
      return isNaN(v) ? rounds : Math.min(100, Math.max(10, v));
    }
    return rounds;
  })();

  const effectivePlayers = (() => {
    if (useCustomPlayers) {
      return Math.min(20, Math.max(2, customPlayersInput));
    }
    return players;
  })();

  const handleCreate = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      setIsSignInModalOpen(true);
      return;
    }

    if (selectedGameMode === 'speedRace') {
      // Validate rounds
      const r = effectiveRounds;
      if (r < 10 || r > 100) {
        addToast('error', 'Rounds must be between 10 and 100');
        return;
      }
      const p = effectivePlayers;
      if (p < 2 || p > 20) {
        addToast('error', 'Players must be between 2 and 20');
        return;
      }
      try {
        // For speed race, we pass rounds as duration (repurposed field) and totalRounds will be set inside
        const code = await createSession(p, 30, false, selectedGameMode, false, r, isOpenRoom);
        setGeneratedCode(code);
        addToast('success', t('sessionCreated', { code }));
      } catch (err) {
        addToast('error', 'Failed to create session');
      }
      return;
    }
    try {
      const code = await createSession(effectivePlayers, duration, false, selectedGameMode, cardModeEnabled, undefined, isOpenRoom);
      setGeneratedCode(code);
      addToast('success', t('sessionCreated', { code }));
    } catch (err) {
      addToast('error', 'Failed to create session');
    }
  };

  const handleCreateSolo = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      setIsSignInModalOpen(true);
      return;
    }

    try {
      // Create solo session with 1 player and specified duration (max 60 min)
      const code = await createSession(1, Math.min(duration, 60), true);
      // Solo mode goes directly to game, no waiting room
      navigate('/game');
      onClose();
    } catch (err: any) {
      console.error('[Solo] Failed to create:', err?.message, err);
      addToast('error', `Failed to create solo session: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleJoin = async () => {
    // Validate session code
    const codeValidation = validateSessionCode(sessionCode);
    if (!codeValidation.valid) {
      addToast('error', codeValidation.error || t('invalidCode'));
      return;
    }

    const code = sessionCode.trim().toUpperCase();

    // Unauthenticated users join as guests
    if (!isAuthenticated) {
      const nameValidation = validateUsername(guestName);
      if (!nameValidation.valid) {
        addToast('error', nameValidation.error || 'Invalid name');
        return;
      }
      try {
        const success = await joinSessionAsGuest(code, guestName.trim());
        if (success) {
          navigate('/waiting-room');
          onClose();
        } else {
          // Check if a join request was submitted (closed room)
          const pendingRaw = localStorage.getItem('pendingJoinRequest');
          if (pendingRaw) {
            try {
              const pending = JSON.parse(pendingRaw);
              if (pending.code === code) {
                setPendingJoinInfo(pending);
                return;
              }
            } catch { /* ignore */ }
          }
          addToast('error', 'Could not join session. Please try again.');
        }
      } catch (err: any) {
        addToast('error', err?.message || 'Failed to join session');
      }
      return;
    }

    try {
      const success = await joinSession(code);
      if (success) {
        navigate('/waiting-room');
        onClose();
      } else {
        // Check if a join request was submitted (closed room)
        const pendingRaw = localStorage.getItem('pendingJoinRequest');
        if (pendingRaw) {
          try {
            const pending = JSON.parse(pendingRaw);
            if (pending.code === code) {
              setPendingJoinInfo(pending);
              return;
            }
          } catch { /* ignore */ }
        }
        addToast('error', error || 'Could not join session. Please try again.');
      }
    } catch (err: any) {
      addToast('error', err?.message || 'Failed to join session');
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goToWaitingRoom = () => {
    navigate('/waiting-room');
    onClose();
  };

  return (
    <>
      {/* Game Settings Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        <div className="p-6">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>

          {mode === 'choose' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-display text-foreground text-center">
                {t('startGame')}
              </h2>

              {/* Solo vs Multiplayer choice */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="game"
                  className="h-24 flex-col gap-3 relative overflow-hidden group"
                  onClick={() => setMode('solo')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <User className="h-8 w-8" />
                  <span className="text-lg font-semibold">{t('soloMode')}</span>
                </Button>

                <Button
                  variant="game"
                  className="h-24 flex-col gap-3 relative overflow-hidden group"
                  onClick={() => setMode('multiplayer')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Users className="h-8 w-8" />
                  <span className="text-lg font-semibold">{t('multiplayerMode')}</span>
                </Button>
              </div>
            </div>
          )}

          {mode === 'multiplayer' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-display text-foreground text-center">
                {t('multiplayerMode')}
              </h2>

              {/* Create or Join choice */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="game"
                  className="h-24 flex-col gap-3 relative overflow-hidden group"
                  onClick={() => setMode('selectGameMode')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Users className="h-7 w-7" />
                  <span className="text-base font-semibold">{t('createSession')}</span>
                </Button>

                <Button
                  variant="game"
                  className="h-24 flex-col gap-3 relative overflow-hidden group"
                  onClick={() => setMode('join')}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Hash className="h-7 w-7" />
                  <span className="text-base font-semibold">{t('joinSession')}</span>
                </Button>
              </div>

              <Button variant="outline" onClick={() => setMode('choose')} className="w-full">
                {t('back')}
              </Button>
            </div>
          )}

          {mode === 'selectGameMode' && (
            <GameModeSelector
              onSelect={(gameMode) => {
                setSelectedGameMode(gameMode);
                setDuration(gameMode === 'againstTheClock' ? 15 : 30);
                setRounds(20);
                setUseCustomRounds(false);
                setCustomRounds('');
                setPlayers(2);
                setUseCustomPlayers(false);
                setCustomPlayersInput(5);
                setMode('create');
              }}
              onBack={() => setMode('multiplayer')}
            />
          )}

          {mode === 'solo' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-display text-foreground text-center">
                {t('soloMode')}
              </h2>
              <div className="space-y-3">
                <label className="flex items-center justify-between text-sm font-medium text-foreground">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    {t('gameDuration')}
                  </span>
                  <span className="text-xs text-muted-foreground">{t('maxDurationNote')}</span>
                </label>
                <div className="flex gap-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setDuration(mins)}
                      className={`flex-1 py-3 rounded-lg font-semibold transition-all ${duration === mins ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">{t('soloPlayMode')}:</p>
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <Dice5 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>{t('soloModeDice')}</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-muted-foreground">
                  <MousePointer className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>{t('soloModeClick')}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setMode('choose')} className="flex-1">
                  {t('cancel')}
                </Button>
                <Button variant="netflix" onClick={handleCreateSolo} className="flex-1" disabled={isLoading}>
                  {isLoading ? t('loading') : t('startPractice')}
                </Button>
              </div>
            </div>
          )}

          {mode === 'create' && !generatedCode && (
            <div className="space-y-5">
              <h2 className="text-3xl font-display text-foreground text-center">
                {t('createSession')}
              </h2>

              {/* Selected Game Mode Badge */}
              <div className="flex justify-center">
                <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${
                  selectedGameMode === 'speedRace'
                    ? 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border border-[hsl(var(--success))]/30'
                    : selectedGameMode === 'againstTheClock'
                      ? 'bg-warning/20 text-warning border border-warning/30'
                      : 'bg-primary/20 text-primary border border-primary/30'
                }`}>
                  {selectedGameMode === 'speedRace' && <Zap className="h-4 w-4" />}
                  {selectedGameMode === 'speedRace'
                    ? (t('speedRaceMode' as any))
                    : selectedGameMode === 'againstTheClock'
                      ? t('againstTheClockMode')
                      : t('turnBasedMode')}
                </span>
              </div>

              {/* Players Selection */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  {t('participants')}
                </label>
                {selectedGameMode === 'turnBased' ? (
                  /* Turn-based: only 2, 3, 4 */
                  <div className="flex gap-2">
                    {[2, 3, 4].map((num) => (
                      <button
                        key={num}
                        onClick={() => { setPlayers(num); setUseCustomPlayers(false); }}
                        className={`flex-1 py-2.5 rounded-lg font-semibold transition-all text-sm ${players === num ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Against the Clock & Speed Race: 2, 3, 4 + Custom */
                  <div className="flex gap-2">
                    {[2, 3, 4].map((num) => (
                      <button
                        key={num}
                        onClick={() => { setPlayers(num); setUseCustomPlayers(false); }}
                        className={`flex-1 py-2.5 rounded-lg font-semibold transition-all text-sm ${!useCustomPlayers && players === num ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setCustomPlayersInput(useCustomPlayers ? customPlayersInput : 5);
                        setShowCustomPlayersModal(true);
                      }}
                      className={`flex-1 py-2.5 rounded-lg font-semibold transition-all text-xs ${useCustomPlayers ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                    >
                      {useCustomPlayers ? `${effectivePlayers}` : t('customPlayers' as any) || 'Custom'}
                    </button>
                  </div>
                )}
                {useCustomPlayers && selectedGameMode !== 'turnBased' && (
                  <p className="text-xs text-muted-foreground">{effectivePlayers} {t('participants').toLowerCase()}</p>
                )}
              </div>

              {/* Custom Players Modal */}
              {showCustomPlayersModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center">
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setShowCustomPlayersModal(false)} />
                  <div className="relative bg-card border border-border rounded-2xl shadow-2xl p-6 w-72 animate-scale-in space-y-5">
                    <h3 className="text-lg font-semibold text-foreground text-center">{t('participants')}</h3>
                    <div className="text-center text-4xl font-bold text-foreground">{customPlayersInput}</div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setCustomPlayersInput(Math.max(2, customPlayersInput - 1))}
                        className="p-2.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                      >
                        <Minus className="h-5 w-5 text-foreground" />
                      </button>
                      <Slider
                        min={2}
                        max={20}
                        step={1}
                        value={[customPlayersInput]}
                        onValueChange={([v]) => setCustomPlayersInput(v)}
                        className="flex-1"
                      />
                      <button
                        onClick={() => setCustomPlayersInput(Math.min(20, customPlayersInput + 1))}
                        className="p-2.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                      >
                        <Plus className="h-5 w-5 text-foreground" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">2 – 20 players</p>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowCustomPlayersModal(false)} className="flex-1" size="sm">
                        {t('cancel')}
                      </Button>
                      <Button
                        variant="netflix"
                        className="flex-1"
                        size="sm"
                        onClick={() => {
                          setUseCustomPlayers(true);
                          setPlayers(customPlayersInput);
                          setShowCustomPlayersModal(false);
                        }}
                      >
                        {t('confirm')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Speed Race: Round Count */}
              {selectedGameMode === 'speedRace' ? (
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-sm font-medium text-foreground">
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-[hsl(var(--success))]" />
                      {t('roundCount' as any)}
                    </span>
                    <span className="text-xs text-muted-foreground">{t('roundCountNote' as any)}</span>
                  </label>
                  <div className="flex gap-2">
                    {[10, 20, 30, 50].map((r) => (
                      <button
                        key={r}
                        onClick={() => { setRounds(r); setUseCustomRounds(false); }}
                        className={`flex-1 py-2.5 rounded-lg font-semibold transition-all text-sm ${!useCustomRounds && rounds === r ? 'bg-[hsl(var(--success))] text-white' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                      >
                        {r}
                      </button>
                    ))}
                    <button
                      onClick={() => setUseCustomRounds(true)}
                      className={`flex-1 py-2.5 rounded-lg font-semibold transition-all text-xs ${useCustomRounds ? 'bg-[hsl(var(--success))] text-white' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                    >
                      {t('customRounds' as any)}
                    </button>
                  </div>
                  {useCustomRounds && (
                    <input
                      type="number"
                      min={10}
                      max={100}
                      value={customRounds}
                      onChange={e => setCustomRounds(e.target.value)}
                      placeholder="10–100 rounds"
                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm"
                    />
                  )}
                </div>
              ) : (
                /* Duration Selection - Different options based on game mode */
                <div className="space-y-2">
                  <label className="flex items-center justify-between text-sm font-medium text-foreground">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      {t('gameDuration')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {selectedGameMode === 'againstTheClock' ? t('maxDuration30') : t('maxDurationNote')}
                    </span>
                  </label>
                  <div className="flex gap-2">
                    {(selectedGameMode === 'againstTheClock' ? [10, 15, 20, 30] : [20, 30, 45, 60]).map((mins) => (
                      <button
                        key={mins}
                        onClick={() => setDuration(mins)}
                        className={`flex-1 py-3 rounded-lg font-semibold transition-all ${duration === mins ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Card Mode Toggle - Only for turn-based */}
              {selectedGameMode === 'turnBased' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-warning/20 rounded-lg">
                        <Sparkles className="h-5 w-5 text-warning" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{t('cardMode')}</p>
                        <p className="text-xs text-muted-foreground">{t('cardModeDesc')}</p>
                      </div>
                    </div>
                    <Switch checked={cardModeEnabled} onCheckedChange={setCardModeEnabled} />
                  </div>
                </div>
              )}

              {/* Open / Closed Room Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isOpenRoom ? 'bg-[hsl(var(--success))]/20' : 'bg-primary/20'}`}>
                      {isOpenRoom ? <Globe className="h-5 w-5 text-[hsl(var(--success))]" /> : <Lock className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{isOpenRoom ? t('openRoom' as any) : t('closedRoom' as any)}</p>
                      <p className="text-xs text-muted-foreground">{isOpenRoom ? t('openRoomDesc' as any) : t('closedRoomDesc' as any)}</p>
                    </div>
                  </div>
                  <Switch checked={isOpenRoom} onCheckedChange={setIsOpenRoom} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setMode('selectGameMode')} className="flex-1">
                  {t('cancel')}
                </Button>
                <Button variant="netflix" onClick={handleCreate} className="flex-1" disabled={isLoading}>
                  {isLoading ? t('loading') : t('confirm')}
                </Button>
              </div>
            </div>
          )}

          {mode === 'create' && generatedCode && (
            <div className="space-y-6 text-center">
              <h2 className="text-3xl font-display text-foreground">
                {t('sessionCode')}
              </h2>

              <div className="bg-secondary rounded-xl p-6">
                <p className="text-5xl font-display tracking-[0.3em] text-primary">
                  {generatedCode}
                </p>
              </div>

              <p className="text-muted-foreground text-sm">
                {t('shareCode')}
              </p>

              <div className="flex gap-2 justify-center">
                <GameTooltip content="Copy code to clipboard">
                  <Button
                    variant="outline"
                    onClick={copyCode}
                    className="gap-2"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy Code'}
                  </Button>
                </GameTooltip>
                <GameTooltip content="Copy invite link">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const url = `${window.location.origin}/?join=${generatedCode}`;
                      navigator.clipboard.writeText(url);
                      setLinkCopied(true);
                      addToast('success', t('inviteLinkCopied' as any));
                      setTimeout(() => setLinkCopied(false), 2000);
                    }}
                    className="gap-2"
                  >
                    {linkCopied ? <Check className="h-4 w-4" /> : <Link className="h-4 w-4" />}
                    {linkCopied ? 'Copied!' : t('copyInviteLink' as any)}
                  </Button>
                </GameTooltip>
              </div>

              <Button variant="netflix" onClick={goToWaitingRoom} className="w-full">
                {t('waitingRoom')}
              </Button>
            </div>
          )}

          {mode === 'join' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-display text-foreground text-center">
                {t('joinSession')}
              </h2>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Hash className="h-4 w-4 text-primary" />
                  {t('sessionCode')}
                </label>
                <input
                  type="text"
                  value={sessionCode}
                 onChange={(e) => setSessionCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                 placeholder={t('enterCode')}
                 maxLength={6}
                 pattern="[A-Z0-9]{6}"
                  className="w-full px-4 py-4 bg-secondary border border-border rounded-lg text-center text-2xl font-display tracking-[0.2em] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {!isAuthenticated && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Users className="h-4 w-4 text-primary" />
                    {t('username')}
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value.slice(0, MAX_USERNAME_LENGTH))}
                    placeholder="Enter your name"
                    maxLength={MAX_USERNAME_LENGTH}
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setMode('multiplayer')} className="flex-1">
                  {t('cancel')}
                </Button>
                <Button
                  variant="netflix"
                  onClick={handleJoin}
                  className="flex-1"
                  disabled={sessionCode.length !== 6 || (!isAuthenticated && !guestName.trim()) || isLoading}
                >
                  {isLoading ? t('loading') : t('confirm')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Sign In Modal - Outside z-50 container so it appears on top */}
    <GameStartSignInModal
      isOpen={isSignInModalOpen}
      onClose={() => setIsSignInModalOpen(false)}
      onSignIn={() => {
        setIsSignInModalOpen(false);
        navigate('/');
      }}
      onJoin={() => {
        setIsSignInModalOpen(false);
        navigate('/');
      }}
    />

    {/* Pending Join Request Modal */}
    {pendingJoinInfo && (
      <PendingJoinRequestModal
        sessionCode={pendingJoinInfo.code}
        playerId={pendingJoinInfo.playerId}
        username={pendingJoinInfo.username}
        avatar={pendingJoinInfo.avatar}
        color={pendingJoinInfo.color}
        isGuest={pendingJoinInfo.isGuest}
        onApproved={async () => {
          const info = pendingJoinInfo!;
          localStorage.removeItem('pendingJoinRequest');
          const restored = await restoreApprovedSession(info.code, info.playerId);
          setPendingJoinInfo(null);
          if (restored) {
            navigate('/waiting-room');
            onClose();
          } else {
            addToast('error', 'Failed to join after approval. Please try again.');
          }
        }}
        onCancel={() => {
          localStorage.removeItem('pendingJoinRequest');
          setPendingJoinInfo(null);
        }}
      />
    )}
    </>
  );
};