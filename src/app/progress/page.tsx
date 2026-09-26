"use client";

import { motion } from "framer-motion";
import { Flame, Sparkles, Trophy } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Page, Skeleton } from "@/components/ui";
import { useTwin } from "@/components/TwinProvider";
import Link from "next/link";
import { levelInfo, stats } from "@/lib/engine";

export default function ProgressPage() {
  const { twin } = useTwin();
  if (!twin) return <Page><Skeleton className="h-28" /><Skeleton className="mt-5 h-80" /></Page>;

  if (stats(twin).totalAttempts === 0) {
    return (
      <Page className="max-w-4xl">
        <div className="grid min-h-[50vh] place-items-center text-center">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Your journey starts here.</h1>
            <p className="mt-3 text-muted">Play your first round and it will show up.</p>
            <Link href="/learn" className="btn btn-primary mt-7 !px-8 !py-3.5">Start playing</Link>
          </div>
        </div>
      </Page>
    );
  }

  const lvl = levelInfo(twin.xp);
  const data = twin.history.map((p) => ({ label: p.label, growth: Math.round(p.mastery * 100) }));
  const enough = data.length >= 2;

  return (
    <Page className="max-w-4xl">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Your journey</h1>

      <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { icon: Trophy, label: `Level ${lvl.level}`, value: lvl.name, color: "text-accent" },
          { icon: Sparkles, label: "XP", value: twin.xp.toLocaleString(), color: "text-mastered" },
          { icon: Flame, label: "Day streak", value: String(twin.dayStreak), color: "text-weak" },
        ].map(({ icon: Icon, label, value, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass p-4 sm:p-5">
            <Icon className={`mb-3 size-5 ${color}`} />
            <div className="tabnum text-2xl font-semibold tracking-tight sm:text-3xl">{value}</div>
            <div className="mt-0.5 text-xs text-muted">{label}</div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10" aria-label="Progress to the next level">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-[#8b9cff] to-[#5eead4]" initial={{ width: 0 }} animate={{ width: `${(lvl.into / lvl.per) * 100}%` }} transition={{ duration: 1 }} />
      </div>
      <div className="mt-2 text-xs text-muted">{lvl.per - lvl.into} XP to level {lvl.level + 1}</div>

      <section className="glass mt-8 p-5 sm:p-7">
        <h2 className="mb-4 text-lg font-semibold">Your growth</h2>
        <div className="h-72">
          {enough ? (
            <ResponsiveContainer>
              <AreaChart data={data} margin={{ left: -24, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b9cff" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#8b9cff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="#5c6178" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={28} />
                <YAxis stroke="#5c6178" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} hide />
                <Tooltip contentStyle={{ background: "#0d0f1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }} formatter={(v) => [`${v}%`, "Skill"]} />
                <Area isAnimationActive={false} type="monotone" dataKey="growth" stroke="#8b9cff" strokeWidth={3} fill="url(#g)" dot={false} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center text-center">
              <div>
                <div className="mx-auto mb-4 h-px w-56 border-t-2 border-dashed border-accent/40" />
                <p className="text-muted">Keep playing and your growth line will appear.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </Page>
  );
}
