import { initializeApp, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, update, remove, get, push, Database, DatabaseReference } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | null = null;
let database: Database | null = null;

// Only initialize Firebase if we have the required config
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.databaseURL && firebaseConfig.projectId;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
  }
} else {
  console.warn('Firebase not configured. Please add Firebase secrets.');
}

export { database, ref, set, onValue, update, remove, get, push };
export type { DatabaseReference };
export const isFirebaseReady = () => database !== null;
