import type { Question } from "./types";

type Q = Omit<Question, "conceptId" | "expectedSkill">;
const make = (conceptId: string, skill: string, items: Q[]): Question[] => items.map((q) => ({ ...q, conceptId, expectedSkill: skill }));

/** Programming (taught by Byte) and Geography (taught by Atlas). All answers are numbers so anyone can tap or say them. */
export const MORE_QUESTIONS: Question[] = [
  /* ------------------------------------------------------------ programming */
  ...make("variables", "Read an assignment right to left", [
    { id: "pv-1", prompt: "x = 5. Then x = x + 2. What is x now?", answer: 7, difficulty: "easy", hint: "Work out the right side first, using the old x.", solution: "5 + 2 = 7, and 7 is stored back in x.", traps: [{ value: 5, misconception: "assignment-confusion", note: "5 is the old value. The line takes the 5 out, adds 2, and stores the result." }, { value: 2, misconception: "assignment-confusion", note: "The line adds 2 to what x already holds, it does not replace it with 2." }] },
    { id: "pv-2", prompt: "a = 3. Then b = a. Then a = 10. What is b?", answer: 3, difficulty: "medium", hint: "b copied the value when it was 3.", solution: "b took a copy of 3. Changing a later does not change b.", traps: [{ value: 10, misconception: "assignment-confusion", note: "b is not linked to a. It copied the value 3 and keeps it." }] },
    { id: "pv-3", prompt: "x = 4. Then y = x * 2. Then x = 1. What is y?", answer: 8, difficulty: "hard", hint: "y was worked out when x was 4.", solution: "y = 4 * 2 = 8. Changing x afterwards does not recompute y.", traps: [{ value: 2, misconception: "assignment-confusion", note: "2 would mean y followed x. It does not: y kept the 8." }, { value: 1, misconception: "assignment-confusion", note: "x is 1, but y was set earlier and stays 8." }] },
  ]),
  ...make("loops", "Count loop passes from zero", [
    { id: "pl-1", prompt: "for i in range(3): print(i). How many lines are printed?", answer: 3, difficulty: "easy", hint: "range(3) gives 0, 1, 2.", solution: "It prints 0, 1 and 2: three lines.", traps: [{ value: 4, misconception: "off-by-one", note: "4 counts 0, 1, 2 and 3. But range(3) stops before 3." }, { value: 2, misconception: "off-by-one", note: "2 misses the pass where i is 0." }] },
    { id: "pl-2", prompt: "total = 0. Repeat 4 times: total = total + 2. What is total?", answer: 8, difficulty: "medium", hint: "Add 2 once for each pass.", solution: "Four passes of +2 make 8.", traps: [{ value: 2, misconception: "off-by-one", note: "2 is a single pass. The loop runs 4 times." }, { value: 10, misconception: "off-by-one", note: "10 is five passes. The loop runs 4 times." }] },
    { id: "pl-3", prompt: "for i in range(5): print(i). What is the LAST number printed?", answer: 4, difficulty: "medium", hint: "range(5) stops before 5.", solution: "It prints 0, 1, 2, 3, 4. The last is 4.", traps: [{ value: 5, misconception: "off-by-one", note: "range(5) stops before 5, so 5 is never printed." }] },
    { id: "pl-4", prompt: "total = 0. for i in range(4): total = total + i. What is total?", answer: 6, difficulty: "hard", hint: "i takes the values 0, 1, 2, 3.", solution: "0 + 1 + 2 + 3 = 6.", traps: [{ value: 10, misconception: "off-by-one", note: "10 = 1 + 2 + 3 + 4. But i starts at 0 and stops at 3." }] },
  ]),
  ...make("conditions", "Decide which path an if statement takes", [
    { id: "pc-1", prompt: "score = 50. If score >= 50 then result = 1, else result = 0. What is result?", answer: 1, difficulty: "easy", hint: "Does >= count when the two are equal?", solution: "50 >= 50 is true, so result = 1.", traps: [{ value: 0, misconception: "boundary-condition", note: ">= includes equal, so 50 passes and result is 1." }] },
    { id: "pc-2", prompt: "age = 12. If age >= 13 then price = 5, else price = 3. What is price?", answer: 3, difficulty: "easy", hint: "Is 12 at least 13?", solution: "12 is not >= 13, so the else path gives 3.", traps: [{ value: 5, misconception: "boundary-condition", note: "12 is below 13, so the yes path is not taken." }] },
    { id: "pc-3", prompt: "n = 10. If n > 10 then out = 1, else out = 2. What is out?", answer: 2, difficulty: "medium", hint: "Is 10 strictly more than 10?", solution: "10 > 10 is false, so out = 2.", traps: [{ value: 1, misconception: "boundary-condition", note: "> does not include equal, so 10 does not pass." }] },
    { id: "pc-4", prompt: "x = 7. If x > 5 then x = x + 1. Then if x > 7 then x = x + 10. What is x at the end?", answer: 18, difficulty: "hard", hint: "The second check uses the new x.", solution: "x becomes 8, then 8 > 7 is true, so x = 18.", traps: [{ value: 8, misconception: "boundary-condition", note: "The second check uses the updated x (8), which is greater than 7." }] },
  ]),
  ...make("lists", "Use zero-based positions", [
    { id: "pi-1", prompt: "list = [10, 20, 30]. What is list[1]?", answer: 20, difficulty: "easy", hint: "The first item is at index 0.", solution: "Index 0 is 10, index 1 is 20.", traps: [{ value: 10, misconception: "one-based-index", note: "10 is at index 0. Index 1 is the second item." }] },
    { id: "pi-2", prompt: "list = [4, 8, 15]. What is list[0]?", answer: 4, difficulty: "easy", hint: "Counting starts at zero.", solution: "Index 0 is the first item: 4.", traps: [{ value: 8, misconception: "one-based-index", note: "8 is index 1. Index 0 is the first item." }] },
    { id: "pi-3", prompt: "list = [2, 4, 6, 8]. What is list[3]?", answer: 8, difficulty: "medium", hint: "Indexes are 0, 1, 2, 3.", solution: "Index 3 is the fourth item: 8.", traps: [{ value: 6, misconception: "one-based-index", note: "6 is index 2. Index 3 is the fourth item." }] },
    { id: "pi-4", prompt: "list = [5, 6, 7]. What is list[0] + list[2]?", answer: 12, difficulty: "hard", hint: "list[0] is 5. What is list[2]?", solution: "5 + 7 = 12.", traps: [{ value: 13, misconception: "one-based-index", note: "6 + 7 = 13 uses positions 1 and 2, shifted by one." }, { value: 11, misconception: "one-based-index", note: "5 + 6 = 11 uses positions 0 and 1, so the second index is off by one." }] },
  ]),
  /* ------------------------------------------------------------- geography */
  ...make("continents", "Name and count Earth's continents and oceans", [
    { id: "gc-1", prompt: "How many continents are there?", answer: 7, difficulty: "easy", hint: "Asia, Africa, Europe, North America, South America, Australia and one more at the bottom.", solution: "Seven, including Antarctica.", traps: [{ value: 6, misconception: "continent-count", note: "6 leaves one out, usually Antarctica." }, { value: 5, misconception: "continent-count", note: "5 is the number of oceans." }] },
    { id: "gc-2", prompt: "How many oceans are there?", answer: 5, difficulty: "easy", hint: "Pacific, Atlantic, Indian, Arctic and one near Antarctica.", solution: "Five, including the Southern Ocean.", traps: [{ value: 4, misconception: "continent-count", note: "4 forgets the Southern Ocean." }, { value: 7, misconception: "continent-count", note: "7 is the number of continents." }] },
    { id: "gc-3", prompt: "If Europe and Asia are counted as one landmass, called Eurasia, how many continents are there?", answer: 6, difficulty: "medium", hint: "Start from seven and merge two.", solution: "7 − 1 = 6.", traps: [{ value: 7, misconception: "continent-count", note: "Merging two landmasses takes one away from the count." }] },
  ]),
  ...make("latlon", "Tell latitude from longitude", [
    { id: "gl-1", prompt: "At what latitude is the Equator, in degrees?", answer: 0, difficulty: "easy", hint: "Latitude starts counting at the Equator.", solution: "The Equator is 0 degrees latitude.", traps: [{ value: 90, misconception: "lat-long-mixup", note: "90 is the latitude of the poles, not the Equator." }] },
    { id: "gl-2", prompt: "At what latitude is the North Pole, in degrees north?", answer: 90, difficulty: "easy", hint: "Latitude goes from 0 at the Equator up to the poles.", solution: "The North Pole is 90 degrees north.", traps: [{ value: 0, misconception: "lat-long-mixup", note: "0 is the Equator. The pole is the far end of the scale." }, { value: 180, misconception: "lat-long-mixup", note: "180 is a longitude value. Latitude stops at 90." }] },
    { id: "gl-3", prompt: "How many degrees of longitude go all the way around the Earth?", answer: 360, difficulty: "medium", hint: "It is a full circle.", solution: "A full circle is 360 degrees.", traps: [{ value: 180, misconception: "lat-long-mixup", note: "180 is only halfway round, east or west of the Prime Meridian." }, { value: 90, misconception: "lat-long-mixup", note: "90 is the latitude of the poles, a quarter turn." }] },
    { id: "gl-4", prompt: "The Prime Meridian is at what longitude, in degrees?", answer: 0, difficulty: "medium", hint: "Longitude starts counting here.", solution: "The Prime Meridian is 0 degrees longitude.", traps: [{ value: 180, misconception: "lat-long-mixup", note: "180 is on the opposite side of the world." }] },
  ]),
  ...make("timezones", "Work out time differences east and west", [
    { id: "gt-1", prompt: "The Earth turns 360 degrees in 24 hours. How many degrees does it turn each hour?", answer: 15, difficulty: "easy", hint: "Divide 360 by 24.", solution: "360 ÷ 24 = 15.", traps: [{ value: 24, misconception: "time-direction", note: "24 is the number of hours, not the degrees per hour." }, { value: 12, misconception: "time-direction", note: "12 is half a day, not the turn per hour." }] },
    { id: "gt-2", prompt: "It is 12:00 in London. A city 3 hours EAST of London is on a 24-hour clock at what hour?", answer: 15, difficulty: "medium", hint: "The sun reaches the east first, so it is later there.", solution: "East is later: 12 + 3 = 15.", traps: [{ value: 9, misconception: "time-direction", note: "9 goes the wrong way. East is ahead in time, so add." }] },
    { id: "gt-3", prompt: "It is 18:00 in London. A city 5 hours WEST of London is at what hour?", answer: 13, difficulty: "medium", hint: "West is earlier in the day.", solution: "West is earlier: 18 − 5 = 13.", traps: [{ value: 23, misconception: "time-direction", note: "23 adds when it should subtract. West is behind." }] },
    { id: "gt-4", prompt: "It is 10:00 in a city 2 hours EAST of London. What hour is it in London?", answer: 8, difficulty: "hard", hint: "London is west of that city, so it is earlier there.", solution: "London is 2 hours behind: 10 − 2 = 8.", traps: [{ value: 12, misconception: "time-direction", note: "12 goes the wrong way. London is earlier than a city to its east." }] },
  ]),
  ...make("scale", "Convert between map distance and real distance", [
    { id: "gs-1", prompt: "Map scale: 1 cm = 10 km. A road is 4 cm on the map. How many km is it in real life?", answer: 40, difficulty: "easy", hint: "Each centimetre stands for 10 km.", solution: "4 × 10 = 40 km.", traps: [{ value: 2.5, misconception: "scale-direction", note: "4 ÷ 10 shrinks the distance. Going from map to real life, multiply." }] },
    { id: "gs-2", prompt: "1 cm = 5 km. Two towns are 6 cm apart on the map. How many km apart are they?", answer: 30, difficulty: "medium", hint: "Multiply the map distance by the scale.", solution: "6 × 5 = 30 km.", traps: [{ value: 1.2, misconception: "scale-direction", note: "6 ÷ 5 divides when the map needs to grow into real distance." }] },
    { id: "gs-3", prompt: "1 cm = 20 km. Two cities are 100 km apart in real life. How many cm apart are they on the map?", answer: 5, difficulty: "medium", hint: "Now you go from real life back to the map.", solution: "100 ÷ 20 = 5 cm.", traps: [{ value: 2000, misconception: "scale-direction", note: "100 × 20 multiplies when going back to the map needs division." }] },
    { id: "gs-4", prompt: "1 cm = 2 km. Two roads are 3 cm and 4 cm long on the map. What is their total length in km?", answer: 14, difficulty: "hard", hint: "Add the map lengths, then apply the scale.", solution: "(3 + 4) × 2 = 14 km.", traps: [{ value: 7, misconception: "scale-direction", note: "7 is the map total. It still needs to be multiplied by the scale." }] },
  ]),
  /* ------------------------------------------------------- guided scaffolds */
  ...make("variables", "Read an assignment right to left", [
    { id: "g-assignment-confusion", prompt: "Guided: x = 4. Then x = x + 3. What is x?", answer: 7, difficulty: "guided", hint: "Right side first.", solution: "4 + 3 = 7.", scaffold: ["Step 1: work out the right side first: 4 + 3", "Step 2: store that result back in x"] },
  ]),
  ...make("loops", "Count loop passes from zero", [
    { id: "g-off-by-one", prompt: "Guided: for i in range(4): print(i). How many lines print?", answer: 4, difficulty: "guided", hint: "List what i is on each pass.", solution: "i is 0, 1, 2, 3: four lines.", scaffold: ["Step 1: range(4) gives 0, 1, 2, 3", "Step 2: count how many numbers that is"] },
  ]),
  ...make("conditions", "Decide which path an if statement takes", [
    { id: "g-boundary-condition", prompt: "Guided: n = 5. If n >= 5 then out = 1, else out = 0. What is out?", answer: 1, difficulty: "guided", hint: "Equal counts for >=.", solution: "5 >= 5 is true, so out = 1.", scaffold: ["Step 1: is 5 >= 5? Equal counts, so yes", "Step 2: the yes path gives out = ?"] },
  ]),
  ...make("lists", "Use zero-based positions", [
    { id: "g-one-based-index", prompt: "Guided: list = [7, 8, 9]. What is list[1]?", answer: 8, difficulty: "guided", hint: "Index 0 is the first item.", solution: "Index 0 is 7, index 1 is 8.", scaffold: ["Step 1: index 0 is the first item: 7", "Step 2: index 1 is the next item: ?"] },
  ]),
  ...make("continents", "Name and count Earth's continents and oceans", [
    { id: "g-continent-count", prompt: "Guided: the oceans are Pacific, Atlantic, Indian, Southern and Arctic. How many is that?", answer: 5, difficulty: "guided", hint: "Count the names.", solution: "Five oceans.", scaffold: ["Step 1: Pacific, Atlantic, Indian", "Step 2: add Southern and Arctic, then count them all"] },
  ]),
  ...make("latlon", "Tell latitude from longitude", [
    { id: "g-lat-long-mixup", prompt: "Guided: latitude runs from the Equator to a pole. How many degrees is that?", answer: 90, difficulty: "guided", hint: "The Equator is 0 and a pole is a quarter turn.", solution: "A quarter of 360 is 90.", scaffold: ["Step 1: the Equator is 0 degrees latitude", "Step 2: the pole is a quarter of the way round: ?"] },
  ]),
  ...make("timezones", "Work out time differences east and west", [
    { id: "g-time-direction", prompt: "Guided: it is 12:00 in London. A city 2 hours east is later. What hour is it there?", answer: 14, difficulty: "guided", hint: "East means add.", solution: "12 + 2 = 14.", scaffold: ["Step 1: east is later, so we add", "Step 2: 12 + 2 = ?"] },
  ]),
  ...make("scale", "Convert between map distance and real distance", [
    { id: "g-scale-direction", prompt: "Guided: 1 cm = 5 km. A road is 3 cm on the map. How many km is it?", answer: 15, difficulty: "guided", hint: "Map to real means multiply.", solution: "3 × 5 = 15 km.", scaffold: ["Step 1: each centimetre is 5 km, so multiply", "Step 2: 3 × 5 = ?"] },
  ]),
];
