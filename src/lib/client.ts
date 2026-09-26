import { CONCEPTS, conceptName } from "./curriculum";
import { conceptOf, recentMistakes } from "./engine";
import { misconceptionLabel } from "./misconceptions";
import type { TwinContext } from "./ai/schemas";
import type { LearningTwin } from "./types";

/** Compact learner summary sent to the server-side AI routes. No PII: only learning state. */
export function buildContext(t: LearningTwin): TwinContext {
  const mastery: Record<string, number> = {};
  for (const c of CONCEPTS) mastery[c.name] = Math.round(conceptOf(t, c.id).mastery * 100) / 100;
  // Server-side prompt uses concept ids too so the mock can look up mastery by id.
  for (const c of CONCEPTS) mastery[c.id] = Math.round(conceptOf(t, c.id).mastery * 100) / 100;
  const counts: Record<string, number> = {};
  for (const m of Object.values(t.misconceptionLog)) if (!m.resolved) counts[m.id] = m.count;
  return {
    overall: t.overallMastery,
    mastery,
    recentMistakes: recentMistakes(t, undefined, 5).map((e) => `${conceptName(e.conceptId)}: ${e.prompt} → ${e.answer}${e.misconceptionId ? ` (${misconceptionLabel(e.misconceptionId)})` : ""}`.slice(0, 140)),
    misconceptionCounts: counts,
    preferredStrategy: t.learningPatterns.preferredExplanation,
    averageResponseTime: t.learningPatterns.averageResponseTime,
  };
}

export async function postJson<T>(url: string, body: unknown, timeoutMs = 15000): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return (await res.json()) as T;
}
