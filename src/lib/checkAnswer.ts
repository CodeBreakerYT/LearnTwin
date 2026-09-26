import type { Question } from "./types";

/** Parses "5", "x = 5", "3/4", "0.75", "50%", "-1" into a number. Returns null when unparseable. */
export function parseAnswer(raw: string): number | null {
  let s = raw.trim().toLowerCase().replace(/[−–]/g, "-").replace(/\s+/g, "");
  s = s.replace(/^[a-z]\([a-z0-9]\)=/, "").replace(/^[a-z]=/, "").replace(/[$,]/g, "").replace(/%$/, "");
  s = s.replace(/(km|cm|units?|cups?|eggs?|classes)$/, "");
  const frac = s.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (frac) {
    const d = parseFloat(frac[2]);
    return d === 0 ? null : parseFloat(frac[1]) / d;
  }
  if (/^-?\d+(?:\.\d+)?$/.test(s)) return parseFloat(s);
  return null;
}

export const near = (a: number, b: number) => Math.abs(a - b) <= 0.006 + 0.004 * Math.abs(b);

export type Check = {
  valid: boolean;
  value: number | null;
  correct: boolean;
  trap: { misconception: string; note?: string } | null;
};

export function checkAnswer(q: Question, raw: string): Check {
  const value = parseAnswer(raw);
  if (value === null) return { valid: false, value, correct: false, trap: null };
  if (near(value, q.answer)) return { valid: true, value, correct: true, trap: null };
  const trap = q.traps?.find((t) => near(value, t.value)) ?? null;
  return { valid: true, value, correct: false, trap: trap ? { misconception: trap.misconception, note: trap.note } : null };
}
