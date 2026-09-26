import { CONCEPTS, SUBJECT_ID, conceptById, conceptName } from "./curriculum";
import { CHARACTERS } from "./characters";
import { misconceptionById, misconceptionLabel, misconceptionsFor } from "./misconceptions";
import { questionById, questionsFor } from "./questions";
import {
  DIFFICULTIES,
  STRATEGIES,
  type Activity,
  type Analysis,
  type CharacterId,
  type ConceptState,
  type ConceptStatus,
  type Difficulty,
  type LearningTwin,
  type MisconceptionRecord,
  type RemediationPlan,
  type Strategy,
  type TwinChange,
  type ActivityEvent,
} from "./types";

export const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
export const pct = (n: number) => `${Math.round(n * 100)}%`;
export const diffIndex = (d: Difficulty) => DIFFICULTIES.indexOf(d);
export const strategyLabel = (s: Strategy) => (s === "step-by-step" ? "Step-by-step" : s.charAt(0).toUpperCase() + s.slice(1));
export const difficultyLabel = (d: Difficulty) => d.charAt(0).toUpperCase() + d.slice(1);
export const localDate = (d = new Date()) => d.toLocaleDateString("en-CA");
const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

/* ---------------------------------------------------------------- state */

export const subjectOf = (t: LearningTwin) => t.subjects[SUBJECT_ID];
export const conceptOf = (t: LearningTwin, id: string): ConceptState => subjectOf(t).concepts[id];

export function conceptStatus(t: LearningTwin, id: string): ConceptStatus {
  const def = conceptById(id);
  if (def && def.prereqs.some((p) => conceptOf(t, p).mastery < 0.35)) return "locked";
  const m = conceptOf(t, id).mastery;
  return m >= 0.8 ? "mastered" : m >= 0.55 ? "developing" : "weak";
}

export const missingPrereqs = (t: LearningTwin, id: string) =>
  (conceptById(id)?.prereqs ?? []).filter((p) => conceptOf(t, p).mastery < 0.35);

export function recomputeAggregates(t: LearningTwin) {
  const s = subjectOf(t);
  const cs = CONCEPTS.map((c) => s.concepts[c.id]);
  s.mastery = cs.reduce((a, c) => a + c.mastery, 0) / cs.length;
  s.confidence = cs.reduce((a, c) => a + c.confidence, 0) / cs.length;
  t.overallMastery = s.mastery;
}

export function domainMastery(t: LearningTwin, domainId: string) {
  const cs = CONCEPTS.filter((c) => c.domain === domainId);
  return cs.reduce((a, c) => a + conceptOf(t, c.id).mastery, 0) / cs.length;
}

export const activeMisconceptions = (t: LearningTwin): MisconceptionRecord[] =>
  Object.values(t.misconceptionLog).filter((m) => !m.resolved);

export const resolvedMisconceptions = (t: LearningTwin): MisconceptionRecord[] =>
  Object.values(t.misconceptionLog).filter((m) => m.resolved);

export const recentMistakes = (t: LearningTwin, conceptId?: string, n = 4) =>
  t.recentActivity.filter((e) => !e.correct && (!conceptId || e.conceptId === conceptId)).slice(-n).reverse();

export function stats(t: LearningTwin) {
  const statuses = CONCEPTS.map((c) => ({ id: c.id, status: conceptStatus(t, c.id) }));
  const count = (s: ConceptStatus) => statuses.filter((x) => x.status === s).length;
  return {
    mastered: count("mastered"),
    developing: count("developing"),
    weak: count("weak"),
    locked: count("locked"),
    activeMisconceptions: activeMisconceptions(t).length,
    resolved: resolvedMisconceptions(t).length,
    totalAttempts: CONCEPTS.reduce((a, c) => a + conceptOf(t, c.id).attempts, 0),
  };
}

const LEVELS = ["Explorer", "Apprentice", "Analyst", "Scholar", "Master"];
export function levelInfo(xp: number) {
  const per = 500;
  const level = Math.floor(xp / per) + 1;
  return { level, name: LEVELS[Math.min(level - 1, LEVELS.length - 1)], into: xp % per, per };
}

