import { initializeApp, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, update, remove, get, push, Database, DatabaseReference } from 'firebase/database';

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

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
}

export { database, ref, set, onValue, update, remove, get, push };
export type { DatabaseReference };
export const isFirebaseReady = () => database !== null;
