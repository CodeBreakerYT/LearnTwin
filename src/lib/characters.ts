import type { CharacterId, Strategy } from "./types";

export type Character = {
  id: CharacterId;
  name: string;
  role: string;
  tagline: string;
  style: string;
  bestFor: string;
  approach: string;
  vrm: string;
  accent: string;
  accentSoft: string;
  defaultStrategy: Strategy;
  persona: string;
  subject: string;
};

export const CHARACTERS: Record<CharacterId, Character> = {
  nova: {
    id: "nova",
    name: "Nova",
    role: "Patient Mentor",
    subject: "mathematics",
    tagline: "Slows things down until they click.",
    style: "Calm, encouraging, step-by-step",
    bestFor: "Mathematics: fractions, equations, geometry",
    approach: "Breaks a problem into small moves, checks each one, and never rushes to the answer.",
    vrm: "/models/AvatarSample_B.vrm",
    accent: "#8b9cff",
    accentSoft: "rgba(139,156,255,0.16)",
    defaultStrategy: "step-by-step",
    persona:
      "Nova is a calm, patient mentor. She speaks in short, warm sentences, breaks reasoning into small steps, and celebrates careful thinking over speed.",
  },
  byte: {
    id: "byte",
    name: "Byte",
    role: "Playful Problem Solver",
    subject: "programming",
    tagline: "Turns code into something you can see.",
    style: "Energetic, concise, challenge-oriented",
    bestFor: "Programming: variables, loops, conditions, lists",
    approach: "Shows a tiny program running, step by step, in short punchy sentences.",
    vrm: "/models/AvatarSample_C.vrm",
    accent: "#5eead4",
    accentSoft: "rgba(94,234,212,0.14)",
    defaultStrategy: "example",
    persona:
      "Byte is an energetic, playful coding coach. Replies are brief and punchy, use tiny programming examples, and stay focused on the concept rather than jokes.",
  },
  atlas: {
    id: "atlas",
    name: "Atlas",
    role: "Explorer",
    subject: "geography",
    tagline: "Takes you around the world, one idea at a time.",
    style: "Analogies, stories, real-world examples",
    bestFor: "Geography: maps, coordinates, time zones",
    approach: "Connects places and maps to everyday things you already know, then shows it on the globe.",
    vrm: "/models/AvatarSample_A.vrm",
    accent: "#f5b971",
    accentSoft: "rgba(245,185,113,0.14)",
    defaultStrategy: "analogy",
    persona:
      "Atlas is a curious geography guide who explains places, maps and time with vivid analogies and small stories, then ties them back to the concept.",
  },
};

export const CHARACTER_LIST = Object.values(CHARACTERS);
/** The Twin's own guide on the landing and dashboard pages. */
export const TWIN_GUIDE_VRM = "/models/Unagirl.vrm";
