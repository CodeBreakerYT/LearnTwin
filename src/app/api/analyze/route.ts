import { analyzeAnswer, UnknownQuestionError } from "@/lib/ai/analyzeAnswer";
import { handle, json } from "@/lib/ai/route";
import { AnalyzeRequestSchema } from "@/lib/ai/schemas";

export async function POST(req: Request) {
  return handle(req, AnalyzeRequestSchema, async (data) => {
    try {
      return await analyzeAnswer(data);
    } catch (e) {
      if (e instanceof UnknownQuestionError) return null;
      throw e;
    }
  }).catch(() => json({ error: "Something went wrong" }, 500));
}
