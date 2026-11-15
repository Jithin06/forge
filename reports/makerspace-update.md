# Maker Space update from Jithin (Nov 15)

All ten items are done. Every group is still estimated. Live calls this round: 6 of the 10 allowed (log lines 86 to 91). The eval was not run and the eval cases are unchanged.

## What changed, by item
1. **Access.** Viterbi grad stays "Ask first", with your note.
2. **Work orders.** The 3D print work order is marked open to all students. A work-order route shows "Open to you" for all four audiences, also when a stored plan is re-seen by another audience. Audience price tables are untouched.
3. **Training order.** Levels 3, 4 and 5 each follow Level 2. Power tools read Level 1, Level 2, Level 3.
4. **Sign-up.** Every Maker Space training, the first-visit list and the space page say: "Scan the training QR code on the Maker Space website, or on the door of the building." Levels 2, 3 and 4 show "A 30-minute session." A test checks that no day or time appears in the trainings or first-visit steps.
5. **Materials.** The five sheet prices left the Maker Space and are now one general table, "Typical price if you buy it yourself" (`data/typical-prices.json`), labelled Estimated and used for every space. The Maker Space is marked as selling no material. A priced line there reads "Bring your own, about $12 to buy"; a material with no general price (solid wood) reads "Bring your own". A general price cannot win "Cheapest". The space page says material on hand is for members' use and is never sold, and shows the general table.
6. **Scrap rules.** Free, student use only; pickup in person with staff present; your pickup note; the may-post and never-post lists, shown to staff under "What may be posted here" and marked estimated. A draft is blocked, with the reason, when the model matches the piece to the never list, when the category is resin or unknown plastic, or when the material could not be identified. The publish route refuses resin and unknown plastic as well.
7. **Poster.** The re-recorded poster plan has no "save a PDF" step. Code now also removes any sentence that names a file type from steps and warnings.
8. **3D print look-again.** When the model says the idea needs 3D printing, or a route prints, and no route is a staff-made print although a space offers one, the model is asked once to add it.
9. **Re-recorded:** phone stand, club sign and poster. Both plans are in the final message and in `reports/plan-quality.json`.
10. **Eval cases:** proposal in `reports/eval-cases-proposal.md`. Not applied.

## Limits you should know
- **The scrap block rests partly on the model.** Resin, unknown plastic and unidentified material are blocked by code. A battery or a blade is blocked only if the model recognises it and matches it to the never list. Staff still check every draft before publishing.
- **No live scrap draft was made this round**, so the never-list matching has unit tests but no live example.
- **"A claim closes only when staff press Picked up"** was already how it works, with one exception that I left alone: a hold that is not collected in 48 hours ends by itself and the piece goes back in the bin.
- **Unit tests use test-only sheet stock at the Maker Space**, so the hand-written plans still exercise pricing by quantity and scrap matching. Tests about the real facts read the real files.
- In the club sign plan, BME's test step says "verify the settings", which is close to an operating instruction. The word-pattern check did not catch it.
- Five live calls in the log around 06:38Z on Nov 15 (two asks, a fallback, a plan, a scrap draft) were not made by me.

## Checks
- `npm test`: 118 of 118 (11 new).
- `npm run check:quality` (live) on the three ideas: all checks passed, 1 model answer per plan.
- `npm run check:m2` in fixture mode: all pass.
- UI review at 390 px on a production build: 51 screens, 39 keyboard checks, 0 layout breaks, 0 axe violations. 768 and 1280 were not re-run this round; the layout did not change, only text.
- Lint and typecheck clean. Test data removed.
