import { MORE_QUESTIONS } from "./questions2";
import type { Difficulty, Question } from "./types";

type Q = Omit<Question, "conceptId" | "expectedSkill"> & { skill?: string };
const make = (conceptId: string, skill: string, items: Q[]): Question[] =>
  items.map(({ skill: s, ...q }) => ({ ...q, conceptId, expectedSkill: s ?? skill }));

const MATH_QUESTIONS: Question[] = [
  ...make("linear-equations", "Isolate x with inverse operations", [
    { id: "le-1", prompt: "Solve: x + 7 = 12", answer: 5, difficulty: "easy", hint: "What single operation cancels + 7?", solution: "Subtract 7 from both sides: x = 5.", traps: [{ value: 19, misconception: "sign-error", note: "Adding 7 moves the term the wrong way; +7 is cancelled by subtracting 7." }] },
    { id: "le-2", prompt: "Solve: 2x = 14", answer: 7, difficulty: "easy", hint: "x is multiplied by 2. What undoes multiplication?", solution: "Divide both sides by 2: x = 7.", traps: [{ value: 12, misconception: "inverse-op", note: "14 − 2 = 12 subtracts the coefficient instead of dividing by it." }, { value: 28, misconception: "inverse-op", note: "Multiplying by 2 again repeats the operation instead of undoing it." }] },
    { id: "le-3", prompt: "Solve: 3x + 4 = 19", answer: 5, difficulty: "medium", hint: "Undo the + 4 first, then deal with the 3.", solution: "19 − 4 = 15, then 15 ÷ 3 = 5.", traps: [
      { value: 12, misconception: "inverse-op", note: "19 − 4 = 15, then 15 − 3 = 12: the 3 was subtracted when it should have divided." },
      { value: 15, misconception: "inverse-op", note: "15 is the value of 3x. The last step, dividing by 3, was skipped." },
      { value: 7.67, misconception: "sign-error", note: "19 + 4 = 23 adds the constant instead of subtracting it." },
    ] },
    { id: "le-4", prompt: "Solve: 5x − 3 = 22", answer: 5, difficulty: "medium", hint: "What cancels − 3?", solution: "Add 3: 5x = 25, then divide by 5: x = 5.", traps: [{ value: 3.8, misconception: "sign-error", note: "22 − 3 = 19 subtracts where the equation needs you to add 3." }, { value: 14, misconception: "inverse-op", note: "22 − 3 − 5 removes the coefficient by subtraction." }] },
    { id: "le-5", prompt: "Solve: 2x + 9 = 21", answer: 6, difficulty: "medium", hint: "Two moves: cancel the + 9, then cancel the ×2.", solution: "21 − 9 = 12, then 12 ÷ 2 = 6.", traps: [{ value: 15, misconception: "sign-error", note: "21 + 9 = 30 adds instead of subtracting." }, { value: 10, misconception: "inverse-op", note: "21 − 9 − 2 subtracts the coefficient." }, { value: 12, misconception: "inverse-op", note: "12 is 2x; the final division by 2 is missing." }] },
    { id: "le-6", prompt: "Solve: 4(x + 2) = 36", answer: 7, difficulty: "hard", hint: "Divide by 4 first, or expand the brackets.", solution: "36 ÷ 4 = 9, so x + 2 = 9 and x = 7." },
    { id: "le-7", prompt: "Solve: 2x + 5 = 4x − 3", answer: 4, difficulty: "hard", hint: "Collect the x-terms on one side.", solution: "Subtract 2x: 5 = 2x − 3, add 3: 8 = 2x, so x = 4.", traps: [{ value: 1, misconception: "sign-error", note: "(5 − 3) ÷ 2 = 1 moves −3 across with the wrong sign." }] },
  ]),
  ...make("fractions", "Combine fractions with a common denominator", [
    { id: "fr-1", prompt: "What is 1/2 + 1/4? (fraction or decimal)", answer: 0.75, difficulty: "easy", hint: "Rewrite 1/2 as quarters first.", solution: "1/2 = 2/4, and 2/4 + 1/4 = 3/4.", traps: [{ value: 2 / 6, misconception: "fraction-parts", note: "2/6 adds the tops and the bottoms separately." }] },
    { id: "fr-2", prompt: "What is 3/4 of 20?", answer: 15, difficulty: "easy", hint: "Find 1/4 of 20, then take 3 of them.", solution: "20 ÷ 4 = 5, and 5 × 3 = 15." },
    { id: "fr-3", prompt: "What is 1/3 + 2/5? (fraction or decimal)", answer: 11 / 15, difficulty: "medium", hint: "A common denominator for 3 and 5 is 15.", solution: "5/15 + 6/15 = 11/15.", traps: [{ value: 3 / 8, misconception: "fraction-parts", note: "3/8 adds numerators and denominators separately." }] },
    { id: "fr-4", prompt: "What is 3/4 − 1/6? (fraction or decimal)", answer: 7 / 12, difficulty: "medium", hint: "Use 12 as the common denominator.", solution: "9/12 − 2/12 = 7/12.", traps: [{ value: -1, misconception: "fraction-parts", note: "(3 − 1) ÷ (4 − 6) treats tops and bottoms as separate numbers." }] },
    { id: "fr-5", prompt: "What is 2/3 ÷ 4/9? (fraction or decimal)", answer: 1.5, difficulty: "hard", hint: "Dividing by a fraction means multiplying by its reciprocal.", solution: "2/3 × 9/4 = 18/12 = 3/2." },
    { id: "fr-6", prompt: "What is 1/2 + 1/3 + 1/6?", answer: 1, difficulty: "hard", hint: "Everything fits over 6.", solution: "3/6 + 2/6 + 1/6 = 6/6 = 1.", traps: [{ value: 3 / 11, misconception: "fraction-parts", note: "3/11 sums the tops and the bottoms separately." }] },
  ]),
  ...make("percentages", "Convert a percent to a multiplier", [
    { id: "pc-1", prompt: "What is 10% of 80?", answer: 8, difficulty: "easy", hint: "10% means 10 out of every 100, or ÷ 10.", solution: "80 × 0.10 = 8.", traps: [{ value: 800, misconception: "percent-shift", note: "800 uses 10 instead of 0.10 as the multiplier." }, { value: 0.8, misconception: "percent-shift", note: "0.8 shifts the decimal one place too far." }] },
    { id: "pc-2", prompt: "What is 50% of 36?", answer: 18, difficulty: "easy", hint: "50% is the same as one half.", solution: "36 ÷ 2 = 18.", traps: [{ value: 1800, misconception: "percent-shift" }, { value: 1.8, misconception: "percent-shift" }] },
    { id: "pc-3", prompt: "What is 20% of 150?", answer: 30, difficulty: "medium", hint: "20% = 0.20.", solution: "150 × 0.20 = 30.", traps: [{ value: 3000, misconception: "percent-shift", note: "3000 multiplies by 20 instead of 0.20." }, { value: 3, misconception: "percent-shift", note: "3 uses 0.02, one decimal place too far." }] },
    { id: "pc-4", prompt: "A $40 jacket is 25% off. What is the sale price in dollars?", answer: 30, difficulty: "medium", hint: "Find 25% of 40, then subtract it.", solution: "25% of 40 = 10, and 40 − 10 = 30." },
    { id: "pc-5", prompt: "A price rises from 50 to 65. What is the percent increase?", answer: 30, difficulty: "hard", hint: "Compare the increase to the original price.", solution: "15 ÷ 50 = 0.30, so 30%." },
    { id: "pc-6", prompt: "What is 15% of 60?", answer: 9, difficulty: "medium", hint: "Try 10% and 5% separately.", solution: "10% = 6, 5% = 3, total 9.", traps: [{ value: 900, misconception: "percent-shift" }, { value: 0.9, misconception: "percent-shift" }] },
  ]),
  ...make("ratios", "Scale both parts by the same multiplier", [
    { id: "ra-1", prompt: "Paint is mixed blue : white = 2 : 3. If you use 6 parts blue, how many parts white?", answer: 9, difficulty: "easy", hint: "Blue went from 2 to 6. What was it multiplied by?", solution: "2 × 3 = 6, so white is 3 × 3 = 9.", traps: [{ value: 7, misconception: "additive-ratio", note: "Adding 4 to both parts (2→6, 3→7) keeps the difference, not the ratio." }] },
    { id: "ra-2", prompt: "The ratio of a to b is 1 : 4. If a = 5, what is b?", answer: 20, difficulty: "easy", hint: "How many times bigger is 5 than 1?", solution: "5 is 1 × 5, so b = 4 × 5 = 20.", traps: [{ value: 8, misconception: "additive-ratio", note: "5 + 3 keeps the gap of 3 but breaks the 1 : 4 relationship." }] },
    { id: "ra-3", prompt: "3 cups of flour make 12 cookies. How many cups for 20 cookies?", answer: 5, difficulty: "medium", hint: "Find the flour per cookie, or the scale factor 20 ÷ 12.", solution: "12 cookies need 3 cups, so 4 cookies per cup; 20 ÷ 4 = 5.", traps: [{ value: 11, misconception: "additive-ratio", note: "Adding 8 cookies and 8 cups treats the ratio as a difference." }] },
    { id: "ra-4", prompt: "Boys : girls = 3 : 5 in a class of 40. How many girls?", answer: 25, difficulty: "medium", hint: "3 + 5 = 8 equal parts.", solution: "40 ÷ 8 = 5 per part; girls = 5 × 5 = 25." },
    { id: "ra-5", prompt: "A recipe for 4 people uses 6 eggs. How many eggs for 10 people?", answer: 15, difficulty: "hard", hint: "Find eggs per person first.", solution: "6 ÷ 4 = 1.5 eggs each; 1.5 × 10 = 15.", traps: [{ value: 12, misconception: "additive-ratio", note: "10 − 4 = 6 extra people, +6 eggs: additive thinking." }] },
  ]),
  ...make("functions", "Substitute an input and evaluate in the right order", [
    { id: "fn-1", prompt: "f(x) = 2x + 1. What is f(3)?", answer: 7, difficulty: "easy", hint: "Replace x with 3, then multiply before adding.", solution: "2 × 3 + 1 = 7.", traps: [{ value: 8, misconception: "function-substitution", note: "2(3 + 1) adds before multiplying." }] },
    { id: "fn-2", prompt: "f(x) = x + 5. What is f(4)?", answer: 9, difficulty: "easy", hint: "Replace x with 4 and add.", solution: "4 + 5 = 9.", traps: [{ value: 45, misconception: "function-substitution", note: "45 writes the digits side by side instead of adding." }] },
    { id: "fn-3", prompt: "f(x) = 3x − 2. What is f(4)?", answer: 10, difficulty: "medium", hint: "Multiply 3 by 4 first.", solution: "3 × 4 − 2 = 10.", traps: [{ value: 6, misconception: "function-substitution", note: "3(4 − 2) subtracts before multiplying." }] },
    { id: "fn-4", prompt: "f(x) = x² + 1. What is f(3)?", answer: 10, difficulty: "medium", hint: "Square the 3 before adding 1.", solution: "3² + 1 = 9 + 1 = 10.", traps: [{ value: 16, misconception: "function-substitution", note: "(3 + 1)² adds before squaring." }, { value: 7, misconception: "function-substitution", note: "3 × 2 + 1 treats squaring as doubling." }] },
    { id: "fn-5", prompt: "f(x) = 2x − 3. For what x is f(x) = 9?", answer: 6, difficulty: "hard", hint: "You know the output. Work backwards.", solution: "2x − 3 = 9, so 2x = 12 and x = 6.", traps: [{ value: 15, misconception: "function-substitution", note: "15 = f(9): you evaluated at 9 instead of solving f(x) = 9." }] },
    { id: "fn-6", prompt: "f(x) = 5 − 2x. What is f(3)?", answer: -1, difficulty: "medium", hint: "Multiply 2 by 3 before subtracting from 5.", solution: "5 − 2 × 3 = 5 − 6 = −1.", traps: [{ value: 9, misconception: "function-substitution", note: "(5 − 2) × 3 subtracts before multiplying." }] },
  ]),
  ...make("word-problems", "Translate words into an equation", [
    { id: "wp-1", prompt: "Sam has 5 more apples than Lee. Lee has 8. How many does Sam have?", answer: 13, difficulty: "easy", hint: "Five more than means add 5.", solution: "8 + 5 = 13." },
    { id: "wp-2", prompt: "5 more than twice a number is 17. What is the number?", answer: 6, difficulty: "medium", hint: "Write it as 2x + 5 = 17.", solution: "2x + 5 = 17, so 2x = 12 and x = 6.", traps: [{ value: 12, misconception: "word-translation", note: "12 is twice the number. The last step of halving was missed." }, { value: 22, misconception: "word-translation", note: "17 + 5 reverses the direction of 'more than'." }, { value: 3.4, misconception: "word-translation", note: "17 ÷ 5 attaches the 5 to the wrong operation." }] },
    { id: "wp-3", prompt: "A taxi charges $3 plus $2 per km. A trip costs $17. How many km was it?", answer: 7, difficulty: "medium", hint: "Fixed fee + rate × km = total.", solution: "3 + 2k = 17, so 2k = 14 and k = 7.", traps: [{ value: 14, misconception: "word-translation", note: "14 is the per-km part of the bill. Divide by the rate to get km." }, { value: 8.5, misconception: "word-translation", note: "17 ÷ 2 ignores the fixed $3 fee." }] },
    { id: "wp-4", prompt: "Two numbers add to 30 and one is 4 more than the other. What is the smaller number?", answer: 13, difficulty: "hard", hint: "Call the smaller number x. The other is x + 4.", solution: "x + (x + 4) = 30, so 2x = 26 and x = 13.", traps: [{ value: 17, misconception: "word-translation", note: "17 is the larger number. Re-read which one the question asks for." }, { value: 15, misconception: "word-translation", note: "15 splits 30 evenly and ignores the '4 more' condition." }] },
    { id: "wp-5", prompt: "A gym charges $10 to sign up plus $5 per class. You paid $35 in total. How many classes?", answer: 5, difficulty: "easy", hint: "Take off the sign-up fee first.", solution: "35 − 10 = 25, and 25 ÷ 5 = 5.", traps: [{ value: 7, misconception: "word-translation", note: "35 ÷ 5 ignores the one-off $10 fee." }] },
    { id: "wp-6", prompt: "3 less than 4 times a number is 25. What is the number?", answer: 7, difficulty: "medium", hint: "Write it as 4x − 3 = 25.", solution: "4x − 3 = 25, so 4x = 28 and x = 7.", traps: [{ value: 5.5, misconception: "word-translation", note: "'Less than' turned into + 3 in the equation." }, { value: 28, misconception: "word-translation", note: "28 is 4x, so the final ÷ 4 is missing." }] },
  ]),
  ...make("basic-geometry", "Choose and apply the right formula", [
    { id: "bg-1", prompt: "A rectangle is 5 by 3. What is its area?", answer: 15, difficulty: "easy", hint: "Area covers the inside: length × width.", solution: "5 × 3 = 15.", traps: [{ value: 16, misconception: "area-perimeter", note: "16 is the perimeter, the distance around the edge." }] },
    { id: "bg-2", prompt: "A rectangle is 6 by 4. What is its perimeter?", answer: 20, difficulty: "easy", hint: "Perimeter is the distance around all four sides.", solution: "6 + 4 + 6 + 4 = 20.", traps: [{ value: 24, misconception: "area-perimeter", note: "24 is the area, the space inside." }] },
    { id: "bg-3", prompt: "A square has side 7. What is its perimeter?", answer: 28, difficulty: "medium", hint: "Add all four sides.", solution: "4 × 7 = 28.", traps: [{ value: 49, misconception: "area-perimeter", note: "49 is the area (7 × 7)." }] },
    { id: "bg-4", prompt: "A triangle has base 10 and height 6. What is its area?", answer: 30, difficulty: "medium", hint: "A triangle is half of a rectangle.", solution: "½ × 10 × 6 = 30." },
    { id: "bg-5", prompt: "A rectangle has perimeter 26 and length 8. What is its area?", answer: 40, difficulty: "hard", hint: "Find the width from the perimeter first.", solution: "2(8 + w) = 26 gives w = 5; area = 8 × 5 = 40." },
    { id: "bg-6", prompt: "A circle has radius 3. Using π = 3.14, what is its area?", answer: 28.26, difficulty: "medium", hint: "Area = π × r × r.", solution: "3.14 × 3 × 3 = 28.26.", traps: [{ value: 18.84, misconception: "area-perimeter", note: "18.84 is the circumference (2πr), not the area." }] },
  ]),
  // Guided scaffolds used during remediation.
  ...make("linear-equations", "Isolate x with inverse operations", [
    { id: "g-inverse-op", prompt: "Guided: solve 2x + 6 = 14", answer: 4, difficulty: "guided", hint: "Follow the steps in order.", solution: "2x = 8, so x = 4.", scaffold: ["Step 1: subtract 6 from both sides, so 2x = ?", "Step 2: divide both sides by 2, so x = ?"] },
    { id: "g-sign-error", prompt: "Guided: solve x − 4 = 9", answer: 13, difficulty: "guided", hint: "Cancel − 4 by adding 4.", solution: "x = 13.", scaffold: ["Step 1: to cancel − 4, add 4 to both sides", "Step 2: 9 + 4 = ?"] },
  ]),
  ...make("fractions", "Combine fractions with a common denominator", [
    { id: "g-fraction-parts", prompt: "Guided: 1/2 + 1/4 (fraction or decimal)", answer: 0.75, difficulty: "guided", hint: "Only add numerators once denominators match.", solution: "2/4 + 1/4 = 3/4.", scaffold: ["Step 1: rewrite 1/2 as 2/4", "Step 2: add the numerators, keep the denominator: 2/4 + 1/4 = ?/4"] },
  ]),
  ...make("percentages", "Convert a percent to a multiplier", [
    { id: "g-percent-shift", prompt: "Guided: what is 30% of 60?", answer: 18, difficulty: "guided", hint: "Percent means per hundred.", solution: "0.30 × 60 = 18.", scaffold: ["Step 1: 30% = 30 ÷ 100 = 0.30", "Step 2: 0.30 × 60 = ?"] },
  ]),
  ...make("ratios", "Scale both parts by the same multiplier", [
    { id: "g-additive-ratio", prompt: "Guided: the ratio is 2 : 5 and the first part becomes 6. What is the second part?", answer: 15, difficulty: "guided", hint: "Multiply, do not add.", solution: "2 × 3 = 6, so 5 × 3 = 15.", scaffold: ["Step 1: 2 became 6, so the multiplier is 6 ÷ 2 = 3", "Step 2: multiply the second part by the same multiplier: 5 × 3 = ?"] },
  ]),
  ...make("functions", "Substitute an input and evaluate in the right order", [
    { id: "g-function-substitution", prompt: "Guided: f(x) = 3x + 2. What is f(4)?", answer: 14, difficulty: "guided", hint: "Multiply first, then add.", solution: "3 × 4 + 2 = 14.", scaffold: ["Step 1: replace x with 4, so 3 × 4 + 2", "Step 2: multiply first (12), then add 2 = ?"] },
  ]),
  ...make("word-problems", "Translate words into an equation", [
    { id: "g-word-translation", prompt: "Guided: twice a number plus 3 is 11. Find the number.", answer: 4, difficulty: "guided", hint: "Translate each phrase into symbols.", solution: "2x + 3 = 11, so x = 4.", scaffold: ["Step 1: twice a number is 2x; plus 3 is + 3; is 11 is = 11", "Step 2: solve 2x + 3 = 11 (subtract 3, then divide by 2)"] },
  ]),
  ...make("basic-geometry", "Choose and apply the right formula", [
    { id: "g-area-perimeter", prompt: "Guided: a rectangle is 4 by 6. What is its area?", answer: 24, difficulty: "guided", hint: "Area is the space inside, so multiply.", solution: "4 × 6 = 24.", scaffold: ["Step 1: area measures the inside, so multiply length × width", "Step 2: 4 × 6 = ?"] },
  ]),
];

export const QUESTIONS: Question[] = [...MATH_QUESTIONS, ...MORE_QUESTIONS];

export const questionById = (id: string) => QUESTIONS.find((q) => q.id === id);

export const questionsFor = (conceptId: string, difficulty?: Difficulty) =>
  QUESTIONS.filter((q) => q.conceptId === conceptId && q.difficulty !== "guided" && (!difficulty || q.difficulty === difficulty));
