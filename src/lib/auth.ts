import "server-only";
import { cookies } from "next/headers";
import { apiError } from "./api";
import { db } from "./db";
import { AUDIENCES, EXPERIENCES, type Audience, type Experience } from "./schemas";
import { supabaseAuth } from "./supabase-server";

export type SessionUser = { id: string; email: string };

export const NOT_USC_MESSAGE = "Forge is for USC accounts. Use your @usc.edu Google account.";
export const TEST_COOKIE = "forge_test_user";

/** "test" only when AUTH_MODE is exactly "test". Anything else is the real Google path. */
export function authMode(): "test" | "google" {
  return process.env.AUTH_MODE === "test" ? "test" : "google";
}

export function isUscEmail(email: string | null | undefined): boolean {
  return !!email && /^[^@\s]+@usc\.edu$/i.test(email.trim());
}

/** Only same-site paths are allowed as a return address. */
export function safeNext(next: string | null | undefined): string {
  return next && /^\/(?!\/)[\w\-./?=&%[\]]*$/.test(next) ? next : "/";
}

// ------------------------------------------------------- test personas
export const TEST_PERSONAS = {
  student: { email: "forge-test-student@usc.edu", name: "Test Student", staffOf: null },
  staff: { email: "forge-test-staff@usc.edu", name: "Test Staff (Maker Space)", staffOf: "bfms" },
  nonusc: { email: "forge-test@example.com", name: "Test non-USC account", staffOf: null },
} as const;
export type Persona = keyof typeof TEST_PERSONAS;

/** Find or create the auth user for an email. Test mode and scripts only. */
export async function ensureAuthUser(email: string): Promise<string> {
  const { data: existing } = await db().from("profiles").select("user_id").eq("email", email).maybeSingle();
  if (existing) return existing.user_id;
  const created = await db().auth.admin.createUser({ email, email_confirm: true });
  if (created.data.user) return created.data.user.id;
  // Already in auth.users but without a profile: look it up.
  for (let page = 1; page <= 10; page++) {
    const { data } = await db().auth.admin.listUsers({ page, perPage: 200 });
    const hit = data?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) return hit.id;
    if (!data || data.users.length < 200) break;
  }
  throw new Error(`Could not create test user: ${created.error?.message}`);
}

// ---------------------------------------------------------- session
export async function currentUser(): Promise<SessionUser | null> {
  if (authMode() === "test") {
    const persona = (await cookies()).get(TEST_COOKIE)?.value as Persona | undefined;
    if (!persona || !(persona in TEST_PERSONAS) || persona === "nonusc") return null;
    const email = TEST_PERSONAS[persona].email;
    const { data } = await db().from("profiles").select("user_id").eq("email", email).maybeSingle();
    return data ? { id: data.user_id, email } : null;
  }
  const supabase = await supabaseAuth();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user || !isUscEmail(user.email)) return null; // the server never trusts a non-USC session
  return { id: user.id, email: user.email!.toLowerCase() };
}

export async function staffSpaceIds(email: string): Promise<string[]> {
  const { data } = await db().from("staff_members").select("space_id").eq("email", email.toLowerCase());
  return (data ?? []).map((r) => r.space_id);
}

/** For API routes. Returns the user, or the 401 response to send. */
export async function requireUser(): Promise<SessionUser | Response> {
  const user = await currentUser();
  return user ?? apiError(401, "SIGN_IN_REQUIRED", "Sign in with your USC account to do this.");
}

/** For staff API routes. 401 when signed out, 403 when not staff of that space. */
export async function requireStaff(spaceId: string | null | undefined): Promise<SessionUser | Response> {
  const user = await requireUser();
  if (user instanceof Response) return user;
  const spaces = await staffSpaceIds(user.email);
  if (!spaceId || !spaces.includes(spaceId)) {
    return apiError(403, "NOT_STAFF", "Only staff of this space can do this.");
  }
  return user;
}

// ------------------------------------------- what happens at sign-in
/**
 * Runs after identity is established, in both modes: create the profile on
 * first sign-in (copying the browser's audience and experience), and attach
 * the plan that was open, if it has no owner yet.
 */
export async function afterSignIn(
  user: SessionUser,
  opts: { displayName?: string | null; audience?: string | null; experience?: string | null; next: string },
) {
  const { data: profile } = await db().from("profiles").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!profile) {
    const audience = AUDIENCES.includes(opts.audience as Audience) ? (opts.audience as Audience) : null;
    const experience = EXPERIENCES.includes(opts.experience as Experience) ? (opts.experience as Experience) : null;
    await db().from("profiles").insert({
      user_id: user.id,
      email: user.email,
      display_name: opts.displayName ?? user.email.split("@")[0],
      audience,
      experience,
    });
  }
  const planId = /^\/plan\/([A-Za-z0-9]{6,20})/.exec(opts.next)?.[1];
  if (planId) {
    await db().from("plans").update({ user_id: user.id }).eq("id", planId).is("user_id", null);
  }
}
