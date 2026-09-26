import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firestore } from "../firebase";
import type { LearningTwin } from "../types";

/**
 * Persistence for the Learning Twin.
 *  - Signed-in learners: Firestore document `users/{uid}` (private to that user via security rules).
 *  - Guests: the browser's localStorage, so the app works with zero setup.
 * Only learning state is stored; no name, email or other personal data goes into the twin.
 */
export interface TwinRepository {
  load(): Promise<LearningTwin | null>;
  save(twin: LearningTwin): Promise<void>;
}

const TWIN_KEY = "learntwin.twin.v1";
const ID_KEY = "learntwin.student.v1";

const safe = <T,>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

/** Anonymous id for guests. */
export const guestId = (): string =>
  safe(() => {
    let id = localStorage.getItem(ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ID_KEY, id);
    }
    return id;
  }, "guest");

class LocalRepository implements TwinRepository {
  async load() {
    return safe(() => {
      const raw = localStorage.getItem(TWIN_KEY);
      return raw ? (JSON.parse(raw) as LearningTwin) : null;
    }, null);
  }
  async save(twin: LearningTwin) {
    safe(() => localStorage.setItem(TWIN_KEY, JSON.stringify(twin)), undefined);
  }
}

class FirestoreRepository implements TwinRepository {
  private warned = false;
  constructor(private uid: string, private local: LocalRepository) {}

  async load() {
    try {
      const snap = await getDoc(doc(firestore(), "users", this.uid));
      const raw = snap.data()?.twin as string | undefined;
      return raw ? (JSON.parse(raw) as LearningTwin) : null;
    } catch (e) {
      this.warn(e);
      return null;
    }
  }

  async save(twin: LearningTwin) {
    try {
      // Stored as a JSON string: Firestore rejects `undefined` values, and the twin is read and written whole.
      await setDoc(doc(firestore(), "users", this.uid), { twin: JSON.stringify(twin), overallMastery: twin.overallMastery, xp: twin.xp, updatedAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      this.warn(e);
      await this.local.save(twin); // never lose progress if the cloud write fails
    }
  }

  private warn(e: unknown) {
    if (this.warned) return;
    this.warned = true;
    console.warn("[learntwin] Firestore unavailable, using local storage:", e instanceof Error ? e.message : e);
  }
}

const local = new LocalRepository();
export const getLocalRepository = (): TwinRepository => local;
export const getRepository = (uid: string | null): TwinRepository => (uid ? new FirestoreRepository(uid, local) : local);
