// Renders deck/index.html to deck/out/forge-deck.pdf and one PNG per slide.
//   node deck/build.mjs
import { chromium } from "playwright-core";
import QRCode from "qrcode";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dir = import.meta.dirname;
const out = path.join(dir, "out");
fs.mkdirSync(out, { recursive: true });
const PROTOTYPE = "https://forge-beta-hazel.vercel.app";

// QR code as inline SVG, black on white.
const qr = await QRCode.toString(PROTOTYPE, { type: "svg", margin: 0, color: { dark: "#000000", light: "#ffffff" } });
fs.writeFileSync(path.join(dir, "assets", "qr.svg"), qr);
const html = fs.readFileSync(path.join(dir, "index.html"), "utf8").replace("<!--QR-->", qr);
const built = path.join(dir, ".built.html");
fs.writeFileSync(built, html);

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(pathToFileURL(built).href);
await page.evaluate(() => document.fonts.ready);
const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family} ${f.weight}`));

const slides = page.locator("section.slide");
const n = await slides.count();
for (let i = 0; i < n; i++) await slides.nth(i).screenshot({ path: path.join(out, `slide-${i + 1}.png`) });
await page.pdf({ path: path.join(out, "forge-deck.pdf"), width: "1920px", height: "1080px", printBackground: true, preferCSSPageSize: true });

// Checks the skill asks for: word budget, minimum type size, nothing outside its slide.
const report = await page.evaluate(() => {
  const words = (t) => t.trim().split(/\s+/).filter(Boolean).length;
  return [...document.querySelectorAll("section.slide")].map((s, i) => {
    const h = s.querySelector("h1");
    const box = s.getBoundingClientRect();
    const small = [...s.querySelectorAll("*")].filter((e) => e.children.length === 0 && e.textContent.trim() && !e.closest("svg") && parseFloat(getComputedStyle(e).fontSize) < 26).map((e) => e.textContent.trim().slice(0, 20));
    const outside = [...s.querySelectorAll("h1, p, li, td, th, img, .shot, .qr")].filter((e) => { const b = e.getBoundingClientRect(); return b.width && (b.left < box.left + 119 || b.right > box.right - 119 || b.bottom > box.bottom - 40 || b.top < box.top + 95); }).map((e) => e.tagName + ":" + (e.textContent || e.alt || "").trim().slice(0, 24));
    const lh = parseFloat(getComputedStyle(h).lineHeight);
    return { slide: i + 1, headline: h.textContent.trim(), headlineWords: words(h.textContent), headlineLines: Math.round(h.getBoundingClientRect().height / lh), bodyWords: words(s.innerText) - words(h.innerText), small, outside };
  });
});
fs.rmSync(built);
await browser.close();
const mb = (fs.statSync(path.join(out, "forge-deck.pdf")).size / 1e6).toFixed(2);
console.log(`fonts loaded: ${[...new Set(fonts)].join(", ")}`);
for (const r of report) console.log(`slide ${r.slide}: headline ${r.headlineWords} words on ${r.headlineLines} line(s); body ${r.bodyWords} words${r.small.length ? "; UNDER 26px: " + r.small.join(" | ") : ""}${r.outside.length ? "; OUTSIDE SAFE AREA: " + r.outside.join(" | ") : ""}`);
console.log(`total words: ${report.reduce((a, r) => a + r.headlineWords + r.bodyWords, 0)}; slides: ${n}; PDF: ${mb} MB`);
