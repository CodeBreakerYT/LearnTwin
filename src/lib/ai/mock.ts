import type { Check } from "../checkAnswer";
import { misconceptionById } from "../misconceptions";
import type { Analysis, Question } from "../types";
import type { TwinContext } from "./schemas";

/**
 * Deterministic stand-in for the model, used in DEMO MODE. It reasons from the
 * same evidence a good tutor would: the exact wrong value (answer traps) and the
 * learner's known history. Same input, same output, every time.
 */
export function mockAnalyze(q: Question, truth: Check, ctx: TwinContext): Analysis {
  if (truth.correct) {
    return {
      isCorrect: true,
      confidence: 0.96,
      misconception: null,
      misconceptionId: null,
      errorType: "none",
      explanation: `Correct. ${q.solution}`,
      recommendedDifficulty: (ctx.mastery[q.conceptId] ?? 0.5) >= 0.75 ? "hard" : "medium",
      recommendedTeachingStrategy: ctx.preferredStrategy,
      nextActivity: "advance",
    };
  }

  const known = Object.keys(ctx.misconceptionCounts).find((id) => misconceptionById(id)?.conceptId === q.conceptId && ctx.misconceptionCounts[id] > 0);
  const id = truth.trap?.misconception ?? known ?? null;
  const m = id ? misconceptionById(id) : undefined;

  if (m && id) {
    const repeated = (ctx.misconceptionCounts[id] ?? 0) >= 1;
    const explanation = truth.trap?.note ?? `This answer fits an earlier pattern: ${m.description}`;
    return {
      isCorrect: false,
      confidence: truth.trap ? 0.91 : 0.6,
      misconception: m.label,
      misconceptionId: id,
      errorType: m.errorType,
      explanation,
      recommendedDifficulty: repeated ? "guided" : "easy",
      recommendedTeachingStrategy: m.defaultStrategy,
      nextActivity: repeated ? `guided_${id.replace(/-/g, "_")}` : "easy_practice",
    };
  }

  return {
    isCorrect: false,
    confidence: 0.5,
    misconception: null,
    misconceptionId: null,
    errorType: "careless",
    explanation: `Not quite. ${q.solution} There is no consistent pattern yet, so this may be a slip.`,
    recommendedDifficulty: "easy",
    recommendedTeachingStrategy: ctx.preferredStrategy,
    nextActivity: "easy_practice",
  };
}
