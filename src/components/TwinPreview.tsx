"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TWIN_GUIDE_VRM } from "@/lib/characters";
import Avatar from "./Avatar";

const LINES = [
  { side: "left", k: "You answer", v: "3x + 4 = 19  →  x = 12", top: "16%" },
  { side: "right", k: "The Twin analyzes", v: "You subtracted the 3 instead of dividing by it.", top: "30%" },
  { side: "left", k: "Misconception detected", v: "Incorrect inverse operation, seen 3 times.", top: "50%" },
  { side: "right", k: "Your Twin updates", v: "Linear Equations: 84% → 75%", top: "62%" },
  { side: "left", k: "Your next step adapts", v: "A step-by-step explanation, then a guided question.", top: "74%" },
] as const;

/** One large character with dialogue bubbles fading in and out on either side. */
export default function TwinPreview() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % LINES.length), 3200);
    return () => clearInterval(id);
  }, []);
  const line = LINES[i];

  return (
    <div className="relative mx-auto h-[560px] w-full max-w-[680px] sm:h-[660px]">
      <div className="pointer-events-none absolute left-1/2 top-1/3 size-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/25 blur-3xl" />
      <Avatar src={TWIN_GUIDE_VRM} accent="#8b9cff" mood={i === 3 ? "happy" : "thinking"} speaking={i % 2 === 1} framing="upper" className="absolute inset-x-[20%] inset-y-0" />

      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.6 }}
          style={{ top: line.top }}
          className={`absolute z-10 w-[40%] max-w-[250px] rounded-2xl border border-white/10 bg-[#0d1020]/80 p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md ${line.side === "left" ? "left-0" : "right-0"}`}
        >
          <div className="eyebrow mb-1.5 !text-accent">{line.k}</div>
          <div className="text-[0.95rem] leading-snug">{line.v}</div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
