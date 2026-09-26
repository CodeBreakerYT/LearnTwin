"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RotateCcw, UserRoundX } from "lucide-react";
import ConceptDetail from "@/components/ConceptDetail";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import { useTwin } from "@/components/TwinProvider";
import { Page, Ring, Skeleton } from "@/components/ui";
import { levelInfo, practiceConcept, stats, strongestWeakest } from "@/lib/engine";

export default function TwinPage() {
  const { twin, update, resetDemo, resetBlank } = useTwin();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  if (!twin) {
    return (
      <Page>
        <Skeleton className="h-12 w-64" />
        <div className="mt-8 grid gap-5 lg:grid-cols-3"><Skeleton className="h-[520px] lg:col-span-2" /><Skeleton className="h-[520px]" /></div>
      </Page>
    );
  }

  if (stats(twin).totalAttempts === 0) {
    return (
      <Page className="max-w-4xl">
        <div className="grid min-h-[50vh] place-items-center text-center">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Your skills will grow here.</h1>
            <p className="mt-3 text-muted">Answer a few questions and they light up.</p>
            <Link href="/learn" className="btn btn-primary mt-7 !px-8 !py-3.5">Start playing</Link>
            <div className="mt-8"><button className="text-xs text-faint underline-offset-4 hover:text-muted hover:underline" onClick={resetDemo}>Load a demo learner with history</button></div>
          </div>
        </div>
      </Page>
    );
  }

  const lvl = levelInfo(twin.xp);
  const { weakest } = strongestWeakest(twin);
  const hint = stats(twin).totalAttempts === 0 ? "Answer a few questions and your skills will light up." : `Next up: ${weakest.name}`;
  const insight = { next: hint };

  const practice = (id: string) => {
    update((t) => practiceConcept(t, id));
    router.push("/learn");
  };

  return (
    <Page>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Your skills</h1>
        <div className="chip">Level {lvl.level} · {lvl.name}</div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="glass overflow-hidden p-2 sm:p-3">
          <KnowledgeGraph twin={twin} selected={selected} onSelect={setSelected} />
        </section>
        <div className="flex flex-col gap-5">
          <section className="glass flex items-center gap-5 p-5">
            <Ring value={twin.overallMastery} size={92} stroke={8} color="var(--developing)">
              <span className="tabnum text-xl font-semibold">{Math.round(twin.overallMastery * 100)}%</span>
            </Ring>
            <p className="text-sm leading-relaxed text-muted">{insight.next}</p>
          </section>
          <section className="glass">
            <ConceptDetail twin={twin} conceptId={selected} onPractice={practice} />
          </section>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <button className="btn btn-ghost !px-3.5 !py-2 !text-xs" onClick={() => confirm("Reset to the demo profile?") && resetDemo()}><RotateCcw className="size-3.5" /> Reset demo</button>
        <button className="btn btn-ghost !px-3.5 !py-2 !text-xs" onClick={() => confirm("Start with a brand-new empty profile?") && resetBlank()}><UserRoundX className="size-3.5" /> Start fresh</button>
      </div>
    </Page>
  );
}
