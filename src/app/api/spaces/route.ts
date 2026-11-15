import { z } from "zod";
import { apiError, NO_STORE } from "@/lib/api";
import { eligibility, eligibilityRank } from "@/lib/compute/eligibility";
import { audienceParam, capabilityParam } from "@/lib/schemas";
import { getSpaces } from "@/lib/spaces";

const query = z.object({
  capability: capabilityParam.optional(),
  audience: audienceParam.optional(),
});

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = query.safeParse(params);
  if (!parsed.success) {
    return apiError(400, "BAD_REQUEST", parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  }
  const { capability, audience } = parsed.data;

  const spaces = (await getSpaces()).filter((s) => !capability || s.capabilities.includes(capability));
  const list = spaces.map((s) => ({
    ...s,
    eligibility: audience ? eligibility(s, audience) : null,
  }));
  if (audience) {
    list.sort((a, b) => eligibilityRank(a.eligibility!.status) - eligibilityRank(b.eligibility!.status));
  }
  return Response.json({ spaces: list }, { headers: NO_STORE });
}
