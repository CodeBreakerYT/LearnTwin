import { applyAttempt, type AttemptInput, type AttemptResult } from "../engine";
import { misconceptionById } from "../misconceptions";
import type { LearningTwin } from "../types";
import { AnalysisSchema } from "./schemas";

/**
 * Applies a validated analysis to the Learning Twin. This is deterministic and runs
 * on the client: the model proposes a diagnosis, the engine decides how the Twin
 * changes (mastery, confidence, misconception log, strategy, difficulty, next activity).
 */
export function updateLearningTwin(twin: LearningTwin, input: AttemptInput): AttemptResult {
  const a = AnalysisSchema.safeParse(input.analysis);
  if (!a.success) throw new Error("Refusing to update the Twin with an invalid analysis");
  const id = input.analysis.misconceptionId;
  const analysis = { ...input.analysis, misconceptionId: id && misconceptionById(id) ? id : null };
  return applyAttempt(twin, { ...input, analysis });
}
