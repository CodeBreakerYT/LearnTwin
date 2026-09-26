"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { GoogleAuthProvider, createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut as fbSignOut, type User } from "firebase/auth";
import { firebaseAuth, firebaseConfigured } from "@/lib/firebase";

type Ctx = {
  user: User | null;
  /** False until Firebase has told us whether someone is signed in. */
  ready: boolean;
  /** False when Firebase is not configured (guest-only mode). */
  enabled: boolean;
  google: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!firebaseConfigured) {
      // No Firebase config: run as a guest instead of failing.
      const id = setTimeout(() => setReady(true), 0);
      return () => clearTimeout(id);
    }
    return onAuthStateChanged(firebaseAuth(), (u) => {
      setUser(u);
      setReady(true);
    });
  }, []);

  const value: Ctx = {
    user,
    ready,
    enabled: firebaseConfigured,
    google: async () => void (await signInWithPopup(firebaseAuth(), new GoogleAuthProvider())),
    signIn: async (e, p) => void (await signInWithEmailAndPassword(firebaseAuth(), e, p)),
    signUp: async (e, p) => void (await createUserWithEmailAndPassword(firebaseAuth(), e, p)),
    signOut: () => fbSignOut(firebaseAuth()),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}

/** Turns Firebase error codes into short, friendly messages. */
export function authMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code.includes("popup-closed") || code.includes("cancelled-popup")) return "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) return "That email or password does not match.";
  if (code.includes("email-already-in-use")) return "That email already has an account. Try signing in.";
  if (code.includes("weak-password")) return "Use at least 6 characters for your password.";
  if (code.includes("invalid-email")) return "That email does not look right.";
  if (code.includes("too-many-requests")) return "Too many tries. Please wait a moment.";
  if (code.includes("unauthorized-domain")) return "This website address is not allowed for sign-in yet.";
  if (code.includes("network")) return "Cannot reach the network. Check your connection.";
  return "Something went wrong. Please try again.";
}
