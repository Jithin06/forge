import { NO_STORE, apiError } from "@/lib/api";
import { getPlan } from "@/lib/plans";
import { AUDIENCES, type Audience } from "@/lib/schemas";

/** `?audience=` shows the same plan with badges and order for that audience. */
export async function GET(request: Request, ctx: RouteContext<"/api/plan/[id]">) {
  const { id } = await ctx.params;
  const asked = new URL(request.url).searchParams.get("audience");
  if (asked !== null && !AUDIENCES.includes(asked as Audience)) {
    return apiError(400, "BAD_REQUEST", `audience must be one of: ${AUDIENCES.join(", ")}`);
  }
  const plan = await getPlan(id, (asked as Audience | null) ?? undefined);
  if (!plan) return apiError(404, "NOT_FOUND", "No plan with that link.");
  return Response.json(plan, { headers: NO_STORE });
}