export const ACHIEVEMENTS: Record<string, { name: string; desc: string }> = {
  "first-insight": { name: "First insight", desc: "Your Twin detected its first misconception" },
  "pattern-breaker": { name: "Pattern breaker", desc: "Resolved a repeated misconception" },
  "hot-streak": { name: "On a roll", desc: "Five correct answers in a row" },
  unlocker: { name: "Path unlocked", desc: "Unlocked a new concept" },
  "deep-mastery": { name: "Deep mastery", desc: "Reached 90% mastery in a concept" },
  calibrated: { name: "Calibrated Twin", desc: "25 attempts observed across concepts" },
};

/* ------------------------------------------------- insight / recommenders */

export function strongestWeakest(t: LearningTwin) {
  const list = CONCEPTS.map((c) => ({ id: c.id, name: c.name, m: conceptOf(t, c.id).mastery }));
  const sorted = [...list].sort((a, b) => b.m - a.m);
  return { strongest: sorted[0], weakest: sorted[sorted.length - 1] };
}

export function recommendCharacter(t: LearningTwin): { id: CharacterId; reason: string } {
  const wrong = t.recentActivity.filter((e) => !e.correct).slice(-8);
  const conceptual = wrong.filter((e) => e.errorType === "conceptual").length;
  const procedural = wrong.filter((e) => e.errorType === "procedural").length;
  if (conceptual > procedural) return { id: "atlas", reason: `${conceptual} of your last ${wrong.length} slips were conceptual. Analogies and real-world examples tend to help most here.` };
  if (t.session.correctInRow >= 4 || (t.overallMastery >= 0.8 && procedural === 0))
    return { id: "byte", reason: "You are on a strong run. Byte will raise the challenge and keep practice quick." };
  return { id: "nova", reason: procedural > 0 ? `${procedural} of your last ${wrong.length} slips were procedural. Small, careful steps should help.` : "A steady, step-by-step pace suits your current profile." };
}

export function buildInsight(t: LearningTwin) {
  const { strongest, weakest } = strongestWeakest(t);
  const active = [...activeMisconceptions(t)].sort((a, b) => b.count - a.count);
  const top = active[0];
  const lin = conceptOf(t, "linear-equations").mastery;
  const word = conceptOf(t, "word-problems").mastery;
  let title = "Your recent mistakes aren't random.";
  let body: string;
  let next: string;
  if (t.recentActivity.length === 0 && stats(t).totalAttempts === 0) {
    title = "Your Twin is still getting to know you.";
    body = "Answer a few questions and it will begin mapping strengths, gaps and the way you tend to make mistakes.";
    next = "Start with a short practice round.";
  } else if (lin - word >= 0.2 && conceptStatus(t, "word-problems") !== "locked") {
    body = `You're performing well on symbolic equations (${pct(lin)}) but struggling when the same operations are embedded in word problems (${pct(word)}).${top ? ` The clearest pattern: ${misconceptionLabel(top.id).toLowerCase()}, seen ${top.count} times.` : ""}`;
    next = "Context-based equation practice.";
  } else if (top) {
    body = `${strongest.name} is your strongest area (${pct(strongest.m)}), but ${conceptName(top.conceptId)} keeps producing the same slip: ${misconceptionLabel(top.id).toLowerCase()} (seen ${top.count} times).`;
    next = `Guided ${strategyLabel(misconceptionById(top.id)?.defaultStrategy ?? "step-by-step").toLowerCase()} practice on ${conceptName(top.conceptId)}, then a re-test.`;
  } else {
    title = "No repeated mistakes right now.";
    body = `${strongest.name} is your strongest area (${pct(strongest.m)}). ${weakest.name} has the most room to grow (${pct(weakest.m)}).`;
    next = `Practice ${weakest.name} at a comfortable difficulty.`;
  }
  return { title, body, next };
}

