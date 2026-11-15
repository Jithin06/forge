/**
 * M3 checks, using test sign-in.
 *   BASE=<server with AUTH_MODE=test>  GOOGLE_BASE=<server with AUTH_MODE=google>  npm run check:m3
 * Creates and then deletes its own plans. Uses the two test accounts only.
 */
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.BASE ?? "http://localhost:3000";
const GOOGLE_BASE = process.env.GOOGLE_BASE;
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
let failures = 0;
const check = (ok: boolean, label: string, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `\n      ${detail}` : ""}`);
};
const created: string[] = [];

/** Sign in as a persona; returns the redirect target and the session cookie (if any). */
async function signIn(persona: string, next: string, extra: Record<string, string> = {}, base = BASE) {
  const res = await fetch(`${base}/auth/test`, {
    method: "POST",
    redirect: "manual",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ persona, next, ...extra }),
  });
  const cookie = (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).filter((c) => !c.endsWith("=")).join("; ");
  return { status: res.status, location: res.headers.get("location"), cookie };
}
const get = async (path: string, cookie = "", base = BASE) => {
  const res = await fetch(base + path, { headers: cookie ? { Cookie: cookie } : {} });
  return { status: res.status, body: await res.json().catch(() => null) };
};
const send = async (method: string, path: string, cookie = "", body?: unknown) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(cookie ? { Cookie: cookie } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};
const makePlan = async (cookie = "") => {
  const r = await send("POST", "/api/plan", cookie, {
    text: "An engraved acrylic sign with my club's name for our tabling booth, about 12 inches wide. We need one.",
    answers: { quantity: ["one"], demands: ["looks"] },
    audience: "viterbi_undergrad",
    experience: "never",
  });
  if (r.body?.id) created.push(r.body.id);
  return r.body?.id as string;
};

// Start from a first sign-in for the test student.
await db.from("profiles").delete().eq("email", "forge-test-student@usc.edu");

console.log("1. A usc.edu account signs in and lands back where it started");
const student = await signIn("student", "/spaces/bfms", { audience: "viterbi_grad", experience: "basic_tools" });
const session = await get("/api/session", student.cookie);
check(student.status === 303 && student.location === "/spaces/bfms", `redirected back to ${student.location} (status ${student.status})`);
check(session.body?.user?.email === "forge-test-student@usc.edu", `session is ${session.body?.user?.email}`);
const { data: profile } = await db.from("profiles").select("audience, experience, display_name").eq("email", "forge-test-student@usc.edu").maybeSingle();
check(profile?.audience === "viterbi_grad" && profile?.experience === "basic_tools", "first sign-in copied the browser's choices into the profile", JSON.stringify(profile));
const evil = await signIn("student", "https://evil.example/steal");
check(evil.location === "/", `an off-site return address is refused (sent to ${evil.location})`);

console.log("\n2. A non-USC account is signed out with the message from section 7.2");
const outsider = await signIn("nonusc", "/scrap");
const outsiderSession = await get("/api/session", outsider.cookie);
check(outsider.location?.startsWith("/sign-in?error=not_usc") === true && !outsider.cookie, `sent to ${outsider.location}, session cookie set: ${outsider.cookie ? "yes" : "no"}`);
check(outsiderSession.body?.user === null, "no session exists for the non-USC account");
const forged = await get("/api/session", "forge_test_user=nonusc");
check(forged.body?.user === null, "a hand-made cookie for the non-USC account is ignored");

console.log("\n3. /me and every staff route return 401 when signed out; staff routes return 403 for a non-staff account");
const staffRoutes: [string, string, unknown?][] = [
  ["GET", "/api/staff/claims?space_id=bfms"],
  ...((process.env.STAFF_ROUTES ? JSON.parse(process.env.STAFF_ROUTES) : []) as [string, string, unknown?][]),
];
const me401 = await get("/api/me");
check(me401.status === 401 && me401.body?.error?.code === "SIGN_IN_REQUIRED", `GET /api/me signed out: ${me401.status}`);
for (const [method, path, body] of staffRoutes) {
  const out = await send(method, path, "", body);
  const asStudent = await send(method, path, student.cookie, body);
  check(out.status === 401 && asStudent.status === 403, `${method} ${path}: signed out ${out.status}, test student ${asStudent.status}`);
}
const staff = await signIn("staff", "/staff");
const staffOwn = await get("/api/staff/claims?space_id=bfms", staff.cookie);
const staffOther = await get("/api/staff/claims?space_id=bme-innovation", staff.cookie);
check(staffOwn.status === 200 && staffOther.status === 403, `test staff: own space ${staffOwn.status}, another space ${staffOther.status}`);

console.log("\n4. A plan made while signed in appears on /me");
const mine = await makePlan(student.cookie);
const me = await get("/api/me", student.cookie);
check(me.status === 200 && me.body.plans.some((p: { id: string }) => p.id === mine), `plan ${mine} is in /api/me (${me.body?.plans?.length} plan(s))`);
const anon = await makePlan();
const before = await get("/api/me", student.cookie);
await signIn("student", `/plan/${anon}`);
const after = await get("/api/me", student.cookie);
check(
  !before.body.plans.some((p: { id: string }) => p.id === anon) && after.body.plans.some((p: { id: string }) => p.id === anon),
  "a plan open when the student signs in is attached to their account",
);

console.log("\n5. Test sign-in cannot be used when AUTH_MODE is not test");
if (GOOGLE_BASE) {
  const blocked = await signIn("student", "/", {}, GOOGLE_BASE);
  const ignored = await get("/api/session", "forge_test_user=student", GOOGLE_BASE);
  check(blocked.status === 404, `POST /auth/test in google mode: ${blocked.status}`);
  check(ignored.body?.user === null && ignored.body?.auth_mode === "google", "a test cookie is ignored in google mode, and the server reports google mode to the page");
  console.log("NOTE  that the picker and banner are not drawn in google mode is checked in a browser (see reports/M3.md)");
} else {
  console.log("SKIP  set GOOGLE_BASE to a server running with AUTH_MODE=google");
}

await db.from("plans").delete().in("id", created);
console.log(`\nCleaned up ${created.length} test plan(s).`);
console.log(failures === 0 ? "All M3 checks passed." : `${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
