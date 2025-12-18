import React, { useState } from 'react';
import { X, Users, Clock, Hash, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGame } from '@/contexts/GameContext';
import { useToastContext } from '@/contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { GameTooltip } from '@/components/Tooltip/GameTooltip';

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { createSession, joinSession } = useGame();
  const { addToast } = useToastContext();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [players, setPlayers] = useState(2);
  const [duration, setDuration] = useState(30);
  const [sessionCode, setSessionCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreate = () => {
    const code = createSession(players, duration);
    setGeneratedCode(code);
    addToast('success', t('sessionCreated', { code }));
  };

  const handleJoin = () => {
    if (joinSession(sessionCode)) {
      navigate('/waiting-room');
      onClose();
    } else {
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
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        <div className="p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>

          {mode === 'choose' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-display text-foreground text-center">
                {t('startGame')}
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="game"
                  className="h-32 flex-col gap-3"
                  onClick={() => setMode('create')}
                >
                  <Users className="h-8 w-8" />
                  <span className="text-lg">{t('createSession')}</span>
                </Button>
                
                <Button
                  variant="game"
                  className="h-32 flex-col gap-3"
                  onClick={() => setMode('join')}
                >
                  <Hash className="h-8 w-8" />
                  <span className="text-lg">{t('joinSession')}</span>
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
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  {t('gameDuration')}
                </label>
                <div className="flex gap-2">
                  {[20, 30, 45].map((mins) => (
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
                      {mins} {t('minutes')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setMode('choose')} className="flex-1">
                  {t('cancel')}
                </Button>
                <Button variant="netflix" onClick={handleCreate} className="flex-1">
                  {t('confirm')}
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

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setMode('choose')} className="flex-1">
                  {t('cancel')}
                </Button>
                <Button 
                  variant="netflix" 
                  onClick={handleJoin} 
                  className="flex-1"
                  disabled={sessionCode.length !== 6}
                >
                  {t('confirm')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
