import "server-only";
import { conceptName } from "../curriculum";
import { misconceptionById } from "../misconceptions";
import { questionById } from "../questions";
import type { Difficulty } from "../types";
import { groqChat, isDemoMode, parseJsonLoose } from "./groq";
import { ACTIVITY_SYSTEM } from "./prompts";
import { ActivityHintSchema, type ActivityRequest, type Source } from "./schemas";

export type GeneratedActivity = { question: string; concept: string; difficulty: Difficulty; hint: string; expectedSkill: string };

/**
 * The question itself always comes from the curated bank so its answer key is
 * trustworthy. Groq personalises the *scaffolding* (hint + expected skill) to
 * this learner's history, and its output is rejected if it leaks the answer.
 */
export async function generateActivity(req: ActivityRequest): Promise<{ activity: GeneratedActivity; source: Source } | null> {
  const q = questionById(req.questionId);
  if (!q) return null;
  const base: GeneratedActivity = { question: q.prompt, concept: conceptName(q.conceptId), difficulty: req.difficulty, hint: q.hint, expectedSkill: q.expectedSkill };
  if (isDemoMode()) return { activity: base, source: "demo" };
  try {
    const m = req.misconceptionId ? misconceptionById(req.misconceptionId) : undefined;
    const user = JSON.stringify({ question: q.prompt, concept: base.concept, difficulty: req.difficulty, teachingStrategy: req.strategy, activeMisconception: m?.label ?? null, recentMistakes: req.recentMistakes, defaultHint: q.hint });
    const parsed = ActivityHintSchema.parse(parseJsonLoose(await groqChat({ system: ACTIVITY_SYSTEM, user, json: true, temperature: 0.4, maxTokens: 200, timeoutMs: 7000 })));
    const leaks = new RegExp(`(^|[^\\d.])${String(q.answer).replace(".", "\\.")}([^\\d]|$)`).test(parsed.hint);
    if (leaks) return { activity: base, source: "demo" };
    return { activity: { ...base, ...parsed }, source: "groq" };
  } catch (err) {
    console.warn("[learntwin] Groq activity generation unavailable, using bank scaffolding:", err instanceof Error ? err.message : err);
    return { activity: base, source: "demo" };
  }
}
