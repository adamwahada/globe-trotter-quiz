/**
 * Utility to get the current Firebase user's ID token
 * for authenticating edge function requests.
 */
import { auth } from '@/lib/firebase';

export const getFirebaseIdToken = async (): Promise<string | null> => {
  try {
    const user = auth?.currentUser;
    if (!user) return null;
    // getIdToken(false) returns cached token, auto-refreshes if expired
    return await user.getIdToken(false);
  } catch (error) {
    console.error('Failed to get Firebase ID token:', error);
    return null;
  }
};
