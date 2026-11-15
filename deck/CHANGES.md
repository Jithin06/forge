# What I changed from the brief, and why

Deck: `deck/out/forge-deck.pdf` (7 slides, 1.5 MB, 16:9). Per-slide images are in `deck/out/`. Rebuild with `node deck/build.mjs`.

This replaces the earlier six-slide draft that was in `deck/`. That draft is still in git (commits `bd21b30` and `2dc89f5`).

## The seven headlines, in order

1. Describe what you want to build. Forge finds where at USC to make it.
2. USC has the tools. A first-time builder can't find the way in.
3. One sentence in. A plan a first-timer can follow comes out.
4. Scrap Exchange: leftover material finds its next builder, free.
5. The model proposes. Code checks every fact before a student sees it.
6. Forge launches on estimates. Each space's own staff confirm them.
7. Give Forge one pilot semester at the Maker Space.

## Structure

| Change | Why |
| --- | --- |
| Seven slides, not eight. "Who it reaches" is folded into the ask, where each request names its audience (Maker Space, faculty, staff at other spaces), and into the problem slide (first-years, staff). | A slide of three audiences in a row is the generic layout the brief warns against, and the ask is stronger when each line is addressed to someone. |
| The title slide's headline is the one-line pitch, beside the app's real first screen. | Round-one judges read alone. The first slide should already say what Forge does. |
| The problem slide has no number and no story. It shows the four questions a first-timer can't answer, and the scrap observation from the brief. | No measured figure exists, and I don't have a true story of yours to tell. The four questions are structural, not invented. `notes.md` marks where your own story goes. |
| The product slide shows four steps: the sentence, the tap question, the top of the plan, and the cost with free scrap. | One or two whole screenshots were too small to read at slide size. Cropping to what matters keeps the app's text legible. |
| Captions sit above each screenshot, numbered in gold, in place of callout lines in the margin. | Four frames leave no margin for callouts, and captions above never cover the interface. |
| The Scrap Exchange slide carries the race-test result. | It is a measured number that belongs to that feature, and it shows the claim step is safe. |
| The adoption slide lists all eight spaces by name under one large "8". | Campus relevance is 30 percent of the score. Names are more convincing than a count. |

## Content

| Change | Why |
| --- | --- |
| "Baum Family Maker Space", not "BAUM Family Makerspace". | That is how the app and its data file write it, and the screenshots show it. One spelling across the deck. |
| The slide 5 hero is the eval score, "20/21", with "125/125 automated checks pass" under it. | Both are in `RESULTS.md` since Nov 15. Earlier versions showed "89 of 89 unit tests" because the eval had not been run. |
| No cost per plan. | `RESULTS.md` says it has not been computed. |
| No reuse count. | It is 0. |
| Eight spaces, not four. | The brief says to check the app. There are eight files in `data/spaces/`, and `RESULTS.md` lists the same eight, all still estimated. |
| "None are confirmed yet" on slide 6. | The live data shows every group of facts as estimated for every space. Saying so turns the gap into the pilot's first job, as the brief suggests. |
| The plan shows "Easiest for a first build" only, with no "Cheapest" tag. | That is what the live plan returned. Slide 5 still says labels are computed, which the code confirms. |
| "Cost is quantities times prices in the data files", without "no posted price, no dollar figure". | Since Nov 15 the Maker Space sells no material, and the app prices sheet material from its own typical-price table (`data/typical-prices.json`), marked estimated. "Posted prices" was no longer accurate. |
| The Maker Space training order from the brief (Level 2 as the entry point) is not stated anywhere. | The app's data and screens say Level 1 orientation comes first. I showed only what the app shows. See `NEEDS.md`. |
| The Scrap Exchange slide says "Test piece shown." | The piece in the screenshots is the drawn stand-in. "Proposed pilot" was removed on Nov 14 after Jithin said the supervisor approved giving scrap away. |
| Print Doctor and training booking are not mentioned. | They are stretch items and are not in the app. |
| No repository link on the last slide. | I could not tell whether the repository is public. |
| The stack line reads "Next.js on Vercel. Supabase. Gemini 3.5 Flash-Lite." | Checked against `package.json`, the live URL and `src/lib/ai/client.ts`, where the primary model is `gemini-3.5-flash-lite`. |

## Added Nov 14: labs as scrap-only sources (planned, not built)

- **Adoption slide (slide 6 here; "slide 4" in the request):** one line, labelled "Planned".
- **Ask slide (slide 7 here; "slide 6" in the request):** a "Next, not built yet" paragraph under the three asks.
- **Wording:** the request said never to state the idea in the present tense, so "can grow" and "can post" became "could", and "list" and "joins" became "could list" and "would join". Nothing else in the two lines changed.
- **Speaker note:** "Labs are the next source" became "Labs would be the next source", for the same reason. To keep the pitch at three minutes, the profile-change step on slide 3 is now marked as only-if-ahead.
- No number about lab waste and no screenshot were added.

