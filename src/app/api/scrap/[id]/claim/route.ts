import { z } from "zod";
import { NO_STORE, apiError, readJson } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSpace } from "@/lib/spaces";

const body = z.object({ plan_id: z.string().regex(/^[A-Za-z0-9]{6,20}$/).optional() }).optional();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request, ctx: RouteContext<"/api/scrap/[id]/claim">) {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const { id } = await ctx.params;
  if (!UUID.test(id)) return apiError(404, "NOT_FOUND", "No scrap item with that id.");
  const parsed = body.safeParse((await readJson(request)) ?? {});
  if (!parsed.success) return apiError(400, "BAD_REQUEST", "plan_id is not valid.");

  const { data: item } = await db().from("scrap_items").select("id, title, space_id").eq("id", id).maybeSingle();
  if (!item) return apiError(404, "NOT_FOUND", "No scrap item with that id.");

  // One database function does the whole claim in one transaction (rule 5.3.1).
  const { data: claim, error } = await db().rpc("claim_scrap", { p_item_id: id, p_user_id: user.id, p_plan_id: parsed.data?.plan_id ?? null });
  if (error) {
    if (/TOO_MANY_CLAIMS/.test(error.message))
      return apiError(409, "TOO_MANY_CLAIMS", "You already have 3 pieces on hold. Pick one up or cancel one, then claim this.");
    if (/ALREADY_CLAIMED/.test(error.message)) return apiError(409, "ALREADY_CLAIMED", "Someone just claimed this piece.");
    throw new Error(error.message);
  }
  const space = await getSpace(item.space_id);
  return Response.json(
    {
      claim: { id: claim.id, item_id: claim.item_id, hold_until: claim.hold_until, status: claim.status },
      item: { id: item.id, title: item.title },
      space: { id: item.space_id, name: space?.name ?? item.space_id, location: space?.location ?? null },
      pickup_note: space?.scrap_policy.pickup_note ?? null,
    },
    { status: 201, headers: NO_STORE },
  );
}
