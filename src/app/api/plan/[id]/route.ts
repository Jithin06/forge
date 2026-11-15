import { NO_STORE, apiError } from "@/lib/api";
import { getPlan } from "@/lib/plans";

export async function GET(_request: Request, ctx: RouteContext<"/api/plan/[id]">) {
  const { id } = await ctx.params;
  const plan = await getPlan(id);
  if (!plan) return apiError(404, "NOT_FOUND", "No plan with that link.");
  return Response.json(plan, { headers: NO_STORE });
}
