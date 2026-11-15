import { apiError, NO_STORE } from "@/lib/api";
import { eligibility } from "@/lib/compute/eligibility";
import { audienceParam } from "@/lib/schemas";
import { getAvailableScrap, getSpace } from "@/lib/spaces";

export async function GET(request: Request, ctx: RouteContext<"/api/spaces/[id]">) {
  const { id } = await ctx.params;
  const raw = new URL(request.url).searchParams.get("audience");
  const audience = raw === null ? undefined : audienceParam.safeParse(raw);
  if (audience && !audience.success) {
    return apiError(400, "BAD_REQUEST", `audience: ${audience.error.issues[0].message}`);
  }

  const space = await getSpace(id);
  if (!space) return apiError(404, "NOT_FOUND", "No space with that id.");

  const scrap = await getAvailableScrap(id);
  return Response.json(
    {
      space,
      eligibility: audience ? eligibility(space, audience.data) : null,
      scrap,
    },
    { headers: NO_STORE },
  );
}
