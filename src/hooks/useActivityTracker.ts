/**
 * Tracks user activity and automatically logs out after 6 hours of inactivity.
 * Activity is refreshed on any user interaction (clicks, keys, scrolls, etc.).
 * The timer is based on the LAST time the user interacted with the website.
 */
import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const INACTIVITY_TIMEOUT_MS = 6 * 60 * 60 * 1000; // 6 hours
const CHECK_INTERVAL_MS = 60 * 1000; // Check every minute
const THROTTLE_MS = 30 * 1000; // Throttle localStorage writes to every 30 seconds
export const ACTIVITY_STORAGE_KEY = 'worldquiz_last_activity';

export const useActivityTracker = () => {
  const { isAuthenticated, signOut } = useAuth();
  const lastWriteRef = useRef(0);

  const updateActivity = useCallback(() => {
    const now = Date.now();
    // Throttle writes to avoid excessive localStorage access
    if (now - lastWriteRef.current > THROTTLE_MS) {
      localStorage.setItem(ACTIVITY_STORAGE_KEY, now.toString());
      lastWriteRef.current = now;
    }
  }, []);

  const checkInactivity = useCallback(() => {
    if (!isAuthenticated) return;

    const lastActivity = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!lastActivity) return;

    const elapsed = Date.now() - parseInt(lastActivity, 10);
    if (elapsed >= INACTIVITY_TIMEOUT_MS) {
      console.warn('[Security] Session expired due to 6h inactivity. Logging out...');
      signOut();
    }
  }, [isAuthenticated, signOut]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Record activity on mount (user just logged in or refreshed)
    updateActivity();

    // Listen for user interactions
    const events = ['click', 'keydown', 'scroll', 'mousemove', 'touchstart'];
    events.forEach(event =>
      window.addEventListener(event, updateActivity, { passive: true })
    );

    // Periodically check for inactivity
    const interval = setInterval(checkInactivity, CHECK_INTERVAL_MS);

    // Also check when user returns to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
        if (isAuthenticated) updateActivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, updateActivity, checkInactivity]);
};
