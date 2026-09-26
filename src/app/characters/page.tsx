"use client";

import { motion } from "framer-motion";
import { Check, Lightbulb, Target } from "lucide-react";
import Avatar from "@/components/Avatar";
import { Page, Skeleton } from "@/components/ui";
import { useTwin } from "@/components/TwinProvider";
import { CHARACTER_LIST, CHARACTERS, type Character } from "@/lib/characters";
import { recommendCharacter, setCharacter } from "@/lib/engine";

const SAMPLES: Record<string, { problem: string; lines: string[] }> = {
  nova: { problem: "Solve 3x + 4 = 19", lines: ["First, take 4 away from both sides. What is left?", "Good. Now 3x = 15. What undoes “times 3”?", "Check it: does 3 × 5 + 4 give 19?"] },
  byte: { problem: "Solve 3x + 4 = 19", lines: ["Challenge: get x alone in two moves.", "Move one: −4 both sides. Move two: ÷3.", "Bonus round: try 5x − 3 = 22 in under 20 seconds."] },
  atlas: { problem: "Solve 3x + 4 = 19", lines: ["Imagine 3 identical boxes and 4 loose coins weighing 19 in total.", "Remove the coins first. The boxes share what is left equally.", "That is why we subtract, then divide."] },
};

function CharacterCard({ c, active, recommended, onPick }: { c: Character; active: boolean; recommended: boolean; onPick: () => void }) {
  const s = SAMPLES[c.id];
  return (
    <motion.article layout className="glass relative flex flex-col overflow-hidden" style={active ? { borderColor: `${c.accent}88`, boxShadow: `0 0 0 1px ${c.accent}55, 0 30px 80px -30px ${c.accent}66` } : undefined}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72" style={{ background: `radial-gradient(60% 70% at 50% 25%, ${c.accent}30, transparent 70%)` }} />
      <div className="relative h-[340px]">
        <Avatar src={c.vrm} accent={c.accent} mood={active ? "happy" : "neutral"} className="absolute inset-0" />
        <div className="absolute left-5 top-5">
          <div className="eyebrow" style={{ color: c.accent }}>{c.role}</div>
          <h2 className="text-3xl font-semibold tracking-tight">{c.name}</h2>
        </div>
        {recommended && (
          <span className="absolute right-4 top-5 chip" style={{ color: c.accent, borderColor: `${c.accent}55` }}>
            Recommended for you
          </span>
        )}
      </div>
      <div className="relative flex flex-1 flex-col gap-4 p-5 pt-2">
        <p className="text-muted">{c.tagline}</p>
        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="eyebrow mb-1">Teaching style</dt>
            <dd>{c.style}</dd>
          </div>
          <div>
            <dt className="eyebrow mb-1 flex items-center gap-1.5"><Target className="size-3" /> Best suited for</dt>
            <dd>{c.bestFor}</dd>
          </div>
        </dl>
        <div className="rounded-2xl border border-line bg-black/30 p-3.5 text-sm">
          <div className="eyebrow mb-2 flex items-center gap-1.5"><Lightbulb className="size-3" /> Example approach · {s.problem}</div>
          <ul className="space-y-1.5 text-ink/90">
            {s.lines.map((l) => (
              <li key={l} className="flex gap-2"><span style={{ color: c.accent }}>›</span>{l}</li>
            ))}
          </ul>
        </div>
        <button onClick={onPick} className={`btn mt-auto ${active ? "btn-ghost" : "btn-primary"}`} style={active ? { borderColor: `${c.accent}66`, color: c.accent } : undefined} aria-pressed={active}>
          {active ? <><Check className="size-4" /> Active tutor</> : `Learn with ${c.name}`}
        </button>
      </div>
    </motion.article>
  );
}

export default function CharactersPage() {
  const { twin, update } = useTwin();
  const rec = twin ? recommendCharacter(twin) : null;
  return (
    <Page>
      <div className="mb-8 max-w-2xl">
        <div className="eyebrow mb-2">AI companions</div>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Choose how you want to be taught.</h1>
        <p className="mt-3 text-muted">
          The character is the voice. The Learning Twin is the intelligence behind it: it decides <em>what</em> to teach and <em>how</em>, and the character delivers it in their own style.
        </p>
      </div>

      {rec && twin && (
        <div className="glass mb-6 flex flex-wrap items-center gap-3 p-4 text-sm">
          <span className="chip" style={{ color: CHARACTERS[rec.id].accent }}>Twin suggestion</span>
          <span><strong className="font-semibold">{CHARACTERS[rec.id].name}</strong>: <span className="text-muted">{rec.reason}</span></span>
        </div>
      )}

      {!twin ? (
        <div className="grid gap-5 md:grid-cols-3"><Skeleton className="h-[640px]" /><Skeleton className="h-[640px]" /><Skeleton className="h-[640px]" /></div>
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          {CHARACTER_LIST.map((c) => (
            <CharacterCard key={c.id} c={c} active={twin.character === c.id} recommended={rec?.id === c.id} onPick={() => update((t) => setCharacter(t, c.id))} />
          ))}
        </div>
      )}
      <p className="mt-6 text-xs text-faint">Characters are educational companions only. They do not build emotional dependence and stay focused on your learning.</p>
    </Page>
  );
}