export function recommendForConcept(t: LearningTwin, id: string) {
  const cs = conceptOf(t, id);
  const active = cs.misconceptions.map((m) => t.misconceptionLog[m]).find((m) => m && !m.resolved);
  if (conceptStatus(t, id) === "locked") {
    const need = missingPrereqs(t, id).map(conceptName).join(", ");
    return { text: `Build ${need} first to unlock this concept.`, difficulty: "easy" as Difficulty };
  }
  if (active) {
    const m = misconceptionById(active.id);
    return { text: `Guided ${strategyLabel(m?.defaultStrategy ?? "step-by-step").toLowerCase()} walkthrough on “${misconceptionLabel(active.id)}”, then a re-test.`, difficulty: "guided" as Difficulty };
  }
  if (cs.mastery < 0.55) return { text: "Easy practice with hints to build a foundation.", difficulty: "easy" as Difficulty };
  if (cs.mastery < 0.8) return { text: "Medium practice to consolidate the concept.", difficulty: "medium" as Difficulty };
  return { text: "Challenge problems to extend and stress-test mastery.", difficulty: "hard" as Difficulty };
}

/* ------------------------------------------------- activity construction */

function questionActivity(
  t: LearningTwin,
  conceptId: string,
  level: Difficulty,
  reasons: string[],
  opts: { strategy?: Strategy; kind?: "question" | "retest"; avoid?: string[]; misconceptionId?: string | null } = {},
): Activity {
  const pickLevel = level === "guided" ? "easy" : level;
  const recentIds = t.recentActivity.slice(-10).map((e) => e.questionId);
  const avoid = new Set([...(opts.avoid ?? []), ...recentIds.slice(-4)]);
  const order = [pickLevel, ...(pickLevel === "hard" ? ["medium", "easy"] : pickLevel === "easy" ? ["medium", "hard"] : ["easy", "hard"])] as Difficulty[];
  let q = undefined as ReturnType<typeof questionById>;
  for (const strict of [true, false]) {
    for (const d of order) {
      const pool = questionsFor(conceptId, d).filter((x) => !(opts.avoid ?? []).includes(x.id) && (!strict || !avoid.has(x.id)));
      if (pool.length) {
        // Prefer the item that was seen longest ago.
        q = pool.sort((a, b) => lastSeen(t, a.id) - lastSeen(t, b.id))[0];
        break;
      }
    }
    if (q) break;
  }
  q ??= questionsFor(conceptId)[0];
  return {
    id: uid("act"),
    kind: opts.kind ?? "question",
    conceptId,
    questionId: q.id,
    prompt: q.prompt,
    difficulty: level,
    hint: q.hint,
    expectedSkill: q.expectedSkill,
    strategy: opts.strategy ?? t.learningPatterns.preferredExplanation,
    autoHint: level === "guided",
    misconceptionId: opts.misconceptionId ?? null,
    reasons,
    generatedBy: "engine",
  };
}

const lastSeen = (t: LearningTwin, qid: string) => {
  const i = t.recentActivity.map((e) => e.questionId).lastIndexOf(qid);
  return i;
};

function explainActivity(t: LearningTwin, plan: RemediationPlan, strategy: Strategy, reasons: string[]): Activity {
  const m = misconceptionById(plan.misconceptionId) ?? misconceptionsFor(plan.conceptId)[0];
  return {
    id: uid("act"),
    kind: "explain",
    conceptId: plan.conceptId,
    prompt: `Rethinking: ${m.label}`,
    difficulty: "guided",
    hint: "",
    expectedSkill: conceptById(plan.conceptId)?.blurb ?? "",
    strategy,
    misconceptionId: m.id,
    explain: { title: m.label, body: m.explanations[strategy], example: m.example },
    reasons,
    generatedBy: "engine",
  };
}

function guidedActivity(plan: RemediationPlan, strategy: Strategy, reasons: string[]): Activity {
  const m = misconceptionById(plan.misconceptionId) ?? misconceptionsFor(plan.conceptId)[0];
  const q = questionById(m.guidedQuestionId)!;
  return {
    id: uid("act"),
    kind: "guided",
    conceptId: plan.conceptId,
    questionId: q.id,
    prompt: q.prompt,
    difficulty: "guided",
    hint: q.hint,
    expectedSkill: q.expectedSkill,
    strategy,
    scaffold: q.scaffold,
    autoHint: true,
    misconceptionId: m.id,
    reasons,
    generatedBy: "engine",
  };
}

