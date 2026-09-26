/**
 * Data-driven 3D teaching scenes. Each concept has a set of steps; `buildBlocks(concept, step)` returns
 * the blocks that exist at that step. The renderer tweens blocks with the same id (position, size,
 * colour, opacity), so going from one step to the next animates instead of jumping.
 */
import { conditions, continents, latlon, lists, loops, scale, timezones, variables } from "./visuals2";

export type Block = {
  id: string;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  color: string;
  glow?: number;
  opacity?: number;
  label?: string;
  /** Label only: no visible box. */
  ghost?: boolean;
  /** Label size multiplier. */
  size?: number;
};

const BLUE = "#7a8cff";
const AMBER = "#f5b971";
const MINT = "#5eead4";
const CYAN = "#67d4ff";
const SLATE = "#3b4577";
const GREY = "#2b3150";
const WHITE = "#e8ecff";

const box = (id: string, x: number, y: number, z: number, w: number, h: number, d: number, color: string, extra: Partial<Block> = {}): Block => ({ id, x, y, z, w, h, d, color, ...extra });
const tag = (id: string, x: number, y: number, z: number, label: string): Block => ({ id: `tag:${id}`, x, y, z, w: 0.01, h: 0.01, d: 0.01, color: WHITE, ghost: true, label });

function fractions(step: number): Block[] {
  const xs = [-1.5, -0.5, 0.5, 1.5];
  const out: Block[] = [box("floor", 0, -0.2, 0, 7.4, 0.1, 2.2, GREY)];
  xs.forEach((bx, i) => {
    let x = bx;
    if (step === 1) x += i < 2 ? -0.16 : 0.16;
    if (step >= 2) x += (i - 1.5) * 0.14;
    let color = BLUE;
    let lift = 0;
    let glow = 0;
    if (step === 1 && i < 2) [color, lift] = [AMBER, 0.3];
    if (step === 2 && i === 0) [color, lift] = [AMBER, 0.3];
    if (step === 3) {
      if (i < 2) [color, lift] = [AMBER, 0.3];
      if (i === 2) [color, lift] = [MINT, 0.3];
    }
    if (step === 4 && i < 3) [color, lift, glow] = [MINT, 0.35, 0.5];
    out.push(box(`q${i}`, x, 0.3 + lift, 0, step === 0 ? 1.0 : 0.94, 0.6, 1.6, color, { glow }));
  });
  if (step === 0) out.push(tag("a", 0, 1.5, 0, "1 whole"));
  if (step === 1) out.push(tag("a", -1.15, 1.6, 0, "1/2"), tag("b", 1.15, 1.6, 0, "1/2"));
  if (step === 2) xs.forEach((bx, i) => out.push(tag(`q${i}`, bx + (i - 1.5) * 0.14, 1.6, 0, "1/4")));
  if (step === 3) out.push(tag("a", -1.0, 1.7, 0, "1/2 = 2/4"), tag("b", 0.64, 1.7, 0, "1/4"));
  if (step === 4) out.push(tag("a", -0.4, 1.9, 0, "3/4"));
  return out;
}

function percentages(step: number): Block[] {
  const k = [0, 0, 10, 20, 50][step] ?? 0;
  const out: Block[] = [];
  for (let i = 0; i < 100; i++) {
    const r = Math.floor(i / 10);
    const c = i % 10;
    const hi = i < k;
    out.push(box(`c${i}`, (c - 4.5) * 0.42, hi ? 0.32 : 0.1, (r - 4.5) * 0.42 + 0.3, 0.36, hi ? 0.5 : 0.18, 0.36, hi ? AMBER : SLATE, { glow: hi ? 0.35 : 0 }));
  }
  const label = ["100 squares", "100 squares", "10%", "20%", "50%"][step];
  out.push(tag("a", 0, 1.9, 0, label));
  return out;
}

function ratios(step: number): Block[] {
  const groups = step >= 2 ? 3 : 1;
  const out: Block[] = [box("floor", 0, -0.2, 0, 8.2, 0.1, 2.4, GREY)];
  for (let g = 0; g < groups; g++) {
    const gx = groups === 1 ? 0 : (g - 1) * 2.7;
    for (let j = 0; j < 2; j++) out.push(box(`b${g}${j}`, gx - 0.5, 0.35 + j * 0.7, 0, 0.62, 0.62, 0.62, BLUE, { glow: 0.2 }));
    for (let j = 0; j < 3; j++) out.push(box(`w${g}${j}`, gx + 0.5, 0.35 + j * 0.7, 0, 0.62, 0.62, 0.62, WHITE));
  }
  const label = ["2 blue : 3 white", "2 : 3", "repeat it 3 times", "6 : 9  (still 2 : 3)"][step];
  out.push(tag("a", 0, 2.7, 0, label));
  return out;
}

