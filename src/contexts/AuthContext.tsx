import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
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
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => void;
  tabSessionId: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Placeholder avatars and colors
const avatars = ['🦁', '🐯', '🐘', '🦒', '🦊', '🐨', '🐼', '🦓', '🦄', '🐲', '🐙', '🐢', '🐧', '🦉'];
const colors = ['#E50914', '#1DB954', '#4169E1', '#FF6B35', '#9B59B6', '#00CED1', '#F1C40F', '#E67E22'];

// 6 hours inactivity timeout for session expiry
const INACTIVITY_TIMEOUT_MS = 6 * 60 * 60 * 1000;
const ACTIVITY_STORAGE_KEY = 'worldquiz_last_activity';
const PENDING_SIGNUP_USERNAME_KEY = 'worldquiz_pending_signup_username';

// Convert Firebase user to our User type
const mapFirebaseUser = (firebaseUser: FirebaseUser): User => {
  // Try to get stored user data from localStorage
  const storedData = localStorage.getItem(`user_${firebaseUser.uid}`);
  let parsedData: any = {};

  if (storedData) {
    try {
      parsedData = JSON.parse(storedData);
    } catch {
      parsedData = {};
    }
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
    stats: parsedData.stats || {
      totalGames: 0,
      wins: 0,
      avgScore: 0,
    },
  };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToastContext();

  // Unique ID for this specific tab/session instance
  const tabSessionIdRef = useRef<string>(Math.random().toString(36).substring(2, 15) + Date.now().toString(36));
  const presenceUnsubscribeRef = useRef<(() => void) | null>(null);
  // Track if we've registered our presence - only log out on conflicts AFTER we've registered
  const presenceRegisteredRef = useRef<boolean>(false);

  // Listen for auth state changes
  useEffect(() => {
    if (!auth) {
      console.error('Firebase auth not initialized');
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if session expired due to inactivity (6 hours since last use)
        const lastActivity = localStorage.getItem(ACTIVITY_STORAGE_KEY);
        if (lastActivity) {
          const elapsed = Date.now() - parseInt(lastActivity, 10);
          if (elapsed >= INACTIVITY_TIMEOUT_MS) {
            console.warn('[Security] Session expired due to 6h inactivity');
            await firebaseSignOut(auth!);
            setUser(null);
            setIsLoading(false);
            localStorage.removeItem(ACTIVITY_STORAGE_KEY);
            return;
          }
        }

        const mappedUser = mapFirebaseUser(firebaseUser);
        setUser(mappedUser);

        // Update activity timestamp on session restore/login
        localStorage.setItem(ACTIVITY_STORAGE_KEY, Date.now().toString());

        // Reset presence flag before registering
        presenceRegisteredRef.current = false;

        // Register this tab's presence - this will kick out other sessions
        await trackUserPresence(firebaseUser.uid, tabSessionIdRef.current);
        
        // Mark that we've successfully registered our presence
        presenceRegisteredRef.current = true;

        // Start watching for session conflicts (from OTHER devices logging in later)
        if (presenceUnsubscribeRef.current) presenceUnsubscribeRef.current();
        presenceUnsubscribeRef.current = subscribeToUserPresence(firebaseUser.uid, (presence) => {
          // Only act on conflicts AFTER we've registered our presence
          // This prevents the new session from being kicked by its own registration
          if (!presenceRegisteredRef.current) {
            return; // Ignore updates until we're registered
          }

          if (presence && presence.sessionId !== tabSessionIdRef.current) {
            console.warn('[Security] Another device logged in. Logging out this session...');

            // Get current language for toast
            const lang = (localStorage.getItem('worldquiz_language') || 'en') as 'en' | 'fr' | 'ar';
            addToast('error', translations[lang].sessionConflictDesc, 10000);

            // Force logout this (old) session
            signOut();
          }
        });

        // Store user data
        localStorage.setItem(`user_${firebaseUser.uid}`, JSON.stringify({
          username: mappedUser.username,
          avatar: mappedUser.avatar,
          color: mappedUser.color,
          stats: mappedUser.stats,
        }));
      } else {
        setUser(null);
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
      if (presenceUnsubscribeRef.current) {
        presenceUnsubscribeRef.current();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase not initialized');
    setIsLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      // Check for permanent ban after login
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
    setIsLoading(true);

    const normalizedUsername = username.trim();
    localStorage.setItem(PENDING_SIGNUP_USERNAME_KEY, normalizedUsername);

    try {
      const avatar = avatars[Math.floor(Math.random() * avatars.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];

      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);

      // Persist chosen username immediately for this uid
      localStorage.setItem(`user_${firebaseUser.uid}`, JSON.stringify({
        username: normalizedUsername,
        avatar,
        color,
        stats: { totalGames: 0, wins: 0, avgScore: 0 },
      }));

      // Keep Firebase profile aligned with the chosen username
      await firebaseUpdateProfile(firebaseUser, { displayName: normalizedUsername });

      // Force immediate in-app state sync
      setUser(mapFirebaseUser(firebaseUser));

      // Store username for uniqueness checks
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

  const signOut = async () => {
    if (!auth) return;
    try {
      if (user?.id) {
        await clearUserPresence(user.id);
      }
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
      // Persist to localStorage
      localStorage.setItem(`user_${user.id}`, JSON.stringify({
        username: updatedUser.username,
        avatar: updatedUser.avatar,
        color: updatedUser.color,
        stats: updatedUser.stats,
      }));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      signIn,
      signUp,
      signOut,
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
