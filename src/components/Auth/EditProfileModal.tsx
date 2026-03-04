import React, { useState } from 'react';
import { X, Camera, Lock, Eye, EyeOff, Check, Loader2 } from 'lucide-react';
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

const PROFILE_PICTURES = [
  '🦁', '🐯', '🐘', '🦒', '🦊', '🐨', '🐼', '🦓',
  '🦄', '🐲', '🐙', '🐢', '🐧', '🦉', '🦅', '🐬',
  '🦈', '🐺', '🦇', '🐸', '🦋', '🐝', '🦎', '🐠',
];

const PROFILE_COLORS = [
  '#E50914', '#1DB954', '#4169E1', '#FF6B35',
  '#9B59B6', '#00CED1', '#F1C40F', '#E67E22',
  '#2ECC71', '#E91E63', '#3F51B5', '#FF5722',
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { user, updateProfile } = useAuth();
  const { addToast } = useToastContext();

  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '🦁');
  const [selectedColor, setSelectedColor] = useState(user?.color || '#E50914');
  const [username, setUsername] = useState(user?.username || '');

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  if (!isOpen || !user) return null;

  const handleSaveProfile = () => {
    updateProfile({
      avatar: selectedAvatar,
      color: selectedColor,
      username: username.trim() || user.username,
    });
    addToast('success', t('profileUpdated'));
    onClose();
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      addToast('error', t('passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('error', t('passwordMismatch'));
      return;
    }

    setChangingPassword(true);
    try {
      const firebaseUser = auth?.currentUser;
      if (!firebaseUser || !firebaseUser.email) throw new Error('No user');

      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);

      addToast('success', t('passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        addToast('error', t('wrongPassword'));
      } else {
        addToast('error', error.message || 'Error');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">{t('editProfile')}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Current avatar preview */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl border-2 border-primary/30 shadow-lg transition-all duration-300"
              style={{ backgroundColor: selectedColor }}
            >
              {selectedAvatar}
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="text-center text-lg font-semibold bg-transparent border-b border-border text-foreground focus:border-primary outline-none px-4 py-1 transition-colors"
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>

          {/* Profile Picture Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
              <Camera className="h-4 w-4 text-primary" />
              {t('profilePicture')}
            </label>
            <div className="grid grid-cols-8 gap-2">
              {PROFILE_PICTURES.map((pic) => (
                <button
                  key={pic}
                  onClick={() => setSelectedAvatar(pic)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-xl transition-all duration-200 ${
                    selectedAvatar === pic
                      ? 'bg-primary/20 ring-2 ring-primary scale-110'
                      : 'bg-secondary/50 hover:bg-secondary hover:scale-105'
                  }`}
                >
                  {pic}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">{t('selectColor')}</label>
            <div className="flex flex-wrap gap-2">
              {PROFILE_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full transition-all duration-200 ${
                    selectedColor === color ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {selectedColor === color && <Check className="h-4 w-4 text-white mx-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* Save Profile Button */}
          <button
            onClick={handleSaveProfile}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            {t('save')}
          </button>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Change Password Section */}
          <div>
            <button
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              <Lock className="h-4 w-4" />
              {t('changePassword')}
            </button>

            {showPasswordSection && (
              <div className="mt-4 space-y-3 animate-scale-in">
                {/* Current Password */}
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

                {/* New Password */}
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

                {/* Confirm New Password */}
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('confirmNewPassword')}
                  className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:border-primary outline-none text-sm"
                />

                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {changingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('changePassword')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
