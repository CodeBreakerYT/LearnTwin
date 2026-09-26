import type { CharacterId } from "./types";
import { MORE_LESSONS } from "./lessons2";

export type Domain = { id: string; subject: string; name: string; blurb: string };
export type ConceptDef = {
  id: string;
  subject: string;
  name: string;
  domain: string;
  prereqs: string[];
  blurb: string;
  /** Position in the knowledge graph. */
  pos: { x: number; y: number };
};

/** The Twin keeps every concept's state in one container (named after the first subject). */
export const SUBJECT_ID = "mathematics";
export const SUBJECT_NAME = "Mathematics";

export type Subject = { id: string; name: string; character: CharacterId; blurb: string };
export const SUBJECTS: Subject[] = [
  { id: "mathematics", name: "Mathematics", character: "nova", blurb: "Fractions, equations, geometry" },
  { id: "programming", name: "Programming", character: "byte", blurb: "Variables, loops, conditions, lists" },
  { id: "geography", name: "Geography", character: "atlas", blurb: "Maps, coordinates, time zones" },
];
export const SUBJECT_OF_CHARACTER: Record<CharacterId, string> = { nova: "mathematics", byte: "programming", atlas: "geography" };
export const subjectById = (id: string) => SUBJECTS.find((x) => x.id === id) ?? SUBJECTS[0];
export const subjectOfConcept = (conceptId: string) => CONCEPTS.find((c) => c.id === conceptId)?.subject ?? "mathematics";

export const DOMAINS: Domain[] = [
  { id: "number-sense", subject: "mathematics", name: "Number Sense", blurb: "Fractions, percentages and proportional reasoning" },
  { id: "algebra", subject: "mathematics", name: "Algebra", blurb: "Equations, functions and modelling with symbols" },
  { id: "geometry", subject: "mathematics", name: "Geometry", blurb: "Shapes, perimeter and area" },
  { id: "prog-core", subject: "programming", name: "Core ideas", blurb: "Storing values and making choices" },
  { id: "prog-flow", subject: "programming", name: "Repeating and storing", blurb: "Loops and lists" },
  { id: "geo-world", subject: "geography", name: "The world", blurb: "Places and coordinates" },
  { id: "geo-tools", subject: "geography", name: "Reading maps", blurb: "Scale and time" },
];

export const DOMAIN_POS: Record<string, { x: number; y: number }> = {
  root: { x: 380, y: 0 },
  "number-sense": { x: 100, y: 130 },
  algebra: { x: 480, y: 130 },
  geometry: { x: 770, y: 130 },
  "prog-core": { x: 200, y: 130 },
  "prog-flow": { x: 600, y: 130 },
  "geo-world": { x: 100, y: 130 },
  "geo-tools": { x: 480, y: 130 },
};

export const CONCEPTS: ConceptDef[] = [
  // Mathematics (Nova)
  { id: "fractions", subject: "mathematics", name: "Fractions", domain: "number-sense", prereqs: [], blurb: "Add, subtract and compare parts of a whole", pos: { x: 100, y: 270 } },
  { id: "ratios", subject: "mathematics", name: "Ratios", domain: "number-sense", prereqs: ["fractions"], blurb: "Scale quantities while keeping relationships", pos: { x: -20, y: 410 } },
  { id: "percentages", subject: "mathematics", name: "Percentages", domain: "number-sense", prereqs: ["fractions"], blurb: "Parts per hundred, discounts and change", pos: { x: 220, y: 410 } },
  { id: "linear-equations", subject: "mathematics", name: "Linear Equations", domain: "algebra", prereqs: [], blurb: "Isolate the unknown using inverse operations", pos: { x: 480, y: 270 } },
  { id: "functions", subject: "mathematics", name: "Functions", domain: "algebra", prereqs: ["linear-equations"], blurb: "Inputs, outputs and rules", pos: { x: 380, y: 410 } },
  { id: "word-problems", subject: "mathematics", name: "Word Problems", domain: "algebra", prereqs: ["linear-equations", "percentages"], blurb: "Translate real situations into equations", pos: { x: 600, y: 410 } },
  { id: "basic-geometry", subject: "mathematics", name: "Basic Geometry", domain: "geometry", prereqs: [], blurb: "Perimeter, area and circles", pos: { x: 770, y: 270 } },
  // Programming (Byte)
  { id: "variables", subject: "programming", name: "Variables", domain: "prog-core", prereqs: [], blurb: "Boxes that hold values", pos: { x: 100, y: 270 } },
  { id: "conditions", subject: "programming", name: "If and Else", domain: "prog-core", prereqs: [], blurb: "Choosing a path", pos: { x: 300, y: 270 } },
  { id: "loops", subject: "programming", name: "Loops", domain: "prog-flow", prereqs: ["variables"], blurb: "Repeating a step", pos: { x: 500, y: 270 } },
  { id: "lists", subject: "programming", name: "Lists", domain: "prog-flow", prereqs: ["variables"], blurb: "Items in order", pos: { x: 700, y: 270 } },
  // Geography (Atlas)
  { id: "continents", subject: "geography", name: "Continents & Oceans", domain: "geo-world", prereqs: [], blurb: "Earth's land and water", pos: { x: 100, y: 270 } },
  { id: "latlon", subject: "geography", name: "Latitude & Longitude", domain: "geo-world", prereqs: ["continents"], blurb: "Naming any place", pos: { x: 100, y: 410 } },
  { id: "scale", subject: "geography", name: "Map Scale", domain: "geo-tools", prereqs: [], blurb: "Map distance to real distance", pos: { x: 500, y: 270 } },
  { id: "timezones", subject: "geography", name: "Time Zones", domain: "geo-tools", prereqs: ["latlon"], blurb: "Earlier in the west, later in the east", pos: { x: 320, y: 410 } },
];

