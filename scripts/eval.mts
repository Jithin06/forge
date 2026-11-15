/**
 * Eval (SPEC 6.6). Runs every case in data/eval-cases.json through the
 * running app and prints how many top routes fall in the accepted set and
 * how many badges are correct. Quote only the numbers this prints.
 *
 *   AI_PROVIDER=gemini PORT=3123 npm start
 *   BASE=http://localhost:3123 npm run eval
 *
 * One live call per case, two if grounding needs a retry. Refuses to count
 * anything that came from sample data.
 */
import { readFile, writeFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { eligibility } from "../src/lib/compute/eligibility";
import { parseSpaceDoc, type Audience, type SpaceDoc } from "../src/lib/schemas";

const BASE = process.env.BASE ?? "http://localhost:3000";
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
type Case = { id: string; idea: string; answers: Record<string, string[]>; audience: Audience; accept_space_ids: string[] };
const file = JSON.parse(await readFile("data/eval-cases.json", "utf8")) as { status: string; cases: Case[] };
const { data: rows } = await db.from("spaces").select("doc");
const spaces = new Map(rows!.map((r) => parseSpaceDoc(r.doc)).flatMap((r) => (r.ok ? [[r.doc.id, r.doc] as [string, SpaceDoc]] : [])));

const created: string[] = [];
const results: Record<string, unknown>[] = [];
let topOk = 0, badges = 0, badgesOk = 0, errors = 0, fixtureSeen = false;

for (const c of file.cases) {
  await new Promise((r) => setTimeout(r, 4500)); // stay under 15 requests a minute
  const res = await fetch(`${BASE}/api/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: c.idea, answers: c.answers, audience: c.audience, experience: "never" }),
  });
  const body = await res.json().catch(() => null);
  if (body?.id) created.push(body.id);
  if (res.status !== 201) {
    errors++;
    results.push({ id: c.id, error: `${res.status} ${body?.error?.code ?? ""}` });
    console.log(`ERROR ${c.id}: ${res.status} ${body?.error?.message ?? ""}`);
    continue;
  }
  if (body.fixture) fixtureSeen = true;
  const routes = body.plan.routes as { space_id: string; eligibility: { status: string } }[];
  const top = routes[0]?.space_id ?? null;
  const ok = c.accept_space_ids.length === 0 ? routes.length === 0 : top !== null && c.accept_space_ids.includes(top);
  if (ok) topOk++;
  let caseBadges = 0, caseBadgesOk = 0;
  for (const r of routes) {
    caseBadges++;
    if (spaces.has(r.space_id) && eligibility(spaces.get(r.space_id)!, c.audience).status === r.eligibility.status) caseBadgesOk++;
  }
  badges += caseBadges;
  badgesOk += caseBadgesOk;
  results.push({ id: c.id, audience: c.audience, top, accepted: c.accept_space_ids, top_ok: ok, routes: routes.map((r) => `${r.space_id}:${r.eligibility.status}`), badges_ok: `${caseBadgesOk}/${caseBadges}` });
  console.log(`${ok ? "ok  " : "MISS"} ${c.id}: top=${top ?? "(no route)"} accepted=[${c.accept_space_ids.join(", ") || "no route"}] badges ${caseBadgesOk}/${caseBadges}`);
}

await db.from("plans").delete().in("id", created);
const n = file.cases.length;
console.log(`\nCases: ${n} (${file.status})`);
if (fixtureSeen) {
  console.log("NOT A RESULT: at least one answer came from sample data. Run against a server with a live AI provider.");
  process.exit(2);
}
console.log(`Top route in the accepted set: ${topOk} of ${n}`);
console.log(`Badges correct: ${badgesOk} of ${badges}`);
console.log(`Cases that errored: ${errors}`);
await writeFile(
  "reports/eval-latest.json",
  JSON.stringify({ ran_at: new Date().toISOString(), cases: n, cases_status: file.status, top_in_accepted: topOk, badges_correct: badgesOk, badges_total: badges, errors, results }, null, 2) + "\n",
);