export function pickStrategy(t: LearningTwin, misconceptionId: string, tried: Strategy[], baseline: Strategy, suggestion?: Strategy): Strategy {
  const m = misconceptionById(misconceptionId);
  const ordered = [...new Set([suggestion, m?.defaultStrategy, t.learningPatterns.preferredExplanation, ...STRATEGIES].filter(Boolean) as Strategy[])];
  return (
    ordered.find((s) => !tried.includes(s) && s !== baseline) ??
    ordered.find((s) => !tried.includes(s)) ??
    ordered.find((s) => s !== baseline) ??
    "step-by-step"
  );
}

/* ------------------------------------------------------ difficulty logic */

export function decideDifficulty(t: LearningTwin, conceptId: string, responseTimeSec: number | null) {
  const cs = conceptOf(t, conceptId);
  const lastOnConcept = [...t.recentActivity].reverse().find((e) => e.conceptId === conceptId && e.kind !== "guided");
  const from: Difficulty = lastOnConcept ? (lastOnConcept.difficulty === "guided" ? "easy" : lastOnConcept.difficulty) : t.difficulty === "guided" ? "easy" : t.difficulty;
  const recent = cs.recentResults.slice(-5);
  const acc = recent.length ? recent.filter(Boolean).length / recent.length : 0.5;
  const avg = t.learningPatterns.averageResponseTime;
  const speed = responseTimeSec !== null && avg > 0 ? clamp((avg - responseTimeSec) / avg, -1, 1) : 0;
  const active = cs.misconceptions.some((m) => t.misconceptionLog[m] && !t.misconceptionLog[m].resolved);
  const hotRun = recent.length >= 3 && recent.slice(-3).every(Boolean);
  let score = 0.45 * cs.mastery + 0.25 * acc + 0.1 * cs.confidence + 0.1 * (0.5 + 0.5 * speed) + (hotRun ? 0.05 : 0) - (active ? 0.15 : 0);
  score = clamp(score);
  const target = score < 0.3 ? 0 : score < 0.55 ? 1 : score < 0.74 ? 2 : 3;
  const cur = diffIndex(from);
  let next = target > cur ? cur + 1 : target < cur ? cur - 1 : cur;
  if (next > cur && speed < -0.4) next = cur; // hesitation caps a step-up
  const to = DIFFICULTIES[clamp(next, 0, 3)];
  const name = conceptName(conceptId);
  const bits = [`mastery ${pct(cs.mastery)}`, `recent accuracy ${pct(acc)}`, `confidence ${pct(cs.confidence)}`];
  const reasons: string[] = [];
  if (to !== from) reasons.push(`${name}: ${bits.join(", ")}. Moving ${difficultyLabel(from)} → ${difficultyLabel(to)}.`);
  else reasons.push(`${name}: ${bits.join(", ")}. Holding at ${difficultyLabel(to)}.`);
  if (hotRun) reasons.push("Three correct in a row on this concept supports a step up.");
  if (speed > 0.3) reasons.push("Faster than your usual response time.");
  if (speed < -0.4) reasons.push("Slower than your usual pace, so difficulty is not rising yet.");
  if (active) reasons.push("An unresolved misconception on this concept is lowering the difficulty target.");
  return { level: to, from, reasons };
}

function chooseConcept(t: LearningTwin, justConceptId: string | null, correct: boolean) {
  const recent = t.recentActivity.slice(-6).map((e) => e.conceptId);
  const runOnSame = (() => {
    let n = 0;
    for (let i = t.recentActivity.length - 1; i >= 0 && t.recentActivity[i].conceptId === justConceptId; i--) n++;
    return n;
  })();
  const scored = CONCEPTS.filter((c) => conceptStatus(t, c.id) !== "locked").map((c, order) => {
    const cs = conceptOf(t, c.id);
    let s = 1 - cs.mastery;
    if (cs.misconceptions.some((m) => t.misconceptionLog[m] && !t.misconceptionLog[m].resolved)) s += 0.25;
    if (cs.attempts === 0) s += 0.15;
    if (!recent.includes(c.id)) s += 0.1;
    if (c.id === justConceptId) s += correct && cs.mastery < 0.85 && runOnSame < 3 ? 0.35 : correct ? -0.5 : 0.4;
    return { c, s: s - order * 0.001 };
  });
  scored.sort((a, b) => b.s - a.s);
  return { concept: scored[0].c.id, why: scored[0].c.id === justConceptId ? null : conceptName(scored[0].c.id) };
}

