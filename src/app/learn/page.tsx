"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Flame, Loader2, Mic, SkipForward, Sparkles, Trophy, Volume2, VolumeX } from "lucide-react";
import Avatar from "@/components/Avatar";
import BlockStage from "@/components/BlockStage";
import { useTyped } from "@/components/CharacterStage";
import { useTwin } from "@/components/TwinProvider";
import { CHARACTERS } from "@/lib/characters";
import { checkAnswer } from "@/lib/checkAnswer";
import { makeChoices } from "@/lib/choices";
import { buildContext, postJson } from "@/lib/client";
import { conceptName, subjectById } from "@/lib/curriculum";
import { activeSubject, advancePlan, levelInfo, pct, stats, type Outcome } from "@/lib/engine";
import { LESSON_BEATS, type Beat } from "@/lib/lessons";
import { mockAnalyze } from "@/lib/ai/mock";
import { updateLearningTwin } from "@/lib/ai/updateLearningTwin";
import type { AnalysisResponse, Source } from "@/lib/ai/schemas";
import { misconceptionLabel } from "@/lib/misconceptions";
import { questionById } from "@/lib/questions";
import { canListen, cancelListening, listen, speak, stopSpeaking, useVoiceState } from "@/lib/speech";
import { spokenToAnswer, toSpeech, voiceCommand } from "@/lib/spoken";
import { lastStep } from "@/lib/visuals";
import { guidedIntro, voiceLine, yourTurn } from "@/lib/voice";
import type { Activity, Analysis } from "@/lib/types";

type Phase = "gate" | "ready" | "analyzing" | "reveal";
type Bubble = { text: string; tone: "good" | "info" | "trophy" };
type Reveal = { activity: Activity; answer: string; analysis: Analysis; outcome: Outcome; next: Activity; bubbles: Bubble[]; xp: number; levelUp: boolean; win: boolean };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const VOICE_KEY = "learntwin.voice";

/** The beats the character teaches for an explain activity: a full lesson, or a re-teach after a slip. */
function beatsFor(a: Activity): Beat[] {
  const base = LESSON_BEATS[a.conceptId] ?? [];
  if (a.lesson || !a.explain) return base;
  return [{ say: a.explain.body, step: base[0]?.step ?? 0 }, ...base.slice(1)];
}

