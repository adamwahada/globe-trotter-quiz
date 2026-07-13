import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  signInAnonymously,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
  FirebaseUser
} from '@/lib/firebase';
import { trackUserPresence, subscribeToUserPresence, clearUserPresence } from '@/services/gameSessionService';
import { translations } from '@/i18n/translations';
import { useToastContext } from './ToastContext';
import { checkUserBan } from '@/utils/banUtils';


export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string;
  color: string;
  stats: {
    totalGames: number;
    wins: number;
    avgScore: number;
  };
  isGuest?: boolean;
  guestExpiresAt?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  guestTimeRemaining: number | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInAsGuest: (username: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => void;
  tabSessionId: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const avatars = ['🦁', '🐯', '🐘', '🦒', '🦊', '🐨', '🐼', '🦓', '🦄', '🐲', '🐙', '🐢', '🐧', '🦉'];
const colors = ['#E50914', '#1DB954', '#4169E1', '#FF6B35', '#9B59B6', '#00CED1', '#F1C40F', '#E67E22'];

const INACTIVITY_TIMEOUT_MS = 6 * 60 * 60 * 1000;
const ACTIVITY_STORAGE_KEY = 'worldquiz_last_activity';
const PENDING_SIGNUP_USERNAME_KEY = 'worldquiz_pending_signup_username';
const GUEST_SESSION_KEY = 'worldquiz_guest_session';
const GUEST_DURATION_MS = 4 * 60 * 60 * 1000;

const mapFirebaseUser = (firebaseUser: FirebaseUser): User => {
  const storedData = localStorage.getItem(`user_${firebaseUser.uid}`);
  let parsedData: any = {};
  if (storedData) {
    try { parsedData = JSON.parse(storedData); } catch { parsedData = {}; }
  }
  const pendingSignupUsername = localStorage.getItem(PENDING_SIGNUP_USERNAME_KEY)?.trim();

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    username:
      parsedData.username?.trim() ||
      pendingSignupUsername ||
      firebaseUser.displayName ||
      firebaseUser.email?.split('@')[0] ||
      'Player',
    avatar: parsedData.avatar || avatars[Math.floor(Math.random() * avatars.length)],
    color: parsedData.color || colors[Math.floor(Math.random() * colors.length)],
    stats: parsedData.stats || { totalGames: 0, wins: 0, avgScore: 0 },
  };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [guestTimeRemaining, setGuestTimeRemaining] = useState<number | null>(null);
  const { addToast } = useToastContext();

  const tabSessionIdRef = useRef<string>(Math.random().toString(36).substring(2, 15) + Date.now().toString(36));
  const presenceUnsubscribeRef = useRef<(() => void) | null>(null);
  const presenceRegisteredRef = useRef<boolean>(false);

  // Restore guest session on mount — ensure Firebase anonymous auth is active
  useEffect(() => {
    const storedGuest = localStorage.getItem(GUEST_SESSION_KEY);
    if (storedGuest && auth) {
      try {
        const guest = JSON.parse(storedGuest) as User;
        if (guest.guestExpiresAt && guest.guestExpiresAt > Date.now()) {
          setUser(guest);
          // Ensure Firebase anonymous auth is active for this guest
          if (!auth.currentUser) {
            signInAnonymously(auth).then((cred) => {
              // Update guest ID to match Firebase uid if it was a legacy random ID
              if (guest.id !== cred.user.uid) {
                const updatedGuest = { ...guest, id: cred.user.uid };
                setUser(updatedGuest);
                localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(updatedGuest));
                localStorage.setItem(`user_${cred.user.uid}`, JSON.stringify({
                  username: guest.username,
                  avatar: guest.avatar,
                  color: guest.color,
                  stats: guest.stats,
                }));
              }
            }).catch(() => {
              // Anonymous auth failed — clear guest session
              localStorage.removeItem(GUEST_SESSION_KEY);
              setUser(null);
            });
          }
        } else {
          localStorage.removeItem(GUEST_SESSION_KEY);
        }
      } catch {
        localStorage.removeItem(GUEST_SESSION_KEY);
      }
    }
  }, []);

  // Guest countdown timer
  useEffect(() => {
    if (!user?.isGuest || !user.guestExpiresAt) {
      setGuestTimeRemaining(null);
      return;
    }
    const tick = () => {
      const remaining = (user.guestExpiresAt || 0) - Date.now();
      if (remaining <= 0) {
        setGuestTimeRemaining(0);
        setUser(null);
        localStorage.removeItem(GUEST_SESSION_KEY);
        if (auth) firebaseSignOut(auth).catch(() => {});
        addToast('info', 'Your guest session has expired. Create an account to keep playing!', 10000);
      } else {
        setGuestTimeRemaining(remaining);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [user?.isGuest, user?.guestExpiresAt, addToast]);

  // Firebase auth state
  useEffect(() => {
    if (!auth) {
      console.error('Firebase auth not initialized');
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if this is a guest (anonymous) user with an active guest session
        const storedGuest = localStorage.getItem(GUEST_SESSION_KEY);
        if (firebaseUser.isAnonymous && storedGuest) {
          try {
            const guest = JSON.parse(storedGuest) as User;
            if (guest.guestExpiresAt && guest.guestExpiresAt > Date.now()) {
              // Keep the guest user — don't override with mapFirebaseUser
              setUser(guest);
              setIsLoading(false);
              return;
            }
          } catch { /* invalid stored guest, continue normally */ }
        }

        // Not a guest — clear any stale guest session
        localStorage.removeItem(GUEST_SESSION_KEY);

        const lastActivity = localStorage.getItem(ACTIVITY_STORAGE_KEY);
        if (lastActivity) {
          const elapsed = Date.now() - parseInt(lastActivity, 10);
          if (elapsed >= INACTIVITY_TIMEOUT_MS) {
            await firebaseSignOut(auth!);
            setUser(null);
            setIsLoading(false);
            localStorage.removeItem(ACTIVITY_STORAGE_KEY);
            return;
          }
        }

        const mappedUser = mapFirebaseUser(firebaseUser);
        setUser(mappedUser);
        localStorage.setItem(ACTIVITY_STORAGE_KEY, Date.now().toString());

        presenceRegisteredRef.current = false;
        await trackUserPresence(firebaseUser.uid, tabSessionIdRef.current);
        presenceRegisteredRef.current = true;

        if (presenceUnsubscribeRef.current) presenceUnsubscribeRef.current();
        presenceUnsubscribeRef.current = subscribeToUserPresence(firebaseUser.uid, (presence) => {
          if (!presenceRegisteredRef.current) return;
          if (presence && presence.sessionId !== tabSessionIdRef.current) {
            const lang = (localStorage.getItem('worldquiz_language') || 'en') as 'en' | 'fr' | 'ar';
            addToast('error', translations[lang].sessionConflictDesc, 10000);
            signOut();
          }
        });

        localStorage.setItem(`user_${firebaseUser.uid}`, JSON.stringify({
          username: mappedUser.username,
          avatar: mappedUser.avatar,
          color: mappedUser.color,
          stats: mappedUser.stats,
        }));
      } else {
        setUser(prev => prev?.isGuest ? prev : null);
        localStorage.removeItem(ACTIVITY_STORAGE_KEY);
        presenceRegisteredRef.current = false;
        if (presenceUnsubscribeRef.current) {
          presenceUnsubscribeRef.current();
          presenceUnsubscribeRef.current = null;
        }
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      if (presenceUnsubscribeRef.current) presenceUnsubscribeRef.current();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase not initialized');
    localStorage.removeItem(GUEST_SESSION_KEY);
    setIsLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const ban = await checkUserBan(credential.user.uid);
      if (ban && ban.ban_type === 'permanent') {
        await firebaseSignOut(auth);
        throw new Error('PERMANENTLY_BANNED');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    if (!auth) throw new Error('Firebase not initialized');
    localStorage.removeItem(GUEST_SESSION_KEY);
    setIsLoading(true);
    const normalizedUsername = username.trim();
    localStorage.setItem(PENDING_SIGNUP_USERNAME_KEY, normalizedUsername);
    try {
      const avatar = avatars[Math.floor(Math.random() * avatars.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);

      localStorage.setItem(`user_${firebaseUser.uid}`, JSON.stringify({
        username: normalizedUsername, avatar, color,
        stats: { totalGames: 0, wins: 0, avgScore: 0 },
      }));
      await firebaseUpdateProfile(firebaseUser, { displayName: normalizedUsername });
      setUser(mapFirebaseUser(firebaseUser));
      await supabase
        .from('usernames')
        .upsert({ user_id: firebaseUser.uid, username: normalizedUsername }, { onConflict: 'user_id' });
      localStorage.removeItem(PENDING_SIGNUP_USERNAME_KEY);
    } catch (error) {
      localStorage.removeItem(PENDING_SIGNUP_USERNAME_KEY);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInAsGuest = useCallback(async (username: string) => {
    if (!auth) throw new Error('Firebase not initialized');
    const trimmed = username.trim();

    // Check uniqueness against registered usernames
    const { data: existingUsername } = await supabase
      .from('usernames')
      .select('id')
      .ilike('username', trimmed)
      .maybeSingle();

    if (existingUsername) {
      throw new Error('This username is already taken by a registered player. Please choose another.');
    }

    // Sign in anonymously to get a real Firebase auth uid
    const credential = await signInAnonymously(auth);
    const firebaseUid = credential.user.uid;

    const guestUser: User = {
      id: firebaseUid,
      email: '',
      username: trimmed,
      avatar: avatars[Math.floor(Math.random() * avatars.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      stats: { totalGames: 0, wins: 0, avgScore: 0 },
      isGuest: true,
      guestExpiresAt: Date.now() + GUEST_DURATION_MS,
    };

    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(guestUser));
    localStorage.setItem(`user_${firebaseUid}`, JSON.stringify({
      username: trimmed,
      avatar: guestUser.avatar,
      color: guestUser.color,
      stats: guestUser.stats,
    }));
    setUser(guestUser);
    addToast('info', `Welcome ${trimmed}! You have 4 hours to play as a guest. Create an account to save your progress.`, 8000);
  }, [addToast]);

  const signOut = async () => {
    if (user?.isGuest) {
      localStorage.removeItem(GUEST_SESSION_KEY);
      setUser(null);
      // Also sign out of Firebase anonymous auth
      if (auth) await firebaseSignOut(auth).catch(() => {});
      return;
    }
    if (!auth) return;
    try {
      if (user?.id) await clearUserPresence(user.id);
      localStorage.removeItem(ACTIVITY_STORAGE_KEY);
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      if (user.isGuest) {
        localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(updatedUser));
      } else {
        localStorage.setItem(`user_${user.id}`, JSON.stringify({
          username: updatedUser.username,
          avatar: updatedUser.avatar,
          color: updatedUser.color,
          stats: updatedUser.stats,
        }));
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isGuest: !!user?.isGuest,
      isLoading,
      guestTimeRemaining,
      signIn,
      signUp,
      signOut,
      signInAsGuest,
      updateProfile,
      tabSessionId: tabSessionIdRef.current,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};