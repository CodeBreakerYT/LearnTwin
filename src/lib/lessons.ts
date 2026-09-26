/** What the character says while each step of a 3D scene plays. `step` matches lib/visuals.ts. */
export type Beat = { say: string; step: number };

import { MORE_BEATS } from "./lessons2";

const MATH_BEATS: Record<string, Beat[]> = {
  fractions: [
    { say: "A fraction is a way to talk about equal parts of a whole. Here is one whole bar.", step: 0 },
    { say: "Cut it into two equal pieces. Each piece is one half.", step: 1 },
    { say: "Cut it again and you get four pieces. Each one is one quarter.", step: 2 },
    { say: "To add one half and one quarter, the pieces must be the same size. One half is the same as two quarters.", step: 3 },
    { say: "Two quarters plus one quarter makes three quarters. The bottom number is the piece size, so it stays the same.", step: 4 },
  ],
  percentages: [
    { say: "Here are one hundred squares. Percent simply means out of one hundred.", step: 0 },
    { say: "Ten percent is ten squares out of a hundred.", step: 2 },
    { say: "Twenty percent is twenty squares. That is one fifth of the whole.", step: 3 },
    { say: "Fifty percent is fifty squares, exactly half.", step: 4 },
    { say: "So to find twenty percent of a number, turn twenty percent into point two, then multiply.", step: 3 },
  ],
  ratios: [
    { say: "A ratio compares amounts. Here are two blue blocks for every three white blocks, a ratio of two to three.", step: 0 },
    { say: "Think of it as a recipe: two blue, three white.", step: 1 },
    { say: "To make more, repeat the whole recipe. Three times gives six blue and nine white.", step: 2 },
    { say: "We multiplied both parts by three, so the ratio is still two to three. Adding the same number to each part would break it.", step: 3 },
  ],
  "linear-equations": [
    { say: "An equation is a balance. Three boxes and four coins balance nineteen coins on the other side.", step: 0 },
    { say: "Take four coins off both sides. The scale stays balanced.", step: 1 },
    { say: "Now three boxes balance fifteen coins. Share the fifteen equally among the three boxes.", step: 2 },
    { say: "Each box holds five coins. So x equals five.", step: 3 },
  ],
  functions: [
    { say: "A function is a machine. You put a number in, and its rule changes it. This one doubles, then adds one.", step: 0 },
    { say: "Put in three.", step: 1 },
    { say: "First it doubles. Three becomes six.", step: 2 },
    { say: "Then it adds one. Six becomes seven.", step: 3 },
    { say: "Out comes seven. So f of three equals seven.", step: 4 },
  ],
  "word-problems": [
    { say: "Word problems hide equations. Try this: five more than twice a number is seventeen. The whole bar is seventeen.", step: 0 },
    { say: "Five of it is the five more. Set that piece aside.", step: 1 },
    { say: "The other twelve is twice the number, so split it into two equal parts.", step: 2 },
    { say: "Each part is six. The number is six.", step: 3 },
  ],
  "basic-geometry": [
    { say: "Here is a rectangle, five by three.", step: 0 },
    { say: "Perimeter is the distance around the edge. Walk around it: five, three, five, three. That is sixteen.", step: 1 },
    { say: "Area is the space inside. Fill it with squares and you get fifteen.", step: 2 },
    { say: "Around is perimeter. Inside is area. Two different ideas with two different answers.", step: 3 },
  ],
};

export const LESSON_BEATS: Record<string, Beat[]> = { ...MATH_BEATS, ...MORE_BEATS };
