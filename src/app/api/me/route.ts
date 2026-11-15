import { NO_STORE } from "@/lib/api";
import { requireUser, staffSpaceIds } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await requireUser();
  if (user instanceof Response) return user;

  const [profile, plans, claims, staff] = await Promise.all([
    db().from("profiles").select("email, display_name, audience, experience").eq("user_id", user.id).maybeSingle(),
    db().from("plans").select("id, created_at, idea_text, plan->base->>summary").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    db()
      .from("scrap_claims")
      .select("id, status, created_at, hold_until, plan_id, item:scrap_items(id, title, size_note, photo_url, space_id)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    staffSpaceIds(user.email),
  ]);
  const now = Date.now();
  return Response.json(
    {
      profile: profile.data ?? { email: user.email, display_name: null, audience: null, experience: null },
      plans: plans.data ?? [],
      // A hold past its time reads as expired even before anything rewrites the row.
      claims: (claims.data ?? []).map((c) => ({
        ...c,
        status: c.status === "active" && new Date(c.hold_until).getTime() < now ? "expired" : c.status,
      })),
      staff_space_ids: staff,
    },
    { headers: NO_STORE },
  );
}
