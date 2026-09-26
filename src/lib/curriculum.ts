export type Domain = { id: string; name: string; blurb: string };
export type ConceptDef = {
  id: string;
  name: string;
  domain: string;
  prereqs: string[];
  blurb: string;
  /** Position in the knowledge graph. */
  pos: { x: number; y: number };
};

export const SUBJECT_ID = "mathematics";
export const SUBJECT_NAME = "Mathematics";

export const DOMAINS: Domain[] = [
  { id: "number-sense", name: "Number Sense", blurb: "Fractions, percentages and proportional reasoning" },
  { id: "algebra", name: "Algebra", blurb: "Equations, functions and modelling with symbols" },
  { id: "geometry", name: "Geometry", blurb: "Shapes, perimeter and area" },
];

export const DOMAIN_POS: Record<string, { x: number; y: number }> = {
  root: { x: 380, y: 0 },
  "number-sense": { x: 100, y: 130 },
  algebra: { x: 480, y: 130 },
  geometry: { x: 770, y: 130 },
};

export const CONCEPTS: ConceptDef[] = [
  { id: "fractions", name: "Fractions", domain: "number-sense", prereqs: [], blurb: "Add, subtract and compare parts of a whole", pos: { x: 100, y: 270 } },
  { id: "ratios", name: "Ratios", domain: "number-sense", prereqs: ["fractions"], blurb: "Scale quantities while keeping relationships", pos: { x: -20, y: 410 } },
  { id: "percentages", name: "Percentages", domain: "number-sense", prereqs: ["fractions"], blurb: "Parts per hundred, discounts and change", pos: { x: 220, y: 410 } },
  { id: "linear-equations", name: "Linear Equations", domain: "algebra", prereqs: [], blurb: "Isolate the unknown using inverse operations", pos: { x: 480, y: 270 } },
  { id: "functions", name: "Functions", domain: "algebra", prereqs: ["linear-equations"], blurb: "Inputs, outputs and rules", pos: { x: 380, y: 410 } },
  { id: "word-problems", name: "Word Problems", domain: "algebra", prereqs: ["linear-equations", "percentages"], blurb: "Translate real situations into equations", pos: { x: 600, y: 410 } },
  { id: "basic-geometry", name: "Basic Geometry", domain: "geometry", prereqs: [], blurb: "Perimeter, area and circles", pos: { x: 770, y: 270 } },
];

export const conceptById = (id: string) => CONCEPTS.find((c) => c.id === id);
export const conceptName = (id: string) => conceptById(id)?.name ?? id;
export const domainOf = (conceptId: string) => DOMAINS.find((d) => d.id === conceptById(conceptId)?.domain);
