/**
 * Route order, eligibility badges and tags of every recorded plan, for each of
 * the four audiences, with the scrap bin as it is now. Used to compare before
 * and after a change. Sample-data mode only; the plans it makes are deleted.
 *   BASE=http://localhost:3123 tsx --env-file=.env.local scripts/snapshot-plan-tags.mts out.json
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.BASE ?? "http://localhost:3123";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const out: Record<string, string[]> = {};
const ids: string[] = [];
for (const f of (await readdir("data/fixtures/plan")).filter((f) => f.endsWith(".json") && f !== "default.json").sort()) {
  const { key } = JSON.parse(await readFile(`data/fixtures/plan/${f}`, "utf8"));
  if (!key?.text) continue;
  for (const audience of ["viterbi_undergrad", "viterbi_grad", "usc_undergrad_other", "usc_grad_other"]) {
    const r = await fetch(`${BASE}/api/plan`, { method: "POST", headers: { "Content-Type": "application/json", "X-Forwarded-For": "10.0.9.1" }, body: JSON.stringify({ text: key.text, answers: key.answers ?? {}, audience, experience: key.experience ?? "never" }) });
    const j = await r.json();
    if (r.status !== 201) { out[`${f} ${audience}`] = [`status ${r.status} ${j?.error?.code ?? ""}`]; continue; }
    if (!j.fixture) throw new Error("Not in sample-data mode.");
    ids.push(j.id);
    out[`${f} ${audience}`] = j.plan.routes.map((x: { space_id: string; kind?: string; eligibility: { status: string }; labels: string[]; total: { low: number } | null; with_scrap: { low: number } | null }) => `${x.space_id}/${x.kind ?? ""} ${x.eligibility.status} [${x.labels.join(",")}] new ${x.total?.low ?? "-"} scrap ${x.with_scrap?.low ?? "-"}`);
  }
}
if (ids.length) await db.from("plans").delete().in("id", ids);
await writeFile(process.argv[2], JSON.stringify(out, null, 1));
console.log(`${Object.keys(out).length} plans snapshotted`);
