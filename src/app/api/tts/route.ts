import { z } from "zod";
import { groqConfigured, isDemoMode } from "@/lib/ai/groq";

const VOICE = { nova: "diana", byte: "hannah", atlas: "autumn" } as const;
const Body = z.object({ text: z.string().trim().min(1).max(220), characterId: z.enum(["nova", "byte", "atlas"]) });

/** Text-to-speech through Groq (server-side key). 503 tells the client to use browser voices instead. */
export async function POST(req: Request) {
  if (isDemoMode() || !groqConfigured()) return Response.json({ error: "voice unavailable" }, { status: 503 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  try {
    const res = await fetch("https://api.groq.com/openai/v1/audio/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({ model: process.env.GROQ_TTS_MODEL || "canopylabs/orpheus-v1-english", input: parsed.data.text, voice: VOICE[parsed.data.characterId], response_format: "wav" }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return Response.json({ error: "voice unavailable" }, { status: 503 });
    return new Response(res.body, { headers: { "Content-Type": "audio/wav", "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "voice unavailable" }, { status: 503 });
  }
}
