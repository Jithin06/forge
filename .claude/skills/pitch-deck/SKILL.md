---
name: pitch-deck
description: Build a short, judge-ready hackathon pitch deck as a 16 by 9 PDF from HTML, in the USC theme, with real screenshots and only measured numbers. Use when asked for a pitch deck, slides, a presentation or Devpost slides for this project.
---

# Pitch deck

Use this to build the submission deck. The output is one PDF, six slides, that a judge can understand in ninety seconds with nobody presenting it.

## Who reads it and why that shapes everything

At this hackathon the deck is read twice, by different people in different ways:

1. **Round one, alone.** Judges go through many submissions and pick ten finalists. Nobody is there to explain the slides. A slide that needs narration fails here.
2. **Finals, on a screen.** The presenter has three minutes for the whole pitch, demo included. Slides are glanced at while someone talks.

So every slide must make its point in its headline, and carry almost no other text. Judges score four things, and the deck should make each one easy to find:

| Criterion | Weight | Where the deck answers it |
| --- | --- | --- |
| Impact and campus relevance | 30% | Slides 1 and 5 |
| Technical and AI execution | 25% | Slide 3 |
| Feasibility and implementation | 25% | Slide 4 |
| User experience and design | 20% | Slide 2, and the look of the deck itself |

Submission format: a short pitch deck as a PDF or Google Slides. Build the PDF.

## Before writing a single slide

Gather these. If one is missing, ask the user; do not fill the gap.

- `SPEC.md`: the product, the one-line pitch, the deck outline and the adoption story.
- `RESULTS.md`: the only source of numbers. Eval score with case count, cost per plan, race-test results, items posted and reused.
- The running app's URL, to take real screenshots.
- Which data in the app is estimated and which is confirmed by staff.
- The presenter's name and anything they want in the ask.

Rules that protect the presenter's credibility:

- Every number on a slide comes from `RESULTS.md` or a live query, and is written with its unit and its base ("11 of 14 test ideas"). No rounded-up claims, no market-size guesses, no invented survey figures.
- Anything estimated is labelled "estimated" on the slide.
- If the problem has no measured number, tell it as one specific, true story instead.
- Say what is built. Do not show features that are not in the app.

## The six slides

One idea per slide. The headline is a full sentence that states the point; a reader who reads only the six headlines should get the whole pitch.

| # | Job | Headline pattern | Body |
| --- | --- | --- | --- |
| 1 | Problem | A sentence naming who is stuck and why | One short true story, or one measured number. Nothing else |
| 2 | Product | A sentence saying what the user gets | One large real screenshot of the main result. Three short callouts at most, pointing at real parts of it |
| 3 | How the AI is kept honest | A sentence stating the design principle | A two-column split: what the model does, what code verifies. The eval score and tests passed, large |
| 4 | Adoption | A sentence saying who can run it and what it takes | Three facts: who maintains what, cost per use (measured), what is live today. A staff quote only if it is real and permitted |
| 5 | What exists today | A sentence stating the current footprint | The spaces or units covered, each marked estimated or confirmed, and the reuse counter |
| 6 | Ask | A sentence stating the request | Two or three concrete asks. The prototype URL and repo URL as text and as a QR code |

Do not add: an agenda slide, a "thank you" slide, a team-bio slide, a technology-logo collage, or a roadmap of features that do not exist. The presenter's name and "Student project. Not an official USC service." go small on slide 1 and slide 6.

An appendix of up to two slides is allowed after slide 6 for an architecture sketch or the full test table. Mark it "Appendix".

Word budget: headline up to 12 words; body up to 25 words per slide; the whole deck under 220 words.

## Speaker notes

Write `deck/notes.md` alongside the slides: what to say over each slide, with a time budget that sums to three minutes including the live demo. At a normal speaking pace that is about 390 words in total. Give slide 2 the most time, because that is where the demo happens. End on the ask, not on thanks.

## Visual system

Load the `usc-theme` skill first and use its tokens, pairings and typeface. On top of it:

