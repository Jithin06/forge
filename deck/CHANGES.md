# What I changed from the brief, and why

Deck: `deck/out/forge-deck.pdf` (7 slides, 1.6 MB, 16:9). Per-slide images are in `deck/out/`. Rebuild with `node deck/build.mjs`.

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
| No eval score. The slide 5 figure is "89 of 89 unit tests pass". | `RESULTS.md` says the eval has not been run. The unit-test line is the measured number that exists. |
| No cost per plan. | `RESULTS.md` says it has not been computed. |
| No reuse count. | It is 0. |
| Eight spaces, not four. | The brief says to check the app. A live query of the app's spaces list returns eight, all marked estimated. `RESULTS.md` still says four because it was generated at 9:30 PM, before four more were added. |
| "None are confirmed yet" on slide 6. | The live data shows every group of facts as estimated for every space. Saying so turns the gap into the pilot's first job, as the brief suggests. |
| The plan shows "Easiest for a first build" only, with no "Cheapest" tag. | That is what the live plan returned. Slide 5 still says labels are computed, which the code confirms. |
| "Cost is quantities times posted prices", without "no posted price, no dollar figure". | The app now uses the Maker Space's prices as typical campus prices for some spaces that list none, so the second half is no longer always true. |
| The Maker Space training order from the brief (Level 2 as the entry point) is not stated anywhere. | The app's data and screens say Level 1 orientation comes first. I showed only what the app shows. See `NEEDS.md`. |
| The Scrap Exchange slide says "Proposed pilot. Test piece shown." | Supervisor approval is not confirmed, and the piece in the screenshots is the drawn stand-in. |
| Print Doctor and training booking are not mentioned. | They are stretch items and are not in the app. |
| No repository link on the last slide. | I could not tell whether the repository is public. |
| The stack line reads "Next.js on Vercel. Supabase. Gemini API." | Checked against `package.json`, the environment settings and the live URL. |

## Visual

| Change | Why |
| --- | --- |
| Screenshots sit in a black outline with a hard offset shadow, not a thin gray border. | It is the app's own card style, so the deck and the product read as one thing. The pitch-deck skill asks for gray; this is the one place I went against it. |
| The title screenshot is tilted 2.5 degrees. | It gives the title slide some energy, in the same way the app tilts its tags. |
| The deck has about 590 words. The skill's budget is 220. | The count includes captions, the quoted idea and the eight space names. Each slide still makes its point in the headline. Cut the captions first if you want it lighter for the finals. |
| A small Forge mark sits at the bottom left of content slides. | A judge who sees one slide on its own still knows what it belongs to. |
| Gold is used for one thing per content slide: the scrap observation (2), the step numbers (3, 4), the "Code verifies" box (5), the Estimated label (6). | The brief reserves gold for what the judge should remember. |

## How the screenshots were taken

All are from this repository's app, built and run locally at 390 px wide, device scale factor 3.

- **Ask, question and plan (slides 1 and 3):** one real run on a live Gemini model, as a Viterbi undergraduate who has never built anything. The plan is `/plan/RRFvTqmeZR` and carries no "Sample data" banner. `node deck/shots.mjs` retakes the plan crops with no AI calls.
- **AI scrap draft (slide 4):** the staff portal's draft from `data/samples/scrap-standin.jpg`, on a live model. The title, description, size and warning in it are the model's.
- **Claim and "Held for you" (slide 4):** the test student claiming that piece.
- **Confirm step (slide 6):** the staff portal as test staff. I opened the dialog and closed it without confirming.

What this cost and touched:

- 5 requests to Gemini (lines 81 to 85 of `logs/ai-calls.jsonl`).
- One plan row in the database (`RRFvTqmeZR`). It is still there, so the plan link works.
- One test scrap piece, posted twice and claimed once. I removed the piece, its photo and the claim afterwards. Another session's cleanup removed the first copy.
- `npx next build` replaced `.next`. A server from another session was running on port 3123 at the time; I checked that it still served pages and assets afterwards, and left it alone.
- No source file outside `deck/` was edited.
