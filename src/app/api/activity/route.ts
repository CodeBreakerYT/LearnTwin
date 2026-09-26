import { generateActivity } from "@/lib/ai/generateActivity";
import { handle } from "@/lib/ai/route";
import { ActivityRequestSchema } from "@/lib/ai/schemas";

export async function POST(req: Request) {
  return handle(req, ActivityRequestSchema, (data) => generateActivity(data));
}
