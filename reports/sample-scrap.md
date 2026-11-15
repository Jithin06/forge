# Sample scrap for the demo (Nov 15)

Ten sample items are published at the Maker Space in the database the live site reads. The battery was blocked and is not published. Nothing about how plans are made changed.

## Calls
13 model requests, of the 14 allowed (log lines 128 to 140): 11 drafts, plus 2 requests that the primary model refused with a 503 and the fallback model then answered. The local total is 140 of 150.

## 1. The images
The folder was `~/Downloads/scrap-images`, not `~/Downloads/images`. It held 11 images and I looked at every one.

- **Skipped: none.** No image has text, a logo or a person.
- **All 11 look like 3D renders, not photos.** The bench grain, the lighting and the blurred pegboard are the same in each. I did not skip any for that, since skipping on that ground would have skipped all of them.
- **Weakest images:**
  - Filament spool: the spool's sides look like plywood, and the filament is as thick as cable.
  - Cardboard: one patch has a texture like chipboard.
  - Failed prints: there are about 10 pieces in the picture, and the size you gave says 5.

All 11 are in `data/samples/scrap/`, 1200 by 900 px JPG, with metadata stripped (checked: no EXIF, XMP, comment or colour profile).

## 2. What the model drafted
Every image went through `POST /api/staff/scrap/draft`, the route the staff portal uses, signed in as the test staff account, with no staff note. The full drafts are in `reports/sample-scrap-drafts.json`.