export function chooseNormalActivity(t: LearningTwin, justConceptId: string | null, correct: boolean, responseTimeSec: number | null): Activity {
  const { concept, why } = chooseConcept(t, justConceptId, correct);
  const d = decideDifficulty(t, concept, responseTimeSec);
  const reasons = [...d.reasons];
  if (why) {
    const cs = conceptOf(t, concept);
    reasons.unshift(`${why} is the best next target: ${pct(cs.mastery)} mastery${cs.attempts === 0 ? " and not practised yet" : ""}.`);
  }
  return questionActivity(t, concept, d.level, reasons);
}

/* ------------------------------------------------------------ the update */

export type Outcome = "correct" | "wrong" | "pattern" | "guided-done" | "guided-retry" | "retest-failed" | "resolved";

export type AttemptInput = {
  activity: Activity;
  answer: string;
  responseTimeSec: number;
  analysis: Analysis;
};

export type AttemptResult = { twin: LearningTwin; changes: TwinChange[]; outcome: Outcome; masteryBefore: number; masteryAfter: number; insight: boolean };

const BASE_XP: Record<Difficulty, number> = { guided: 6, easy: 10, medium: 15, hard: 22 };
const WEIGHT: Record<Difficulty, number> = { guided: 0.55, easy: 0.8, medium: 1, hard: 1.2 };

export function preferredFromEffectiveness(eff: LearningTwin["learningPatterns"]["strategyEffectiveness"]): Strategy {
  return [...STRATEGIES].sort((a, b) => (eff[b].helped + 1) / (eff[b].tried + 2) - (eff[a].helped + 1) / (eff[a].tried + 2))[0];
}

