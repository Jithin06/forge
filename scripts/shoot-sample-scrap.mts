/**
 * Screenshots at 390 px for the sample-scrap check: the Scrap tab, the Maker
 * Space page's "Free here now" strip, and the club sign and phone stand plans.
 * Run against a server in sample-data mode; it makes no live AI calls.
 *   BASE=http://localhost:3123 tsx --env-file=.env.local scripts/shoot-sample-scrap.mts
 */
import { chromium } from "playwright-core";
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.BASE ?? "http://localhost:3123";
const OUT = "reports/sample-scrap";
const session = await (await fetch(`${BASE}/api/session`)).json();
const plan = async (body: unknown) => {
  const r = await fetch(`${BASE}/api/plan`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (r.status !== 201 || !j.fixture) throw new Error(`plan: ${r.status}, fixture ${j.fixture}. Run the server with AI_PROVIDER=fixture.`);
  return j as { id: string; plan: { routes: { space_id: string; scrap: { id: string; title: string }[][]; total: unknown; with_scrap: unknown; cost_lines: { name: string }[] }[] } };
};
const sign = await plan({ text: "An engraved acrylic sign with my club's name for our tabling booth, about 12 inches wide. We need one.", answers: { size: ["shoebox"], quantity: ["one"], demands: ["not_sure"] }, audience: "usc_undergrad_other", experience: "never" });
const stand = await plan({ text: "I want to make a phone stand for my desk out of wood. It should hold my phone at a slight angle, fit in my hand, and I only need one.", answers: { size: ["hand"], quantity: ["one"] }, audience: "viterbi_undergrad", experience: "never" });
for (const [n, p] of [["club sign", sign], ["phone stand", stand]] as const)
  for (const r of p.plan.routes) console.log(`${n} @ ${r.space_id}: total ${JSON.stringify(r.total)}, with scrap ${JSON.stringify(r.with_scrap)}, matches ${JSON.stringify(r.cost_lines.map((l, i) => `${l.name}: ${(r.scrap[i] ?? []).map((s) => s.title).join(" / ") || "none"}`))}`);

const browser = await chromium.launch({ channel: "chrome" });
const shots: [string, string, string][] = [
  ["scrap-tab", "/scrap", "usc_undergrad_other"],
  ["maker-space-page", "/spaces/bfms", "usc_undergrad_other"],
  ["plan-club-sign", `/plan/${sign.id}`, "usc_undergrad_other"],
  ["plan-phone-stand", `/plan/${stand.id}`, "viterbi_undergrad"],
];
for (const [name, path, audience] of shots) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript((a) => { localStorage.setItem("forge.audience", a); localStorage.setItem("forge.experience", "never"); }, audience);
  const p = await ctx.newPage();
  await p.goto(BASE + path, { waitUntil: "load", timeout: 30000 });
  await p.waitForTimeout(1500);
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } scrollTo(0, 0); });
  await p.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 1 : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 8000); })))));
  const broken = await p.evaluate(() => [...document.images].filter((i) => i.complete && !i.naturalWidth).length);
  const sideways = await p.evaluate(() => document.documentElement.scrollWidth > 390);
  const claims = await p.getByRole("button", { name: /claim/i }).count() + await p.getByRole("link", { name: /claim/i }).count();
  await p.screenshot({ path: `${OUT}/${name}-390.png`, fullPage: true });
  // Close-ups of the parts being checked.
  if (name === "maker-space-page") {
    const strip = p.locator("section[aria-labelledby=free-here]");
    await strip.scrollIntoViewIfNeeded();
    await p.waitForTimeout(800);
    await strip.screenshot({ path: `${OUT}/maker-space-free-here-now-390.png` });
    console.log(`  strip: ${await strip.locator("li").count()} items`);
  }
  if (name.startsWith("plan-")) {
    const first = p.locator("main article").first();
    const claim = first.getByRole("button", { name: /claim/i }).or(first.getByRole("link", { name: /claim/i })).first();
    if (await claim.count()) {
      await claim.scrollIntoViewIfNeeded();
      await p.evaluate(() => scrollBy(0, 250));
      await p.waitForTimeout(500);
      await p.screenshot({ path: `${OUT}/${name}-scrap-match-390.png` });
    }
    console.log(`  first route: ${(await first.innerText()).split("\n").filter((l) => /scrap|claim|free|\$/i.test(l)).slice(0, 14).join(" | ")}`);
  }
  if (name === "scrap-tab") {
    await p.getByRole("button", { name: /see and claim/i }).nth(2).click();
    await p.waitForTimeout(800);
    await p.screenshot({ path: `${OUT}/scrap-item-sheet-390.png` });
    console.log(`  item sheet: sample line shown ${await p.getByText("Generated photo, not real Maker Space stock").count()}`);
  }
  console.log(`${name}: sideways scroll ${sideways}, broken images ${broken}, "Claim" controls ${claims}, sample line shown ${await p.getByText("Generated photo, not real Maker Space stock").count()}`);
  await ctx.close();
}
await browser.close();
console.log(`auth mode ${session.auth_mode}; plans ${sign.id}, ${stand.id}`);
if (process.env.KEEP_PLANS !== "1") {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  await db.from("plans").delete().in("id", [sign.id, stand.id]);
}
