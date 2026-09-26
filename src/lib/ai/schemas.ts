import { z } from "zod";
import type { Analysis } from "../types";

const difficulty = z.enum(["guided", "easy", "medium", "hard"]);
const strategy = z.enum(["visual", "example", "step-by-step", "analogy"]);

/** What the model is asked to return. Anything else is rejected, never trusted. */
export const AnalysisSchema = z.object({
  isCorrect: z.boolean(),
  confidence: z.number().min(0).max(1),
  misconception: z.string().max(160).nullable().optional(),
  misconceptionId: z.string().max(60).nullable().optional(),
  errorType: z.enum(["procedural", "conceptual", "careless", "none"]),
  explanation: z.string().min(1).max(420),
  recommendedDifficulty: difficulty,
  recommendedTeachingStrategy: strategy,
  nextActivity: z.string().max(80),
});

export const ActivityHintSchema = z.object({
  hint: z.string().min(1).max(220),
  expectedSkill: z.string().min(1).max(120),
});

export const TwinContextSchema = z.object({
  overall: z.number().min(0).max(1),
  mastery: z.record(z.string().max(40), z.number().min(0).max(1)),
  recentMistakes: z.array(z.string().max(140)).max(8),
  misconceptionCounts: z.record(z.string().max(60), z.number().int().min(0).max(999)),
  preferredStrategy: strategy,
  averageResponseTime: z.number().min(0).max(600),
});
export type TwinContext = z.infer<typeof TwinContextSchema>;

export const AnalyzeRequestSchema = z.object({
  questionId: z.string().max(40),
  answer: z.string().trim().min(1).max(40),
  responseTimeSec: z.number().min(0).max(3600),
  context: TwinContextSchema,
});

export const TutorRequestSchema = z.object({
  characterId: z.enum(["nova", "byte", "atlas"]),
  situation: z.enum(["intro", "correct", "wrong", "pattern", "guided-done", "guided-retry", "retest-failed", "resolved"]),
  conceptId: z.string().max(40),
  strategy: strategy,
  difficulty: difficulty,
  mastery: z.number().min(0).max(1),
  misconceptionId: z.string().max(60).nullable().optional(),
  misconceptionCount: z.number().int().min(0).max(999).optional(),
  analysisExplanation: z.string().max(420).optional(),
  recentMistakes: z.array(z.string().max(140)).max(6),
});
export type TutorRequest = z.infer<typeof TutorRequestSchema>;

export const ActivityRequestSchema = z.object({
  questionId: z.string().max(40),
  characterId: z.enum(["nova", "byte", "atlas"]),
  strategy: strategy,
  difficulty: difficulty,
  misconceptionId: z.string().max(60).nullable().optional(),
  recentMistakes: z.array(z.string().max(140)).max(6),
});
export type ActivityRequest = z.infer<typeof ActivityRequestSchema>;

export type Source = "groq" | "demo";
export type AnalysisResponse = { analysis: Analysis; source: Source };