## Round of Nov 15: review changes

Numbers, and where each one comes from:

| On the slide | Source | Result |
| --- | --- | --- |
| "20/21 test ideas got an accepted space as the top route" (slide 5) | `RESULTS.md`, "Eval": "Top route in the accepted set: 20 of 21", 21 cases approved by Jithin, live model, run once | New hero number |
| "Access badges correct: 45 of 45" (slide 5) | `RESULTS.md`, "Eval": "Badges correct: 45 of 45" | Added to the hero's subline |
| "125/125 automated checks pass" (slide 5) | `RESULTS.md`, "Automated tests", and `npm test` run again on Nov 15: 125 passed in 11 files | Was "89 of 89". 89 was the count on Nov 14; it is no longer true |
| "8 campus spaces" and the eight names (slide 6) | The eight files in `data/spaces/`; each name is that file's `name` field | Unchanged, matches exactly |
| "If 5 claim at once, exactly 1 gets it (race-tested)" (slide 4) | `scripts/race-test.mts` (`npm run race`): five separate clients call `claim_scrap` on one item inside one `Promise.all`. `RESULTS.md`, "Race test": "1 succeeded, 4 got ALREADY_CLAIMED" | Kept. I did not run it again, because it writes to the live database |
| "$6" and "Estimated prices" (slide 3 screenshot) | Computed by the app: 1 sheet times $6.00, the plywood line in `data/typical-prices.json`. The app no longer shows a with-scrap dollar figure, so the screenshot was retaken on Nov 15 | Changed |

Slide by slide:

- **Slide 2.** Added the audience line. The second paragraph now says "Maker Space staff". The gold callout follows the text with normal spacing and is no longer pinned to the bottom.
- **Slide 3, step 3.** Re-cropped to end after "Level 2: Basic hand tools". To keep the row even, all three screenshots on this slide are now the same shorter crop (frames 566 px tall, were 600). Nothing in them was altered; only the bottom was cut.
- **Slide 3, step 4.** Not retaken. No plan can show a scrap piece that covers the material without changing the app: it matches scrap by kind of material only and never compares sizes, and every plywood, MDF and acrylic line is named after the 12 x 24 in sheet in the price table. No piece in the bin is that big. Logged in `NEEDS.md` as an app bug.
- **Slide 3, caption.** Reworded as asked. It is 26 px.
- **Slide 4.** The three cards share one top edge and one height (538 px). I trimmed each screenshot's own black outline, so the card outline is the only one. Cards 1 and 3 are shorter screens than card 2, so they have 17 px and 43 px of plain white below the screenshot inside the card. No real photo of a real leftover exists in the app: the ten sample items use generated images and say so. The illustration and "Test piece shown." stay.
- **Slide 5.** Hero and labels as in the table above. The first bullet in "Code verifies" is unchanged, because it matches the code: `groundPlan` in `src/lib/compute/grounding.ts` lists every tool that is not in that space's data, `src/lib/ai/plan.ts` sends the list back to the model once, and if the second answer still fails it throws and no plan is shown. Nothing is dropped silently. The second bullet changed from "posted prices" to "prices in the data files" (see Content above); this was not on the list, but the old wording had become untrue. The stack line names the model. A fallback model, `gemini-3.1-flash-lite`, is in the code and is not named on the slide.
- **Slide 6.** I could not sign in as a real staff account (that needs a real Google sign-in). The screenshot is now cropped to the top of the dialog and ends after "Your name is recorded but not shown.", just above the test-account paragraph. Nothing is blurred or joined. Because the card is much shorter, the "Estimated to Confirmed by staff" labels moved under it, and a gray caption says what the crop is. The "Planned" line is gone, and the rule has more space above it.
- **Slide 7.** Third ask and the "Next, not built yet" line reworded. I wrote "would post" where the request said "post", because of the standing rule that the lab idea is never stated in the present tense. The QR code was read from `deck/out/slide-7.png` with the jsQR library: it decodes to `https://forge-beta-hazel.vercel.app`, and that address answered HTTP 200.
- **Speaker notes.** Rewritten to 396 spoken words. Slide 3 has the most time (45 seconds), and the last words are the ask.

Checks run after the build: every slide image opened and looked at; no text under 26 px (smallest is 26); no screenshot ends mid-line; the PDF has 7 pages of 1440 by 810 pt, which is 16:9.

No app code or app data was changed, and no call was made to the live model. Local total is still 140 of 150.

## Round of Nov 15, morning: 12-minute fix

