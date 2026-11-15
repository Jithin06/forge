// Takes the plan screenshots for the deck from the running app at phone width (390 px, 3x).
//   BASE=http://localhost:3124 PLAN=RRFvTqmeZR node deck/shots.mjs
// BASE must be a server in Google sign-in mode (no "Test sign-in" banner) on a live model.
// PLAN is the id of a plan made on a live model, so it carries no "Sample data" banner.
// This script makes no AI calls and writes nothing to the database.
// The other screenshots (ask, question, AI scrap draft, claim, held, staff confirm) were taken
// once by driving the same app by hand-written Playwright steps; see deck/CHANGES.md.
import { chromium } from "playwright-core";
import path from "node:path";
const BASE = process.env.BASE ?? "http://localhost:3124";
const PLAN = process.env.PLAN ?? "RRFvTqmeZR";
const out = path.join(import.meta.dirname, "assets");
const W = 390, H = 526; // css px shown in each slide frame; 526 ends the first crop cleanly after the second training

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({ viewport: { width: W, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { localStorage.setItem("forge.audience", "viterbi_undergrad"); localStorage.setItem("forge.experience", "never"); });
const p = await ctx.newPage();
await p.goto(`${BASE}/plan/${PLAN}`, { waitUntil: "networkidle" });
await p.waitForSelector("main article");
await p.addStyleTag({ content: "nav[aria-label=Main].fixed{display:none}" }); // the fixed tab bar would sit across long captures
await p.evaluate(() => Promise.all([...document.images].map((i) => { i.loading = "eager"; return i.complete && i.naturalWidth ? 1 : new Promise((r) => { i.onload = i.onerror = r; }); })));
if (await p.getByText("Sample data.").count()) throw new Error("This plan shows the Sample data banner; use a plan made on a live model.");
const first = p.locator("main article").first();
const top = (loc) => loc.evaluate((e) => e.getBoundingClientRect().top + scrollY);
const tools = await top(first.getByText("Tools you will use", { exact: true }));
const mat = await top(first.locator("h3", { hasText: "Materials" }));
const stepsEnd = await first.locator("summary", { hasText: "See the steps" }).evaluate((e) => e.getBoundingClientRect().bottom + scrollY);
console.log("tools at", tools, "materials at", mat, "see-the-steps ends", stepsEnd);
// Panel 3 starts at "Tools you will use": the saved plan's intro sentence above it is no longer true of the Maker Space.
await p.screenshot({ path: path.join(out, "plan-top.png"), fullPage: true, clip: { x: 0, y: tools - 14, width: W, height: H } });
// Panel 4 runs from "Materials" to the end of the "See the steps" row, so it never ends mid-line.
await p.screenshot({ path: path.join(out, "plan-cost.png"), fullPage: true, clip: { x: 19.3, y: mat - 12, width: W - 38.6, height: Math.round(stepsEnd + 2 - (mat - 12)) } }); // inside the card's outline, so the frame is the only outline
await browser.close();
