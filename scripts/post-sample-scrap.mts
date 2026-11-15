/**
 * Sample scrap for the demo. Sends each photo in data/samples/scrap/ through
 * the staff portal's own draft route, as the test staff account, and records
 * what the model drafted. Publishing is a second step, so a blocked draft is
 * seen before anything is posted.
 *   BASE=http://localhost:3123 tsx --env-file=.env.local scripts/post-sample-scrap.mts draft [name ...]
 *   BASE=http://localhost:3123 tsx --env-file=.env.local scripts/post-sample-scrap.mts publish
 * Each draft is one live model call (two if the first answer is malformed).
 */
import { readFile, readdir, writeFile } from "node:fs/promises";

const BASE = process.env.BASE ?? "http://localhost:3000";
const DIR = "data/samples/scrap";
const OUT = "reports/sample-scrap-drafts.json";
const SAMPLE_LINE = "Sample item. Generated photo, not real Maker Space stock.";
/** Sizes and wording set by hand (Jithin, Nov 15): the model cannot judge size from a photo. */
const EDITS: Record<string, { size_note: string; title?: string; description?: string; material_category?: string }> = JSON.parse(await readFile("data/samples/scrap/edits.json", "utf8").catch(() => "{}"));

const signIn = async (persona: string) => {
  const res = await fetch(`${BASE}/auth/test`, { method: "POST", redirect: "manual", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ persona, next: "/" }) });
  return (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
};
const post = async (path: string, cookie: string, body: unknown) => {
  const res = await fetch(BASE + path, { method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return { status: res.status, body: await res.json().catch(() => null) };
};
const dataUrl = async (name: string) => `data:image/jpeg;base64,${(await readFile(`${DIR}/${name}.jpg`)).toString("base64")}`;
type Rec = { status: number; draft?: Record<string, unknown>; blocked_reason?: string | null; fixture?: boolean; error?: unknown; note?: string; published_id?: string };
const saved: Record<string, Rec> = JSON.parse(await readFile(OUT, "utf8").catch(() => "{}"));
const [stage, ...only] = process.argv.slice(2);
const staff = await signIn("staff");
if (!staff) throw new Error("Could not sign in as the test staff account. Is the server running with AUTH_MODE=test?");

if (stage === "draft") {
  const note = process.env.NOTE;
  const names = only.length ? only : (await readdir(DIR)).filter((f) => f.endsWith(".jpg")).map((f) => f.slice(0, -4)).sort();
  for (const name of names) {
    const r = await post("/api/staff/scrap/draft", staff, { space_id: "bfms", image: await dataUrl(name), ...(note ? { note } : {}) });
    saved[name] = r.status === 200 ? { status: 200, draft: r.body.draft, blocked_reason: r.body.blocked_reason, fixture: r.body.fixture, ...(note ? { note } : {}) } : { status: r.status, error: r.body };
    await writeFile(OUT, JSON.stringify(saved, null, 2) + "\n");
    console.log(`${name}: ${r.status} ${r.status === 200 ? `${r.body.draft.material_category} | ${r.body.draft.title} | blocked: ${r.body.blocked_reason ?? "no"}${r.body.fixture ? " | SAMPLE DATA, not the live model" : ""}` : JSON.stringify(r.body)}`);
  }
} else if (stage === "publish") {
  for (const [name, rec] of Object.entries(saved)) {
    if (rec.status !== 200 || !rec.draft || rec.blocked_reason || rec.published_id) { console.log(`${name}: skipped (${rec.blocked_reason ? "blocked" : rec.published_id ? "already published" : "no draft"})`); continue; }
    const edit = EDITS[name];
    if (!edit) { console.log(`${name}: skipped, no hand-set size in edits.json`); continue; }
    const d = rec.draft as { material_category: string; title: string; description: string; condition: string; restrictions: string[] };
    const description = `${(edit.description ?? d.description).trim().replace(/\s*Sample item\..*$/, "")} ${SAMPLE_LINE}`;
    const r = await post("/api/staff/scrap", staff, { space_id: "bfms", material_category: edit.material_category ?? d.material_category, title: edit.title ?? d.title, description, size_note: edit.size_note, condition: d.condition, restrictions: d.restrictions, image: await dataUrl(name) });
    if (r.status === 201) rec.published_id = r.body.item.id;
    await writeFile(OUT, JSON.stringify(saved, null, 2) + "\n");
    console.log(`${name}: ${r.status} ${r.status === 201 ? r.body.item.id : JSON.stringify(r.body)}`);
  }
} else {
  console.log("Say draft or publish.");
}
