/**
 * 390 px check of the "I am a..." and "I have..." chip rows on the welcome step
 * and in the profile on My stuff. No AI calls.
 *   BASE=http://localhost:3123 tsx scripts/shoot-ask-chips.mts
 */
import { chromium } from "playwright-core";
const BASE = process.env.BASE ?? "http://localhost:3123";
const b = await chromium.launch({ channel: "chrome" });
for (const [name, path] of [["ask-welcome", "/"], ["my-stuff-profile", "/me"]] as const) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(BASE + path, { waitUntil: "load" });
  await p.waitForTimeout(2000);
  const rows = await p.evaluate(() => [...document.querySelectorAll("fieldset")].map((f) => ({
    legend: f.querySelector("legend")?.textContent,
    chips: [...f.querySelectorAll("label")].map((l) => { const r = l.getBoundingClientRect(); return `${l.textContent?.trim()} [${Math.round(r.width)}x${Math.round(r.height)} at y${Math.round(r.top + scrollY)}, right ${Math.round(r.right)}]`; }),
  })));
  console.log(name, JSON.stringify(rows, null, 1), "page width", await p.evaluate(() => document.documentElement.scrollWidth));
  await p.screenshot({ path: `reports/sample-scrap/${name}-390.png`, fullPage: true });
  await ctx.close();
}
await b.close();
