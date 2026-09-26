import { CONCEPTS, SUBJECT_ID } from "./curriculum";
import { chooseNormalActivity, ensureConcepts, localDate, recomputeAggregates } from "./engine";
import { questionById } from "./questions";
import { misconceptionById } from "./misconceptions";
import type { ActivityEvent, ConceptState, Difficulty, LearningTwin, MisconceptionRecord, Strategy } from "./types";

const ago = (days: number, hours = 0) => new Date(Date.now() - days * 864e5 - hours * 36e5).toISOString();
const shortDate = (daysAgo: number) => new Date(Date.now() - daysAgo * 864e5).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const cs = (mastery: number, confidence: number, attempts: number, correct: number, recent: boolean[], misconceptions: string[] = [], lastDays = 1): ConceptState => ({
  mastery, confidence, attempts, correct, misconceptions, recentResults: recent, lastAttempt: ago(lastDays),
});

type Spec = [days: number, qid: string, answer: string, correct: boolean, misconception: string | null, rt: number, strategy: Strategy];
const EVENT_SPECS: Spec[] = [
  [6, "fr-3", "3/8", false, "fraction-parts", 24, "example"],
  [6, "fr-3", "11/15", true, null, 31, "visual"],
  [5, "wp-2", "12", false, "word-translation", 29, "example"],
  [5, "wp-3", "14", false, "word-translation", 33, "example"],
  [4, "le-4", "3.8", false, "sign-error", 18, "example"],
  [4, "fn-3", "10", true, null, 13, "example"],
  [3, "le-3", "12", false, "inverse-op", 15, "example"],
  [3, "le-5", "6", true, null, 14, "example"],
  [3, "ra-3", "5", true, null, 21, "example"],
  [2, "pc-5", "15", false, null, 27, "example"],
  [2, "fn-4", "10", true, null, 12, "example"],
  [2, "fr-2", "15", true, null, 11, "example"],
  [2, "pc-4", "30", true, null, 19, "example"],
  [1, "le-5", "10", false, "inverse-op", 17, "example"],
  [1, "ra-4", "25", true, null, 23, "example"],
  [1, "wp-6", "5.5", false, "word-translation", 26, "example"],
  [1, "bg-4", "60", false, null, 22, "example"],
];

function seedEvents(): ActivityEvent[] {
  return EVENT_SPECS.map(([days, qid, answer, correct, m, rt, strategy], i) => {
    const q = questionById(qid)!;
    const mis = m ? misconceptionById(m) : null;
    const base = 0.5 + i * 0.012;
    return {
      id: `seed-ev-${i}`,
      at: ago(days, EVENT_SPECS.length - i),
      conceptId: q.conceptId,
      questionId: qid,
      prompt: q.prompt,
      answer,
      correct,
      misconceptionId: m,
      errorType: correct ? "none" : (mis?.errorType ?? "careless"),
      difficulty: q.difficulty as Difficulty,
      strategy,
      kind: "question",
      responseTimeSec: rt,
      masteryBefore: base,
      masteryAfter: base + (correct ? 0.02 : -0.03),
    };
  });
}

const rec = (id: string, conceptId: string, count: number, firstDays: number, lastDays: number, resolved: boolean): MisconceptionRecord => ({
  id, conceptId, count, firstSeen: ago(firstDays), lastSeen: ago(lastDays), resolved, ...(resolved ? { resolvedAt: ago(lastDays) } : {}),
});

const HISTORY: [number, number, number, number][] = [
  // mastery, accuracy, difficulty(1-4), resolved
  [0.52, 0.55, 2, 0], [0.54, 0.6, 2, 0], [0.55, 0.58, 2, 0], [0.58, 0.64, 2, 0], [0.6, 0.66, 3, 1],
  [0.61, 0.62, 3, 1], [0.63, 0.7, 3, 1], [0.64, 0.68, 4, 1], [0.66, 0.72, 3, 2], [0.66, 0.64, 3, 2],
  [0.68, 0.7, 3, 2], [0.68, 0.66, 3, 2],
];

function base(studentId: string): LearningTwin {
  return {
    studentId,
    overallMastery: 0,
    subjects: { [SUBJECT_ID]: { mastery: 0, confidence: 0, concepts: {} } },
    learningPatterns: {
      preferredExplanation: "example",
      averageResponseTime: 0,
      difficultyPreference: "Easy",
      commonErrorTypes: [],
      errorCounts: {},
      strategyEffectiveness: {
        visual: { tried: 0, helped: 0 },
        example: { tried: 0, helped: 0 },
        "step-by-step": { tried: 0, helped: 0 },
        analogy: { tried: 0, helped: 0 },
      },
    },
    recentActivity: [],
    misconceptionLog: {},
    difficulty: "easy",
    character: "nova",
    xp: 0,
    dayStreak: 0,
    lastActiveDate: "",
    achievements: [],
    history: [],
    baseline: {},
    lessonsSeen: [],
    sessions: [],
    session: { activity: null as never, plan: null, message: "", correctInRow: 0 },
    lastChanges: [],
    createdAt: new Date().toISOString(),
  };
}

