/**
 * Confirmations must be real, and nobody's name leaves the server.
 * Needs two copies of the same build running against the same database:
 *
 *   AI_PROVIDER=fixture AUTH_MODE=test   npx next start -p 3123
 *   AI_PROVIDER=fixture AUTH_MODE=google npx next start -p 3124
 *   TEST_BASE=http://localhost:3123 REAL_BASE=http://localhost:3124 npm run check:confirmations
 *
 * It confirms the Maker Space's hours with the TEST staff account, looks at
 * what each copy shows, and then puts the stored status back to estimated.
 */
import { createClient } from "@supabase/supabase-js";

const TEST = process.env.TEST_BASE ?? "http://localhost:3123";
const REAL = process.env.REAL_BASE ?? "http://localhost:3124";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
let failures = 0;
const check = (ok: boolean, label: string, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `\n      ${detail}` : ""}`);
};
const STAFF = "forge-test-staff@usc.edu";
const text = async (url: string, cookie = "") => (await fetch(url, { headers: cookie ? { Cookie: cookie } : {}, cache: "no-store" })).text();

const { data: before } = await db.from("spaces").select("doc").eq("id", "bfms").single();
const original = before!.doc as { status: Record<string, unknown> };

try {
  const login = await fetch(`${TEST}/auth/test`, { method: "POST", redirect: "manual", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ persona: "staff", next: "/" }) });
  const cookie = (login.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  const patch = await fetch(`${TEST}/api/staff/space/bfms`, { method: "PATCH", headers: { "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify({ confirm: "hours" }) });
  const patched = await patch.text();
  check(patch.status === 200, "the test staff account confirms the Maker Space's hours (test sign-in on)");
  check(!patched.includes(STAFF) && !patched.includes("confirmed_by"), "the reply to the staff member does not echo who confirmed");

  const { data: stored } = await db.from("spaces").select("doc->status->hours").eq("id", "bfms").single();
  check((stored as { hours?: { confirmed_by?: string } })?.hours?.confirmed_by === STAFF, "the database records who confirmed", JSON.stringify(stored));

  console.log("\nTest sign-in on");
  const t = JSON.parse(await text(`${TEST}/api/spaces/bfms`)).space.status.hours;
  check(t.state === "confirmed" && t.test === true, 'the API marks it as a test confirmation', JSON.stringify(t));
  const tPage = await text(`${TEST}/spaces/bfms`);
  check(tPage.includes("Test confirmation") && !/Confirmed by staff<!-- --> on|Confirmed by staff on/.test(tPage), 'the space page chip reads "Test confirmation", not "Confirmed by staff"');

  console.log("\nTest sign-in off (AUTH_MODE is not test)");
  const r = JSON.parse(await text(`${REAL}/api/spaces/bfms`)).space.status.hours;
  check(r.state === "estimated" && Object.keys(r).length === 1, "the API shows the group as estimated: the test confirmation is ignored", JSON.stringify(r));
  const rPage = await text(`${REAL}/spaces/bfms`);
  check(!rPage.includes("Test confirmation") && !/Confirmed by staff<!-- --> on|Confirmed by staff on/.test(rPage), "the space page shows no confirmation chip");

  console.log("\nNo public route says who confirmed");
  const { data: plan } = await db.from("plans").select("id").limit(1).maybeSingle();
  const routes = ["/api/spaces", "/api/spaces/bfms", "/api/spaces?audience=viterbi_undergrad", "/api/scrap", "/api/session", "/spaces", "/spaces/bfms", "/", "/scrap", ...(plan ? [`/api/plan/${plan.id}`, `/plan/${plan.id}`] : [])];
  for (const base of [TEST, REAL]) {
    const leaks: string[] = [];
    for (const path of routes) {
      const body = await text(base + path);
      if (body.includes("confirmed_by") || body.includes(STAFF)) leaks.push(path);
    }
    check(leaks.length === 0, `${base === TEST ? "test" : "real"} mode: ${routes.length} public pages and API routes read, none contains "confirmed_by" or the staff address`, leaks.join(", "));
  }
} finally {
  // Put the stored status back exactly as it was. Nothing stays confirmed.
  const { data: now } = await db.from("spaces").select("doc").eq("id", "bfms").single();
  const doc = { ...(now!.doc as object), status: original.status };
  const { error } = await db.from("spaces").update({ doc }).eq("id", "bfms");
  const { data: after } = await db.from("spaces").select("doc->status").eq("id", "bfms").single();
  check(!error && JSON.stringify((after as { status: unknown }).status) === JSON.stringify(original.status), "the Maker Space's stored status is back to what it was", JSON.stringify((after as { status: unknown }).status));
}
console.log(failures === 0 ? "\nAll confirmation and privacy checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
