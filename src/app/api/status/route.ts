import { groqConfigured, groqModel, isDemoMode } from "@/lib/ai/groq";
import { json } from "@/lib/ai/route";

/** Tells the UI whether it is running on Groq or in DEMO MODE. Never returns the key. */
export async function GET() {
  const demo = isDemoMode();
  return json({ demo, model: demo ? null : groqModel(), keyPresent: groqConfigured() });
}
