# What I need from Jithin

Each item says what, why, and exactly where to put it. Newest blockers first.

## Live AI

### 0. Let me finish Part 1's live run (about 6 calls)
- **What:** allow, or run yourself: `npx next build`, then `RECORD_FIXTURES=1 npx next start -p 3123`, then in another terminal `ONLY=phone-stand,night-light CALL_CAP=60 BASE=http://localhost:3123 npm run check:quality`, then `npm run results`.
- **Why:** the phone stand and night light have no live plan on the final prompt (Gemini answered 503 twice, then my next live run was refused by the permission system). Their sample recordings are from an earlier prompt, and the phone stand one states a wrong reason for having one route. 19 of Part 1's 30 calls are used; the cap stops the run at 30.

### 0b. The Maker Space equipment is marked "Confirmed by staff" by the test account
- **What:** decide whether that is intended. To undo it, re-seed that one space from its file with `npm run seed -- --force --dir FOLDER`, where FOLDER holds only a copy of `data/spaces/bfms.json`. That also resets any other staff edits to the Maker Space.
- **Why:** it shows to every student as confirmed by forge-test-staff@usc.edu on Nov 14. I did not do it and did not change it.

### 1. Gemini API key in `.env.local`: done
The key works. 49 live calls made so far, logged in `logs/ai-calls.jsonl`. Local cap: 150.

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

### 6. Makerspace scrap policy
- **What:** may the Makerspace give leftovers away this way? Which materials must never be offered? Where do students pick pieces up?
- **Why:** the seed says `offers_scrap: false`, `never_offer: []`, `pickup_note: null`. Without your supervisor's yes, present the scrap exchange as a proposed pilot.
- **Where:** `scrap_policy` in `data/spaces/bfms.json`, then `npm run seed -- --force`. (From M5 on, staff can also edit space facts in the Staff portal, but not the scrap policy.)

### 7. Correct my estimated Makerspace prices
All seven are my guesses, saved with `price_source: "coder estimate, unverified"`, and the price group is marked Estimated. Sheet sizes are guesses too. Correct them in `data/spaces/bfms.json` (then `npm run seed -- --force`) or in the Staff portal's Space info tab.

| Material | My estimate | Per |
| --- | --- | --- |
| PLA filament | $0.05 | g |
| Resin for the Form 3L | $0.20 | ml |
| Plywood sheet (about 12 x 24 in) | $6.00 | sheet |
| MDF sheet (about 12 x 24 in) | $4.00 | sheet |
| Acrylic sheet (about 12 x 24 in) | $12.00 | sheet |
| PETG sheet (about 12 x 24 in) | $10.00 | sheet |
| Cardboard sheet | $1.00 | sheet |

### 8. Makerspace access, trainings and first-visit details
- **What:** access for each of the four audiences (all four are still "Ask first"), which training each machine really needs (I assumed Level 1 for the printers and the laser cutter), how to sign up for each level, and how long each takes.
- **Where:** `access`, `equipment[].required_training_ids`, `trainings[].how_to_sign_up` and `duration_note` in `data/spaces/bfms.json`.

## Proof

### 9. Review the eval cases: ready for you
- **What:** `data/eval-cases.json` has 15 cases across the four spaces. For each, `accept_space_ids` is the set of spaces I think a knowledgeable person would accept as the top route for that student; an empty list means the right answer is no route. Correct them from what you know, then change `"status"` at the top of the file to say you reviewed them.
- **Why:** the spec says you write these. I will not run the eval until you say so. It costs 15 calls, up to 30 with retries.
- **Look hardest at:** the three audio cases and the workshop case (they rest on one sentence each from the Leavey pages), and `podcast-and-sign`, which accepts either space.

### 10. Live checks still to run, when you say so
- `npm run eval` (15 to 30 calls), then `npm run results` to rewrite `RESULTS.md`.
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
