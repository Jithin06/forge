import { describeScrap } from "@/lib/ai/scrap";
import { scrapDraftBodySchema } from "@/lib/ai/schemas";
import { NO_STORE, aiFailure, apiError, readJson, zodMessage } from "@/lib/api";
import { requireStaff } from "@/lib/auth";
import { getSpace } from "@/lib/spaces";

export async function POST(request: Request) {
  const raw = (await readJson(request)) as { space_id?: string } | undefined;
  const staff = await requireStaff(typeof raw?.space_id === "string" ? raw.space_id : null);
  if (staff instanceof Response) return staff;
  const parsed = scrapDraftBodySchema.safeParse(raw);
  if (!parsed.success) return apiError(400, "BAD_REQUEST", zodMessage(parsed.error.issues));
  const space = await getSpace(parsed.data.space_id);
  if (!space) return apiError(400, "BAD_REQUEST", "No space with that id.");

  try {
    const r = await describeScrap({ image: parsed.data.image, space, note: parsed.data.note });
    console.log(`scrap draft tokens in=${r.usage.input_tokens} out=${r.usage.output_tokens} fixture=${r.fixture}`);
    if (r.error !== null) return apiError(400, "PHOTO_NOT_USABLE", r.error);
    return Response.json({ draft: r.draft, blocked_reason: r.blocked_reason, fixture: r.fixture }, { headers: NO_STORE });
  } catch (e) {
    return aiFailure(e);
  }
}