function linear(step: number): Block[] {
  const out: Block[] = [box("beam", 0, -0.2, 0.2, 8, 0.16, 3, GREY), box("pivot", 0, -0.6, 0.2, 0.5, 0.7, 0.5, SLATE)];
  const bx = [-3.3, -2.4, -1.5];
  bx.forEach((x, i) => out.push(box(`b${i}`, x, 0.5, -0.3, 0.8, 0.8, 0.8, step === 3 ? MINT : AMBER, { glow: step === 3 ? 0.5 : 0.15, label: step === 3 ? "5" : "x" })));
  if (step <= 0) for (let i = 0; i < 4; i++) out.push(box(`l${i}`, -3.3 + i * 0.5, 0.15, 1.0, 0.34, 0.34, 0.34, CYAN));
  for (let i = 0; i < 19; i++) {
    const inBoxes = step >= 2 && i < 15;
    if (step >= 1 && i >= 15) continue;
    if (inBoxes) {
      const k = Math.floor(i / 5);
      out.push(box(`r${i}`, bx[k], 0.12 + (i % 5) * 0.3, 1.0, 0.3, 0.26, 0.3, CYAN));
    } else {
      out.push(box(`r${i}`, 1.4 + (i % 5) * 0.55, 0.15, -0.5 + Math.floor(i / 5) * 0.55, 0.34, 0.34, 0.34, CYAN));
    }
  }
  out.push(tag("a", 0, 2.4, 0, ["3x + 4 = 19", "take 4 from both sides", "3x = 15", "x = 5"][step]));
  return out;
}

function functions(step: number): Block[] {
  const out: Block[] = [box("belt", 0, -0.2, 0, 9, 0.12, 1.2, GREY), box("m", 0, 0.9, 0, 1.9, 1.8, 1.6, BLUE, { glow: step === 2 || step === 3 ? 0.6 : 0.2, opacity: 0.55, label: "x2, then +1" })];
  const t = [
    [-3.4, 0.5, 0.7, AMBER, "3"],
    [-1.7, 0.5, 0.7, AMBER, "3"],
    [0, 0.9, 0.5, CYAN, "6"],
    [0, 0.9, 0.5, MINT, "7"],
    [3.4, 0.5, 0.7, MINT, "7"],
  ][step] as [number, number, number, string, string];
  out.push(box("t", t[0], t[1], 0, t[2], t[2], t[2], t[3], { glow: 0.4, label: t[4] }));
  if (step === 4) out.push(tag("a", 3.4, 1.6, 0, "f(3) = 7"));
  return out;
}

function words(step: number): Block[] {
  const out: Block[] = [];
  for (let i = 0; i < 17; i++) {
    let x = -3.6 + i * 0.44;
    let color = BLUE;
    let y = 0.3;
    if (step >= 1 && i >= 12) [color, y, x] = [CYAN, 0.7, x + 0.7];
    if (step >= 2 && i < 12) {
      color = AMBER;
      x += i < 6 ? -0.25 : 0.25;
    }
    out.push(box(`u${i}`, x, y, 0, 0.38, 0.38, 0.38, color, { glow: step >= 2 && i < 12 ? 0.3 : 0 }));
  }
  const label = ["17 in all", "5 more: set it aside", "twice x = 12, so split it", "x = 6"][step];
  out.push(tag("a", 0, 1.8, 0, label));
  if (step >= 2) out.push(tag("h1", -3.6 + 2.5 * 0.44 - 0.25, 1.1, 0, "x"), tag("h2", -3.6 + 8.5 * 0.44 + 0.25, 1.1, 0, "x"));
  return out;
}

function geometry(step: number): Block[] {
  const out: Block[] = [];
  for (let i = 0; i < 15; i++) {
    const c = i % 5;
    const r = Math.floor(i / 5);
    const filled = step >= 2;
    out.push(box(`t${i}`, (c - 2) * 0.9, filled ? 0.25 : 0.05, (r - 1) * 0.9, 0.82, filled ? 0.4 : 0.12, 0.82, filled ? MINT : SLATE, { glow: filled ? 0.3 : 0 }));
  }
  if (step === 1 || step === 3) {
    const w = 5 * 0.9 + 0.2;
    const d = 3 * 0.9 + 0.2;
    out.push(
      box("e0", 0, 0.3, -d / 2, w, 0.16, 0.16, AMBER, { glow: 0.7 }),
      box("e1", 0, 0.3, d / 2, w, 0.16, 0.16, AMBER, { glow: 0.7 }),
      box("e2", -w / 2, 0.3, 0, 0.16, 0.16, d, AMBER, { glow: 0.7 }),
      box("e3", w / 2, 0.3, 0, 0.16, 0.16, d, AMBER, { glow: 0.7 }),
    );
  }
  out.push(tag("a", 0, 1.9, 0, ["5 by 3", "around = 16", "inside = 15", "around is not inside"][step]));
  return out;
}

const BUILDERS: Record<string, (s: number) => Block[]> = {
  fractions,
  percentages,
  ratios,
  "linear-equations": linear,
  functions,
  "word-problems": words,
  "basic-geometry": geometry,
  variables,
  loops,
  conditions,
  lists,
  continents,
  latlon,
  timezones,
  scale,
};

export const buildBlocks = (conceptId: string, step: number): Block[] => (BUILDERS[conceptId] ?? fractions)(step);
export const lastStep: Record<string, number> = { fractions: 4, percentages: 4, ratios: 3, "linear-equations": 3, functions: 4, "word-problems": 3, "basic-geometry": 3, variables: 3, loops: 3, conditions: 3, lists: 3, continents: 3, latlon: 3, timezones: 3, scale: 3 };

/** Half-width of each scene, used to frame the camera. */
export const SPAN: Record<string, number> = { fractions: 1.7, percentages: 1.9, ratios: 3.0, "linear-equations": 3.4, functions: 3.2, "word-problems": 3.2, "basic-geometry": 2.3, variables: 3.6, loops: 3.6, conditions: 3.8, lists: 3.0, continents: 3.6, latlon: 3.6, timezones: 3.8, scale: 3.6 };
