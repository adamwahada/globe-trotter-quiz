import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Eye, EyeOff, Loader2, User, Lock, ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToastContext } from '@/contexts/ToastContext';
import { supabase } from '@/integrations/supabase/client';
import {
  auth,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile as firebaseUpdateProfile,
} from '@/lib/firebase';
import { validateUsername, MAX_USERNAME_LENGTH } from '@/utils/inputValidation';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type View = 'menu' | 'username' | 'password-verify' | 'password-set';

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { user, updateProfile } = useAuth();
  const { addToast } = useToastContext();

  const [view, setView] = useState<View>('menu');
  const [username, setUsername] = useState(user?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setUsername(user.username);
    }
  }, [isOpen, user?.username]);

  if (!isOpen || !user) return null;

  const resetState = () => {
    setView('menu');
    setUsername(user?.username || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPw(false);
    setShowNewPw(false);
    setShowConfirmPw(false);
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSaveUsername = async () => {
    const trimmed = username.trim();
    if (!trimmed || trimmed === user.username) {
      handleClose();
      return;
    }

    // Validate format
    const validation = validateUsername(trimmed);
    if (!validation.valid) {
      addToast('error', validation.error || 'Invalid username');
      return;
    }

    setLoading(true);
    try {
      // Check uniqueness (case-insensitive)
      const { data: existing } = await supabase
        .from('usernames')
        .select('id')
        .ilike('username', trimmed)
        .neq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        addToast('error', t('usernameAlreadyUsed'));
        setLoading(false);
        return;
      }

      // Keep auth profile and database in sync with chosen username
      const firebaseUser = auth?.currentUser;
      if (firebaseUser) {
        await firebaseUpdateProfile(firebaseUser, { displayName: trimmed });
      }

      await supabase
        .from('usernames')
        .upsert({ user_id: user.id, username: trimmed, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

      updateProfile({ username: trimmed });
      addToast('success', t('profileUpdated'));
      handleClose();
    } catch {
      addToast('error', 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPassword = async () => {
    setLoading(true);
    try {
      const firebaseUser = auth?.currentUser;
      if (!firebaseUser || !firebaseUser.email) throw new Error('No user');
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      setView('password-set');
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
      handleClose();
    } catch (error: any) {
      addToast('error', error.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'menu':
        return (
          <div className="space-y-3">
            <button
              onClick={() => setView('username')}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 hover:bg-secondary transition-all text-left"
            >
              <User className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">{t('username')}</p>
                <p className="text-xs text-muted-foreground">{user.username}</p>
              </div>
            </button>
            <button
              onClick={() => setView('password-verify')}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-secondary/50 border border-border hover:border-primary/50 hover:bg-secondary transition-all text-left"
            >
              <Lock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">{t('changePassword')}</p>
                <p className="text-xs text-muted-foreground">{t('enterCurrentPassword')}</p>
              </div>
            </button>
          </div>
        );

      case 'username':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">{t('username')}</label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.slice(0, MAX_USERNAME_LENGTH))}
                  className="w-full px-4 py-2.5 pr-16 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:border-primary outline-none text-sm"
                  maxLength={MAX_USERNAME_LENGTH}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {username.length}/{MAX_USERNAME_LENGTH}
                </span>
              </div>
            </div>
            <button
              onClick={handleSaveUsername}
              disabled={loading || !username.trim()}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('save')}
            </button>
          </div>
        );

      case 'password-verify':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('enterCurrentPassword')}</p>
            <div className="relative">
              <input
                type={showCurrentPw ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('currentPassword')}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:border-primary outline-none text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button
              onClick={handleVerifyPassword}
              disabled={loading || !currentPassword}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('verify')}
            </button>
          </div>
        );

      case 'password-set':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('enterNewPassword')}</p>
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('newPassword')}
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:border-primary outline-none text-sm pr-10"
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
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:border-primary outline-none text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button
              onClick={handleSetNewPassword}
              disabled={loading || !newPassword || !confirmPassword}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('changePassword')}
            </button>
          </div>
        );
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            {view !== 'menu' && (
              <button
                onClick={() => setView('menu')}
                className="p-1 rounded-lg hover:bg-secondary transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
            <h2 className="text-lg font-bold text-foreground">{t('editProfile')}</h2>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5">
          {renderContent()}
        </div>
      </div>
    </div>,
    document.body
  );
};
