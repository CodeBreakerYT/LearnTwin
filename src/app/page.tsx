"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpenCheck, Compass, Fingerprint, GitBranch, Repeat, Scale } from "lucide-react";
import TwinPreview from "@/components/TwinPreview";

const LOOP = [
  { icon: BookOpenCheck, title: "Understand", body: "A character teaches in the style the Twin thinks fits you right now." },
  { icon: Repeat, title: "Practice", body: "You answer structured questions instead of chatting." },
  { icon: Fingerprint, title: "Detect", body: "AI reads your answer and reasoning to find the misconception behind the mistake." },
  { icon: GitBranch, title: "Adapt", body: "Difficulty, strategy and next activity change. Repeated mistakes trigger a new explanation, not another question." },
  { icon: Compass, title: "Improve", body: "The Twin re-tests, confirms what is fixed and grows more accurate." },
];

const fade = { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-60px" }, transition: { duration: 0.5 } } as const;

export default function Home() {
  return (
    <>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
        <div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="chip mb-6 !text-ink">
            <span className="size-1.5 rounded-full bg-mastered" /> SDG 4 · Quality Education
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Meet your <span className="bg-gradient-to-r from-[#b7c0ff] via-[#8b9cff] to-[#5eead4] bg-clip-text text-transparent">Learning Twin.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="mt-5 text-2xl font-medium text-ink/90 sm:text-3xl">An AI that learns how YOU learn.</motion.p>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            LearnTwin analyzes your mistakes, discovers hidden knowledge gaps, and adapts every learning experience around you.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }} className="mt-9 flex flex-wrap gap-3">
            <Link href="/learn" className="btn btn-primary !px-7 !py-3.5">Start Learning <ArrowRight className="size-4" /></Link>
            <Link href="/twin" className="btn btn-ghost !px-7 !py-3.5">Explore Your Twin</Link>
          </motion.div>
          <p className="mt-6 text-sm text-faint">No sign-up. Just say hello.</p>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15, duration: 0.6 }}>
          <TwinPreview />
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <motion.div {...fade} className="mb-10 max-w-2xl">
          <div className="eyebrow mb-2">The core loop</div>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">The character is the voice. The Twin is the intelligence.</h2>
        </motion.div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {LOOP.map((s, i) => (
            <motion.div key={s.title} {...fade} transition={{ duration: 0.5, delay: i * 0.07 }} className="glass p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="grid size-9 place-items-center rounded-xl bg-accent/12 text-accent"><s.icon className="size-4.5" /></span>
                <span className="tabnum text-xs text-faint">0{i + 1}</span>
              </div>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-5 md:grid-cols-2">
          <motion.div {...fade} className="glass p-7 opacity-90">
            <div className="eyebrow mb-4 flex items-center gap-2"><Scale className="size-3.5" /> Traditional education</div>
            <ol className="space-y-3 text-muted">
              <li className="rounded-xl border border-line bg-black/20 px-4 py-3">Same content for everyone</li>
              <li className="rounded-xl border border-line bg-black/20 px-4 py-3">Same explanation, same pace</li>
              <li className="rounded-xl border border-line bg-black/20 px-4 py-3">A wrong answer is just marked wrong</li>
            </ol>
          </motion.div>
          <motion.div {...fade} transition={{ duration: 0.5, delay: 0.1 }} className="glass border-accent/30 p-7">
            <div className="eyebrow mb-4 !text-accent">LearnTwin</div>
            <ol className="space-y-3">
              {["Observe the learner", "Understand the learner", "Adapt the learning", "Continuously update the learner model"].map((t, i) => (
                <li key={t} className="flex items-center gap-3 rounded-xl border border-accent/25 bg-accent/[0.06] px-4 py-3">
                  <span className="tabnum grid size-6 place-items-center rounded-full bg-accent text-xs font-semibold text-[#0a0c18]">{i + 1}</span>{t}
                </li>
              ))}
            </ol>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6">
        <motion.div {...fade} className="glass relative overflow-hidden p-8 sm:p-12">
          <div className="pointer-events-none absolute -left-20 top-0 size-80 rounded-full bg-mastered/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <div className="eyebrow mb-2">Why SDG 4?</div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Equitable learning means meeting each learner where they are.</h2>
              <p className="mt-4 max-w-2xl leading-relaxed text-muted">
                Sustainable Development Goal 4 calls for inclusive and equitable quality education. LearnTwin explores one piece of that: adapting the learning experience to individual needs instead of treating every learner identically, and making the reasoning behind each adaptation visible. It runs on a demo curriculum today, and we make no claims about learning outcomes.
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:items-end">
              <Link href="/learn" className="btn btn-primary !px-8 !py-3.5">Try the 3-minute demo <ArrowRight className="size-4" /></Link>
              <Link href="/progress" className="btn btn-ghost">See the analytics</Link>
            </div>
          </div>
        </motion.div>
      </section>
    </>
  );
}
