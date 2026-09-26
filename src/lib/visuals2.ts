import type { Block } from "./visuals";

const BLUE = "#7a8cff";
const AMBER = "#f5b971";
const MINT = "#5eead4";
const CYAN = "#67d4ff";
const SLATE = "#3b4577";
const GREY = "#2b3150";
const WHITE = "#e8ecff";
const LAND = "#6fd08c";

const box = (id: string, x: number, y: number, z: number, w: number, h: number, d: number, color: string, extra: Partial<Block> = {}): Block => ({ id, x, y, z, w, h, d, color, ...extra });
const tag = (id: string, x: number, y: number, z: number, label: string, size = 1): Block => ({ id: `tag:${id}`, x, y, z, w: 0.01, h: 0.01, d: 0.01, color: WHITE, ghost: true, label, size });

/* -------------------------------------------------------------- programming */

export function variables(step: number): Block[] {
  const out: Block[] = [box("floor", 0, -0.2, 0, 8, 0.1, 2.6, GREY), box("bx", -1.6, 0.7, 0, 2.0, 1.4, 1.6, BLUE, { opacity: 0.4, glow: 0.2 }), tag("lx", -1.6, -0.55, 1.3, "x")];
  const v = [
    [0.6, AMBER, "5"],
    [2.0, AMBER, "5 + 2"],
    [2.0, CYAN, "7"],
    [0.6, MINT, "7"],
  ][step] as [number, string, string];
  out.push(box("vx", -1.6, v[0], 0, 0.8, 0.8, 0.8, v[1], { glow: 0.35, label: v[2] }));
  if (step >= 3) out.push(box("by", 2.2, 0.7, 0, 2.0, 1.4, 1.6, BLUE, { opacity: 0.4, glow: 0.2 }), tag("ly", 2.2, -0.55, 1.3, "y"), box("vy", 2.2, 0.6, 0, 0.8, 0.8, 0.8, MINT, { glow: 0.35, label: "7" }));
  out.push(tag("a", 0, 3.2, 0, ["x holds 5", "read the right side first", "5 + 2 = 7", "store 7 back in x"][step]));
  return out;
}

export function loops(step: number): Block[] {
  const out: Block[] = [box("belt", 0, -0.2, 0, 8.4, 0.12, 1.4, GREY), box("m", -2.6, 0.9, 0, 1.6, 1.8, 1.4, BLUE, { opacity: 0.5, glow: 0.25 }), tag("lm", -2.6, 2.1, 0, "repeat")];
  const shown = [0, 1, 2, 3][step];
  for (let i = 0; i < shown; i++) out.push(box(`k${i}`, -0.2 + i * 1.4, 0.55, 0, 0.8, 0.8, 0.8, i === shown - 1 ? MINT : AMBER, { glow: 0.35, label: String(i) }));
  out.push(tag("a", 0.6, 2.7, 0, ["a loop machine", "i starts at 0", "0, then 1", "3 passes: 0, 1, 2"][step]));
  return out;
}

export function conditions(step: number): Block[] {
  const t = [
    [0, 0.4, 2.2, "50"],
    [0, 0.9, 0, "50"],
    [3, 0.9, 0, "true"],
    [3, 0.9, 0, "true"],
  ][step] as [number, number, number, string];
  const yes = step >= 2;
  return [
    box("floor", 0, -0.2, 0, 9, 0.1, 3.4, GREY),
    box("g", 0, 0.9, 0, 1.6, 1.6, 1.4, BLUE, { opacity: 0.5, glow: step === 1 ? 0.6 : 0.2 }),
    box("yes", 3, 0.3, 0, 1.9, 0.6, 1.5, yes ? MINT : SLATE, { glow: yes ? 0.6 : 0 }),
    box("no", -3, 0.3, 0, 1.9, 0.6, 1.5, SLATE),
    tag("y", 3, 1.2, 0, "yes: 1"),
    tag("n", -3, 1.2, 0, "no: 0"),
    tag("c", 0, 2.6, 0, ["choose a path", "is 50 >= 50 ?", "equal counts: true", "> alone says false"][step]),
    box("t", t[0], t[1], t[2], 0.7, 0.7, 0.7, AMBER, { glow: 0.4, label: t[3] }),
  ];
}

export function lists(step: number): Block[] {
  const vals = ["10", "20", "30"];
  const out: Block[] = [box("floor", 0, -0.2, 0, 7, 0.1, 2.6, GREY)];
  vals.forEach((v, i) => {
    const pick = (step === 1 && i === 0) || (step >= 2 && i === 1);
    out.push(box(`c${i}`, (i - 1) * 1.8, pick ? 0.75 : 0.45, 0, 1.5, 0.9, 1.5, step === 3 && i === 1 ? MINT : pick ? AMBER : BLUE, { glow: pick ? 0.5 : 0.1, label: v }), tag(`i${i}`, (i - 1) * 1.8, 0.05, 1.5, String(i)));
  });
  out.push(tag("a", 0, 2.6, 0, ["a list keeps items in order", "the first index is 0", "list[1] is the second item", "list[1] = 20"][step]));
  return out;
}

