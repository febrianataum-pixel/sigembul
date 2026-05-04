
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDxB7rZ8g6WtPykr5TF8FL3lY0UBUmGKjQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gembul-d9cd3.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gembul-d9cd3",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gembul-d9cd3.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "943366605451",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:943366605451:web:47bbcba8bb1c6fde51228e",
};

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export const isFirebaseConfigured = true; // Set to true as we now have defaults

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Please set VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID in secrets.');
  }
  if (!appInstance) {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  }
  return appInstance;
}

export function getDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getFirebaseApp(), import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || undefined);
  }
  return dbInstance;
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }
  return authInstance;
}

export { firebaseConfig };
