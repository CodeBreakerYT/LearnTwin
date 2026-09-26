import type { Question } from "./types";

export type Choice = { label: string; value: string };

/** 3/4 instead of 0.75 when the number is a friendly fraction. */
export function formatNumber(n: number, fractions = true): string {
  if (Number.isInteger(n)) return String(n);
  if (!fractions) return String(Math.round(n * 100) / 100);
  for (let d = 2; d <= 12; d++) {
    const top = n * d;
    if (Math.abs(top - Math.round(top)) < 0.002 && Math.abs(n) < 5) return `${Math.round(top)}/${d}`;
  }
  return String(Math.round(n * 100) / 100);
}

const seeded = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
};

/** Tap-to-choose options: the right answer, the tempting wrong answers the question is built around, plus a filler. */
export function makeChoices(q: Question, salt: string): Choice[] {
  const rnd = seeded(q.id + salt);
  const nums: number[] = [q.answer];
  const near = (a: number, b: number) => Math.abs(a - b) < 0.004 * Math.max(1, Math.abs(b));
  const add = (v: number) => {
    if (Number.isFinite(v) && !nums.some((n) => near(n, v)) && (q.answer < 0 || v >= 0)) nums.push(v);
  };
  for (const t of q.traps ?? []) if (nums.length < 3) add(t.value);
  const fill = [q.answer + 1, q.answer - 1, q.answer * 2, Math.round((q.answer / 2) * 100) / 100, q.answer + 2, q.answer + 5];
  for (const v of fill) if (nums.length < 3) add(v);
  const arr = nums.map((n) => ({ label: formatNumber(n, /\d\s*\/\s*\d|fraction/i.test(q.prompt)), value: String(n) }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
