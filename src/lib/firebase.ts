import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase web config, read from NEXT_PUBLIC_FIREBASE_* environment variables (see .env.example).
 * Nothing is hardcoded in the repository. If the variables are missing, the app still works as a guest.
 */
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

const app = () => (getApps().length ? getApp() : initializeApp(config));
export const firebaseAuth = () => getAuth(app());
export const firestore = () => getFirestore(app());
