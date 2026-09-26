"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Flame, Keyboard, Loader2, Mic, Sparkles, Trophy, Volume2, VolumeX } from "lucide-react";
import Avatar from "@/components/Avatar";
import { useTyped } from "@/components/CharacterStage";
import { useTwin } from "@/components/TwinProvider";
import { CHARACTERS } from "@/lib/characters";
import { checkAnswer, parseAnswer } from "@/lib/checkAnswer";
import { buildContext, postJson } from "@/lib/client";
import { conceptName } from "@/lib/curriculum";
import { advancePlan, levelInfo, pct, stats, type Outcome } from "@/lib/engine";
import { mockAnalyze } from "@/lib/ai/mock";
import { updateLearningTwin } from "@/lib/ai/updateLearningTwin";
import type { AnalysisResponse, Source } from "@/lib/ai/schemas";
import { misconceptionLabel } from "@/lib/misconceptions";
import { questionById } from "@/lib/questions";
import { canListen, cancelListening, listen, speak, stopSpeaking, useVoiceState } from "@/lib/speech";
import { isAffirmative, spokenToAnswer, toSpeech, voiceCommand } from "@/lib/spoken";
import { guidedIntro, voiceLine } from "@/lib/voice";
import type { Activity, Analysis } from "@/lib/types";

type Phase = "gate" | "ready" | "analyzing" | "reveal";
type Bubble = { text: string; tone: "good" | "info" | "trophy" };
type Reveal = { activity: Activity; answer: string; analysis: Analysis; outcome: Outcome; next: Activity; bubbles: Bubble[]; xp: number; levelUp: boolean; win: boolean };

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const VOICE_KEY = "learntwin.voice";

