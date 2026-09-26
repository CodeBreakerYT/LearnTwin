import type { CharacterId, Strategy } from "./types";

export type Situation = "intro" | "correct" | "wrong" | "pattern" | "guided-done" | "guided-retry" | "retest-failed" | "resolved";

export type VoiceVars = {
  concept: string;
  mastery: string;
  pattern: string;
  strategy: string;
  misconception: string;
  count: number;
  detail: string;
};

const T: Record<Situation, Record<CharacterId, (v: VoiceVars) => string>> = {
  intro: {
    nova: () => "Let's solve this together. Take your time and show me your reasoning.",
    byte: () => "Ready? Here's your next challenge. Go!",
    atlas: () => "Here's a new one. Picture what the numbers stand for before you compute.",
  },
  correct: {
    nova: (v) => `That's right. Your reasoning held up on ${v.concept}. Let's keep building.`,
    byte: () => "Nailed it. Next challenge incoming.",
    atlas: (v) => `Exactly. You've got the shape of this idea in ${v.concept}. Let's explore a little further.`,
  },
  wrong: {
    nova: (v) => `Not quite, and that's useful information. ${v.detail} Let's try a slightly easier one.`,
    byte: (v) => `Close, but no. ${v.detail} Quick reset: easier one next.`,
    atlas: (v) => `Interesting, let's trace where this went off the path. ${v.detail} Here's a gentler route.`,
  },
  pattern: {
    nova: (v) => `I found a pattern. You've handled ${v.concept} well before (${v.mastery}), but ${v.pattern}. Let's slow down, use the ${v.strategy} approach, and then try a guided version.`,
    byte: (v) => `Pattern spotted. ${v.concept} is solid at ${v.mastery}, but ${v.pattern}. New plan: the ${v.strategy} approach, one guided rep, then a re-test.`,
    atlas: (v) => `I've noticed something. You know ${v.concept} (${v.mastery}), yet ${v.pattern}. Let's come at it from a different angle using the ${v.strategy} approach, then a guided walk.`,
  },
  "guided-done": {
    nova: () => "That's the move. Now let's see whether it holds up without the steps written out.",
    byte: () => "Clean. Now the same skill with no scaffolding. Re-test time.",
    atlas: () => "You followed the path well. Now let's see if you can walk it alone.",
  },
  "guided-retry": {
    nova: (v) => `Still tricky, and that's okay. Let's look at it a different way, using the ${v.strategy} approach.`,
    byte: (v) => `Not yet. Switching tactics to the ${v.strategy} approach. Take another look.`,
    atlas: (v) => `That route didn't quite work, so let's take another one: the ${v.strategy} approach.`,
  },
  "retest-failed": {
    nova: (v) => `That one is still slipping, so we'll try another explanation, the ${v.strategy} approach. No rush.`,
    byte: (v) => `Still there. New angle: the ${v.strategy} approach. Then we go again.`,
    atlas: (v) => `The old idea is still hiding. Let's try seeing it through the ${v.strategy} approach.`,
  },
  resolved: {
    nova: (v) => `That re-test went well, so I'll mark "${v.misconception}" as resolved for now and keep watching for it.`,
    byte: (v) => `Re-test cleared. "${v.misconception}" is marked resolved. I'll keep an eye out.`,
    atlas: (v) => `The pattern didn't return in your re-test. "${v.misconception}" is resolved for now, and I'll keep watching.`,
  },
};

export const voiceLine = (c: CharacterId, s: Situation, v: Partial<VoiceVars> = {}) =>
  T[s][c]({ concept: "this concept", mastery: "", pattern: "something keeps slipping", strategy: "step-by-step", misconception: "this misconception", count: 0, detail: "", ...v });

export const strategyPhrase = (s: Strategy) => (s === "step-by-step" ? "step-by-step" : s);

const GUIDED: Record<CharacterId, string> = {
  nova: "Here are the steps laid out for you. Take them one at a time.",
  byte: "Guided rep: the steps are right there. Fill in the blanks.",
  atlas: "Follow the trail I've marked, one step at a time.",
};
export const guidedIntro = (c: CharacterId) => GUIDED[c];
