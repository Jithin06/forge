import { apiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Cancel my own claim. The piece goes back to available. */
export async function DELETE(_request: Request, ctx: RouteContext<"/api/claims/[id]">) {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const { id } = await ctx.params;
  if (!UUID.test(id)) return apiError(404, "NOT_FOUND", "No claim with that id.");

  const { data: claim } = await db().from("scrap_claims").select("id, user_id, item_id, status").eq("id", id).maybeSingle();
  if (!claim) return apiError(404, "NOT_FOUND", "No claim with that id.");
  if (claim.user_id !== user.id) return apiError(403, "NOT_YOURS", "You can only cancel your own claims.");

  if (claim.status === "active") {
    const { data: changed } = await db().from("scrap_claims").update({ status: "cancelled" }).eq("id", id).eq("status", "active").select("id");
    if (changed?.length) await db().from("scrap_items").update({ status: "available" }).eq("id", claim.item_id).eq("status", "reserved");
  }
  return new Response(null, { status: 204 });
}
