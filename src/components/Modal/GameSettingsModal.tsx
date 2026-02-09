import React, { useState } from 'react';
 import { X, Users, Clock, Hash, Copy, Check, User, Dice5, MousePointer, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
 import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGame, GameMode } from '@/contexts/GameContext';
import { useToastContext } from '@/contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';
import { GameModeSelector } from './GameModeSelector';
import { validateSessionCode, validateUsername, MAX_USERNAME_LENGTH } from '@/utils/inputValidation';

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

  const [mode, setMode] = useState<'choose' | 'multiplayer' | 'solo' | 'selectGameMode' | 'create' | 'join'>('choose');
  const [players, setPlayers] = useState(2);
  const [duration, setDuration] = useState(30);
  const [sessionCode, setSessionCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [guestName, setGuestName] = useState(localStorage.getItem('guest_username') || '');
  const [copied, setCopied] = useState(false);
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode>('turnBased');
   const [cardModeEnabled, setCardModeEnabled] = useState(false);

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
    onClose();
  };

  if (!isOpen) return null;

  const handleCreate = async () => {
    try {
       const code = await createSession(players, duration, false, selectedGameMode, cardModeEnabled);
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
    // Validate session code
    const codeValidation = validateSessionCode(sessionCode);
    if (!codeValidation.valid) {
      addToast('error', codeValidation.error || t('invalidCode'));
      return;
    }

    // Validate guest name if not authenticated
    if (!isAuthenticated) {
      const nameValidation = validateUsername(guestName);
      if (!nameValidation.valid) {
        addToast('error', nameValidation.error || 'Invalid name');
        return;
      }
    }

    try {
      const success = await joinSession(sessionCode.trim().toUpperCase(), isAuthenticated ? undefined : guestName.trim());
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
                // Set appropriate default duration based on game mode
                setDuration(gameMode === 'againstTheClock' ? 15 : 30);
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

              {/* Selected Game Mode Badge */}
              <div className="flex justify-center">
                <span className={`
                  px-4 py-2 rounded-full text-sm font-medium
                  ${selectedGameMode === 'againstTheClock' 
                    ? 'bg-warning/20 text-warning border border-warning/30' 
                    : 'bg-primary/20 text-primary border border-primary/30'}
                `}>
                  {selectedGameMode === 'againstTheClock' ? t('againstTheClockMode') : t('turnBasedMode')}
                </span>
              </div>

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

              {/* Duration Selection - Different options based on game mode */}
              <div className="space-y-3">
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
                     <Switch
                       checked={cardModeEnabled}
                       onCheckedChange={setCardModeEnabled}
                     />
                   </div>
                 </div>
               )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setMode('selectGameMode')} className="flex-1">
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
  );
};