export const conceptsOfSubject = (subjectId: string) => CONCEPTS.filter((c) => c.subject === subjectId);
export const domainsOfSubject = (subjectId: string) => DOMAINS.filter((d) => d.subject === subjectId);

export const conceptById = (id: string) => CONCEPTS.find((c) => c.id === id);
export const conceptName = (id: string) => conceptById(id)?.name ?? id;
export const domainOf = (conceptId: string) => DOMAINS.find((d) => d.id === conceptById(conceptId)?.domain);

export type Lesson = { title: string; body: string; example: { problem: string; steps: string[] } };

/** A short lesson taught before a concept's first question. The character teaches first, then asks. */
const MATH_LESSONS: Record<string, Lesson> = {
  fractions: {
    title: "Adding fractions",
    body: "A fraction names equal pieces of a whole. To add fractions, first make the pieces the same size, then count them. The bottom number is the piece size, so it stays the same.",
    example: { problem: "1/2 + 1/4", steps: ["Turn 1/2 into 2/4, so both are quarters", "Add the tops: 2 + 1 = 3", "Keep the bottom: 3/4"] },
  },
  percentages: {
    title: "What percent means",
    body: "Percent means out of 100. To find a percent of a number, turn the percent into a decimal by dividing by 100, then multiply.",
    example: { problem: "20% of 50", steps: ["20% = 20 ÷ 100 = 0.20", "0.20 × 50 = 10", "Check: 10 is one fifth of 50"] },
  },
  ratios: {
    title: "Scaling a ratio",
    body: "A ratio compares two amounts. To scale it up, multiply both parts by the same number. Adding the same amount to each part changes the recipe.",
    example: { problem: "2 : 3 = 6 : ?", steps: ["2 × 3 = 6, so multiply by 3", "3 × 3 = 9", "6 : 9 is the same ratio as 2 : 3"] },
  },
  "linear-equations": {
    title: "Solving for x",
    body: "An equation is a balance. To find x, undo what was done to it, working backwards, and do the same thing to both sides. Undo adding first, then undo multiplying by dividing.",
    example: { problem: "2x + 1 = 9", steps: ["Subtract 1 from both sides: 2x = 8", "Divide both sides by 2: x = 4", "Check: 2 × 4 + 1 = 9"] },
  },
  functions: {
    title: "Function machines",
    body: "A function is a rule machine. You put a number in, follow the rule, and a number comes out. Follow the order of operations: multiply before you add.",
    example: { problem: "f(x) = 2x + 1, find f(3)", steps: ["Replace x with 3: 2(3) + 1", "Multiply first: 6 + 1", "Add: 7"] },
  },
  "word-problems": {
    title: "Words into equations",
    body: "Word problems are equations in disguise. Turn each phrase into symbols: twice a number is 2x, more than means plus, and is means equals. Build the equation first, then solve it.",
    example: { problem: "Twice a number plus 3 is 11", steps: ["Twice a number: 2x. Plus 3: + 3. Is 11: = 11", "So 2x + 3 = 11", "Subtract 3, then divide by 2: x = 4"] },
  },
  "basic-geometry": {
    title: "Perimeter and area",
    body: "Perimeter is the distance around a shape, so you add the sides. Area is the space inside, so you multiply length by width. Around is not the same as inside.",
    example: { problem: "A rectangle, 5 by 3", steps: ["Perimeter: 5 + 3 + 5 + 3 = 16", "Area: 5 × 3 = 15", "Same shape, two different questions"] },
  },
};

export const LESSONS: Record<string, Lesson> = { ...MATH_LESSONS, ...MORE_LESSONS };