export default function LearnPage() {
  const { twin, update, noteSource, status } = useTwin();
  const voice = useVoiceState();
  const [phase, setPhase] = useState<Phase>("gate");
  const [voiceOn, setVoiceOn] = useState(false);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [step, setStep] = useState(0);
  const [heard, setHeard] = useState("");
  const [typeOpen, setTypeOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [typeError, setTypeError] = useState("");
  const [micNote, setMicNote] = useState("");

  const twinRef = useRef(twin);
  const submitRef = useRef<(a: string, t: number) => void>(() => {});
  const proceedRef = useRef<() => void>(() => {});
  const runRef = useRef(0);
  const startedAt = useRef(0);
  useEffect(() => {
    twinRef.current = twin;
  }, [twin]);

  const serverVoice = Boolean(status && !status.demo);
  const act = twin?.session.activity;
  const char = twin ? CHARACTERS[twin.character] : CHARACTERS.nova;
  const introLine = twin ? twin.session.message || voiceLine(twin.character, "intro") : "";
  const secs = () => Math.max(1, Math.round((Date.now() - startedAt.current) / 100) / 10);

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
      setStep(0);
      const ticker = setInterval(() => setStep((s) => Math.min(s + 1, 3)), 700);
      const minDelay = wait(2000);

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
      clearInterval(ticker);
      if (tutor) noteSource(tutor.source);

      const message = tutor?.message ?? voiceLine(t.character, result.outcome, { concept: conceptName(a.conceptId), mastery: pct(result.masteryBefore), strategy: next.strategy, detail: res.analysis.explanation });
      update(() => {
        const n = structuredClone(result.twin);
        n.session.message = message;
        if (gen?.activity && n.session.activity.id === next.id && gen.source === "groq") n.session.activity = { ...n.session.activity, hint: gen.activity.hint, expectedSkill: gen.activity.expectedSkill, generatedBy: "ai" };
        return n;
      });

      // Gamified, encouraging feedback: celebrate wins, frame mistakes as discoveries.
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
    setReveal((r) => {
      if (r && r.next.kind !== "explain") update((t) => ({ ...t, session: { ...t.session, message: voiceLine(t.character, "intro") } }));
      return null;
    });
    setTyped("");
    setTypeError("");
    setHeard("");
    setPhase("ready");
  }, [update]);
  useEffect(() => {
    proceedRef.current = proceed;
  }, [proceed]);

  const advance = useCallback(() => {
    stopSpeaking();
    cancelListening();
    update((t) => {
      const n = advancePlan(t);
      n.session.message = guidedIntro(t.character);
      return n;
    });
  }, [update]);

  /* ------------------------------------------------- spoken interaction */
  const questionScript = useCallback((a: Activity, lead: string) => `${lead} ${toSpeech(a.prompt)}. ${(a.scaffold ?? []).map(toSpeech).join(". ")}`, []);

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
          setMicNote("Microphone unavailable. You can type instead.");
          setTypeOpen(true);
          return;
        }
        if (!alive()) return;
        if (!text) {
          tries++;
          if (tries < 3) await speak("I didn't catch that. Say your answer whenever you're ready.", id);
          continue;
        }
        setHeard(text);
        const ans = spokenToAnswer(text);
        if (ans !== null) return submitRef.current(ans, secs());
        const cmd = voiceCommand(text);
        if (cmd === "hint") await speak(a.hint, id);
        else if (cmd === "repeat") await speak(questionScript(a, lead), id);
        else {
          tries++;
          await speak("I need a number or a fraction. Try again?", id);
        }
      }
      if (alive()) setTypeOpen(true);
    },
    [serverVoice, questionScript],
  );

  const affirmLoop = useCallback(
    async (run: number, script: string) => {
      const alive = () => run === runRef.current;
      const id = twinRef.current!.character;
      for (let tries = 0; alive() && tries < 3; tries++) {
        let text = "";
        try {
          text = await listen(serverVoice);
        } catch {
          return;
        }
        if (!alive()) return;
        if (text && voiceCommand(text) === "repeat") {
          await speak(script, id);
          tries--;
          continue;
        }
        if (text && isAffirmative(text)) return advance();
        if (!text) await speak("Say ready when you want to try one.", id);
      }
    },
    [serverVoice, advance],
  );

  // Speak each new activity, then listen for the answer.
  const actId = act?.id;
  useEffect(() => {
    if (phase !== "ready" || !twinRef.current) return;
    const t = twinRef.current;
    const a = t.session.activity;
    const runs = runRef;
    const run = ++runs.current;
    startedAt.current = Date.now();
    if (!voiceOn) return;
    const lead = t.session.message || voiceLine(t.character, "intro");
    (async () => {
      if (a.kind === "explain" && a.explain) {
        const script = `${a.explain.body} Here's a simpler example. ${toSpeech(a.explain.example.problem)}. ${a.explain.example.steps.map(toSpeech).join(". ")}. Ready to try one?`;
        await speak(script, t.character);
        if (run === runRef.current) await affirmLoop(run, script);
      } else {
        await speak(questionScript(a, lead), t.character);
        if (run !== runRef.current) return;
        startedAt.current = Date.now();
        await answerLoop(run, a, lead);
      }
    })();
    return () => {
      runs.current++;
      stopSpeaking();
      cancelListening();
    };
  }, [phase, actId, voiceOn, answerLoop, affirmLoop, questionScript]);

  // Speak the feedback, then move on hands-free.
  useEffect(() => {
    if (phase !== "reveal" || !reveal || !twinRef.current) return;
    const t = twinRef.current;
    let dead = false;
    if (!voiceOn) return;
    (async () => {
      await speak(t.session.message, t.character);
      if (dead) return;
      await wait(1600);
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
    if (withVoice && !canListen()) setMicNote("This browser can't listen, so you'll tap or type your answers.");
    setPhase("ready");
  };

  const tapMic = () => {
    if (!twinRef.current || phase !== "ready" || !act) return;
    stopSpeaking();
    cancelListening();
    setMicNote("");
    const run = ++runRef.current;
    startedAt.current = Date.now();
    setVoiceOn(true);
    void answerLoop(run, act, introLine);
  };

  const sendTyped = () => {
    if (parseAnswer(typed) === null) return setTypeError("Try a number, like 7 or 3/4");
    submitRef.current(typed.trim(), secs());
  };

  /* -------------------------------------------------------------- render */
  const { shown: caption, typing } = useTyped(phase === "reveal" ? (twin?.session.message ?? "") : introLine, 32);
  if (!twin || !act) return <div className="grid min-h-[70vh] place-items-center"><Loader2 className="size-6 animate-spin text-muted" /></div>;

  const lvl = levelInfo(twin.xp);
  const played = stats(twin).totalAttempts > 0;
  const talking = voice.speaking || typing;
  const mood = phase === "analyzing" ? "thinking" : phase === "reveal" && reveal ? (reveal.win ? "happy" : "concerned") : "neutral";
  const isExplain = act.kind === "explain" && act.explain;

  return (
    <div className="relative mx-auto flex min-h-[calc(100dvh-4rem)] max-w-7xl flex-col overflow-hidden px-4 pb-24 sm:px-6 md:pb-8">
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

      {/* the character */}
      <div className="relative mt-2 h-[44vh] shrink-0 lg:absolute lg:inset-x-0 lg:bottom-40 lg:top-8 lg:mt-0 lg:h-auto">
        <div className="pointer-events-none absolute left-1/2 top-1/3 size-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" style={{ background: `${char.accent}30` }} />
        <Avatar src={char.vrm} accent={char.accent} mood={mood} speaking={talking} className="absolute inset-y-0 left-1/2 w-full max-w-[620px] -translate-x-1/2" />
        {phase === "analyzing" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-x-0 top-2 flex justify-center">
            <span className="chip !text-ink"><Loader2 className="size-3.5 animate-spin text-accent" /> Thinking about your answer</span>
          </motion.div>
        )}
        <AnimatePresence>
          {phase === "reveal" && reveal && (
            <motion.div key={reveal.activity.id} className="pointer-events-none absolute inset-x-0 top-4 flex flex-col items-center">
              <motion.div initial={{ opacity: 0, y: 20, scale: 0.6 }} animate={{ opacity: [0, 1, 1, 0], y: [20, -10, -30, -60], scale: [0.6, 1.15, 1, 1] }} transition={{ duration: 2.4, times: [0, 0.2, 0.7, 1] }} className="text-4xl font-bold tracking-tight text-[#a5b1ff] drop-shadow-[0_0_20px_rgba(139,156,255,0.8)]">+{reveal.xp} XP</motion.div>
              {reveal.win && Array.from({ length: 14 }).map((_, i) => (
                <motion.span key={i} className="absolute top-6 size-2 rounded-full" style={{ background: i % 2 ? "#5eead4" : "#a5b1ff" }} initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: Math.cos((i / 14) * Math.PI * 2) * 150, y: Math.sin((i / 14) * Math.PI * 2) * 110, opacity: 0, scale: 0.4 }} transition={{ duration: 1.1, ease: "easeOut" }} />
              ))}
              {reveal.levelUp && <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} className="mt-3 rounded-full bg-gradient-to-r from-[#8b9cff] to-[#5eead4] px-5 py-1.5 text-sm font-bold tracking-widest text-[#07080f]">LEVEL UP</motion.div>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* floating cards, left and right of the character */}
      <div className="relative z-10 mt-3 grid flex-1 content-start gap-4 lg:mt-16 lg:grid-cols-[minmax(0,320px)_1fr_minmax(0,320px)]">
        <div>
          <AnimatePresence mode="wait">
            {phase === "ready" && (
              <motion.div key={`q-${act.id}`} initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.5 }} className="glass p-5">
                <div className="eyebrow mb-2">{conceptName(act.conceptId)}</div>
                {isExplain ? <div className="text-xl font-semibold leading-snug">{act.explain!.title}</div> : <div className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{act.prompt.replace(/^Guided:\s*/, "")}</div>}
              </motion.div>
            )}
            {phase === "reveal" && reveal && (
              <motion.div key="verdict" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="glass flex items-center gap-4 p-5">
                <span className={`grid size-12 place-items-center rounded-2xl ${reveal.win ? "bg-mastered/15 text-mastered" : "bg-weak/15 text-weak"}`}>{reveal.win ? <Check className="size-6" strokeWidth={3} /> : <Sparkles className="size-6" />}</span>
                <div><div className="text-lg font-semibold">{reveal.win ? "Nailed it" : "Good try"}</div><div className="font-mono text-sm text-muted">{reveal.answer}</div></div>
              </motion.div>
            )}
            {phase === "analyzing" && (
              <motion.div key="an" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="glass p-5">
                <div className="eyebrow mb-1">You said</div><div className="font-mono text-2xl">{heard || typed || "…"}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="hidden lg:block" />

        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {phase === "ready" && isExplain && (
              <motion.div key={`e-${act.id}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.5 }} className="glass p-5">
                <div className="mb-2 text-lg font-medium">{act.explain!.example.problem}</div>
                <ol className="space-y-2 text-sm text-ink/90">
                  {act.explain!.example.steps.map((s, i) => (
                    <motion.li key={s} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.5 }} className="flex gap-2.5"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent/15 text-[0.7rem] text-accent">{i + 1}</span>{s}</motion.li>
                  ))}
                </ol>
                <button className="btn btn-primary mt-4 !py-2 !text-sm" onClick={advance}>Let&apos;s try <ArrowRight className="size-4" /></button>
              </motion.div>
            )}
            {phase === "ready" && !isExplain && act.scaffold && (
              <motion.div key={`s-${act.id}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.5, delay: 0.3 }} className="glass p-5">
                <ol className="space-y-2 text-sm">{act.scaffold.map((s) => <li key={s} className="flex gap-2"><span className="text-accent">›</span>{s}</li>)}</ol>
              </motion.div>
            )}
          </AnimatePresence>
          {phase === "reveal" && reveal && reveal.bubbles.map((b, i) => (
            <motion.div key={b.text} initial={{ opacity: 0, x: 24, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: 0.5 + i * 0.6, duration: 0.5 }} className={`glass flex items-center gap-3 px-4 py-3 text-[0.95rem] ${b.tone === "trophy" ? "!border-weak/40" : ""}`}>
              {b.tone === "trophy" ? <Trophy className="size-4 shrink-0 text-weak" /> : b.tone === "good" ? <Sparkles className="size-4 shrink-0 text-accent" /> : <Sparkles className="size-4 shrink-0 text-mastered" />}
              <span className="font-medium">{b.text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* dock: caption + mic */}
      <div className="relative z-10 mx-auto mt-auto flex w-full max-w-2xl flex-col items-center gap-4 pt-6 lg:absolute lg:inset-x-0 lg:bottom-6 lg:mt-0">
        {phase !== "gate" && (
          <motion.p key={caption.slice(0, 12)} className="min-h-[3.5rem] rounded-2xl border border-line bg-black/55 px-5 py-3 text-center text-base leading-snug text-ink backdrop-blur-md sm:text-lg">{caption}</motion.p>
        )}

        {phase === "ready" && !isExplain && (
          <div className="flex flex-col items-center gap-3">
            <button onClick={tapMic} aria-label="Answer by voice" className="relative grid size-16 place-items-center rounded-full bg-gradient-to-br from-[#a5b1ff] to-[#7a8cff] text-[#0a0c18] shadow-[0_10px_40px_-8px_rgba(139,156,255,0.9)] transition-transform active:scale-95">
              {voice.listening && <span className="absolute inset-0 rounded-full border-2 border-[#a5b1ff]" style={{ transform: `scale(${1.15 + voice.mic * 0.9})`, opacity: 0.7, transition: "transform 80ms" }} />}
              {voice.speaking ? <span className="flex h-6 items-end gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className="w-1 animate-pulse rounded-full bg-[#0a0c18]" style={{ height: `${10 + ((i * 7) % 12)}px`, animationDelay: `${i * 120}ms` }} />)}</span> : <Mic className="size-6" />}
            </button>
            <span className="text-xs text-muted">{voice.listening ? "Listening…" : voice.speaking ? `${char.name} is talking` : "Tap and say your answer"}</span>
            <button onClick={() => setTypeOpen((v) => !v)} className="flex items-center gap-1.5 text-xs text-faint hover:text-muted"><Keyboard className="size-3.5" /> type instead</button>
            {typeOpen && (
              <form onSubmit={(e) => { e.preventDefault(); sendTyped(); }} className="flex w-72 gap-2">
                <input autoFocus value={typed} onChange={(e) => { setTyped(e.target.value); setTypeError(""); }} placeholder="Your answer" aria-label="Your answer" maxLength={40} className="input !py-2.5 !text-base" />
                <button className="btn btn-primary !px-4 !py-2" disabled={!typed.trim()}>Go</button>
              </form>
            )}
            {(typeError || micNote) && <span className="text-xs text-danger" role="alert">{typeError || micNote}</span>}
          </div>
        )}

        {phase === "reveal" && (
          <div className="flex items-center gap-4">
            <button className="btn btn-primary" onClick={proceed}>{reveal?.next.kind === "explain" ? "Show me" : "Next"} <ArrowRight className="size-4" /></button>
            <Link href="/twin" className="text-xs text-muted hover:text-ink">See my skills</Link>
          </div>
        )}
      </div>

      {/* start gate */}
      <AnimatePresence>
        {phase === "gate" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 grid place-items-end justify-items-center bg-gradient-to-t from-bg via-bg/60 to-transparent pb-16 lg:pb-20">
            <div className="text-center">
              <div className="eyebrow mb-2" style={{ color: char.accent }}>{char.role}</div>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Hi, I&apos;m {char.name}.</h1>
              <p className="mt-2 text-muted">Let&apos;s talk it out.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button className="btn btn-primary !px-7 !py-3.5" onClick={() => begin(true)}><Mic className="size-4" /> Talk with {char.name}</button>
                <button className="btn btn-ghost !py-3.5" onClick={() => begin(false)}>No mic, just tap</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {phase === "analyzing" && <span className="sr-only" aria-live="polite">Analyzing your answer, step {step}</span>}
    </div>
  );
}
