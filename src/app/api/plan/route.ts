import { planBuild } from "@/lib/ai/plan";
import { planBodySchema } from "@/lib/ai/schemas";
import { NO_STORE, aiFailure, apiError, rateLimited, readJson, zodMessage } from "@/lib/api";
import { computeBase, finalize } from "@/lib/compute/plan";
import { availableScrap, savePlan } from "@/lib/plans";

export async function POST(request: Request) {
  const parsed = planBodySchema.safeParse(await readJson(request));
  if (!parsed.success) return apiError(400, "BAD_REQUEST", zodMessage(parsed.error.issues));

  const limited = rateLimited(request);
  if (limited) return limited;

  const body = parsed.data;
  let built;
  try {
    built = await planBuild(body);
  } catch (e) {
    return aiFailure(e);
  }
  console.log(
    `plan tokens in=${built.usage.input_tokens} out=${built.usage.output_tokens} attempts=${built.attempts} fixture=${built.fixture}`,
  );

  const base = computeBase(built.model, built.spaces, body.audience);
  const id = await savePlan({
    idea_text: body.text,
    answers: body.answers,
    audience: body.audience,
    experience: body.experience,
    had_image: !!body.image,
    stored: { base, model: built.model, fixture: built.fixture, attempts: built.attempts },
    usage: built.usage,
  });
  const plan = finalize(base, await availableScrap());
  return Response.json({ id, plan, fixture: built.fixture }, { status: 201, headers: NO_STORE });
}