/* ---------------------------------------------------------------- geography */

export function continents(step: number): Block[] {
  const lands: [string, number, number, number, number, string][] = [
    ["na", -2.7, -0.9, 1.5, 1.1, "N. America"],
    ["sa", -2.2, 0.9, 0.9, 1.3, "S. America"],
    ["eu", -0.4, -0.95, 0.9, 0.8, "Europe"],
    ["af", -0.3, 0.5, 1.2, 1.4, "Africa"],
    ["as", 1.7, -0.7, 2.0, 1.4, "Asia"],
    ["au", 2.5, 1.2, 1.0, 0.8, "Australia"],
    ["an", 0, 2.35, 2.8, 0.6, "Antarctica"],
  ];
  const out: Block[] = [box("sea", 0, -0.2, 0.7, 7.6, 0.1, 5.4, "#233a75")];
  const hi = step >= 1;
  lands.forEach(([id, x, z, w, d, name]) => out.push(box(id, x, hi ? 0.4 : 0.25, z, w, hi ? 0.5 : 0.3, d, LAND, { glow: hi ? 0.35 : 0, label: hi ? name : undefined, size: 0.6 })));
  if (step >= 2) out.push(tag("o1", -3.3, 0.5, 0.2, "Pacific", 0.55), tag("o2", -1.2, 0.5, 2.0, "Atlantic", 0.55), tag("o3", 1.3, 0.5, 2.2, "Indian", 0.55), tag("o4", 3.2, 0.5, 2.4, "Southern", 0.55), tag("o5", 0, 0.5, -2.4, "Arctic", 0.55));
  out.push(tag("a", 0, 2.4, 0, ["Earth's land", "7 continents", "5 oceans", "7 continents + 5 oceans"][step]));
  return out;
}

export function latlon(step: number): Block[] {
  const out: Block[] = [box("p", 0, -0.1, 0, 8, 0.15, 4.4, SLATE)];
  if (step >= 1) [-1.4, -0.7, 0, 0.7, 1.4].forEach((z, i) => out.push(box(`la${i}`, 0, 0.05, z, 7.6, 0.07, 0.07, z === 0 ? AMBER : "#6d78b8", { glow: z === 0 ? 0.7 : 0.1 })));
  if (step >= 2) [-3, -1.5, 0, 1.5, 3].forEach((x, i) => out.push(box(`lo${i}`, x, 0.05, 0, 0.07, 0.07, 4.0, x === 0 ? CYAN : "#6d78b8", { glow: x === 0 ? 0.7 : 0.1 })));
  if (step >= 1) out.push(tag("eq", -2.9, 0.55, 0.1, "Equator 0°"));
  if (step >= 2) out.push(tag("pm", 0.1, 0.55, -2.4, "Prime Meridian 0°"));
  if (step >= 3) out.push(box("pin", 1.5, 0.45, -0.7, 0.4, 0.8, 0.4, MINT, { glow: 0.8 }));
  out.push(tag("a", 0, 2.2, 0, ["a grid on the map", "latitude: north-south", "longitude: east-west", "two numbers pin a place"][step]));
  return out;
}

export function timezones(step: number): Block[] {
  const out: Block[] = [box("floor", 0, -0.2, 0, 9, 0.1, 2.4, GREY)];
  for (let i = 0; i < 7; i++) {
    if (step === 0 && i !== 3) continue;
    const picked = step >= 2 && i === 6;
    out.push(box(`z${i}`, (i - 3) * 1.15, picked ? 0.7 : 0.4, 0, 0.95, picked ? 1.0 : 0.6, 1.4, picked ? MINT : i === 3 ? AMBER : i < 3 ? BLUE : CYAN, { glow: picked ? 0.7 : i === 3 ? 0.4 : 0.1, label: `${9 + i}:00` }));
  }
  if (step >= 1) out.push(tag("w", -3.6, 1.5, 0, "west"), tag("e", 3.6, 1.5, 0, "east"));
  out.push(tag("a", 0, 2.5, 0, ["London, noon", "east is later", "3 hours east", "12 + 3 = 15:00"][step]));
  return out;
}

export function scale(step: number): Block[] {
  const out: Block[] = [box("floor", 0, -0.2, 0, 9, 0.1, 4.2, GREY)];
  const maps = step >= 2 ? 4 : 1;
  for (let i = 0; i < maps; i++) out.push(box(`m${i}`, (i - (maps - 1) / 2) * 1.1, 0.2, 1.2, 0.95, 0.3, 0.95, BLUE, { glow: 0.2, label: i === 0 ? "1 cm" : undefined }));
  const reals = step >= 2 ? 4 : step === 1 ? 1 : 0;
  for (let i = 0; i < reals; i++) out.push(box(`r${i}`, (i - (reals - 1) / 2) * 1.95, 0.3, -0.9, 1.8, 0.5, 1.6, MINT, { glow: 0.35, label: i === 0 || step >= 2 ? "10 km" : undefined }));
  out.push(tag("a", 0, 2.2, 0, ["1 cm on the map", "= 10 km for real", "4 cm on the map", "4 x 10 = 40 km"][step]));
  return out;
}
