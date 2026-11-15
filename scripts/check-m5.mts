/**
 * M5 checks through the running app (AUTH_MODE=test).
 * The space document is saved first and restored at the end, so nothing stays
 * confirmed and no price stays changed.
 *   BASE=http://localhost:3123 npm run check:m5
 */
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.BASE ?? "http://localhost:3000";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
let failures = 0;
const check = (ok: boolean, label: string, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `\n      ${detail}` : ""}`);
};
const signIn = async (persona: string) => {
  const res = await fetch(`${BASE}/auth/test`, { method: "POST", redirect: "manual", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ persona, next: "/" }) });
  return (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
};
const call = async (method: string, path: string, cookie = "", body?: unknown) => {
  const res = await fetch(BASE + path, { method, headers: { ...(cookie ? { Cookie: cookie } : {}), ...(body ? { "Content-Type": "application/json" } : {}), "X-Forwarded-For": "10.0.5.1" }, body: body ? JSON.stringify(body) : undefined });
  return { status: res.status, body: await res.json().catch(() => null) };
};
const plans: string[] = [];
const standPlan = async () => {
  const r = await call("POST", "/api/plan", "", {
    text: "I want to make a phone stand for my desk out of wood. It should hold my phone at a slight angle, fit in my hand, and I only need one.",
    answers: { size: ["hand"], quantity: ["one"], demands: ["looks"] }, audience: "viterbi_undergrad", experience: "never",
  });
  plans.push(r.body.id);
  return r.body.plan.routes[0] as { total: { low: number; high: number }; prices_estimated: boolean };
};
const staff = await signIn("staff");
const student = await signIn("student");
const { data: saved } = await db.from("spaces").select("id, doc, updated_at, updated_by").in("id", ["bfms", "bme-innovation"]);
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());

try {
  console.log("1. A staff member cannot edit another space (403)");
  const out = await call("PATCH", "/api/staff/space/bfms", "", { confirm: "hours" });
  const stu = await call("PATCH", "/api/staff/space/bfms", student, { confirm: "hours" });
  const other = await call("PATCH", "/api/staff/space/bme-innovation", staff, { confirm: "hours" });
  const { data: bme } = await db.from("spaces").select("doc").eq("id", "bme-innovation").single();
  check(out.status === 401 && stu.status === 403 && other.status === 403 && bme!.doc.status.hours.state === "estimated", `signed out ${out.status}; test student ${stu.status}; Maker Space staff editing BME ${other.status}; BME unchanged`);

  console.log("\n3. An edited price changes the cost on a new plan within about a minute");
  const before = await standPlan();
  const t0 = Date.now();
  const edit = await call("PATCH", "/api/staff/space/bfms", staff, { prices: [{ material_id: "plywood_sheet", unit_price_usd: 9 }] });
  const after = await standPlan();
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  // 1 plywood sheet + 1 to 2 cardboard sheets at $1: was 6 + (1..2) = 7..8, now 9 + (1..2) = 10..11
  check(edit.status === 200 && JSON.stringify(before.total) === '{"low":7,"high":8}' && JSON.stringify(after.total) === '{"low":10,"high":11}', `plywood $6 -> $9: plan total ${JSON.stringify(before.total)} -> ${JSON.stringify(after.total)}, ${secs} s after the edit`);
  const src = edit.body.space.materials.find((m: { id: string }) => m.id === "plywood_sheet").price_source;
  check(/^staff \(/.test(src), `the edited price is now sourced "${src}"`);

  console.log("\n2. Confirming prices changes the chip to Confirmed by staff with today's date, and new plans drop \"estimated prices\"");
  const confirm = await call("PATCH", "/api/staff/space/bfms", staff, { confirm: "prices" });
  const seen = (await call("GET", "/api/spaces/bfms")).body.space.status;
  const confirmedPlan = await standPlan();
  const page = (await (await fetch(`${BASE}/spaces/bfms`)).text()).replaceAll("<!-- -->", ""); // React splits text nodes with comments
  const pretty = new Date(`${today}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  check(confirm.status === 200 && seen.prices.state === "confirmed" && seen.prices.confirmed_on === today && seen.prices.confirmed_by === "forge-test-staff@usc.edu", `status.prices = ${JSON.stringify(seen.prices)}`);
  check(page.includes(`Confirmed by staff on ${pretty}`), `the space page shows "Confirmed by staff on ${pretty}"`);
  check(before.prices_estimated === true && confirmedPlan.prices_estimated === false, `plan prices_estimated: ${before.prices_estimated} before, ${confirmedPlan.prices_estimated} after confirming`);
  check(seen.hours.state === "estimated" && seen.access.state === "estimated", "only the confirmed group changed; hours and access are still estimated");

  console.log("\n   Edits are validated");
  const badTime = await call("PATCH", "/api/staff/space/bfms", staff, { hours: { mon: { open: "25:00", close: "26:00" } } });
  const missingAudience = await call("PATCH", "/api/staff/space/bfms", staff, { access: [{ audience: "viterbi_undergrad", status: "open", note: null }] });
  const two = await call("PATCH", "/api/staff/space/bfms", staff, { confirm: "hours", hours: null });
  const negative = await call("PATCH", "/api/staff/space/bfms", staff, { prices: [{ material_id: "plywood_sheet", unit_price_usd: -1 }] });
  check([badTime, missingAudience, two, negative].every((r) => r.status === 400), `bad time ${badTime.status}; access missing audiences ${missingAudience.status}; two changes at once ${two.status}; negative price ${negative.status}`, missingAudience.body?.error?.message?.slice(0, 120));
  const okAccess = await call("PATCH", "/api/staff/space/bfms", staff, { access: saved!.find((s) => s.id === "bfms")!.doc.access.map((a: { audience: string }) => (a.audience === "viterbi_undergrad" ? { ...a, status: "open", note: null } : a)) });
  const badge = (await call("GET", "/api/spaces/bfms?audience=viterbi_undergrad")).body.eligibility;
  check(okAccess.status === 200 && badge.status === "open", `a valid access edit shows at once: Viterbi undergrad is now "${badge.status}"`);
} finally {
  for (const s of saved ?? []) await db.from("spaces").update({ doc: s.doc, updated_at: s.updated_at, updated_by: s.updated_by }).eq("id", s.id);
  await db.from("plans").delete().in("id", plans);
  const { data: back } = await db.from("spaces").select("doc").eq("id", "bfms").single();
  console.log(`\nRestored both spaces (prices group is "${back!.doc.status.prices.state}" again, plywood is $${back!.doc.materials.find((m: { id: string }) => m.id === "plywood_sheet").unit_price_usd}). Deleted ${plans.length} plan(s).`);
}
console.log(failures === 0 ? "All M5 checks passed." : `${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
