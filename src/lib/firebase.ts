import { initializeApp, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, update, remove, get, push, onDisconnect, Database, DatabaseReference } from 'firebase/database';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  Auth,
  User as FirebaseUser
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAbGN1Bx9i9685A5sMgZSaVBfgPthO6JR4",
  authDomain: "lovable-quiz-map.firebaseapp.com",
  databaseURL: "https://lovable-quiz-map-default-rtdb.firebaseio.com",
  projectId: "lovable-quiz-map",
  storageBucket: "lovable-quiz-map.firebasestorage.app",
  messagingSenderId: "834594629478",
  appId: "1:834594629478:web:ff4d7f68f902ec9896caa7",
  measurementId: "G-WLSR0BQ5FV"
};

let app: FirebaseApp | null = null;
let database: Database | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let initPromise: Promise<void> | null = null;

// Lazy initialization - only init Firebase when first needed
const initFirebase = (): Promise<void> => {
  if (initPromise) return initPromise;
  
  initPromise = new Promise((resolve) => {
    // Use requestIdleCallback or setTimeout to defer initialization
    const init = () => {
      try {
        if (!app) {
          app = initializeApp(firebaseConfig);
          database = getDatabase(app);
          auth = getAuth(app);
          googleProvider = new GoogleAuthProvider();
        }
        resolve();
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        resolve();
      }
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(init, { timeout: 2000 });
    } else {
      setTimeout(init, 100);
    }
  });

  return initPromise;
};

// Start initialization after initial paint
if (typeof window !== 'undefined') {
  // Defer Firebase init to after LCP
  if (document.readyState === 'complete') {
    initFirebase();
  } else {
    window.addEventListener('load', () => {
      initFirebase();
    }, { once: true });
  }
}

// Getters that ensure initialization
export const getFirebaseAuth = async (): Promise<Auth | null> => {
  await initFirebase();
  return auth;
};

export const getFirebaseDatabase = async (): Promise<Database | null> => {
  await initFirebase();
  return database;
};

export const getGoogleProvider = async (): Promise<GoogleAuthProvider | null> => {
  await initFirebase();
  return googleProvider;
};

// Synchronous exports for backward compatibility (may be null initially)
export {
  database,
  auth,
  googleProvider,
  ref,
  set,
  onValue,
  update,
  remove,
  get,
  push,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  onDisconnect
};
export type { DatabaseReference, FirebaseUser, Auth };
export const isFirebaseReady = () => database !== null && auth !== null;
export { initFirebase };
