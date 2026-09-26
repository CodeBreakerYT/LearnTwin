export type Difficulty = "guided" | "easy" | "medium" | "hard";
export const DIFFICULTIES: Difficulty[] = ["guided", "easy", "medium", "hard"];

export type Strategy = "visual" | "example" | "step-by-step" | "analogy";
export const STRATEGIES: Strategy[] = ["visual", "example", "step-by-step", "analogy"];

export type ErrorType = "procedural" | "conceptual" | "careless" | "none";
export type CharacterId = "nova" | "byte" | "atlas";
export type ActivityKind = "question" | "explain" | "guided" | "retest";
export type ConceptStatus = "mastered" | "developing" | "weak" | "locked";

export type Trap = { value: number; misconception: string; note?: string };

export type Question = {
  id: string;
  conceptId: string;
  prompt: string;
  answer: number;
  difficulty: Difficulty;
  hint: string;
  expectedSkill: string;
  solution: string;
  traps?: Trap[];
  /** Guided items carry a worked scaffold shown next to the input. */
  scaffold?: string[];
};

export type Misconception = {
  id: string;
  conceptId: string;
  label: string;
  errorType: Exclude<ErrorType, "none" | "careless">;
  description: string;
  /** Short phrase used in the character's "I found a pattern" line. */
  patternSummary: string;
  defaultStrategy: Strategy;
  explanations: Record<Strategy, string>;
  example: { problem: string; steps: string[] };
  guidedQuestionId: string;
};

export type Analysis = {
  isCorrect: boolean;
  confidence: number;
  misconception: string | null;
  misconceptionId: string | null;
  errorType: ErrorType;
  explanation: string;
  recommendedDifficulty: Difficulty;
  recommendedTeachingStrategy: Strategy;
  nextActivity: string;
};

export type ConceptState = {
  mastery: number;
  confidence: number;
  attempts: number;
  correct: number;
  misconceptions: string[];
  lastAttempt: string;
  recentResults: boolean[];
};

export type SubjectState = {
  mastery: number;
  confidence: number;
  concepts: Record<string, ConceptState>;
};

export type ActivityEvent = {
  id: string;
  at: string;
  conceptId: string;
  questionId: string;
  prompt: string;
  answer: string;
  correct: boolean;
  misconceptionId: string | null;
  errorType: ErrorType;
  difficulty: Difficulty;
  strategy: Strategy;
  kind: ActivityKind;
  responseTimeSec: number;
  masteryBefore: number;
  masteryAfter: number;
};

export type MisconceptionRecord = {
  id: string;
  conceptId: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  resolved: boolean;
  resolvedAt?: string;
};

export type LearningPatterns = {
  preferredExplanation: Strategy;
  averageResponseTime: number;
  difficultyPreference: string;
  commonErrorTypes: string[];
  errorCounts: Record<string, number>;
  strategyEffectiveness: Record<Strategy, { tried: number; helped: number }>;
};

export type HistoryPoint = {
  label: string;
  mastery: number;
  accuracy: number;
  difficulty: number;
  resolved: number;
};

export type SessionRecord = {
  id: string;
  date: string;
  concepts: string[];
  attempts: number;
  accuracy: number;
  xp: number;
  peakDifficulty: Difficulty;
  live?: boolean;
};

export type Activity = {
  id: string;
  kind: ActivityKind;
  conceptId: string;
  questionId?: string;
  prompt: string;
  difficulty: Difficulty;
  hint: string;
  expectedSkill: string;
  strategy: Strategy;
  scaffold?: string[];
  autoHint?: boolean;
  misconceptionId?: string | null;
  explain?: { title: string; body: string; example: { problem: string; steps: string[] } };
  reasons: string[];
  generatedBy: "engine" | "ai";
};

export type RemediationPlan = {
  misconceptionId: string;
  conceptId: string;
  stage: "explain" | "guided" | "retest";
  strategiesTried: Strategy[];
  rounds: number;
  failedQuestionId: string;
};

export type SessionState = {
  activity: Activity;
  plan: RemediationPlan | null;
  message: string;
  correctInRow: number;
};

export type TwinChange = {
  kind: "mastery" | "confidence" | "misconception" | "resolved" | "strategy" | "difficulty" | "unlock" | "achievement" | "xp";
  label: string;
  from?: string;
  to?: string;
  tone: "up" | "down" | "neutral";
};

export type LearningTwin = {
  studentId: string;
  overallMastery: number;
  subjects: Record<string, SubjectState>;
  learningPatterns: LearningPatterns;
  recentActivity: ActivityEvent[];

  misconceptionLog: Record<string, MisconceptionRecord>;
  difficulty: Difficulty;
  character: CharacterId;
  xp: number;
  dayStreak: number;
  lastActiveDate: string;
  achievements: string[];
  history: HistoryPoint[];
  /** Concept mastery when the profile started, used to show what has improved. */
  baseline: Record<string, number>;
  sessions: SessionRecord[];
  session: SessionState;
  lastChanges: TwinChange[];
  createdAt: string;
};
