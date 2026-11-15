import { cookies } from "next/headers";
import { TEST_COOKIE, TEST_PERSONAS, afterSignIn, authMode, ensureAuthUser, isUscEmail, safeNext, type Persona } from "@/lib/auth";
import { db } from "@/lib/db";

/** Test sign-in. Exists only when AUTH_MODE=test; otherwise it is a 404. */
export async function POST(request: Request) {
  if (authMode() !== "test") return new Response("Not found", { status: 404 });

  const form = await request.formData();
  const persona = String(form.get("persona")) as Persona;
  const next = safeNext(String(form.get("next") ?? "/"));
  if (!(persona in TEST_PERSONAS)) return new Response("Unknown test account", { status: 400 });
  const p = TEST_PERSONAS[persona];
  const to = (path: string) => new Response(null, { status: 303, headers: { Location: path } });

  // The same domain rule as the real path: a non-USC account is never signed in.
  if (!isUscEmail(p.email)) {
    (await cookies()).delete(TEST_COOKIE);
    return to(`/sign-in?error=not_usc&next=${encodeURIComponent(next)}`);
  }

  const id = await ensureAuthUser(p.email);
  await afterSignIn(
    { id, email: p.email },
    { displayName: p.name, audience: String(form.get("audience") ?? ""), experience: String(form.get("experience") ?? ""), next },
  );
  if (p.staffOf) {
    await db().from("staff_members").upsert({ email: p.email, space_id: p.staffOf }, { ignoreDuplicates: true });
  }
  (await cookies()).set(TEST_COOKIE, persona, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return to(next);
}
