import { groqConfigured, isDemoMode } from "@/lib/ai/groq";

const MAX_BYTES = 3_000_000;

/** Speech-to-text through Groq Whisper (server-side key). 503 tells the client to use the browser recogniser. */
export async function POST(req: Request) {
  if (isDemoMode() || !groqConfigured()) return Response.json({ error: "stt unavailable" }, { status: 503 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob) || file.size === 0 || file.size > MAX_BYTES) return Response.json({ error: "Invalid audio" }, { status: 400 });
  const out = new FormData();
  out.append("file", file, "answer.webm");
  out.append("model", "whisper-large-v3-turbo");
  out.append("language", "en");
  out.append("temperature", "0");
  out.append("response_format", "json");
  out.append("prompt", "A short spoken maths answer: a number, a fraction like three over four, or a decimal.");
  try {
    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: out,
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return Response.json({ error: "stt unavailable" }, { status: 503 });
    const data = (await res.json()) as { text?: string };
    return Response.json({ text: (data.text ?? "").slice(0, 200) });
  } catch {
    return Response.json({ error: "stt unavailable" }, { status: 503 });
  }
}
