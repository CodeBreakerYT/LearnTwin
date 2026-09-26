import "server-only";
import { CHARACTERS } from "../characters";
import { conceptName } from "../curriculum";
import { misconceptionById } from "../misconceptions";
import { voiceLine } from "../voice";
import { groqChat, isDemoMode } from "./groq";
import { tutorSystem } from "./prompts";
import type { Source, TutorRequest } from "./schemas";

const pct = (n: number) => `${Math.round(n * 100)}%`;

export function mockTutor(req: TutorRequest) {
  const m = req.misconceptionId ? misconceptionById(req.misconceptionId) : undefined;
  return voiceLine(req.characterId, req.situation, {
    concept: conceptName(req.conceptId),
    mastery: pct(req.mastery),
    pattern: m?.patternSummary ?? "the same slip keeps coming back",
    strategy: req.strategy === "step-by-step" ? "step-by-step" : req.strategy,
    misconception: m?.label ?? "this misconception",
    count: req.misconceptionCount ?? 0,
    detail: req.analysisExplanation ?? "",
  });
}

/** Character voice for feedback and explanations. The intelligence is the Twin; this is its voice. */
export async function tutorMessage(req: TutorRequest): Promise<{ message: string; source: Source }> {
  if (!isDemoMode()) {
    try {
      const c = CHARACTERS[req.characterId];
      const m = req.misconceptionId ? misconceptionById(req.misconceptionId) : undefined;
      const user = JSON.stringify({
        situation: req.situation,
        concept: conceptName(req.conceptId),
        masteryPercent: Math.round(req.mastery * 100),
        teachingStrategy: req.strategy,
        difficulty: req.difficulty,
        misconception: m ? { label: m.label, patternSummary: m.patternSummary, repeatedTimes: req.misconceptionCount ?? 0 } : null,
        analysisNote: req.analysisExplanation ?? null,
        recentMistakes: req.recentMistakes,
        guidance: {
          intro: "Welcome the student to a new question in one or two sentences.",
          correct: "Acknowledge correct reasoning briefly and hint at what comes next.",
          wrong: "Treat the mistake as information. Point at the likely cause using the analysis note. Say an easier one is next.",
          pattern: "Say kindly that you noticed a pattern in how the student is thinking, name it, and say you will show it again with a picture. Do not quiz.",
          "guided-done": "Praise the guided step and say a re-test without scaffolding is next.",
          "guided-retry": "Reassure the student and say you will explain it a different way using the given strategy.",
          "retest-failed": "Reassure the student, say the misconception is still active and you will try the given strategy.",
          resolved: "Say the re-test went well so you will mark the misconception resolved for now and keep watching. Do not overclaim.",
        }[req.situation],
        speakAs: c.name,
      });
      const text = (await groqChat({ system: tutorSystem(req.characterId), user, temperature: 0.5, maxTokens: 140, timeoutMs: 7000 })).trim().replace(/^["“]|["”]$/g, "");
      if (text.length >= 8 && text.length <= 400) return { message: text, source: "groq" };
    } catch (err) {
      console.warn("[learntwin] Groq tutor unavailable, using DEMO MODE:", err instanceof Error ? err.message : err);
    }
  }
  return { message: mockTutor(req), source: "demo" };
}
