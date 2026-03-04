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
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
  OAuthCredential,
  AuthCredential,
  Auth,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
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

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  // Default to session-only persistence — credentials are NOT stored unless "Remember me" is checked
  setPersistence(auth, browserSessionPersistence).catch(() => {});
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
}

export {
  database,
  auth,
  googleProvider,
  GoogleAuthProvider,
  EmailAuthProvider,
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
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  reauthenticateWithCredential,
  updatePassword,
  onDisconnect,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
};
export type { DatabaseReference, FirebaseUser, OAuthCredential, AuthCredential };
export const isFirebaseReady = () => database !== null && auth !== null;
