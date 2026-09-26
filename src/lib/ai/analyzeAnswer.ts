import "server-only";
import { checkAnswer } from "../checkAnswer";
import { misconceptionById, MISCONCEPTIONS } from "../misconceptions";
import { questionById } from "../questions";
import type { Analysis, Question } from "../types";
import { groqChat, isDemoMode, parseJsonLoose } from "./groq";
import { mockAnalyze } from "./mock";
import { ANALYZER_SYSTEM, analyzerUser } from "./prompts";
import { AnalysisSchema, type Source, type TwinContext } from "./schemas";

export class UnknownQuestionError extends Error {}

/**
 * Model output is treated as a *proposal*. We validate its shape, then reconcile
 * it with what we can verify ourselves: correctness comes from the answer key,
 * and misconception ids must exist in the catalog for this concept.
 */
function reconcile(raw: unknown, q: Question, truth: ReturnType<typeof checkAnswer>): Analysis {
  const parsed = AnalysisSchema.parse(raw);
  const correct = truth.correct;
  if (correct) {
    return { ...parsed, isCorrect: true, misconception: null, misconceptionId: null, errorType: "none" };
  }
  const catalogIds = MISCONCEPTIONS.filter((m) => m.conceptId === q.conceptId).map((m) => m.id);
  let id = parsed.misconceptionId && catalogIds.includes(parsed.misconceptionId) ? parsed.misconceptionId : null;
  if (!id && truth.trap) id = truth.trap.misconception;
  const m = id ? misconceptionById(id) : undefined;
  return {
    ...parsed,
    isCorrect: false,
    misconceptionId: m ? m.id : null,
    misconception: m ? m.label : null,
    errorType: parsed.errorType === "none" ? (m?.errorType ?? "careless") : parsed.errorType,
  };
}

export async function analyzeAnswer(input: { questionId: string; answer: string; responseTimeSec: number; context: TwinContext }): Promise<{ analysis: Analysis; source: Source }> {
  const q = questionById(input.questionId);
  if (!q) throw new UnknownQuestionError(input.questionId);
  const truth = checkAnswer(q, input.answer);
  if (!isDemoMode()) {
    try {
      const text = await groqChat({ system: ANALYZER_SYSTEM, user: analyzerUser(q, input.answer, input.context, input.responseTimeSec), json: true, temperature: 0.1, maxTokens: 450 });
      return { analysis: reconcile(parseJsonLoose(text), q, truth), source: "groq" };
    } catch (err) {
      console.warn("[learntwin] Groq analysis unavailable, using DEMO MODE:", err instanceof Error ? err.message : err);
    }
  }
  return { analysis: mockAnalyze(q, truth, input.context), source: "demo" };
}
