import "server-only";
import type { ZodType } from "zod";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Shared request handling for our API routes: size limit, JSON parse, schema validation. */
export async function handle<T>(req: Request, schema: ZodType<T>, run: (data: T) => Promise<unknown>) {
  const raw = await req.text();
  if (raw.length > 20_000) return json({ error: "Request too large" }, 413);
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return json({ error: "Invalid request" }, 400);
  try {
    const result = await run(parsed.data);
    return result === null ? json({ error: "Not found" }, 404) : json(result);
  } catch (err) {
    console.error("[learntwin] route error", err instanceof Error ? err.message : err);
    return json({ error: "Something went wrong" }, 500);
  }
}

export { json };
