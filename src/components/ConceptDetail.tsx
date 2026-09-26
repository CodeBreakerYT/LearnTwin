"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Lock, MousePointerClick } from "lucide-react";
import { conceptById } from "@/lib/curriculum";
import { conceptOf, conceptStatus, pct, recommendForConcept } from "@/lib/engine";
import type { LearningTwin } from "@/lib/types";
import { Ring, STATUS, StatusPill } from "./ui";

export default function ConceptDetail({ twin, conceptId, onPractice }: { twin: LearningTwin; conceptId: string | null; onPractice: (id: string) => void }) {
  if (!conceptId) {
    return (
      <div className="grid h-full min-h-56 place-items-center p-6 text-center text-sm text-muted">
        <div><MousePointerClick className="mx-auto mb-3 size-6 text-faint" />Tap a skill</div>
      </div>
    );
  }
  const def = conceptById(conceptId)!;
  const cs = conceptOf(twin, conceptId);
  const status = conceptStatus(twin, conceptId);
  const rec = recommendForConcept(twin, conceptId);
  return (
    <AnimatePresence mode="wait">
      <motion.div key={conceptId} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-col items-center gap-4 p-6 text-center">
        <Ring value={cs.mastery} size={110} stroke={9} color={STATUS[status].color}>
          {status === "locked" ? <Lock className="size-6 text-locked" /> : <span className="tabnum text-2xl font-semibold">{pct(cs.mastery)}</span>}
        </Ring>
        <div>
          <h3 className="text-xl font-semibold tracking-tight">{def.name}</h3>
          <div className="mt-2"><StatusPill status={status} /></div>
        </div>
        <p className="text-sm text-muted">{rec.text}</p>
        {status !== "locked" && <button className="btn btn-primary !py-2.5 !text-sm" onClick={() => onPractice(conceptId)}>Play this skill <ArrowRight className="size-4" /></button>}
      </motion.div>
    </AnimatePresence>
  );
}
