# What I need from Jithin

Each item says what, why, and exactly where to put it. Newest blockers first.

## Live AI

### 1. Gemini API key in `.env.local`: done
The key works. 91 live calls made so far (5 of them, on Nov 15 around 06:38Z, were not mine), logged in `logs/ai-calls.jsonl`. Local cap: 150.

### 2. Put the live site on Gemini
- **What:** set the variables listed in `docs/production-settings.md` in Vercel and redeploy. In short: `AI_PROVIDER=gemini`, `GEMINI_API_KEY`, `GEMINI_MODEL_PRIMARY=gemini-3.5-flash-lite`, `GEMINI_MODEL_FALLBACK=gemini-3.1-flash-lite`, `AI_DAILY_BUDGET=450`, `AUTH_MODE=test`. Do **not** set `AI_CALL_BUDGET` there.
- **Why:** I cannot change settings in your Vercel account. Until then the live site shows sample data with the banner.

### 2b. Run the updated schema once, for an exact daily cap
- **What:** Supabase, SQL Editor: paste and run the whole of `supabase/schema.sql` again. It adds one table (`ai_usage`) and one function (`spend_ai_call`) and touches nothing else.
- **Why:** the live site's daily cap is counted in the database so all server copies share it. Without this step the cap is counted per server copy and is only approximate.

## Sign-in

### 3. Turn test sign-in on for the live site (optional, until Google is ready)
- **What:** in Vercel, add `AUTH_MODE=test` and redeploy.
- **Why:** without it the live site is in Google mode, and "Sign in" leads to a Google flow that is not set up, so it fails. With it, anyone visiting can sign in as the test student or test staff. A gold banner says so on every page.
- **Remove it** as soon as Google sign-in works.

### 4. M3b: real Google sign-in
1. Google Cloud Console, APIs and Services, Credentials: create an OAuth client of type "Web application".
2. Authorized redirect URI: `https://xjruxfndvqlzvamlndqn.supabase.co/auth/v1/callback`.
3. OAuth consent screen: set the audience so any Google user can sign in ("In production", External), not only listed test users. Otherwise only you can sign in during judging.
4. Supabase, Authentication, Sign In / Providers, Google: turn it on and paste the client ID and client secret there (not in chat, not in the repo).
5. Supabase, Authentication, URL Configuration: Site URL `https://forge-beta-hazel.vercel.app`; add redirect URLs `https://forge-beta-hazel.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`.
6. Set `AUTH_MODE=google` in `.env.local` and in Vercel, then tell me to "Do M3b". I will run the four M3 checks with your real `@usc.edu` account and a personal Google account, and confirm the picker and banner are gone.
- **If it is not working within 30 minutes,** the spec's fallback is Supabase's email one-time code for `@usc.edu` addresses.

## Data and photos

### 5. Real photos of leftover material (8 to 10)
- **What:** photos of real offcuts, taken today, one piece per photo, with something for scale if possible.
- **Why:** everything so far uses one drawn stand-in (`data/samples/scrap-standin.jpg`). The M4 check "a real offcut photo yields a sensible draft" and M2b's scrap check need real photos, and the demo needs real pieces in the bin.
- **Where:** save them in `data/samples/real/` (any names), or post them yourself: sign in as staff, Staff portal, Post scrap.

### 6. Confirm the scrap lists in the portal
Your supervisor has approved the scrap exchange, so it is no longer described as a proposed pilot. The may-post and never-post lists still show as estimated until you confirm them with your real account.

### 7. The general price table is still my guesses
"Typical price if you buy it yourself" (`data/typical-prices.json`) holds the five sheet prices that used to sit under the Maker Space: plywood $6, MDF $4, acrylic $12, PETG $10, cardboard $1, each per sheet of about 12 x 24 in. They are labelled Estimated and used for every space. Correct any you know.

### 7b. 3D print prices: two small questions
Prices now come from the staff quote sheet you showed (Nov 14), which is newer than the public chart.
- The sheet lists non-Viterbi prices for PLA on the Prusas only, so a non-Viterbi student sees "Ask staff for the price" for every other material. Tell me if those are Viterbi-only.
- The public prices page still shows the 2024 chart (PLA specialty $1.25; the sheet says $1.50). The app follows the sheet.

### 8b. The four new spaces: what the official pages did not say
- **Iovine and Young Hall, Roski shops, Dramatic Arts scene shop:** who may use them is not stated for students outside those schools, so all four audiences are "Ask first". If you know the rule, tell me.
- **Iovine and Young Hall:** the page calls it Iovine and Young Hall maker spaces, not "the Garage". Welding and the table saw come from photo descriptions on that page, not body text.
- **Dramatic Arts scene shop:** the page lists no equipment, so the planner can only send someone there to ask.
- **Cinematic Arts:** not added. Its pages describe cameras, sound gear and stages for its own student productions and mention no shop.
- **Digital Creative Lab:** the page lists "Plotters" and "3D Printer" with no prices or booking steps.

## Proof

### 9. Approve the proposed eval-case changes
- **What:** `reports/eval-cases-proposal.md` lists a proposed change for each of the 15 cases, 6 new cases and one risk to decide (the guitar pedal). Nothing is applied. Mark what you accept; I will edit `data/eval-cases.json` and wait for your word before running the eval.

### 10. Live checks still to run, when you say so
- `npm run check:quality` is done for the six home-page ideas (see RESULTS.md).
- `npm run eval` (15 to 30 calls, more when the model is asked to look again), then `npm run results` to rewrite `RESULTS.md`.
- `npm run check:live` (about 8 calls): the section 6.5 rows that depend on a live model.
- M2b's scrap-draft check, once there is a real photo.
- Each needs a local server on live Gemini: `RECORD_FIXTURES=1 PORT=3123 npm start`.

## Submission materials (all first drafts)

### 11. Your problem story
- **What:** one true story from working at the Maker Space: one student, one idea, where they got stuck. About 25 words for the slide, about 55 spoken.
- **Where:** the dashed box on slide 1 (`deck/index.html`, the `<p class="todo">`), the first section of `deck/notes.md`, and "The problem" in `docs/devpost.md`. Then `node deck/build.mjs`.

### 12. Deck, Devpost and demo script: things only you can settle
- The seven open questions in `reports/deck.md`.
- Every bracketed `[Jithin: ...]` part in `docs/devpost.md` and `deck/notes.md`.
- `docs/demo-script.md` lists what must be true before you record: a live model (no "Sample data" banner), a real leftover posted, and real prices before you press Confirm on camera.

### 13. Things I could not do
- Use a real phone or a real screen reader. Everything was checked in Chrome's phone mode at 390 and 360 px.
- Change anything in your Vercel, Supabase or Google accounts.
- Open the leads in SPEC section 9.5 for more spaces (Ahmanson Lab equipment list, Iovine and Young Hall). Only two spaces are listed. Say the word and I will read those official pages and draft the documents, marked estimated.
