import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToastContext } from '@/contexts/ToastContext';
import {
  auth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from '@/lib/firebase';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PasswordStage = 'idle' | 'verify' | 'set-new';

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { user, updateProfile } = useAuth();
  const { addToast } = useToastContext();

  const [username, setUsername] = useState(user?.username || '');

  // Password flow
  const [passwordStage, setPasswordStage] = useState<PasswordStage>('idle');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  const resetPasswordState = () => {
    setPasswordStage('idle');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPw(false);
    setShowNewPw(false);
    setShowConfirmPw(false);
  };

  const handleClose = () => {
    resetPasswordState();
    onClose();
  };

  const handleSaveProfile = () => {
    updateProfile({ username: username.trim() || user.username });
    addToast('success', t('profileUpdated'));
    handleClose();
  };

  const handleVerifyCurrentPassword = async () => {
    setLoading(true);
    try {
      const firebaseUser = auth?.currentUser;
      if (!firebaseUser || !firebaseUser.email) throw new Error('No user');

      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      setPasswordStage('set-new');
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        addToast('error', t('wrongPassword'));
      } else {
        addToast('error', error.message || 'Error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async () => {
    if (newPassword.length < 6) {
      addToast('error', t('passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('error', t('passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const firebaseUser = auth?.currentUser;
      if (!firebaseUser) throw new Error('No user');
      await updatePassword(firebaseUser, newPassword);
      addToast('success', t('passwordChanged'));
      resetPasswordState();
    } catch (error: any) {
      addToast('error', error.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">{t('editProfile')}</h2>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Username */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">{t('username')}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:border-primary outline-none text-sm"
              maxLength={20}
            />
          </div>

          <button
            onClick={handleSaveProfile}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            {t('save')}
          </button>

          <div className="border-t border-border" />

          {/* Password Change - Stage based */}
          {passwordStage === 'idle' && (
            <button
              onClick={() => setPasswordStage('verify')}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              {t('changePassword')}
            </button>
          )}

          {passwordStage === 'verify' && (
            <div className="space-y-3 animate-scale-in">
              <p className="text-sm text-muted-foreground">{t('enterCurrentPassword')}</p>
              <div className="relative">
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t('currentPassword')}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:border-primary outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => resetPasswordState()}
                  className="flex-1 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleVerifyCurrentPassword}
                  disabled={loading || !currentPassword}
                  className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('verify')}
                </button>
              </div>
            </div>
          )}

          {passwordStage === 'set-new' && (
            <div className="space-y-3 animate-scale-in">
              <p className="text-sm text-muted-foreground">{t('enterNewPassword')}</p>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('newPassword')}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:border-primary outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showConfirmPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('confirmNewPassword')}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:border-primary outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => resetPasswordState()}
                  className="flex-1 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-secondary transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSetNewPassword}
                  disabled={loading || !newPassword || !confirmPassword}
                  className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('changePassword')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
