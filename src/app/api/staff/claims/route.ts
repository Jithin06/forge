import { NO_STORE } from "@/lib/api";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";

/** Active claims on a space's items, with names and emails. Staff of that space only. */
export async function GET(request: Request) {
  const spaceId = new URL(request.url).searchParams.get("space_id");
  const staff = await requireStaff(spaceId);
  if (staff instanceof Response) return staff;

  await db().rpc("expire_holds");
  const { data, error } = await db()
    .from("scrap_claims")
    .select("id, created_at, hold_until, user_id, item:scrap_items!inner(id, title, size_note, photo_url, space_id)")
    .eq("status", "active")
    .eq("item.space_id", spaceId!)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const ids = [...new Set(data.map((c) => c.user_id))];
  const { data: people } = await db().from("profiles").select("user_id, display_name, email").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const who = new Map((people ?? []).map((p) => [p.user_id, p]));
  return Response.json(
    { claims: data.map(({ user_id, ...c }) => ({ ...c, claimant: { name: who.get(user_id)?.display_name ?? null, email: who.get(user_id)?.email ?? null } })) },
    { headers: NO_STORE },
  );
}
