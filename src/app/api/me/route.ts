import { z } from "zod";
import { NO_STORE, apiError, readJson, zodMessage } from "@/lib/api";
import { requireUser, staffSpaceIds } from "@/lib/auth";
import { db } from "@/lib/db";
import { AUDIENCES, EXPERIENCES } from "@/lib/schemas";

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

const profilePatch = z
  .object({
    display_name: z.string().trim().min(1, "Type a name, or leave it as it was.").max(60, "Keep the name under 60 characters.").optional(),
    audience: z.enum(AUDIENCES).optional(),
    experience: z.enum(EXPERIENCES).optional(),
  })
  .refine((b) => Object.values(b).some((v) => v !== undefined), "Nothing to change.");

/** The signed-in user edits their own profile: name, "I am a..." and "I have...". */
export async function PATCH(request: Request) {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const parsed = profilePatch.safeParse(await readJson(request));
  if (!parsed.success) return apiError(400, "BAD_REQUEST", zodMessage(parsed.error.issues));

  const changes = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== undefined));
  const { data, error } = await db()
    .from("profiles")
    .upsert({ user_id: user.id, email: user.email, ...changes }, { onConflict: "user_id" })
    .select("email, display_name, audience, experience")
    .single();
  if (error) {
    console.error("profile update failed:", error.message);
    return apiError(500, "SAVE_FAILED", "We could not save your profile. Please try again.");
  }
  return Response.json({ profile: data }, { headers: NO_STORE });
}
