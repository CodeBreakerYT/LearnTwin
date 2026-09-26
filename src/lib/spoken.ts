/** Helpers for turning maths text into speech, and spoken answers back into text. */

/** "3x + 4 = 19" → "3 x plus 4 equals 19", so any voice reads it naturally. */
export function toSpeech(text: string): string {
  return text
    .replace(/\$(\d+(?:\.\d+)?)/g, "$1 dollars")
    .replace(/½/g, " one half ")
    .replace(/π/g, " pi ")
    .replace(/²/g, " squared ")
    .replace(/×/g, " times ")
    .replace(/÷/g, " divided by ")
    .replace(/>=/g, " is greater than or equal to ")
    .replace(/<=/g, " is less than or equal to ")
    .replace(/>/g, " is greater than ")
    .replace(/</g, " is less than ")
    .replace(/\[(\d+)\]/g, " index $1")
    .replace(/[\[\]]/g, " ")
    .replace(/\*/g, " times ")
    .replace(/=/g, " equals ")
    .replace(/\+/g, " plus ")
    .replace(/[−–]/g, " minus ")
    .replace(/(\s)-(\s)/g, " minus ")
    .replace(/(\d)\s*\/\s*(\d)/g, "$1 over $2")
    .replace(/(\d)\s*:\s*(\d)/g, "$1 to $2")
    .replace(/([a-z])\(([^)]*)\)/g, "$1 of $2")
    .replace(/(\d)([a-z])\b/g, "$1 $2")
    .replace(/%/g, " percent")
    .replace(/[()]/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Splits into chunks small enough for TTS providers (Groq's Orpheus caps input at 200 characters). */
export function chunkSpeech(text: string, max = 190): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + " " + s).trim().length <= max) cur = (cur + " " + s).trim();
    else {
      if (cur) out.push(cur);
      if (s.length <= max) cur = s;
      else {
        const parts = s.match(new RegExp(`.{1,${max}}(\\s|$)`, "g")) ?? [s];
        out.push(...parts.slice(0, -1).map((p) => p.trim()));
        cur = parts[parts.length - 1].trim();
      }
    }
  }
  if (cur) out.push(cur);
  return out;
}

const UNITS: Record<string, number> = { zero: 0, oh: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 };
const TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const DENOM: Record<string, number> = { half: 2, halves: 2, third: 3, thirds: 3, quarter: 4, quarters: 4, fourth: 4, fourths: 4, fifth: 5, fifths: 5, sixth: 6, sixths: 6, seventh: 7, sevenths: 7, eighth: 8, eighths: 8, ninth: 9, ninths: 9, tenth: 10, tenths: 10, twelfth: 12, twelfths: 12 };

const isNumWord = (t?: string) => t !== undefined && (t in UNITS || t in TENS || t === "hundred");

function wordsToDigits(s: string): string {
  const tokens = s.toLowerCase().replace(/[-,]/g, " ").split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (isNumWord(t)) {
      let cur = 0;
      while (i < tokens.length && (isNumWord(tokens[i]) || (tokens[i] === "and" && isNumWord(tokens[i + 1]) && cur > 0))) {
        const w = tokens[i];
        if (w in UNITS) cur += UNITS[w];
        else if (w in TENS) cur += TENS[w];
        else if (w === "hundred") cur = (cur || 1) * 100;
        i++;
      }
      i--;
      out.push(String(cur));
    } else if (t === "point" && isNumWord(tokens[i + 1]) && out.length && /^\d+$/.test(out[out.length - 1])) {
      let digits = "";
      while (i + 1 < tokens.length && tokens[i + 1] in UNITS && UNITS[tokens[i + 1]] < 10) digits += UNITS[tokens[++i]];
      out[out.length - 1] += "." + digits;
    } else if (t in DENOM) {
      const prev = out[out.length - 1];
      if (prev && /^\d+$/.test(prev)) out[out.length - 1] = `${prev}/${DENOM[t]}`;
      else out.push(`1/${DENOM[t]}`);
    } else if (t === "over" || t === "slash") out.push("/");
    else if (t === "divided" && tokens[i + 1] === "by") {
      out.push("/");
      i++;
    } else if (t === "negative" || t === "minus") out.push("-");
    else if (t === "percent") continue;
    else out.push(t);
  }
  return out.join(" ").replace(/-\s+(?=\d)/g, "-").replace(/(\d)\s*\/\s*(\d)/g, "$1/$2");
}

/** "x equals twelve" → "12", "three over four" → "3/4", "twenty percent" → "20". Null when no number found. */
export function spokenToAnswer(transcript: string): string | null {
  const normalised = wordsToDigits(transcript.replace(/−/g, "-"));
  const matches = normalised.match(/-?\d+(?:\.\d+)?(?:\/\d+)?/g);
  return matches ? matches[matches.length - 1] : null;
}

export type VoiceCommand = "repeat" | "hint" | null;
export function voiceCommand(t: string): VoiceCommand {
  const s = t.toLowerCase();
  if (/\bhint\b|\bhelp\b|\bstuck\b/.test(s)) return "hint";
  if (/\brepeat\b|\bagain\b|\bsay that\b|\bwhat was\b/.test(s)) return "repeat";
  return null;
}

export const isAffirmative = (t: string) => /\b(yes|yeah|yep|yup|ready|ok|okay|sure|go|let'?s|try|continue|next|start|alright|please)\b/i.test(t);
