import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToastContext } from '@/contexts/ToastContext';
import { auth, googleProvider, signInWithPopup, sendPasswordResetEmail } from '@/lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const { t } = useLanguage();
  const { signIn, signUp, isLoading } = useAuth();
  const { addToast } = useToastContext();
  
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Sync mode with initialMode when modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      // Clear form fields when modal opens
      setEmail('');
      setPassword('');
      setUsername('');
      setConfirmPassword('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          addToast('error', 'Passwords do not match');
          return;
        }
        await signUp(email, password, username);
        addToast('success', 'Account created successfully!');
      } else {
        await signIn(email, password);
        addToast('success', 'Welcome back!');
      }
      onClose();
    } catch (error: any) {
      console.error('Auth error:', error?.code, error?.message);
      const code = error?.code || '';
      
      if (code === 'auth/email-already-in-use') {
        addToast('error', 'This email is already registered. Please sign in instead.');
      } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        addToast('error', t('invalidCredentialsGoogleHint') || 'Invalid credentials. If you previously signed in with Google, please use "Continue with Google" or reset your password.');
      } else if (code === 'auth/invalid-email') {
      } else if (code === 'auth/invalid-email') {
        addToast('error', 'Invalid email address');
      } else if (code === 'auth/weak-password') {
        addToast('error', 'Password must be at least 6 characters');
      } else if (code === 'auth/too-many-requests') {
        addToast('error', 'Too many attempts. Please try again later.');
      } else if (code === 'auth/account-exists-with-different-credential') {
        addToast('error', 'An account already exists with this email using a different sign-in method (e.g., Google). Try signing in with Google.');
      } else {
        addToast('error', error?.message || t('invalidCredentials'));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="relative p-6 pb-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
          
          <h2 className="text-3xl font-display text-foreground text-center mb-2">
            {mode === 'signin' ? t('welcomeBack') : t('joinUs')}
          </h2>
          <p className="text-muted-foreground text-center text-sm">
            {mode === 'signin' ? t('signIn') : t('createAccount')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'signup' && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('username')}
                required
                className="w-full pl-11 pr-4 py-3 bg-secondary border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}
          
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('email')}
              required
              className="w-full pl-11 pr-4 py-3 bg-secondary border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>
          
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('password')}
              required
              className="w-full pl-11 pr-4 py-3 bg-secondary border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {mode === 'signup' && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPassword')}
                required
                className="w-full pl-11 pr-4 py-3 bg-secondary border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}

          <Button 
            type="submit" 
            variant="netflix" 
            className="w-full py-6"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              mode === 'signin' ? t('signIn') : t('signUp')
            )}
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted-foreground text-sm">{t('or') || 'or'}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google Sign-in */}
          <Button
            type="button"
            variant="outline"
            className="w-full py-6 gap-3"
            onClick={async () => {
              if (!auth || !googleProvider) {
                addToast('error', 'Firebase not initialized');
                return;
              }
              try {
                await signInWithPopup(auth, googleProvider);
                addToast('success', t('welcomeBack'));
                onClose();
              } catch (error: any) {
                console.error('Google sign-in error:', error);
                addToast('error', error.message || 'Google sign-in failed');
              }
            }}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t('signInWithGoogle') || 'Continue with Google'}
          </Button>

          {mode === 'signin' && (
            <button
              type="button"
              className="w-full text-sm text-primary hover:underline"
              onClick={async () => {
                if (!email) {
                  addToast('error', t('enterEmailFirst') || 'Please enter your email address first.');
                  return;
                }
                if (!auth) {
                  addToast('error', 'Firebase not initialized');
                  return;
                }
                try {
                  await sendPasswordResetEmail(auth, email);
                  addToast('success', t('passwordResetSent') || 'Password reset email sent! Check your inbox.');
                } catch (error: any) {
                  console.error('Password reset error:', error);
                  if (error?.code === 'auth/user-not-found') {
                    addToast('error', t('noAccountWithEmail') || 'No account found with this email.');
                  } else {
                    addToast('error', error?.message || 'Failed to send reset email.');
                  }
                }
              }}
            >
              {t('forgotPassword')}
            </button>
          )}
        </form>

        {/* Footer */}
        <div className="p-6 pt-0 text-center">
          <p className="text-muted-foreground text-sm">
            {mode === 'signin' ? t('noAccount') : t('hasAccount')}
            {' '}
            <button
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-primary font-medium hover:underline"
            >
              {mode === 'signin' ? t('signUp') : t('signIn')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
