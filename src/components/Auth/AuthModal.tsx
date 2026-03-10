import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, User, Loader2, Eye, EyeOff, AlertCircle, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToastContext } from '@/contexts/ToastContext';
import {
  auth,
  googleProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from '@/lib/firebase';
import type { AuthCredential } from '@/lib/firebase';
import { validateUsername, MAX_USERNAME_LENGTH } from '@/utils/inputValidation';
import { supabase } from '@/integrations/supabase/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const { t } = useLanguage();
  const { signIn, signUp, isLoading } = useAuth();
  const { addToast } = useToastContext();

  const [mode, setMode] = useState<'signin' | 'signup' | 'reset' | 'link'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);
  // When email/password fails and the account might be Google-only, show inline prompt
  const [showSetPasswordPrompt, setShowSetPasswordPrompt] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('worldquiz_remember_me') === 'true');
  const [showNoAccountPrompt, setShowNoAccountPrompt] = useState(false);

  // Cooldown timer for reset email (60s)
  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = setTimeout(() => setResetCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resetCooldown]);

  // Stored Google credential pending account linking
  const pendingGoogleCredential = useRef<AuthCredential | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      // Pre-fill email if "remember me" was enabled
      const saved = localStorage.getItem('worldquiz_remember_me') === 'true'
        ? (localStorage.getItem('worldquiz_saved_email') || '')
        : '';
      setEmail(saved);
      setPassword('');
      setUsername('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setShowSetPasswordPrompt(false);
      setShowNoAccountPrompt(false);
      pendingGoogleCredential.current = null;
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // ── helpers ──────────────────────────────────────────────────────────────────

  // ── Google sign-in ────────────────────────────────────────────────────────────

  const handleGoogleSignIn = async () => {
    if (!auth || !googleProvider) {
      addToast('error', 'Firebase not initialized');
      return;
    }
    setIsGoogleLoading(true);
    try {
      // Google sign-in: always session-only (no "remember me" for OAuth popup)
      await setPersistence(auth, browserSessionPersistence);
      await signInWithPopup(auth, googleProvider);
      addToast('success', t('welcomeBack'));
      onClose();
    } catch (error: any) {
      console.error('Google sign-in error:', error);

      if (error?.code === 'auth/account-exists-with-different-credential') {
        // Capture the Google credential so we can link it after email/password sign-in
        const credential = GoogleAuthProvider.credentialFromError(error);
        if (credential) {
          pendingGoogleCredential.current = credential;
        }
        // Extract the email from the error
        const conflictEmail: string = error.customData?.email || '';
        if (conflictEmail) setEmail(conflictEmail);

        // Switch to "link" mode – a special sign-in form that will link after auth
        setMode('link');
      } else if (error?.code !== 'auth/popup-closed-by-user') {
        addToast('error', error.message || 'Google sign-in failed');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // ── Link flow: sign in with email/password, then attach Google credential ────

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      if (pendingGoogleCredential.current) {
        await linkWithCredential(user, pendingGoogleCredential.current);
        addToast('success', 'Google account linked! You can now sign in with both methods.');
      } else {
        addToast('success', t('welcomeBack'));
      }
      pendingGoogleCredential.current = null;
      onClose();
    } catch (error: any) {
      console.error('Link error:', error);
      if (error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        addToast('error', 'Incorrect password. Please try again.');
      } else {
        addToast('error', error?.message || 'Sign-in failed');
      }
    }
  };

  // ── Standard email/password submit ───────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (mode === 'signup') {
        const usernameValidation = validateUsername(username);
        if (!usernameValidation.valid) {
          addToast('error', usernameValidation.error || 'Invalid username');
          return;
        }
        if (password !== confirmPassword) {
          addToast('error', 'Passwords do not match');
          return;
        }

        // Check username uniqueness before creating account
        const { data: existingUsername } = await supabase
          .from('usernames')
          .select('id')
          .ilike('username', username.trim())
          .maybeSingle();

        if (existingUsername) {
          addToast('error', t('usernameAlreadyUsed') || 'This username is already taken. Please choose another one.');
          return;
        }

        await signUp(email, password, username.trim());
        addToast('success', 'Account created successfully!');
      } else {
        // Set Firebase persistence BEFORE signing in
        if (auth) {
          await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
        }
        await signIn(email, password);
        // Save or clear remembered email
        localStorage.setItem('worldquiz_remember_me', rememberMe ? 'true' : 'false');
        if (rememberMe) {
          localStorage.setItem('worldquiz_saved_email', email);
        } else {
          localStorage.removeItem('worldquiz_saved_email');
        }
        addToast('success', 'Welcome back!');
      }
      onClose();
    } catch (error: any) {
      console.error('Auth error:', error?.code, error?.message);
      const code = error?.code || '';
      const msg = error?.message || '';

      // Permanent ban check
      if (msg === 'PERMANENTLY_BANNED') {
        addToast('error', 'You have been permanently banned from this platform. You can no longer sign in.', 8000);
        return;
      }

      if (code === 'auth/email-already-in-use') {
        addToast('error', 'This email is already registered. Please sign in instead.');
      } else if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        // Only show the Google password-setup prompt if the email actually has a Google provider linked
        if (auth && email) {
          try {
            const methods = await fetchSignInMethodsForEmail(auth, email);
            if (methods.includes('google.com')) {
              setShowSetPasswordPrompt(true);
            } else {
              addToast('error', t('invalidCredentials'));
            }
          } catch {
            addToast('error', t('invalidCredentials'));
          }
        } else {
          addToast('error', t('invalidCredentials'));
        }
      } else if (code === 'auth/invalid-email') {
        addToast('error', 'Invalid email address');
      } else if (code === 'auth/weak-password') {
        addToast('error', 'Password must be at least 6 characters');
      } else if (code === 'auth/too-many-requests') {
        addToast('error', 'Too many attempts. Please try again later.');
      } else if (code === 'auth/account-exists-with-different-credential') {
        addToast('error', 'An account already exists with this email using a different sign-in method. Try signing in with Google.');
      } else {
        addToast('error', error?.message || t('invalidCredentials'));
      }
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

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
            {mode === 'reset'
              ? (t('resetPassword') || 'Reset Password')
              : mode === 'link'
              ? 'Confirm your identity'
              : mode === 'signin' ? t('welcomeBack') : t('joinUs')}
          </h2>
          <p className="text-muted-foreground text-center text-sm">
            {mode === 'reset'
              ? (t('resetPasswordDescription') || 'Enter your email to receive a password reset link')
              : mode === 'link'
              ? 'Enter your password to link your Google account'
              : mode === 'signin' ? t('signIn') : t('createAccount')}
          </p>
        </div>

        {/* ── Account-linking mode ── */}
        {mode === 'link' && (
          <form onSubmit={handleLinkSubmit} className="p-6 space-y-4">
            {/* Info banner */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
              <AlertCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-foreground/80">
                An account with <strong>{email}</strong> already exists. Sign in with your password to automatically link your Google account.
              </p>
            </div>

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
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('password')}
                required
                autoFocus
                className="w-full pl-11 pr-11 py-3 bg-secondary border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <Button type="submit" variant="netflix" className="w-full py-6" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Link Google account & Sign in'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setMode('signin'); pendingGoogleCredential.current = null; }}
                className="text-primary text-sm font-medium hover:underline"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* ── Reset Password mode ── */}
        {mode === 'reset' && (
          <div className="p-6 space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setShowNoAccountPrompt(false); }}
                placeholder={t('email')}
                required
                className="w-full pl-11 pr-4 py-3 bg-secondary border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* No account found prompt */}
            {showNoAccountPrompt && (
              <div className="flex flex-col gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground/80">
                    {t('noActiveAccount') || 'There is no active account with this email address.'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="netflix"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setShowNoAccountPrompt(false); setMode('signup'); }}
                  >
                    {t('createAccount') || 'Create Account'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setShowNoAccountPrompt(false); onClose(); }}
                  >
                    {t('continueAsGuest') || 'Continue as Guest'}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 py-6" onClick={() => { setShowNoAccountPrompt(false); setMode('signin'); }}>
                {t('cancel') || 'Cancel'}
              </Button>
              <Button
                variant="netflix"
                className="flex-1 py-6"
                disabled={isSendingReset || !email || resetCooldown > 0}
                onClick={async () => {
                  if (!email) { addToast('error', t('enterEmailFirst') || 'Please enter your email address.'); return; }
                  if (!auth) { addToast('error', 'Firebase not initialized'); return; }
                  setIsSendingReset(true);
                  try {
                    // Check if this email has any account
                    const methods = await fetchSignInMethodsForEmail(auth, email);
                    if (!methods || methods.length === 0) {
                      setShowNoAccountPrompt(true);
                      setIsSendingReset(false);
                      return;
                    }
                    await sendPasswordResetEmail(auth, email);
                    addToast('success', t('passwordResetSent') || 'Password reset email sent! Check your inbox.');
                    setResetCooldown(60);
                    setShowNoAccountPrompt(false);
                    setMode('signin');
                  } catch (error: any) {
                    if (error?.code === 'auth/user-not-found') {
                      setShowNoAccountPrompt(true);
                    } else {
                      addToast('error', error?.message || 'Failed to send reset email.');
                    }
                  } finally {
                    setIsSendingReset(false);
                  }
                }}
              >
                {isSendingReset ? <Loader2 className="h-5 w-5 animate-spin" /> : resetCooldown > 0 ? `Wait ${resetCooldown}s` : (t('confirm') || 'Confirm')}
              </Button>
            </div>

            <div className="pt-2 text-center">
              <button onClick={() => { setShowNoAccountPrompt(false); setMode('signin'); }} className="text-primary text-sm font-medium hover:underline">
                {t('backToSignIn') || 'Back to Sign In'}
              </button>
            </div>
          </div>
        )}

        {/* ── Sign In / Sign Up mode ── */}
        {(mode === 'signin' || mode === 'signup') && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.slice(0, MAX_USERNAME_LENGTH))}
                  placeholder={t('username')}
                  required
                  maxLength={MAX_USERNAME_LENGTH}
                  className="w-full pl-11 pr-12 py-3 bg-secondary border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {username.length}/{MAX_USERNAME_LENGTH}
                </span>
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
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('password')}
                required
                className="w-full pl-11 pr-11 py-3 bg-secondary border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {mode === 'signup' && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('confirmPassword')}
                  required
                  className="w-full pl-11 pr-11 py-3 bg-secondary border border-border rounded-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            )}

            {/* Remember me - only for sign-in */}
            {mode === 'signin' && (
              <button
                type="button"
                onClick={() => {
                  const next = !rememberMe;
                  setRememberMe(next);
                  localStorage.setItem('worldquiz_remember_me', next ? 'true' : 'false');
                  if (!next) localStorage.removeItem('worldquiz_saved_email');
                }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
              >
                {rememberMe ? (
                  <CheckSquare className="h-4 w-4 text-primary" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                Remember me
              </button>
            )}

            <Button type="submit" variant="netflix" className="w-full py-6" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (mode === 'signin' ? t('signIn') : t('signUp'))}
            </Button>

            {/* Inline prompt shown when email/password fails — may be a Google-only account */}
            {showSetPasswordPrompt && mode === 'signin' && (
              <div className="flex flex-col gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20 text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-foreground/80 leading-snug">
                    <strong>Sign-in failed.</strong> If you registered with Google and haven't set a password yet, we can send you a link to set one — then you can use both methods.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-9 text-xs"
                    onClick={() => setShowSetPasswordPrompt(false)}
                  >
                    Dismiss
                  </Button>
                  <Button
                    type="button"
                    variant="netflix"
                    className="flex-1 h-9 text-xs"
                    disabled={isSendingReset || !email || resetCooldown > 0}
                    onClick={async () => {
                      if (!auth || !email) return;
                      setIsSendingReset(true);
                      try {
                        await sendPasswordResetEmail(auth, email);
                        addToast('success', 'Password setup email sent! Check your inbox, then come back to sign in with your email.');
                        setResetCooldown(60);
                        setShowSetPasswordPrompt(false);
                      } catch (err: any) {
                        addToast('error', err?.message || 'Failed to send email.');
                      } finally {
                        setIsSendingReset(false);
                      }
                    }}
                  >
                    {isSendingReset ? <Loader2 className="h-3 w-3 animate-spin" /> : resetCooldown > 0 ? `Wait ${resetCooldown}s` : 'Send password setup email'}
                  </Button>
                </div>
              </div>
            )}

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
              disabled={isGoogleLoading}
              onClick={handleGoogleSignIn}
            >
              {isGoogleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {t('signInWithGoogle') || 'Continue with Google'}
            </Button>

            {mode === 'signin' && (
              <button
                type="button"
                className="w-full text-sm text-primary hover:underline"
                onClick={() => setMode('reset')}
              >
                {t('forgotPassword')}
              </button>
            )}
          </form>
        )}

        {/* Footer */}
        {(mode === 'signin' || mode === 'signup') && (
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
        )}
      </div>
    </div>
  );
};
