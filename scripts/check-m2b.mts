/**
 * M2b checks against a server running with AI_PROVIDER=gemini.
 * Costs about 10 live calls (more if a grounding retry happens).
 *
 *   AI_PROVIDER=gemini RECORD_FIXTURES=1 PORT=3123 npm start     (one terminal)
 *   BASE=http://localhost:3123 npm run check:m2b                 (another)
 */
import { readFile, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { planOutputSchema } from "../src/lib/ai/schemas";
import { groundPlan } from "../src/lib/compute/grounding";
import { parseSpaceDoc, type SpaceDoc } from "../src/lib/schemas";

const BASE = process.env.BASE ?? "http://localhost:3000";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
let failures = 0;
const check = (ok: boolean, label: string, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `\n      ${detail}` : ""}`);
};
const pause = () => new Promise((r) => setTimeout(r, 4500)); // stay under 15 requests a minute
const post = async (path: string, body: unknown) => {
  await pause();
  const res = await fetch(BASE + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { status: res.status, body: await res.json().catch(() => null) };
};
const created: string[] = [];
const { data: rows } = await db.from("spaces").select("doc");
const spaces = rows!.map((r) => parseSpaceDoc(r.doc)).flatMap((r) => (r.ok ? [r.doc] : [])) as SpaceDoc[];

const IDEAS = {
  stand: "I want to make a phone stand for my desk out of wood. It should hold my phone at a slight angle, fit in my hand, and I only need one.",
  light: "A small night light for my dorm desk with a warm LED inside and a 3D printed cover. Just one, about the size of my palm.",
  sign: "An engraved acrylic sign with my club's name for our tabling booth, about 12 inches wide. We need one.",
};
type R = { space_id: string; process: string; equipment: { id: string }[]; cost_lines: { category: string }[] };
const livePlan = async (text: string, image?: string) => {
  const ask = await post("/api/ask", { text, experience: "never", ...(image ? { image } : {}) });
  if (ask.status !== 200 || ask.body.blocked_reason) return { ask, plan: null, raw: null };
  const answers = { ...ask.body.prefilled };
  for (const q of ask.body.questions ?? []) answers[q.id] = ["not_sure"];
  const plan = await post("/api/plan", { text, answers, audience: "viterbi_undergrad", experience: "never", ...(image ? { image } : {}) });
  if (plan.body?.id) created.push(plan.body.id);
  const { data } = await db.from("plans").select("plan").eq("id", plan.body?.id ?? "").maybeSingle();
  return { ask, plan, raw: data?.plan?.model ?? null };
};

console.log("1. The three M2 ideas each produce a valid plan from the live model");
const raws: string[] = [];
let allLive = true;
let standRoutes: R[] = [];
for (const [name, text] of Object.entries(IDEAS)) {
  const { ask, plan, raw } = await livePlan(text);
  const zod = planOutputSchema.safeParse(raw);
  const grounded = zod.success && groundPlan(zod.data, spaces).ok;
  raws.push(JSON.stringify(raw));
  allLive &&= ask.body?.fixture === false && plan?.body?.fixture === false;
  if (name === "stand") standRoutes = plan?.body?.plan?.routes ?? [];
  if (name === "sign" && plan?.status === 201) {
    // One complete live example for the report: what went in, what the model said, what code made of it.
    await writeFile("reports/m2b-live-example.json", JSON.stringify({ idea: text, audience: "viterbi_undergrad", experience: "never", ask: ask.body, raw_model_output: raw, computed_plan: plan.body.plan }, null, 2) + "\n");
  }
  check(
    plan?.status === 201 && zod.success && grounded && plan.body.plan.routes.length > 0,
    `${name}: status ${plan?.status}, zod ${zod.success}, grounded ${grounded}, questions asked ${ask.body?.questions?.length}`,
    (plan?.body?.plan?.routes as R[] | undefined)?.map((r) => `${r.space_id}: ${r.process}`).join("\n      ") ?? JSON.stringify(plan?.body ?? ask.body),
  );
}

console.log("\n2. A photo of a hand sketch changes the live plan");
const sketch = `data:image/jpeg;base64,${(await readFile("data/samples/sketch-phone-stand.jpg")).toString("base64")}`;
const withSketch = await livePlan(IDEAS.stand, sketch);
const sig = (rs: R[]) => rs.map((r) => `${r.space_id}|${r.equipment.map((e) => e.id).join("+")}|${r.cost_lines.map((c) => c.category).join("+")}`).join(" ; ");
const a = sig(standRoutes);
const b = sig(withSketch.plan?.body?.plan?.routes ?? []);
raws.push(JSON.stringify(withSketch.raw));
check(withSketch.plan?.status === 201 && a !== b, "routes, tools or materials differ with the sketch (the sketch says clear acrylic; the text says wood)", `without: ${a}\n      with:    ${b}\n      summary with sketch: ${withSketch.plan?.body?.plan?.summary}`);

console.log("\n3. Raw live output contains no dollar amounts");
check(raws.every((r) => !/\$|dollar|usd/i.test(r)), `scanned ${raws.length} raw outputs, ${raws.join("").length} characters`);

console.log("\n5. The Sample data banner is gone in live mode");
check(allLive && withSketch.plan?.body?.fixture === false, "every response says fixture: false, so no banner is shown");

await db.from("plans").delete().in("id", created);
console.log(`\nCleaned up ${created.length} test plan(s).`);
console.log(failures === 0 ? "All M2b checks passed (check 4, the scrap draft, runs in M4)." : `${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
