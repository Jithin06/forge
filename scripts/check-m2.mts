/**
 * M2 checks that go through the running app's API (fixture mode).
 *
 *   BASE=http://localhost:3000 npm run check:m2
 *
 * Needs .env.local so it can read back the stored raw model output.
 */
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { planOutputSchema } from "../src/lib/ai/schemas";
import { groundPlan } from "../src/lib/compute/grounding";
import { parseSpaceDoc, type SpaceDoc } from "../src/lib/schemas";

const BASE = process.env.BASE ?? "http://localhost:3000";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});

let failures = 0;
const check = (ok: boolean, label: string, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `\n      ${detail}` : ""}`);
};
// Each group uses its own client address so the hourly limit does not interfere.
const post = async (path: string, body: unknown, ip: string) => {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": ip },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
};

const IDEAS = {
  stand: "I want to make a phone stand for my desk out of wood. It should hold my phone at a slight angle, fit in my hand, and I only need one.",
  light: "A small night light for my dorm desk with a warm LED inside and a 3D printed cover. Just one, about the size of my palm.",
  sign: "An engraved acrylic sign with my club's name for our tabling booth, about 12 inches wide. We need one.",
  vague: "something cool for my room",
  weapon: "I want to 3D print a working gun frame.",
};

const { data: spaceRows } = await db.from("spaces").select("doc");
const spaces = spaceRows!.map((r) => parseSpaceDoc(r.doc)).flatMap((r) => (r.ok ? [r.doc] : [])) as SpaceDoc[];

const created: string[] = []; // plan ids made by this run, deleted at the end
type Route = { space_id: string; process: string; eligibility: { status: string }; total: unknown; labels: string[] };
const planFor = async (text: string, audience: string, ip: string) => {
  const ask = await post("/api/ask", { text, experience: "never" }, ip);
  const answers = { ...ask.body.prefilled };
  for (const q of ask.body.questions ?? []) answers[q.id] = ["not_sure"];
  const plan = await post("/api/plan", { text, answers, audience, experience: "never" }, ip);
  if (plan.body?.id) created.push(plan.body.id);
  return { ask, plan };
};

console.log("\n1. Three different ideas each produce a plan that passes zod and grounding");
const rawOutputs: string[] = [];
for (const [name, text] of Object.entries({ stand: IDEAS.stand, light: IDEAS.light, sign: IDEAS.sign })) {
  const { plan } = await planFor(text, "viterbi_undergrad", "10.0.0.1");
  const { data: row } = await db.from("plans").select("plan").eq("id", plan.body?.id ?? "").maybeSingle();
  const model = row?.plan?.model;
  const zod = planOutputSchema.safeParse(model);
  const grounded = zod.success ? groundPlan(zod.data, spaces) : { ok: false };
  rawOutputs.push(JSON.stringify(model));
  check(
    plan.status === 201 && zod.success && grounded.ok,
    `${name}: status ${plan.status}, zod ${zod.success ? "ok" : "failed"}, grounding ${grounded.ok ? "ok" : "failed"}`,
    `plan ${plan.body?.id}: ${(plan.body?.plan.routes as Route[] | undefined)?.map((r) => `${r.space_id} "${r.process}"`).join(" | ")}`,
  );
}

console.log("\n2. A detailed idea is asked at most one question; a vague one is asked one to three");
const detailed = await post("/api/ask", { text: IDEAS.stand, experience: "never" }, "10.0.0.2");
check(detailed.body.questions.length <= 1, `detailed idea: ${detailed.body.questions.length} question(s)`, `summary: ${detailed.body.summary}`);
const vague = await post("/api/ask", { text: IDEAS.vague, experience: "never" }, "10.0.0.2");
const n = vague.body.questions.length;
check(n >= 1 && n <= 3, `vague idea: ${n} questions`, vague.body.questions.map((q: { text: string }) => q.text).join(" / "));

console.log("\n3. The same idea from two audiences gives the same routes with different badges and order");
const a = (await planFor(IDEAS.sign, "viterbi_undergrad", "10.0.0.3")).plan.body.plan.routes as Route[];
const b = (await planFor(IDEAS.sign, "usc_undergrad_other", "10.0.0.3")).plan.body.plan.routes as Route[];
const set = (rs: Route[]) => rs.map((r) => `${r.space_id}|${r.process}`).sort().join(";");
const show = (rs: Route[]) => rs.map((r) => `${r.space_id}=${r.eligibility.status}`).join(", ");
check(set(a) === set(b), "same set of routes");
check(show(a) !== show(b), "different badges and order", `Viterbi undergrad:   ${show(a)}\n      Other USC undergrad: ${show(b)}`);

console.log("\n6. Raw model (fixture) output for the three plans contains no dollar amounts");
check(rawOutputs.every((r) => !/\$|dollar|usd/i.test(r)), `scanned ${rawOutputs.length} stored raw outputs, ${rawOutputs.join("").length} characters`);

console.log("\nAlso checked");
const blocked = await post("/api/ask", { text: IDEAS.weapon, experience: "never" }, "10.0.0.4");
check(!!blocked.body.blocked_reason && !("questions" in blocked.body), "weapon part: blocked_reason set, no questions", blocked.body.blocked_reason);
// Recomputed here, separately from the app: each material's quantity range times
// its stored price; no total when a material has no stored price.
const standFixture = JSON.parse(await readFile("data/fixtures/plan/phone-stand.json", "utf8")).output as {
  routes: { space_id: string; materials: { material_id: string | null; quantity_low: number; quantity_high: number }[] }[];
};
const byHand = standFixture.routes.map((r) => {
  const space = spaces.find((s) => s.id === r.space_id)!;
  const prices = r.materials.map((m) => space.materials.find((x) => x.id === m.material_id)?.unit_price_usd ?? null);
  if (prices.length === 0 || prices.some((p) => p === null)) return null;
  const sum = (k: "quantity_low" | "quantity_high") => Math.round(r.materials.reduce((t, m, i) => t + m[k] * prices[i]!, 0) * 100) / 100;
  return { low: sum("quantity_low"), high: sum("quantity_high") };
});
const costed = (await planFor(IDEAS.stand, "viterbi_undergrad", "10.0.0.4")).plan.body.plan.routes as (Route & { prices_estimated: boolean })[];
const sortTotals = (xs: unknown[]) => xs.map((x) => JSON.stringify(x)).sort().join(" ");
check(
  sortTotals(costed.map((r) => r.total)) === sortTotals(byHand) && costed.filter((r) => r.total).every((r) => r.prices_estimated),
  "costs equal quantity times stored price, recomputed in this script; marked estimated",
  `app: ${JSON.stringify(costed.map((r) => r.total))}  recomputed: ${JSON.stringify(byHand)}`,
);
const short = await post("/api/ask", { text: "lamp", experience: "never" }, "10.0.0.4");
check(short.status === 400 && short.body.error.code === "BAD_REQUEST", `too-short idea: ${short.status}`, short.body.error.message);
const badAud = await post("/api/plan", { text: IDEAS.sign, answers: {}, audience: "martian", experience: "never" }, "10.0.0.4");
check(badAud.status === 400, `bad audience: ${badAud.status}`);
const badAns = await post("/api/plan", { text: IDEAS.sign, answers: { size: ["galaxy"] }, audience: "viterbi_grad", experience: "never" }, "10.0.0.4");
check(badAns.status === 400, `answer not in the bank: ${badAns.status}`, badAns.body.error.message);
const missing = await fetch(`${BASE}/api/plan/doesNotExist1`);
check(missing.status === 404, `unknown plan id: ${missing.status}`);
if (process.env.SKIP_RATE_LIMIT) {
  console.log("SKIP  rate limit (SKIP_RATE_LIMIT set, so this address is not locked out for an hour)");
} else {
  let last = 0;
  for (let i = 0; i < 101; i++) last = (await post("/api/ask", { text: IDEAS.sign, experience: "never" }, "10.0.0.99")).status;
  check(last === 429, `101st AI call in an hour from one address: ${last}`);
}

const { error: cleanupErr } = await db.from("plans").delete().in("id", created);
console.log(cleanupErr ? `\nCleanup failed: ${cleanupErr.message}` : `\nCleaned up ${created.length} test plan(s).`);

console.log(failures === 0 ? "All M2 API checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
