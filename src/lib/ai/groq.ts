import "server-only";
import { serverEnv } from "./env";

/**
 * Thin server-side Groq client. The API key is read from the environment here
 * and never leaves the server: browsers only ever talk to our own /api routes.
 */
const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export const groqModel = () => serverEnv("GROQ_MODEL") || "openai/gpt-oss-120b";
export const groqConfigured = () => Boolean(serverEnv("GROQ_API_KEY"));
export const demoForced = () => process.env.NEXT_PUBLIC_DEMO_MODE === "true";
/** DEMO MODE is active when forced, or when there is no key to call Groq with. */
export const isDemoMode = () => demoForced() || !groqConfigured();

type ChatOptions = {
  system: string;
  user: string;
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
};

export async function groqChat({ system, user, json = false, maxTokens = 500, temperature = 0.3, timeoutMs = 9000 }: ChatOptions): Promise<string> {
  const key = serverEnv("GROQ_API_KEY");
  if (!key) throw new Error("GROQ_API_KEY is not set");
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: groqModel(),
      temperature,
      ...(groqModel().startsWith("openai/gpt-oss") ? { reasoning_effort: "low" } : {}),
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Groq responded ${res.status}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty Groq response");
  return text;
}

/** Extracts the first JSON object from a model reply, tolerating code fences. */
export function parseJsonLoose(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("No JSON object in reply");
  return JSON.parse(cleaned.slice(start, end + 1));
}
