// Takes the deck's screenshots from the running app at phone width (390 px, 3x).
//   TEST_BASE: a server with AUTH_MODE=test (used only to post one leftover piece as test staff)
//   BASE:      the server to photograph (google mode, so no test banner)
import { chromium } from "playwright-core";
import fs from "node:fs";
const BASE = process.env.BASE ?? "http://localhost:3124";
const TEST_BASE = process.env.TEST_BASE ?? "http://localhost:3123";
const browser = await chromium.launch({ channel: "chrome" });

const staff = await browser.newContext();
await staff.request.post(TEST_BASE + "/auth/test", { form: { persona: "staff", next: "/" }, maxRedirects: 0 }).catch(() => {});
const image = "data:image/jpeg;base64," + fs.readFileSync("data/samples/scrap-standin.jpg").toString("base64");
const pub = await staff.request.post(TEST_BASE + "/api/staff/scrap", { data: { space_id: "bfms", material_category: "plywood", title: "Plywood offcut with one hole", description: "A flat piece of light plywood.", size_note: "About 26 x 17 cm", condition: "usable", restrictions: [], image } });
console.log("posted a piece:", pub.status());

const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const p = await ctx.newPage();
const plan = await (await ctx.request.post(BASE + "/api/plan", { data: {
  text: "I want to make a phone stand for my desk out of wood. It should hold my phone at a slight angle, fit in my hand, and I only need one.",
  answers: { size: ["hand"], quantity: ["one"], demands: ["looks"] }, audience: "viterbi_undergrad", experience: "never" } })).json();
await p.goto(`${BASE}/plan/${plan.id}`, { waitUntil: "load" });
await p.waitForSelector("main article:visible");
await p.addStyleTag({ content: "nav[aria-label=Main].fixed{display:none}" }); // the fixed tab bar would sit across element shots
// Thumbnails load lazily; make sure they are in before photographing.
await p.evaluate(() => Promise.all([...document.images].map((i) => { i.loading = "eager"; return i.complete && i.naturalWidth ? 1 : new Promise((r) => { i.onload = i.onerror = r; }); })));
const card = p.locator("main article").first();
await card.locator("header").screenshot({ path: "deck/assets/plan-route.png" });
await card.locator("div:has(> h3:text-is('Materials'))").screenshot({ path: "deck/assets/plan-materials.png" });
await p.screenshot({ path: "deck/assets/plan-top.png" });
console.log("sample-data banner on this plan:", await p.getByText("Sample data.").count() > 0);
await p.goto(`${BASE}/spaces/bfms`, { waitUntil: "load" });
await p.waitForSelector("#s-material-prices");
await p.addStyleTag({ content: "nav[aria-label=Main].fixed{display:none}" });
await p.locator("section[aria-labelledby=s-hours]").screenshot({ path: "deck/assets/space-hours.png" });
await p.locator("section[aria-labelledby=who-can-use] >> div").first().screenshot({ path: "deck/assets/space-access-head.png" });
fs.writeFileSync("deck/assets/plan-id.txt", plan.id);
await browser.close();