| Image | Category | Title | Model's size | What it got wrong |
| --- | --- | --- | --- | --- |
| plywood-offcut | Plywood | Small plywood sheet scrap | About 30 x 30 cm, 3 mm | Size. Did not say birch. Warning "Do not laser cut PVC" has nothing to do with plywood |
| acrylic-offcut | Acrylic | Small clear acrylic sheet remnant | About 15 x 10 cm, 3 mm | Size is close. Warning "Do not laser cut if uncertain of material safety" contradicts its own high confidence |
| red-acrylic-strip | Acrylic | Red acrylic strip with holes | About 30 x 4 cm, 3 mm | Size is close. Description says "red plastic". Same PVC warning |
| mdf-offcut | MDF | Square piece of MDF board | About 20 x 20 cm | Size. It is not square. Suggested "small shelf", too big for the piece |
| cardboard-offcut | Cardboard | Small piece of corrugated cardboard | About 20 x 20 cm | Size, well under 14 x 10 in |
| failed-prints | PLA filament | Assorted 3D printing scraps and prints | About 30 x 20 cm total | Gave an area, not a count. It cannot know the plastic is PLA, yet said high confidence. Vague warning about heating |
| filament-spool | PLA filament | Partial spool of black filament | About 20 cm diameter | Did not say how much is left. Says "wooden spool" (the image's fault). Same PLA guess |
| pine-2x4 | Solid wood | Small solid wood board | About 30 x 10 cm, 2 cm thick | Thickness: a 2x4 is about 4 cm thick. Did not say pine or 2x4 |
| aluminium-pieces | Aluminum | Small aluminum tube and plate | About 10 x 5 cm | One size for two different pieces |
| wire-and-hardware-tray | Electronic parts | Small wires and hardware | About 20 x 15 cm tray | Nothing serious. The category fits the wire better than the fasteners |
| swollen-lipo | Electronic parts | Swelling LiPo Battery | About 5 x 4 cm | Nothing. See below |

Categories were right for all 11. Sizes were the weak point, as you expected.

## 3. The battery
**Blocked.** The model matched it to "Batteries" on the Maker Space never-post list, and the route answered: "This cannot be posted. Baum Family Maker Space never gives away: batteries." It was not sent to the publish route. Its image is in the repo with the others but is not in the database or the photo store.

## 4. What was published
Ten items, through `POST /api/staff/scrap` as `forge-test-staff@usc.edu`. The live site's `/api/scrap` lists all ten.

My edits, and nothing else:
- every description ends with "Sample item. Generated photo, not real Maker Space stock.";
- the size line is yours, from `data/samples/scrap/edits.json`. I put the words you gave (birch, clear, black PLA, pine 2x4) in the size line, so the model's title and description stay as drafted.

Titles, descriptions, categories, conditions and warnings are the model's. The pickup note is the standard Maker Space one.

## 5. The check at 390 px
Sample-data mode, production build, no live calls. Screenshots are in `reports/sample-scrap/`.

- **Scrap tab:** 10 pieces, 10 photos load, no sideways scroll (after the fix below).
- **Maker Space page, "Free here now":** 10 cards with photo, title and size.
- **Club sign plan:** shows two free acrylic pieces, each with "Claim this piece", and "With free scrap, about $0".
- **Phone stand plan:** shows the pine piece with "Claim this piece". It does not show the plywood, because the recorded plan builds the stand from solid wood.

I did not press "Claim", so no hold was made.

## Found on the way
- **Fixed: the Scrap tab scrolled sideways on a phone.** With eight material chips, the hidden radio buttons inside the chips widened the page to 1146 px. One class added in `src/components/scrap/scrap-bin.tsx`. This was a real bug that the earlier reviews missed because the bin never held this many kinds of material.
- **Not fixed, your call: the club sign's "$0".** The two acrylic pieces are 12 x 2 in and 6 x 4 in. The sign needs a sheet about 12 in wide. The app matches scrap by kind of material and does not compare sizes, so the plan says the material is free when neither piece is big enough. Changing that would change how plans are made.
- **The sample sentence is only visible when a piece is opened.** The cards, the strip and the plan show the title and size, not the description.
- **`npm run clean:test` used to delete everything the test staff account posted.** It now keeps items whose description ends with the sample sentence. `KEEP_SAMPLES=0 npm run clean:test` removes them.

## Checks
- `npm test`: 125 of 125. Typecheck and lint clean.
- Not re-run: the full UI review at three widths, and axe. Only the four screens above were looked at, at 390 px.
- Three plans made by my failed first attempts at the screenshot script were deleted.

## Last fixes (Nov 15, later)
Wording and data only. No live calls. How plans and scrap matches are made did not change.

1. **Scrap total.** A plan no longer shows a with-scrap dollar figure. The stub shows the price of the materials new, then "Could cost less with free scrap. Check the piece is big enough." The plan view was the only place a with-scrap total appeared. The number is still computed, and still decides the "Cheapest" tag, as before. Tests: `src/components/plan/cost-stub.test.ts` (6 new).
2. **Sample tag.** A small gray "Sample" tag shows on Scrap tab cards, the Maker Space "Free here now" strip, the home page "Free right now" strip, and scrap matches inside plans. An item is a sample when its description ends with the sample sentence. The opened item still shows the full sentence.
3. **Listings fixed in the database** (`scripts/fix-sample-scrap.mts`): PVC warning removed from the plywood and the red strip; the red strip's description says "red acrylic"; the "uncertain of material safety" warning removed from the clear acrylic; failed prints read "Failed PLA prints, about 10 pieces"; "on a wooden spool" removed from the spool.
4. **Check at 390 px**, sample-data mode, production build: club sign plan shows $12, the new sentence, no "$0", and both pieces tagged; phone stand plan shows the pine piece tagged; Scrap tab shows 10 cards, each tagged, no sideways scroll. `npm test`: 131 of 131. Typecheck and lint clean. The screenshots in `reports/sample-scrap/` are the new ones.

Left alone, for you to decide: the material line above a matched piece still reads "Free with scrap"; the deck's plan-cost screenshot still shows "$0"; SPEC.md still describes the with-scrap total.

## Last cleanup and the ask-screen wording (Nov 15, morning)
No live calls. Routes and badges did not change.

1. **Material line:** a matched material now reads "May be free with scrap".
2. **"Cheapest":** computed from the low price the student sees, without scrap. Checked against every recorded plan (7 ideas x 4 audiences = 28 plans, with today's scrap bin) before and after: route order, badges and tags are identical in all 28, and in the deck's stored plan. No recorded plan carries a "Cheapest" tag either way. The with-scrap cost still breaks the last tie for "Easiest", as before.
3. **Deck:** `deck/assets/plan-cost.png` retaken from the deck's club sign plan (`RRFvTqmeZR`); alt text fixed; the "drops to zero" sentence in the speaker notes reworded; deck rebuilt. No "$0" is left in the deck's pages, notes or documents.
4. **SPEC.md:** the scrap-match step, the label rule, the color table row and the M4 checklist line now describe what the app does.
5. **Ask screen:** "Worked in a workshop"; "USC undergraduate (not Viterbi)" and "USC graduate (not Viterbi)". The same labels show everywhere those levels appear. Stored values are unchanged. The model is still told "Comfortable in a workshop": its wording now lives in `EXPERIENCE_FOR_MODEL`, apart from the chip labels, with a test.
6. **Checks:** `npm test` 136 of 136; typecheck and lint clean. At 390 px: both plans show "May be free with scrap", the Sample tags and no "$0"; every chip is one line, none wider than the screen ("I am a..." is one chip per line; "I have..." is two lines).
