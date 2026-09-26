"use client";

export function FallbackAvatar({ accent = "#8b9cff" }: { accent?: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center overflow-hidden">
      <div className="absolute size-[70%] rounded-full opacity-40 blur-3xl" style={{ background: accent }} />
      <div className="relative animate-[floaty_5s_ease-in-out_infinite]" aria-hidden>
        <div className="mx-auto size-24 rounded-full border border-white/20" style={{ background: `radial-gradient(circle at 30% 25%, #fff6, ${accent} 60%, #1b1f3a)` }}>
          <div className="flex h-full items-center justify-center gap-4 pt-1">
            <span className="h-3 w-2 rounded-full bg-[#0b0d1a]" />
            <span className="h-3 w-2 rounded-full bg-[#0b0d1a]" />
          </div>
        </div>
        <div className="mx-auto -mt-2 h-24 w-36 rounded-t-[3rem] border border-white/15" style={{ background: `linear-gradient(180deg, ${accent}cc, #12142a)` }} />
      </div>
    </div>
  );
}
