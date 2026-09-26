import type { Lesson } from "./curriculum";
import type { Beat } from "./lessons";

/** Lessons for Programming (Byte) and Geography (Atlas). */
export const MORE_LESSONS: Record<string, Lesson> = {
  variables: {
    title: "Variables",
    body: "A variable is a labeled box that holds a value. A line like x = x + 2 is an instruction: take the value out, change it, and put the new value back.",
    example: { problem: "x = 5, then x = x + 2", steps: ["x holds 5", "Work out 5 + 2 = 7", "Store 7 back in x"] },
  },
  loops: {
    title: "Loops",
    body: "A loop repeats a step. In range(3), the counter starts at zero and stops before three, so the loop runs three times: zero, one, two.",
    example: { problem: "for i in range(3): print(i)", steps: ["Pass one prints 0", "Pass two prints 1", "Pass three prints 2, then it stops"] },
  },
  conditions: {
    title: "If and else",
    body: "An if statement checks a condition and picks one path. If it is true the first path runs, otherwise the else path runs. Greater than or equal counts the exact limit as true.",
    example: { problem: "score = 50, if score >= 50 then result = 1", steps: ["Is 50 >= 50? Yes, equal counts", "So take the yes path", "result = 1"] },
  },
  lists: {
    title: "Lists",
    body: "A list stores items in order. Each item has an index, and the index starts at zero. So the first item is index zero and the second is index one.",
    example: { problem: "list = [10, 20, 30]", steps: ["list[0] is 10", "list[1] is 20", "list[2] is 30"] },
  },
  continents: {
    title: "Continents and oceans",
    body: "Earth has seven continents and five oceans. The continents are Asia, Africa, North America, South America, Antarctica, Europe and Australia. The oceans are the Pacific, Atlantic, Indian, Southern and Arctic.",
    example: { problem: "Count them", steps: ["7 continents", "5 oceans", "Most of Earth's surface is water"] },
  },
  latlon: {
    title: "Latitude and longitude",
    body: "Latitude measures north and south from the Equator, from zero to ninety degrees. Longitude measures east and west from the Prime Meridian, and goes a full three hundred and sixty degrees around.",
    example: { problem: "Where is 0, 0?", steps: ["Latitude 0 is the Equator", "Longitude 0 is the Prime Meridian", "They cross at 0, 0"] },
  },
  timezones: {
    title: "Time zones",
    body: "The Earth turns three hundred and sixty degrees in twenty four hours, so fifteen degrees every hour. Going east it is later, and going west it is earlier.",
    example: { problem: "12:00 in London, 3 hours east", steps: ["East means later", "12 + 3 = 15", "It is 15:00 there"] },
  },
  scale: {
    title: "Map scale",
    body: "A map scale relates map distance to real distance. If one centimetre is ten kilometres, multiply the map distance by ten to get the real distance.",
    example: { problem: "1 cm = 10 km, a road is 4 cm", steps: ["Each cm is 10 km", "4 × 10 = 40", "The road is 40 km"] },
  },
};

export const MORE_BEATS: Record<string, Beat[]> = {
  variables: [
    { say: "A variable is a labeled box that holds a value. Here is a box named x, holding five.", step: 0 },
    { say: "Now the line: x equals x plus two. This is an instruction, not a puzzle. Read the right side first.", step: 1 },
    { say: "Take the five out, add two, and you get seven.", step: 2 },
    { say: "Put the seven back in the box. Another variable can copy the value, but it will not follow x afterwards.", step: 3 },
  ],
  loops: [
    { say: "A loop repeats a step, so you do not write it again and again. This is a loop machine.", step: 0 },
    { say: "It counts with a counter called i, and the counter starts at zero, not one.", step: 1 },
    { say: "Each pass adds one to the counter: zero, then one.", step: 2 },
    { say: "It stops before reaching three. That was three passes: zero, one and two.", step: 3 },
  ],
  conditions: [
    { say: "A program often has to choose. An if statement checks a condition and takes one path.", step: 0 },
    { say: "Here the condition is: score is greater than or equal to fifty. The score is fifty.", step: 1 },
    { say: "Fifty is equal to fifty, so the condition is true and we take the yes path.", step: 2 },
    { say: "With greater than alone, fifty would not pass. That small difference matters.", step: 3 },
  ],
  lists: [
    { say: "A list keeps several items in order. Here is a list with ten, twenty and thirty.", step: 0 },
    { say: "Every item has an index, a position number. The first item is at index zero.", step: 1 },
    { say: "The second item is at index one. So list at one is twenty.", step: 2 },
    { say: "Counting starts at zero. Remember that and lists become easy.", step: 3 },
  ],
  continents: [
    { say: "Earth's land is split into seven continents. Here they are as blocks.", step: 0 },
    { say: "Asia, Africa, North America, South America, Antarctica, Europe and Australia. Seven in total.", step: 1 },
    { say: "The water is split into five oceans: Pacific, Atlantic, Indian, Southern and Arctic.", step: 2 },
    { say: "Seven continents and five oceans. Remember Antarctica and the Southern Ocean.", step: 3 },
  ],
  latlon: [
    { say: "Here is a grid laid over a map. It helps us name any place on Earth.", step: 0 },
    { say: "Latitude lines run east to west. The Equator is zero degrees, and the poles are ninety.", step: 1 },
    { say: "Longitude lines run north to south. The Prime Meridian is zero degrees, and a full circle is three hundred and sixty.", step: 2 },
    { say: "Give a latitude and a longitude, and you can pin any place.", step: 3 },
  ],
  timezones: [
    { say: "The Earth spins once every twenty four hours, so it turns fifteen degrees each hour. It is noon in London.", step: 0 },
    { say: "That gives us time zones. The sun reaches the east first, so the east is later in the day.", step: 1 },
    { say: "Three hours east of London, we add three.", step: 2 },
    { say: "Twelve plus three is fifteen. East is later, west is earlier.", step: 3 },
  ],
  scale: [
    { say: "A map shrinks the world. The scale tells us by how much.", step: 0 },
    { say: "Here one centimetre on the map stands for ten kilometres in real life.", step: 1 },
    { say: "A road that is four centimetres on the map is four of those steps.", step: 2 },
    { say: "Four times ten is forty. Going from map to real life, multiply.", step: 3 },
  ],
};