- **Canvas:** 1920 by 1080 px per slide. Safe margin 120 px left and right, 96 px top and bottom.
- **Grid:** 12 columns with 24 px gutters. Align everything to it. Left-align text; do not center paragraphs.
- **Type:** Source Sans 3 only. Headline 72 to 88 px at weight 700, line height 1.1. Body 36 to 40 px at 400. Captions and labels 26 px minimum. Nothing smaller than 26 px anywhere; it will not be readable on a projector.
- **Color roles:** slides 1 and 6 are full cardinal with white headline and gold accent. Slides 2 to 5 are white with black text and cardinal headlines. Gold is reserved for the single thing on each slide the judge should remember: one number, one label or one underline.
- **Pairings:** only those the theme allows. No gold text on white, no black on cardinal, no tinted cardinal.
- **Numbers:** the key figure is set very large (160 to 220 px, weight 700) with a plain label beneath it. One hero number per slide at most, and only where the content is a number.
- **Screenshots:** real ones from the running app at phone width, shown at readable size inside a plain rounded rectangle drawn in CSS with a thin gray border. Do not use a branded phone mockup. Crop to what matters. Callouts are short black labels with a thin line, placed in the margin, never covering the interface.
- **Diagrams:** boxes and lines only, two colors, labelled directly. No icons from a library, no clip art, no stock photos, no emoji.
- **Marks:** no USC logos, seals or shield; no sponsor logos.
- **Consistency:** the headline sits at the same position on every content slide. A small slide number sits bottom right in gray.
- **One signature detail:** the same thin gold ruler-tick strip used in the app may run along the bottom edge of slides 1 and 6 only.

What makes a deck look generated, and should be avoided: every item in an identical rounded card, three-column icon rows, all-caps eyebrow labels, gradient backgrounds, decorative shapes in corners, and a different layout idea on every slide.

## Build pipeline

Build the deck as HTML and print it to PDF, so type and layout are exact and screenshots stay sharp.

```
deck/
  index.html        one <section class="slide"> per slide
  deck.css          tokens from usc-theme, grid, slide styles
  assets/           screenshots and the QR code
  notes.md          speaker notes
  build.mjs         renders PDF and per-slide PNGs
  out/              forge-deck.pdf, slide-1.png ...
```

1. Take screenshots first. Use a headless browser at 390 px width, device scale factor 3, against the running app. Use realistic content, not placeholder data. Save to `deck/assets/`.
2. Generate the QR code for the prototype URL as an SVG with a small library, in black on white.
3. Write `index.html` and `deck.css`. Each slide is exactly 1920 by 1080 with `overflow: hidden`, and a page break after it. Load Source Sans 3 from a local package so the build does not depend on the network.
4. `build.mjs` uses Playwright or Puppeteer, whichever the project already has, to open the file, wait for fonts to finish loading, export a PDF with page size 1920 by 1080 px and backgrounds on, and also save one PNG per slide. Check the current docs for the exact PDF options rather than assuming them.
5. Keep the PDF under 10 MB.

Everything in `deck/` is created during the event; do not import templates or slide kits.

## Review before handing over

A deck is written without seeing it, so look at it.

1. Open every PNG in `deck/out/` and inspect it. If you cannot view images, say so in the report instead of claiming to have checked.
2. On each slide check:
   - Nothing is clipped or overflows the safe margin.
   - The headline fits on two lines at most.
   - No text is under 26 px.
   - Only allowed color pairings.
   - Left edges line up with the grid, and with the previous slide.
   - No line ends with a single orphaned word.
   - The screenshot is legible at arm's length when the PNG is shown at 25 percent size.
3. Read the six headlines alone, in order. They should tell the full story.
4. Check every number against `RESULTS.md`, character for character.
5. Count the words. Cut until the deck is under budget.
6. Remove one decorative element that is not carrying meaning.

Then report:

```
Deck: deck/out/forge-deck.pdf  (N slides, X MB)
Headlines: <the six, in order>
Numbers used and their source lines in RESULTS.md: <list>
Estimated data shown and how it is labelled: <list>
Viewed slide PNGs: yes or no
Open questions for the presenter: <list>
```
