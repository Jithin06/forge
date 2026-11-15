import { askFollowUps } from "@/lib/ai/ask";
import { askBodySchema } from "@/lib/ai/schemas";
import { NO_STORE, aiFailure, apiError, rateLimited, readJson, zodMessage } from "@/lib/api";

export async function POST(request: Request) {
  const parsed = askBodySchema.safeParse(await readJson(request));
  if (!parsed.success) return apiError(400, "BAD_REQUEST", zodMessage(parsed.error.issues));

  const limited = rateLimited(request);
  if (limited) return limited;

  try {
    const r = await askFollowUps(parsed.data);
    console.log(`ask tokens in=${r.usage.input_tokens} out=${r.usage.output_tokens} fixture=${r.fixture}`);
    if (r.blocked_reason !== null) {
      return Response.json({ summary: r.summary, blocked_reason: r.blocked_reason, fixture: r.fixture }, { headers: NO_STORE });
    }
    return Response.json(
      { summary: r.summary, questions: r.questions, prefilled: r.prefilled, blocked_reason: null, fixture: r.fixture },
      { headers: NO_STORE },
    );
  } catch (e) {
    return aiFailure(e);
  }
}
