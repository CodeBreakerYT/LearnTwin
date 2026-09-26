import { handle } from "@/lib/ai/route";
import { TutorRequestSchema } from "@/lib/ai/schemas";
import { tutorMessage } from "@/lib/ai/tutor";

export async function POST(req: Request) {
  return handle(req, TutorRequestSchema, (data) => tutorMessage(data));
}
