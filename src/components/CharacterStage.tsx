"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { strategyLabel } from "@/lib/engine";
import type { Character } from "@/lib/characters";
import type { Strategy } from "@/lib/types";
import Avatar from "./Avatar";
import type { Mood } from "./VrmAvatar";

/** Reveals text progressively so the character reads as speaking. */
export function useTyped(text: string, cps = 70) {
  const [st, setSt] = useState({ text: "", n: 0 });
  useEffect(() => {
    if (!text) return;
    const start = performance.now();
    const id = setInterval(() => {
      const k = Math.min(text.length, Math.floor(((performance.now() - start) / 1000) * cps));
      setSt({ text, n: k });
      if (k >= text.length) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [text, cps]);
  const n = st.text === text ? st.n : 0;
  return { shown: text.slice(0, n), typing: n < text.length };
}

type Props = {
  character: Character;
  message: string;
  strategy?: Strategy;
  mood?: Mood;
  thinking?: boolean;
  tall?: boolean;
  children?: ReactNode;
};

export default function CharacterStage({ character, message, strategy, mood = "neutral", thinking = false, tall = false, children }: Props) {
  const { shown, typing } = useTyped(message);
  return (
    <div className="glass relative flex h-full flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-2/3" style={{ background: `radial-gradient(60% 60% at 50% 30%, ${character.accent}33, transparent 70%)` }} />
      <div className={`relative ${tall ? "h-[420px]" : "h-[320px] lg:h-[290px]"}`}>
        <Avatar src={character.vrm} accent={character.accent} mood={thinking ? "thinking" : mood} speaking={typing} className="absolute inset-0" />
        <div className="absolute left-5 top-5">
          <div className="eyebrow" style={{ color: character.accent }}>{character.role}</div>
          <div className="text-3xl font-semibold tracking-tight">{character.name}</div>
        </div>
        {strategy && (
          <div className="absolute right-4 top-5 text-right">
            <div className="eyebrow">Teaching strategy</div>
            <AnimatePresence mode="wait">
              <motion.div key={strategy} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="mt-1 inline-block rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: `${character.accent}66`, color: character.accent, background: character.accentSoft }}>
                {strategyLabel(strategy)}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>
      <div className="relative mt-auto px-5 pb-5">
        <div className="rounded-2xl border border-line bg-black/30 p-4 backdrop-blur">
          <p className="min-h-[3.6rem] text-[0.97rem] leading-relaxed text-ink/95">
            {thinking ? <span className="text-muted">Thinking through your answer…</span> : <>“{shown}{typing && <span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-ink/70 align-middle" />}{!typing && "”"}</>}
          </p>
        </div>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
}