export default function LearnPage() {
  const { twin, update, noteSource, status } = useTwin();
  const voice = useVoiceState();
  const [phase, setPhase] = useState<Phase>("gate");
  const [voiceOn, setVoiceOn] = useState(false);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [beat, setBeat] = useState<{ i: number; n: number; say: string; step: number } | null>(null);
  const [heard, setHeard] = useState("");
  const [micNote, setMicNote] = useState("");

  const twinRef = useRef(twin);
  const submitRef = useRef<(a: string, t: number) => void>(() => {});
  const proceedRef = useRef<() => void>(() => {});
  const advanceRef = useRef<() => void>(() => {});
  const runRef = useRef(0);
  const revealRef = useRef<Reveal | null>(null);
  const startedAt = useRef(0);
  useEffect(() => {
    twinRef.current = twin;
  }, [twin]);
  useEffect(() => {
    revealRef.current = reveal;
  }, [reveal]);

  const serverVoice = Boolean(status && !status.demo);
  const act = twin?.session.activity;
  const char = twin ? CHARACTERS[twin.character] : CHARACTERS.nova;
  const introLine = twin ? twin.session.message || voiceLine(twin.character, "intro") : "";
  const secs = () => Math.max(1, Math.round((Date.now() - startedAt.current) / 100) / 10);
  const isTeach = Boolean(act && act.kind === "explain" && act.explain);
  const question = act?.questionId ? questionById(act.questionId) : undefined;
  const choices = useMemo(() => (question && act ? makeChoices(question, act.id) : []), [question, act]);

  /* ----------------------------------------------------------- submit */
  const submit = useCallback(
    async (answer: string, responseTimeSec: number) => {
      const t = twinRef.current;
      if (!t) return;
      const a = t.session.activity;
      const q = a.questionId ? questionById(a.questionId) : undefined;
      if (!q) return;
      stopSpeaking();
      cancelListening();
      setHeard("");
      setPhase("analyzing");
      const minDelay = wait(1600);

      const context = buildContext(t);
      let res: AnalysisResponse;
      try {
        res = await postJson<AnalysisResponse>("/api/analyze", { questionId: q.id, answer, responseTimeSec, context });
      } catch {
        res = { analysis: mockAnalyze(q, checkAnswer(q, answer), context), source: "demo" };
      }
      noteSource(res.source);

      const result = updateLearningTwin(t, { activity: a, answer, responseTimeSec, analysis: res.analysis });
      const next = result.twin.session.activity;
      const mId = t.session.plan?.misconceptionId ?? result.twin.session.plan?.misconceptionId ?? res.analysis.misconceptionId ?? null;
      const recent = buildContext(result.twin).recentMistakes.slice(0, 4);

      const tutorP = postJson<{ message: string; source: Source }>("/api/tutor", {
        characterId: t.character,
        situation: result.outcome,
        conceptId: a.conceptId,
        strategy: next.strategy,
        difficulty: next.difficulty,
        mastery: result.masteryBefore,
        misconceptionId: mId,
        misconceptionCount: mId ? result.twin.misconceptionLog[mId]?.count : undefined,
        analysisExplanation: res.analysis.explanation,
        recentMistakes: recent,
      }).catch(() => null);
      const genP =
        next.questionId && next.kind !== "explain"
          ? postJson<{ activity: { hint: string; expectedSkill: string }; source: Source } | null>("/api/activity", { questionId: next.questionId, characterId: t.character, strategy: next.strategy, difficulty: next.difficulty, misconceptionId: next.misconceptionId ?? null, recentMistakes: recent }).catch(() => null)
          : Promise.resolve(null);
      const [tutor, gen] = await Promise.all([tutorP, genP, minDelay]);
      if (tutor) noteSource(tutor.source);

      const message = tutor?.message ?? voiceLine(t.character, result.outcome, { concept: conceptName(a.conceptId), mastery: pct(result.masteryBefore), strategy: next.strategy, detail: res.analysis.explanation });
      update(() => {
        const n = structuredClone(result.twin);
        n.session.message = message;
        if (gen?.activity && n.session.activity.id === next.id && gen.source === "groq") n.session.activity = { ...n.session.activity, hint: gen.activity.hint, expectedSkill: gen.activity.expectedSkill, generatedBy: "ai" };
        return n;
      });

      const win = res.analysis.isCorrect;
      const xp = result.twin.xp - t.xp;
      const bubbles: Bubble[] = [{ text: `+${xp} XP`, tone: "good" }];
      const m = result.changes.find((c) => c.kind === "mastery");
      if (win && m && m.tone === "up") bubbles.push({ text: `${m.label} ${m.to}`, tone: "good" });
      if (!win && res.analysis.misconceptionId) bubbles.push({ text: `Found a tricky spot: ${misconceptionLabel(res.analysis.misconceptionId)}`, tone: "info" });
      if (result.outcome === "resolved") bubbles.push({ text: "Tricky spot fixed!", tone: "trophy" });
      const ach = result.changes.find((c) => c.kind === "achievement");
      if (ach) bubbles.push({ text: ach.label, tone: "trophy" });
      const levelUp = levelInfo(result.twin.xp).level > levelInfo(t.xp).level;
      if (levelUp) bubbles.push({ text: `Level ${levelInfo(result.twin.xp).level}!`, tone: "trophy" });

      setReveal({ activity: a, answer, analysis: res.analysis, outcome: result.outcome, next, bubbles: bubbles.slice(0, 4), xp, levelUp, win });
      setPhase("reveal");
    },
    [update, noteSource],
  );
  useEffect(() => {
    submitRef.current = (a, t) => void submit(a, t);
  }, [submit]);

  const proceed = useCallback(() => {
    stopSpeaking();
    cancelListening();
    if (revealRef.current && revealRef.current.next.kind !== "explain") update((t) => ({ ...t, session: { ...t.session, message: voiceLine(t.character, "intro") } }));
    setReveal(null);
    setHeard("");
    setPhase("ready");
  }, [update]);
  useEffect(() => {
    proceedRef.current = proceed;
  }, [proceed]);

  /** Teaching finished (or skipped): move on to the check. */
  const advance = useCallback(() => {
    stopSpeaking();
    cancelListening();
    update((t) => {
      const n = advancePlan(t);
      n.session.message = t.session.activity.lesson ? yourTurn(t.character) : guidedIntro(t.character);
      return n;
    });
  }, [update]);
  useEffect(() => {
    advanceRef.current = advance;
  }, [advance]);

  /* ------------------------------------------------ spoken interaction */
  const answerLoop = useCallback(
    async (run: number, a: Activity, lead: string) => {
      const alive = () => run === runRef.current;
      const id = twinRef.current!.character;
      let tries = 0;
      while (alive() && tries < 3) {
        let text = "";
        try {
          text = await listen(serverVoice);
        } catch {
          setMicNote("Microphone unavailable. Tap an answer instead.");
          return;
        }
        if (!alive()) return;
        if (!text) {
          tries++;
          if (tries < 3) await speak("Take your time. Say the answer, or tap it.", id);
          continue;
        }
        setHeard(text);
        const ans = spokenToAnswer(text);
        if (ans !== null) return submitRef.current(ans, secs());
        const cmd = voiceCommand(text);
        if (cmd === "hint") await speak(a.hint, id);
        else if (cmd === "repeat") await speak(`${lead} ${toSpeech(a.prompt)}`, id);
        else {
          tries++;
          await speak("I need a number or a fraction. Try again, or tap an answer.", id);
        }
      }
    },
    [serverVoice],
  );

  // Teach (beats + 3D scene), or ask the check, whenever the activity changes.
  const actId = act?.id;
  useEffect(() => {
    if (phase !== "ready" || !twinRef.current) return;
    const t = twinRef.current;
    const a = t.session.activity;
    const runs = runRef;
    const run = ++runs.current;
    startedAt.current = Date.now();
    const lead = t.session.message || voiceLine(t.character, "intro");
    (async () => {
      if (a.kind === "explain" && a.explain) {
        const beats = beatsFor(a);
        for (let i = 0; i < beats.length; i++) {
          if (run !== runs.current) return;
          setBeat({ i, n: beats.length, say: beats[i].say, step: beats[i].step });
          if (voiceOn) await speak(beats[i].say, t.character);
          else await wait(Math.max(3200, beats[i].say.length * 62));
          if (run !== runs.current) return;
          await wait(voiceOn ? 500 : 700);
        }
        if (run === runs.current) advanceRef.current();
      } else if (voiceOn) {
        await speak(`${lead} ${toSpeech(a.prompt)}`, t.character);
        if (run !== runs.current) return;
        startedAt.current = Date.now();
        await answerLoop(run, a, lead);
      }
    })();
    return () => {
      runs.current++;
      stopSpeaking();
      cancelListening();
      setBeat(null);
    };
  }, [phase, actId, voiceOn, answerLoop]);

  // Speak the feedback, then move on hands-free.
  useEffect(() => {
    if (phase !== "reveal" || !reveal || !twinRef.current) return;
    const t = twinRef.current;
    let dead = false;
    (async () => {
      if (voiceOn) {
        await speak(t.session.message, t.character);
        if (dead) return;
        await wait(1500);
      } else {
        await wait(Math.max(4200, t.session.message.length * 70));
      }
      if (!dead) proceedRef.current();
    })();
    return () => {
      dead = true;
      stopSpeaking();
    };
  }, [phase, reveal, voiceOn]);

  /* ------------------------------------------------------------ actions */
  const begin = (withVoice: boolean) => {
    try {
      localStorage.setItem(VOICE_KEY, withVoice ? "on" : "off");
    } catch {
      /* preference only */
    }
    setVoiceOn(withVoice && canListen());
    if (withVoice && !canListen()) setMicNote("This browser can't listen, so you'll tap your answers.");
    setPhase("ready");
  };

  const tapMic = () => {
    if (!twinRef.current || phase !== "ready" || !act || isTeach) return;
    stopSpeaking();
    cancelListening();
    setMicNote("");
    const run = ++runRef.current;
    startedAt.current = Date.now();
    setVoiceOn(true);
    void answerLoop(run, act, introLine);
  };

  /* -------------------------------------------------------------- render */
  const captionText = !twin || !act ? "" : phase === "reveal" ? twin.session.message : isTeach ? (beat?.say ?? "") : introLine;
  const { shown: caption, typing } = useTyped(captionText, 34);
  if (!twin || !act) return <div className="grid min-h-[70vh] place-items-center"><Loader2 className="size-6 animate-spin text-muted" /></div>;

  const lvl = levelInfo(twin.xp);
  const played = stats(twin).totalAttempts > 0;
  const talking = voice.speaking || typing;
  const mood = phase === "analyzing" ? "thinking" : phase === "reveal" && reveal ? (reveal.win ? "happy" : "concerned") : "neutral";
  const visStep = isTeach ? (beat?.step ?? 0) : (lastStep[act.conceptId] ?? 0);

  return (
    <div className="relative mx-auto flex min-h-[calc(100dvh-4rem)] max-w-7xl flex-col overflow-hidden px-4 pb-24 sm:px-6 md:pb-6">
      {/* game HUD */}
      <div className="relative z-20 flex items-center justify-between gap-3 pt-4">
        <div className={`flex items-center gap-3 ${played ? "" : "invisible"}`}>
          <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-[#a5b1ff] to-[#5eead4] text-sm font-bold text-[#07080f]">{lvl.level}</span>
          <div className="w-28 sm:w-40">
            <div className="mb-1 text-[0.7rem] font-medium text-muted">{lvl.name}</div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full rounded-full bg-gradient-to-r from-[#8b9cff] to-[#5eead4]" animate={{ width: `${(lvl.into / lvl.per) * 100}%` }} transition={{ duration: 0.8 }} /></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {twin.session.correctInRow >= 2 && <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="chip !text-weak">x{twin.session.correctInRow} combo</motion.span>}
          {played && <span className="chip"><Flame className="size-3.5 text-weak" /> {twin.dayStreak}</span>}
          <button onClick={() => { const v = !voiceOn; setVoiceOn(v); if (!v) { stopSpeaking(); cancelListening(); } }} className="chip hover:text-ink" aria-label={voiceOn ? "Mute voice" : "Turn voice on"}>
            {voiceOn ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
          </button>
        </div>
      </div>

      {/* the classroom: character + animated 3D scene */}
      <div className="relative mt-3 grid flex-1 gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="relative min-h-[36vh] lg:min-h-0">
          <div className="pointer-events-none absolute left-1/2 top-1/3 size-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: `${char.accent}30` }} />
          <Avatar src={char.vrm} accent={char.accent} mood={mood} speaking={talking} framing="bust" className="absolute inset-0" />
          <div className="absolute left-1 top-1">
            <div className="eyebrow" style={{ color: char.accent }}>{char.role}</div>
            <div className="text-2xl font-semibold tracking-tight">{char.name}</div>
          </div>
          <AnimatePresence>
            {phase === "reveal" && reveal && (
              <motion.div key={reveal.activity.id} className="pointer-events-none absolute inset-x-0 top-2 flex flex-col items-center">
                <motion.div initial={{ opacity: 0, y: 20, scale: 0.6 }} animate={{ opacity: [0, 1, 1, 0], y: [20, -10, -30, -60], scale: [0.6, 1.15, 1, 1] }} transition={{ duration: 2.4, times: [0, 0.2, 0.7, 1] }} className="text-4xl font-bold tracking-tight text-[#a5b1ff] drop-shadow-[0_0_20px_rgba(139,156,255,0.8)]">+{reveal.xp} XP</motion.div>
                {reveal.win && Array.from({ length: 14 }).map((_, i) => (
                  <motion.span key={i} className="absolute top-6 size-2 rounded-full" style={{ background: i % 2 ? "#5eead4" : "#a5b1ff" }} initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: Math.cos((i / 14) * Math.PI * 2) * 150, y: Math.sin((i / 14) * Math.PI * 2) * 110, opacity: 0, scale: 0.4 }} transition={{ duration: 1.1, ease: "easeOut" }} />
                ))}
                {reveal.levelUp && <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} className="mt-3 rounded-full bg-gradient-to-r from-[#8b9cff] to-[#5eead4] px-5 py-1.5 text-sm font-bold tracking-widest text-[#07080f]">LEVEL UP</motion.div>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="glass relative min-h-[44vh] overflow-hidden lg:min-h-0">
          <BlockStage conceptId={act.conceptId} step={visStep} className="absolute inset-0" />

          <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-3">
            <span className="chip !text-ink">{conceptName(act.conceptId)}</span>
            {isTeach && beat && (
              <span className="flex items-center gap-1.5" aria-label={`Step ${beat.i + 1} of ${beat.n}`}>
                {Array.from({ length: beat.n }).map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === beat.i ? "w-6 bg-accent" : i < beat.i ? "w-2 bg-accent/60" : "w-2 bg-white/15"}`} />)}
              </span>
            )}
          </div>

          {/* feedback bubbles */}
          <div className="absolute right-4 top-4 flex max-w-[16rem] flex-col items-end gap-2">
            {phase === "reveal" && reveal && (
              <>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 text-sm font-semibold backdrop-blur-md ${reveal.win ? "border-mastered/40 bg-mastered/15 text-mastered" : "border-weak/40 bg-weak/15 text-weak"}`}>
                  {reveal.win ? <Check className="size-4" strokeWidth={3} /> : <Sparkles className="size-4" />}{reveal.win ? "Nailed it" : "Good try"}
                </motion.div>
                {reveal.bubbles.map((b, i) => (
                  <motion.div key={b.text} initial={{ opacity: 0, x: 24, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: 0.5 + i * 0.6, duration: 0.5 }} className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-[#0d1020]/80 px-4 py-2.5 text-sm font-medium backdrop-blur-md">
                    {b.tone === "trophy" ? <Trophy className="size-4 shrink-0 text-weak" /> : <Sparkles className="size-4 shrink-0 text-accent" />}{b.text}
                  </motion.div>
                ))}
              </>
            )}
            {phase === "analyzing" && <span className="chip !text-ink backdrop-blur-md"><Loader2 className="size-3.5 animate-spin text-accent" /> Thinking about it</span>}
          </div>

          {/* the check: tap what you think, inside the lesson */}
          <AnimatePresence>
            {phase === "ready" && !isTeach && (
              <motion.div key={act.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.5 }} className="absolute inset-x-4 bottom-4">
                <div className="mb-3 rounded-2xl border border-white/10 bg-[#0d1020]/85 px-5 py-3 text-lg font-semibold leading-snug backdrop-blur-md sm:text-xl">{act.prompt.replace(/^Guided:\s*/, "")}</div>
                <div className="grid grid-cols-3 gap-3">
                  {choices.map((c) => (
                    <button key={c.label} onClick={() => submitRef.current(c.value, secs())} className="rounded-2xl border border-white/15 bg-white/[0.07] py-4 text-2xl font-semibold tracking-tight backdrop-blur-md transition hover:-translate-y-0.5 hover:border-accent/70 hover:bg-accent/15 active:scale-95">{c.label}</button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* dock: what she is saying + controls */}
      <div className="relative z-10 mx-auto mt-4 flex w-full max-w-3xl flex-col items-center gap-3">
        {phase !== "gate" && <p className="min-h-[3.5rem] w-full rounded-2xl border border-line bg-black/55 px-5 py-3 text-center text-base leading-snug text-ink backdrop-blur-md sm:text-lg">{caption}</p>}
        <div className="flex items-center gap-4">
          {phase === "ready" && isTeach && <button onClick={advance} className="flex items-center gap-1.5 text-xs text-muted hover:text-ink"><SkipForward className="size-3.5" /> Skip to the check</button>}
          {phase === "ready" && !isTeach && (
            <button onClick={tapMic} aria-label="Answer by voice" className="relative grid size-12 place-items-center rounded-full bg-gradient-to-br from-[#a5b1ff] to-[#7a8cff] text-[#0a0c18] shadow-[0_10px_40px_-8px_rgba(139,156,255,0.9)] transition-transform active:scale-95">
              {voice.listening && <span className="absolute inset-0 rounded-full border-2 border-[#a5b1ff]" style={{ transform: `scale(${1.15 + voice.mic * 0.9})`, opacity: 0.7, transition: "transform 80ms" }} />}
              <Mic className="size-5" />
            </button>
          )}
          {phase === "ready" && !isTeach && <span className="text-xs text-muted">{voice.listening ? "Listening…" : heard ? `You said: ${heard}` : "Tap an answer, or say it"}</span>}
          {phase === "reveal" && (
            <>
              <button className="btn btn-primary !py-2.5" onClick={proceed}>{reveal?.next.kind === "explain" ? "Show me" : "Next"} <ArrowRight className="size-4" /></button>
              <Link href="/twin" className="text-xs text-muted hover:text-ink">See my skills</Link>
            </>
          )}
        </div>
        {micNote && <span className="text-xs text-danger" role="alert">{micNote}</span>}
      </div>

      {/* start gate */}
      <AnimatePresence>
        {phase === "gate" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 grid place-items-end justify-items-center bg-gradient-to-t from-bg via-bg/70 to-transparent pb-16 lg:pb-20">
            <div className="text-center">
              <div className="eyebrow mb-2" style={{ color: char.accent }}>{char.role}</div>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Hi, I&apos;m {char.name}.</h1>
              <p className="mt-2 text-muted">Let&apos;s explore {subjectById(activeSubject(twin)).name} together.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button className="btn btn-primary !px-7 !py-3.5" onClick={() => begin(true)}><Mic className="size-4" /> Start with voice</button>
                <button className="btn btn-ghost !py-3.5" onClick={() => begin(false)}>No sound, just watch</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
