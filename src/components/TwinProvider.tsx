"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ensureConcepts, stats } from "@/lib/engine";
import { getLocalRepository, getRepository, guestId } from "@/lib/repo";
import { createBlankTwin, createSeedTwin } from "@/lib/seed";
import type { Source } from "@/lib/ai/schemas";
import type { LearningTwin } from "@/lib/types";
import { useAuth } from "./AuthProvider";

type Status = { demo: boolean; model: string | null };

type Ctx = {
  twin: LearningTwin | null;
  update: (fn: (t: LearningTwin) => LearningTwin) => LearningTwin | null;
  resetDemo: () => void;
  resetBlank: () => void;
  status: Status | null;
  /** True when responses come from the deterministic demo engine instead of Groq. */
  demoActive: boolean;
  noteSource: (s: Source) => void;
};

const TwinContext = createContext<Ctx | null>(null);

const valid = (t: LearningTwin | null): t is LearningTwin => Boolean(t && t.session?.activity && t.subjects?.mathematics);

export function TwinProvider({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const [twin, setTwin] = useState<LearningTwin | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [lastSource, setLastSource] = useState<Source | null>(null);
  const ref = useRef<LearningTwin | null>(null);
  const uidRef = useRef<string | null>(null);
  const uid = user?.uid ?? null;

  // Load the right twin whenever the signed-in learner changes.
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    uidRef.current = uid;
    (async () => {
      const repo = getRepository(uid);
      let t = await repo.load();
      if (!valid(t)) {
        // First sign-in: carry over anything the learner already did as a guest.
        const guest = uid ? await getLocalRepository().load() : null;
        t = valid(guest) && stats(guest).totalAttempts > 0 ? { ...guest, studentId: uid! } : createBlankTwin(uid ?? guestId());
        await repo.save(t);
      }
      ensureConcepts(t);
      if (cancelled) return;
      ref.current = t;
      setTwin(t);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, uid]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((s: Status) => !cancelled && setStatus(s))
      .catch(() => !cancelled && setStatus({ demo: true, model: null }));
    return () => {
      cancelled = true;
    };
  }, []);

  const commit = useCallback((next: LearningTwin) => {
    ref.current = next;
    setTwin(next);
    void getRepository(uidRef.current).save(next);
  }, []);

  const update = useCallback(
    (fn: (t: LearningTwin) => LearningTwin) => {
      if (!ref.current) return null;
      const next = fn(ref.current);
      commit(next);
      return next;
    },
    [commit],
  );

  const value: Ctx = {
    twin,
    update,
    resetDemo: () => commit(createSeedTwin(uidRef.current ?? guestId())),
    resetBlank: () => commit(createBlankTwin(uidRef.current ?? guestId())),
    status,
    demoActive: Boolean(status?.demo) || lastSource === "demo",
    noteSource: setLastSource,
  };
  return <TwinContext.Provider value={value}>{children}</TwinContext.Provider>;
}

export function useTwin() {
  const c = useContext(TwinContext);
  if (!c) throw new Error("useTwin must be used inside TwinProvider");
  return c;
}
