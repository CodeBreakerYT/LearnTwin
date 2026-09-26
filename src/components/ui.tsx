"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { ConceptStatus } from "@/lib/types";

export const STATUS: Record<ConceptStatus, { label: string; color: string }> = {
  mastered: { label: "Mastered", color: "var(--mastered)" },
  developing: { label: "Growing", color: "var(--developing)" },
  weak: { label: "Getting started", color: "var(--weak)" },
  locked: { label: "Locked", color: "var(--locked)" },
};

export function Ring({ value, size = 96, stroke = 8, color = "var(--developing)", children }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.min(1, Math.max(0, value))) }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function StatusPill({ status }: { status: ConceptStatus }) {
  const s = STATUS[status];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs" style={{ borderColor: `color-mix(in srgb, ${s.color} 40%, transparent)`, color: s.color, background: `color-mix(in srgb, ${s.color} 10%, transparent)` }}>
      <span className="size-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

export function Bar({ value, color = "var(--developing)" }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${Math.round(value * 100)}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function Page({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 ${className}`}>{children}</div>;
}
