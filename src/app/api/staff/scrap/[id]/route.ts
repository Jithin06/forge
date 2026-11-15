import { z } from "zod";
import { NO_STORE, apiError, readJson } from "@/lib/api";
import { requireStaff, requireUser, staffSpaceIds } from "@/lib/auth";
import { db } from "@/lib/db";
import { SCRAP_COLUMNS } from "@/lib/scrap";

const body = z.object({ status: z.enum(["available", "picked_up", "removed"]) });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Staff close out an item:
 *   picked_up  the claimant collected it (raises the impact counter)
 *   available  "Release": cancel the hold, put it back in the bin
 *   removed    take it off the list
 */
export async function PATCH(request: Request, ctx: RouteContext<"/api/staff/scrap/[id]">) {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const { id } = await ctx.params;
  const { data: item } = UUID.test(id)
    ? await db().from("scrap_items").select("id, space_id, status").eq("id", id).maybeSingle()
    : { data: null };
  if (!item) {
    // Staff of some space get 404; anyone else gets 403 and learns nothing.
    return (await staffSpaceIds(user.email)).length
      ? apiError(404, "NOT_FOUND", "No scrap item with that id.")
      : apiError(403, "NOT_STAFF", "Only staff of this space can do this.");
  }
  const staff = await requireStaff(item.space_id); // rule 5.3.5: own space only
  if (staff instanceof Response) return staff;

  const parsed = body.safeParse(await readJson(request));
  if (!parsed.success) return apiError(400, "BAD_REQUEST", "status must be available, picked_up or removed.");
  const next = parsed.data.status;

  await db().from("scrap_claims").update({ status: next === "picked_up" ? "picked_up" : "cancelled" }).eq("item_id", id).eq("status", "active");
  const { data, error } = await db().from("scrap_items").update({ status: next }).eq("id", id).select(SCRAP_COLUMNS).single();
  if (error) throw new Error(error.message);
  return Response.json({ item: data }, { headers: NO_STORE });
}