export function applyAttempt(prev: LearningTwin, input: AttemptInput): AttemptResult {
  const t: LearningTwin = structuredClone(prev);
  const { activity, analysis } = input;
  const correct = analysis.isCorrect;
  const cs = conceptOf(t, activity.conceptId);
  const changes: TwinChange[] = [];
  const before = cs.mastery;
  const beforeConf = cs.confidence;
  const lockedBefore = new Set(CONCEPTS.filter((c) => conceptStatus(t, c.id) === "locked").map((c) => c.id));
  const beforePreferred = t.learningPatterns.preferredExplanation;
  const beforeDifficulty = t.difficulty;
  let insight = false;

  /* 1. mastery + confidence */
  cs.attempts += 1;
  if (correct) cs.correct += 1;
  cs.recentResults = [...cs.recentResults, correct].slice(-6);
  cs.lastAttempt = new Date().toISOString();
  const lr = 0.16 * (1 - cs.confidence * 0.4);
  const w = WEIGHT[activity.difficulty];
  if (correct) cs.mastery += lr * w * (1 - cs.mastery) * (activity.autoHint ? 0.75 : 1) * 1.6;
  else cs.mastery -= lr * 0.9 * (0.4 + cs.mastery * 0.6) * (2 - w);
  cs.mastery = clamp(cs.mastery, 0.02, 0.99);
  const rr = cs.recentResults;
  const flips = rr.slice(1).filter((v, i) => v !== rr[i]).length;
  const consistency = rr.length > 1 ? 1 - flips / (rr.length - 1) : 0.5;
  cs.confidence = clamp((cs.attempts / (cs.attempts + 6)) * (0.75 + 0.25 * consistency), 0.05, 0.98);
  const after = cs.mastery;
  changes.push({ kind: "mastery", label: conceptName(activity.conceptId), from: pct(before), to: pct(after), tone: after >= before ? "up" : "down" });
  if (Math.abs(cs.confidence - beforeConf) >= 0.01)
    changes.push({ kind: "confidence", label: "Twin confidence", from: pct(beforeConf), to: pct(cs.confidence), tone: cs.confidence >= beforeConf ? "up" : "down" });

  /* 2. misconception bookkeeping */
  const now = new Date().toISOString();
  const mId = !correct ? analysis.misconceptionId : null;
  let rec: MisconceptionRecord | null = null;
  if (mId) {
    rec = t.misconceptionLog[mId] ?? { id: mId, conceptId: activity.conceptId, count: 0, firstSeen: now, lastSeen: now, resolved: false };
    const wasNew = rec.count === 0 || rec.resolved;
    rec.count += 1;
    rec.lastSeen = now;
    rec.resolved = false;
    delete rec.resolvedAt;
    t.misconceptionLog[mId] = rec;
    if (!cs.misconceptions.includes(mId)) cs.misconceptions.push(mId);
    changes.push({ kind: "misconception", label: misconceptionLabel(mId), from: wasNew ? "new" : `×${rec.count - 1}`, to: `×${rec.count}`, tone: "down" });
    if (wasNew) insight = true;
  }
  if (!correct && analysis.errorType !== "none") {
    t.learningPatterns.errorCounts[analysis.errorType] = (t.learningPatterns.errorCounts[analysis.errorType] ?? 0) + 1;
    t.learningPatterns.commonErrorTypes = Object.entries(t.learningPatterns.errorCounts).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  }

  /* 3. response-time model */
  const n = stats(t).totalAttempts;
  const t0 = t.learningPatterns.averageResponseTime || input.responseTimeSec;
  t.learningPatterns.averageResponseTime = Math.round(((t0 * (n - 1) + input.responseTimeSec) / n) * 10) / 10;

  /* 4. activity log */
  const event: ActivityEvent = {
    id: uid("ev"),
    at: now,
    conceptId: activity.conceptId,
    questionId: activity.questionId ?? "",
    prompt: activity.prompt,
    answer: input.answer,
    correct,
    misconceptionId: mId,
    errorType: analysis.errorType,
    difficulty: activity.difficulty,
    strategy: activity.strategy,
    kind: activity.kind,
    responseTimeSec: input.responseTimeSec,
    masteryBefore: before,
    masteryAfter: after,
  };
  t.recentActivity = [...t.recentActivity, event].slice(-60);

  /* 5. decide what happens next (the adaptive part) */
  const plan = t.session.plan;
  let outcome: Outcome;
  let next: Activity;
  let nextPlan: RemediationPlan | null = plan;

  if (plan && activity.kind === "guided") {
    if (correct) {
      outcome = "guided-done";
      nextPlan = { ...plan, stage: "retest" };
      next = questionActivity(t, plan.conceptId, conceptOf(t, plan.conceptId).mastery < 0.5 ? "easy" : "medium", [
        `Guided step completed with the “${strategyLabel(activity.strategy)}” approach.`,
        "Re-testing without scaffolding to check the misconception is really gone.",
      ], { kind: "retest", avoid: [plan.failedQuestionId], strategy: activity.strategy, misconceptionId: plan.misconceptionId });
    } else {
      outcome = "guided-retry";
      const s = pickStrategy(t, plan.misconceptionId, plan.strategiesTried, activity.strategy, analysis.recommendedTeachingStrategy);
      nextPlan = { ...plan, stage: "explain", rounds: plan.rounds + 1, strategiesTried: [...plan.strategiesTried, s] };
      next = explainActivity(t, nextPlan, s, [`Still stuck with the “${strategyLabel(activity.strategy)}” approach, so the Twin is switching to “${strategyLabel(s)}”.`]);
      t.learningPatterns.strategyEffectiveness[s].tried += 1;
    }
  } else if (plan && activity.kind === "retest") {
    if (correct) {
      outcome = "resolved";
      const r = t.misconceptionLog[plan.misconceptionId];
      if (r) {
        r.resolved = true;
        r.resolvedAt = now;
      }
      cs.misconceptions = cs.misconceptions.filter((m) => m !== plan.misconceptionId);
      const strat = plan.strategiesTried[plan.strategiesTried.length - 1];
      t.learningPatterns.strategyEffectiveness[strat].helped += 1;
      t.learningPatterns.preferredExplanation = preferredFromEffectiveness(t.learningPatterns.strategyEffectiveness);
      nextPlan = null;
      changes.push({ kind: "resolved", label: misconceptionLabel(plan.misconceptionId), from: "active", to: "resolved", tone: "up" });
      insight = true;
      next = chooseNormalActivity(t, plan.conceptId, true, input.responseTimeSec);
    } else {
      outcome = "retest-failed";
      const s = pickStrategy(t, plan.misconceptionId, plan.strategiesTried, activity.strategy, analysis.recommendedTeachingStrategy);
      nextPlan = { ...plan, stage: "explain", rounds: plan.rounds + 1, strategiesTried: [...plan.strategiesTried, s] };
      next = explainActivity(t, nextPlan, s, ["Re-test missed, so the misconception is still active.", `Trying a different explanation style: “${strategyLabel(s)}”.`]);
      t.learningPatterns.strategyEffectiveness[s].tried += 1;
    }
  } else if (!correct && rec && rec.count >= 2) {
    outcome = "pattern";
    const s = pickStrategy(t, rec.id, [activity.strategy], activity.strategy, analysis.recommendedTeachingStrategy);
    nextPlan = { misconceptionId: rec.id, conceptId: activity.conceptId, stage: "explain", strategiesTried: [activity.strategy, s], rounds: 1, failedQuestionId: activity.questionId ?? "" };
    t.learningPatterns.strategyEffectiveness[s].tried += 1;
    next = explainActivity(t, nextPlan, s, [
      `“${misconceptionLabel(rec.id)}” has now appeared ${rec.count} times, so another question would not fix it.`,
      `Switching teaching strategy: ${strategyLabel(activity.strategy)} → ${strategyLabel(s)}.`,
      "Plan: explain → simpler example → guided question → re-test.",
    ]);
    insight = true;
  } else if (!correct) {
    outcome = "wrong";
    nextPlan = null;
    const from = diffIndex(activity.difficulty === "guided" ? "easy" : activity.difficulty);
    const lvl = DIFFICULTIES[Math.max(1, from - 1)];
    next = questionActivity(t, activity.conceptId, lvl, [
      rec ? `First time seeing “${misconceptionLabel(rec.id)}”. Staying on ${conceptName(activity.conceptId)} at ${difficultyLabel(lvl)} to see whether it repeats.` : `No consistent pattern yet, so staying on ${conceptName(activity.conceptId)} at ${difficultyLabel(lvl)}.`,
      "If the same mistake repeats, the Twin will switch teaching strategy instead of just asking more questions.",
    ], { strategy: analysis.recommendedTeachingStrategy, avoid: [activity.questionId ?? ""] });
    next.autoHint = lvl === "easy";
  } else {
    outcome = "correct";
    nextPlan = null;
    next = chooseNormalActivity(t, activity.conceptId, true, input.responseTimeSec);
  }

  /* 6. gamification + streaks */
  const inRow = correct ? t.session.correctInRow + 1 : 0;
  let xp = correct ? BASE_XP[activity.difficulty] : 3;
  if (outcome === "resolved") xp += 40;
  t.xp += xp;
  changes.push({ kind: "xp", label: outcome === "resolved" ? "XP (misconception resolved)" : correct ? "XP earned" : "XP (effort)", to: `+${xp}`, tone: "up" });
  const today = localDate();
  if (t.lastActiveDate !== today) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    t.dayStreak = t.lastActiveDate === localDate(y) ? t.dayStreak + 1 : 1;
    t.lastActiveDate = today;
  }

  /* 7. difficulty + strategy visibility */
  if (next.kind !== "explain") t.difficulty = next.difficulty;
  if (t.difficulty !== beforeDifficulty)
    changes.push({ kind: "difficulty", label: "Difficulty", from: difficultyLabel(beforeDifficulty), to: difficultyLabel(t.difficulty), tone: diffIndex(t.difficulty) >= diffIndex(beforeDifficulty) ? "up" : "down" });
  if (activity.strategy !== next.strategy)
    changes.push({ kind: "strategy", label: "Teaching strategy", from: strategyLabel(activity.strategy), to: strategyLabel(next.strategy), tone: "neutral" });
  if (t.learningPatterns.preferredExplanation !== beforePreferred) {
    changes.push({ kind: "strategy", label: "Preferred explanation style", from: strategyLabel(beforePreferred), to: strategyLabel(t.learningPatterns.preferredExplanation), tone: "up" });
    insight = true;
  }
  t.learningPatterns.difficultyPreference = difficultyLabel(t.difficulty);

  /* 8. aggregate, unlocks, achievements, history */
  recomputeAggregates(t);
  for (const c of CONCEPTS) {
    if (lockedBefore.has(c.id) && conceptStatus(t, c.id) !== "locked") {
      changes.push({ kind: "unlock", label: `${c.name} unlocked`, tone: "up" });
      award(t, "unlocker", changes);
    }
  }
  if (analysis.misconceptionId && !correct) award(t, "first-insight", changes);
  if (outcome === "resolved") award(t, "pattern-breaker", changes);
  if (inRow >= 5) award(t, "hot-streak", changes);
  if (cs.mastery >= 0.9) award(t, "deep-mastery", changes);
  if (stats(t).totalAttempts >= 25) award(t, "calibrated", changes);

  const last10 = t.recentActivity.slice(-10);
  const liveN = t.history.filter((h) => h.label.startsWith("Live")).length + 1;
  t.history = [
    ...t.history,
    { label: `Live ${liveN}`, mastery: Math.round(t.overallMastery * 1000) / 1000, accuracy: last10.filter((e) => e.correct).length / last10.length, difficulty: diffIndex(t.difficulty) + 1, resolved: resolvedMisconceptions(t).length },
  ].slice(-40);

  let live = t.sessions.find((s) => s.live);
  if (!live) {
    live = { id: "live", date: now, concepts: [], attempts: 0, accuracy: 0, xp: 0, peakDifficulty: "easy", live: true };
    t.sessions = [live, ...t.sessions];
  }
  live.accuracy = (live.accuracy * live.attempts + (correct ? 1 : 0)) / (live.attempts + 1);
  live.attempts += 1;
  live.xp += xp;
  if (!live.concepts.includes(activity.conceptId)) live.concepts.push(activity.conceptId);
  if (diffIndex(activity.difficulty) > diffIndex(live.peakDifficulty)) live.peakDifficulty = activity.difficulty;

  t.session = { activity: next, plan: nextPlan, message: t.session.message, correctInRow: inRow };
  t.lastChanges = changes;
  return { twin: t, changes, outcome, masteryBefore: before, masteryAfter: after, insight };
}

