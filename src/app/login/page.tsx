"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { authMessage, useAuth } from "@/components/AuthProvider";

function LoginForm() {
  const { user, ready, google, signIn, signUp } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get("next") || "/learn";
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ready && user) router.replace(next);
  }, [ready, user, router, next]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(authMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-md place-items-center px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass w-full p-7 sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight">{mode === "in" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-1.5 text-sm text-muted">Save your progress and pick up anywhere.</p>

        <button onClick={() => run(google)} disabled={busy} className="btn btn-ghost mt-6 w-full !py-3">
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.9 2.3 2.8 6.4 2.8 11.5S6.9 20.7 12 20.7c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1.1-.2-1.5H12z" />
          </svg>
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-faint"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(() => (mode === "in" ? signIn(email.trim(), password) : signUp(email.trim(), password)));
          }}
          className="space-y-3"
        >
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email" className="input !text-base" />
          <input type="password" required minLength={6} autoComplete={mode === "in" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" aria-label="Password" className="input !text-base" />
          {error && <p className="text-sm text-danger" role="alert">{error}</p>}
          <button type="submit" disabled={busy} className="btn btn-primary w-full !py-3">
            {busy ? <Loader2 className="size-4 animate-spin" /> : mode === "in" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <button onClick={() => { setMode(mode === "in" ? "up" : "in"); setError(""); }} className="mt-5 w-full text-center text-sm text-muted hover:text-ink">
          {mode === "in" ? "New here? Create an account" : "Have an account? Sign in"}
        </button>
        <Link href="/learn" className="mt-3 block text-center text-xs text-faint hover:text-muted">Continue as guest</Link>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