export function createBlankTwin(studentId: string): LearningTwin {
  const t = base(studentId);
  for (const c of CONCEPTS) t.subjects[SUBJECT_ID].concepts[c.id] = cs(0, 0, 0, 0, [], [], 0);
  for (const c of CONCEPTS) t.subjects[SUBJECT_ID].concepts[c.id].lastAttempt = "";
  recomputeAggregates(t);
  t.session.activity = chooseNormalActivity(t, null, true, null);
  return t;
}

export function createSeedTwin(studentId: string): LearningTwin {
  const t = base(studentId);
  const c = t.subjects[SUBJECT_ID].concepts;
  c["linear-equations"] = cs(0.84, 0.6, 18, 15, [true, true, false, true, false, true], ["inverse-op"]);
  c["fractions"] = cs(0.78, 0.63, 14, 11, [true, true, false, true, true, true], [], 2);
  c["percentages"] = cs(0.64, 0.57, 12, 8, [false, true, true, false, true, true], [], 2);
  c["ratios"] = cs(0.7, 0.53, 10, 7, [true, true, false, true, true, false], [], 3);
  c["functions"] = cs(0.86, 0.6, 12, 11, [true, true, true, true, false, true], [], 2);
  c["word-problems"] = cs(0.46, 0.48, 9, 4, [false, false, true, false, true, false], ["word-translation"]);
  c["basic-geometry"] = cs(0.5, 0.4, 6, 3, [true, false, false, true, false, true], [], 2);

  t.misconceptionLog = {
    "inverse-op": rec("inverse-op", "linear-equations", 2, 3, 1, false),
    "word-translation": rec("word-translation", "word-problems", 3, 5, 1, false),
    "sign-error": rec("sign-error", "linear-equations", 2, 9, 4, true),
    "fraction-parts": rec("fraction-parts", "fractions", 2, 11, 6, true),
  };
  t.recentActivity = seedEvents();
  t.learningPatterns = {
    preferredExplanation: "example",
    averageResponseTime: 18.4,
    difficultyPreference: "Medium",
    commonErrorTypes: ["procedural", "conceptual", "careless"],
    errorCounts: { procedural: 9, conceptual: 6, careless: 3 },
    strategyEffectiveness: {
      example: { tried: 9, helped: 5 },
      visual: { tried: 3, helped: 1 },
      "step-by-step": { tried: 2, helped: 1 },
      analogy: { tried: 1, helped: 0 },
    },
  };
  t.difficulty = "medium";
  t.xp = 1240;
  t.dayStreak = 6;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  t.lastActiveDate = localDate(y);
  t.achievements = ["calibrated", "first-insight"];
  t.history = HISTORY.map(([mastery, accuracy, difficulty, resolved], i) => ({
    label: shortDate(HISTORY.length - i),
    mastery, accuracy, difficulty, resolved,
  }));
  const S = (days: number, concepts: string[], attempts: number, accuracy: number, xp: number, peak: Difficulty) => ({
    id: `seed-s-${days}`, date: ago(days), concepts, attempts, accuracy, xp, peakDifficulty: peak,
  });
  t.sessions = [
    S(1, ["linear-equations", "word-problems", "basic-geometry"], 9, 0.44, 88, "medium"),
    S(2, ["functions", "percentages"], 8, 0.75, 121, "hard"),
    S(3, ["linear-equations", "ratios"], 10, 0.7, 118, "medium"),
    S(5, ["word-problems", "fractions"], 7, 0.43, 74, "medium"),
    S(6, ["fractions", "ratios"], 9, 0.78, 130, "hard"),
  ];
  ensureConcepts(t);
  t.lessonsSeen = CONCEPTS.filter((c) => c.subject === "mathematics").map((c) => c.id);
  t.baseline = { "linear-equations": 0.72, fractions: 0.61, percentages: 0.5, ratios: 0.58, functions: 0.7, "word-problems": 0.4, "basic-geometry": 0.42 };
  recomputeAggregates(t);

  // The demo opens on a question the Twin already suspects is risky for this learner.
  const q = questionById("le-3")!;
  t.session = {
    plan: null,
    correctInRow: 0,
    message: "",
    activity: {
      id: "seed-activity",
      kind: "question",
      conceptId: q.conceptId,
      questionId: q.id,
      prompt: q.prompt,
      difficulty: "medium",
      hint: q.hint,
      expectedSkill: q.expectedSkill,
      strategy: "example",
      misconceptionId: null,
      reasons: [
        "Linear Equations: mastery 84%, recent accuracy 67%. Holding at Medium.",
        "“Incorrect inverse operation” is active (seen 2 times), so the Twin is probing this exact skill.",
        "Word Problems (46%) is queued next, as your weakest unlocked concept.",
      ],
      generatedBy: "engine",
    },
  };
  return t;
}
