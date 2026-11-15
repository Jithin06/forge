/**
 * M2 checks that go through the running app's API (fixture mode).
 *
 *   BASE=http://localhost:3000 npm run check:m2
 *
 * Needs .env.local so it can read back the stored raw model output.
 */
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

console.log("\n2. A detailed idea is asked no questions; a vague one is asked up to three");
const detailed = await post("/api/ask", { text: IDEAS.stand, experience: "never" }, "10.0.0.2");
check(detailed.body.questions.length === 0, `detailed idea: ${detailed.body.questions.length} questions`, `summary: ${detailed.body.summary}`);
const vague = await post("/api/ask", { text: IDEAS.vague, experience: "never" }, "10.0.0.2");
const n = vague.body.questions.length;
check(n >= 1 && n <= 3, `vague idea: ${n} questions`, vague.body.questions.map((q: { text: string }) => q.text).join(" / "));

console.log("\n3. The same idea from two audiences gives the same routes with different badges and order");
const a = (await planFor(IDEAS.light, "viterbi_undergrad", "10.0.0.3")).plan.body.plan.routes as Route[];
const b = (await planFor(IDEAS.light, "usc_undergrad_other", "10.0.0.3")).plan.body.plan.routes as Route[];
const set = (rs: Route[]) => rs.map((r) => `${r.space_id}|${r.process}`).sort().join(";");
const show = (rs: Route[]) => rs.map((r) => `${r.space_id}=${r.eligibility.status}`).join(", ");
check(set(a) === set(b), "same set of routes");
check(show(a) !== show(b), "different badges and order", `Viterbi undergrad:   ${show(a)}\n      Other USC undergrad: ${show(b)}`);

console.log("\n6. Raw model (fixture) output for the three plans contains no dollar amounts");
check(rawOutputs.every((r) => !/\$|dollar|usd/i.test(r)), `scanned ${rawOutputs.length} stored raw outputs, ${rawOutputs.join("").length} characters`);

console.log("\nAlso checked");
const blocked = await post("/api/ask", { text: IDEAS.weapon, experience: "never" }, "10.0.0.4");
check(!!blocked.body.blocked_reason && !("questions" in blocked.body), "weapon part: blocked_reason set, no questions", blocked.body.blocked_reason);
const noPrice = (await planFor(IDEAS.stand, "viterbi_undergrad", "10.0.0.4")).plan.body.plan;
check(!/\$\s?\d/.test(JSON.stringify(noPrice)) && noPrice.routes.every((r: Route) => r.total === null), "no stored prices: no dollar figure anywhere in the plan");
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
  for (let i = 0; i < 21; i++) last = (await post("/api/ask", { text: IDEAS.sign, experience: "never" }, "10.0.0.99")).status;
  check(last === 429, `21st AI call in an hour from one address: ${last}`);
}

const { error: cleanupErr } = await db.from("plans").delete().in("id", created);
console.log(cleanupErr ? `\nCleanup failed: ${cleanupErr.message}` : `\nCleaned up ${created.length} test plan(s).`);

console.log(failures === 0 ? "All M2 API checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