function award(t: LearningTwin, id: string, changes: TwinChange[]) {
  if (t.achievements.includes(id)) return;
  t.achievements.push(id);
  changes.push({ kind: "achievement", label: ACHIEVEMENTS[id].name, tone: "up" });
}

/** explain → guided question. */
export function advancePlan(prev: LearningTwin): LearningTwin {
  const t: LearningTwin = structuredClone(prev);
  const plan = t.session.plan;
  if (!plan || t.session.activity.kind !== "explain") return t;
  const strategy = t.session.activity.strategy;
  t.session.plan = { ...plan, stage: "guided" };
  t.session.activity = guidedActivity(plan, strategy, [
    `Explanation delivered in “${strategyLabel(strategy)}” style.`,
    "Next: a guided question with the steps laid out, then an unscaffolded re-test.",
  ]);
  return t;
}

/** Jump straight to a concept (used by the knowledge graph detail panel). */
export function practiceConcept(prev: LearningTwin, conceptId: string): LearningTwin {
  const t: LearningTwin = structuredClone(prev);
  const d = decideDifficulty(t, conceptId, null);
  const active = conceptOf(t, conceptId).misconceptions.map((m) => t.misconceptionLog[m]).find((m) => m && !m.resolved);
  t.session.plan = null;
  t.session.correctInRow = 0;
  t.session.activity = questionActivity(t, conceptId, d.level, [`Chosen from the knowledge graph: ${conceptName(conceptId)}.`, ...d.reasons], {
    misconceptionId: active?.id ?? null,
  });
  t.session.message = "";
  return t;
}

export function setCharacter(prev: LearningTwin, id: CharacterId): LearningTwin {
  return { ...prev, character: id, session: { ...prev.session, message: "" } };
}

export const characterOf = (t: LearningTwin) => CHARACTERS[t.character];
