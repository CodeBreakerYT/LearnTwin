"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, GraduationCap, LayoutDashboard, LineChart, Sparkles, Users, Zap } from "lucide-react";
import { levelInfo, stats } from "@/lib/engine";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useTwin } from "./TwinProvider";

const LINKS = [
  { href: "/learn", label: "Learn", icon: GraduationCap },
  { href: "/twin", label: "Twin", icon: LayoutDashboard },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/characters", label: "Characters", icon: Users },
];

export function DemoBadge() {
  const { demoActive } = useTwin();
  if (!demoActive) return null;
  return (
    <span
      title="No Groq key, or Groq is unreachable. Responses come from the deterministic demo engine; the Learning Twin still updates for real."
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-weak/40 bg-weak/10 px-2.5 py-1 text-[0.65rem] font-semibold tracking-[0.14em] text-weak"
    >
      <span className="size-1.5 rounded-full bg-weak" />
      DEMO MODE
    </span>
  );
}

export default function Nav() {
  const path = usePathname();
  const { twin } = useTwin();
  const { user, ready, signOut } = useAuth();
  const [menu, setMenu] = useState(false);
  const lvl = twin ? levelInfo(twin.xp) : null;
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-bg/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-[#a5b1ff] to-[#5eead4] text-[#07080f]">
              <Sparkles className="size-4" strokeWidth={2.5} />
            </span>
            <span className="hidden text-[1.05rem] sm:inline">LearnTwin</span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {LINKS.map(({ href, label }) => {
              const active = path === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${active ? "bg-white/10 text-ink" : "text-muted hover:text-ink"}`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <DemoBadge />
            {twin && lvl && stats(twin).totalAttempts > 0 && (
              <>
                <span className="chip tabnum" title={`Level ${lvl.level} · ${lvl.name}`}>
                  <Zap className="size-3.5 text-developing" /> {twin.xp.toLocaleString()} XP
                </span>
                <span className="chip tabnum" title="Day streak">
                  <Flame className="size-3.5 text-weak" /> {twin.dayStreak}
                  <span className="hidden sm:inline"> day streak</span>
                </span>
              </>
            )}
            {ready && !user && <Link href="/login" className="btn btn-ghost !px-4 !py-1.5 !text-sm">Sign in</Link>}
            {user && (
              <div className="relative">
                <button onClick={() => setMenu((v) => !v)} aria-label="Account" className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-[#a5b1ff] to-[#5eead4] text-sm font-bold text-[#07080f]">
                  {(user.displayName || user.email || "?").charAt(0).toUpperCase()}
                </button>
                {menu && (
                  <div className="glass absolute right-0 top-11 z-50 w-52 p-2 text-sm">
                    <div className="truncate px-3 py-2 text-xs text-muted">{user.email}</div>
                    <button onClick={() => { setMenu(false); void signOut(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-white/10"><LogOut className="size-4" /> Sign out</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-bg/85 backdrop-blur-xl md:hidden">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link key={href} href={href} className={`flex flex-col items-center gap-1 py-2.5 text-[0.68rem] ${active ? "text-ink" : "text-muted"}`}>
              <Icon className={`size-5 ${active ? "text-developing" : ""}`} />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
