import React, { useState } from 'react';
import { X, Users, Clock, Hash, Copy, Check, User, Dice5, MousePointer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGame } from '@/contexts/GameContext';
import { useToastContext } from '@/contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialJoinCode?: string | null;
}

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({ isOpen, onClose, initialJoinCode }) => {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { createSession, joinSession, isLoading, error } = useGame();
  const { addToast } = useToastContext();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'choose' | 'multiplayer' | 'solo' | 'create' | 'join'>('choose');
  const [players, setPlayers] = useState(2);
  const [duration, setDuration] = useState(30);
  const [sessionCode, setSessionCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [guestName, setGuestName] = useState(localStorage.getItem('guest_username') || '');
  const [copied, setCopied] = useState(false);

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
    onClose();
  };

  if (!isOpen) return null;

  const handleCreate = async () => {
    try {
      const code = await createSession(players, duration);
      setGeneratedCode(code);
      addToast('success', t('sessionCreated', { code }));
    } catch (err) {
      addToast('error', 'Failed to create session');
    }
  };

  const handleCreateSolo = async () => {
    try {
      // Create solo session with 1 player and specified duration (max 60 min)
      const code = await createSession(1, Math.min(duration, 60), true);
      // Solo mode goes directly to game, no waiting room
      navigate('/game');
      onClose();
    } catch (err) {
      addToast('error', 'Failed to create solo session');
    }
  };

  const handleJoin = async () => {
    try {
      const success = await joinSession(sessionCode, isAuthenticated ? undefined : guestName);
      if (success) {
        navigate('/waiting-room');
        onClose();
      } else {
        addToast('error', error || t('invalidCode'));
      }
    } catch (err) {
      addToast('error', t('invalidCode'));
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
                  onClick={() => setMode('create')}
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

          {mode === 'solo' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-display text-foreground text-center">
                {t('soloMode')}
              </h2>

              {/* Duration Selection */}
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
                      className={`
                        flex-1 py-3 rounded-lg font-semibold transition-all
                        ${duration === mins
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}
                      `}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Play mode info */}
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
                <Button
                  variant="netflix"
                  onClick={handleCreateSolo}
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? t('loading') : t('startPractice')}
                </Button>
              </div>
            </div>
          )}

          {mode === 'create' && !generatedCode && (
            <div className="space-y-6">
              <h2 className="text-3xl font-display text-foreground text-center">
                {t('createSession')}
              </h2>

              {/* Players Selection */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  {t('participants')}
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={() => setPlayers(num)}
                      className={`
                        flex-1 py-3 rounded-lg font-semibold transition-all
                        ${players === num
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}
                      `}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Selection */}
              <div className="space-y-3">
                <label className="flex items-center justify-between text-sm font-medium text-foreground">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    {t('gameDuration')}
                  </span>
                  <span className="text-xs text-muted-foreground">{t('maxDurationNote')}</span>
                </label>
                <div className="flex gap-2">
                  {[20, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setDuration(Math.min(mins, 60))}
                      className={`
                        flex-1 py-3 rounded-lg font-semibold transition-all
                        ${duration === mins
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}
                      `}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setMode('multiplayer')} className="flex-1">
                  {t('cancel')}
                </Button>
                <Button
                  variant="netflix"
                  onClick={handleCreate}
                  className="flex-1"
                  disabled={isLoading}
                >
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

              <GameTooltip content="Copy code to clipboard">
                <Button
                  variant="outline"
                  onClick={copyCode}
                  className="w-full gap-2"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </Button>
              </GameTooltip>

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
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  placeholder={t('enterCode')}
                  maxLength={6}
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
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Enter your name"
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
  );
};