- **Slide 3, panel 4.** Retaken from the saved wooden sign plan (`RRFvTqmeZR`) in the current app. It now reads "May be free with scrap", "Materials, about $6" and "Could cost less with free scrap. Check the piece is big enough." No "$0" is left in the deck. The crop runs from "Materials" to the "See the steps" row, inside the card's outline. Caption: "What it costs, and which leftovers might cover it."
- **Slide 3, panel 3.** The saved plan still carries the false sentence ("The space provides wood sheets and staff operate the printer"), so the crop now starts at "Tools you will use". The space name and the "Open to you" badge are no longer in the crop, so the caption changed to "The tools, the training, and the material you need." The three training lines still end "Ask the staff how to sign up", which is outdated: that text is stored in the saved plan. Only a new live plan fixes it.
- **Slide 5.** Title and Plan box reworded as asked. The count is "137/137", from `npm test` on Nov 15: 137 passed in 13 files.
- **Slide 1.** Subtitle now ends "and leftover material you can claim for free."
- **Notes.** "A hundred and thirty-seven automated checks pass."
- **Slide 2 (done afterwards).** The first paragraph is the freshman story as written, and the "Every first-year, in any major" paragraph is gone. Spacing opened up so the callout sits lower. The spoken notes tell the same story.
- **Slide 1 phone (done afterwards).** Retaken from the current app. The profile line reads "Viterbi undergraduate, never built anything".
- **Slide 4 claim screens (done afterwards).** Retaken in the current app. Both now carry the Maker Space pickup note: "Show this claim to a staff member at the Maker Space. They will hand the piece to you." To keep the three cards about one piece, I posted the same drawn stand-in ("Plywood sheet with hole") as test staff, claimed it as the test student, then deleted the piece, its claim and its photo by id. The bin is back to the ten sample items. The caption under step 3 no longer says "front desk": it reads "Show the claim to staff to collect it." "Test piece shown." moved under that caption. "(race-tested)" stays: `scripts/race-test.mts` runs five claims at once.
- **Slide 7 (done afterwards).** `https://forge-beta-hazel.vercel.app` answered HTTP 200 with 8 spaces. Its plan page carries the wording of the two newest commits ("May be free with scrap", "Viterbi undergraduate") and none of the old "With free scrap, about", and `origin/main` equals the local head (`e27ffd3`). I could not read the deployment's commit id from Vercel. The QR code on the rebuilt slide decodes to that address.
- **Verify.** PDF text searched for "$0", "Free with scrap", "every fact" and "125": no hits. Every PDF page rendered to an image and looked at. No live model calls.

## Visual

| Change | Why |
| --- | --- |
| Screenshots sit in a black outline with a hard offset shadow, not a thin gray border. | It is the app's own card style, so the deck and the product read as one thing. The pitch-deck skill asks for gray; this is the one place I went against it. |
| The title screenshot is tilted 2.5 degrees. | It gives the title slide some energy, in the same way the app tilts its tags. |
| The deck has about 660 words. The skill's budget is 220. | The count includes captions, the quoted idea and the eight space names. Each slide still makes its point in the headline. Cut the captions first if you want it lighter for the finals. |
| A small Forge mark sits at the bottom left of content slides. | A judge who sees one slide on its own still knows what it belongs to. |
| Gold is used for one thing per content slide: the scrap observation (2), the step numbers (3, 4), the "Code verifies" box (5), the Estimated label (6). | The brief reserves gold for what the judge should remember. |

## How the screenshots were taken

All are from this repository's app, built and run locally at 390 px wide, device scale factor 3.

- **Ask, question and plan (slides 1 and 3):** one real run on a live Gemini model on Nov 14, as a Viterbi undergraduate who has never built anything. The plan is `/plan/RRFvTqmeZR` and carries no "Sample data" banner. `node deck/shots.mjs` retakes the plan crops with no AI calls. The crops on the slide are still the Nov 14 captures; the saved plan now shows a different free piece, because the bin changed.
- **AI scrap draft (slide 4):** the staff portal's draft from `data/samples/scrap-standin.jpg`, on a live model. The title, description, size and warning in it are the model's.
- **Claim and "Held for you" (slide 4):** the test student claiming that piece.
- **Confirm step (slide 6):** the staff portal as test staff. I opened the dialog and closed it without confirming.

What this cost and touched:

- 5 requests to Gemini (lines 81 to 85 of `logs/ai-calls.jsonl`).
- One plan row in the database (`RRFvTqmeZR`). It is still there, so the plan link works.
- One test scrap piece, posted twice and claimed once. I removed the piece, its photo and the claim afterwards. Another session's cleanup removed the first copy.
- `npx next build` replaced `.next`. A server from another session was running on port 3123 at the time; I checked that it still served pages and assets afterwards, and left it alone.
- No source file outside `deck/` was edited.
