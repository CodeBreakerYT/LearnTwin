import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase web config. These values identify the project and are safe to ship to the browser
 * (security comes from Firebase Auth + Firestore rules). Override with NEXT_PUBLIC_FIREBASE_* if needed.
 */
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyBR_P_SjwncSPdbwT222KRPg17Z2om6SJI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "twinai-db821.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "twinai-db821",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "twinai-db821.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "262617986346",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:262617986346:web:d87acb2508b2ba1df61a53",
};

const app = () => (getApps().length ? getApp() : initializeApp(config));
export const firebaseAuth = () => getAuth(app());
export const firestore = () => getFirestore(app());
