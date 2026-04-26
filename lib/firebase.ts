import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

function getFirebaseApp(): FirebaseApp | null {
  if (getApps().length) return getApp();
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return null;
  try {
    return initializeApp({
      apiKey,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });
  } catch {
    return null;
  }
}

const app = getFirebaseApp();

function getSafeFirestore(app: FirebaseApp | null): Firestore {
  if (!app) {
    return new Proxy({} as Firestore, {
      get: () => {
        throw new Error('Firebase not configured');
      },
    });
  }
  return getFirestore(app);
}

function getSafeAuth(app: FirebaseApp | null): Auth {
  if (!app) {
    return new Proxy({} as Auth, {
      get: () => {
        throw new Error('Firebase not configured');
      },
    });
  }
  return getAuth(app);
}

const db = getSafeFirestore(app);
const auth = getSafeAuth(app);

export { db, auth };