# What I need from Jithin

Each item says what, why, and exactly where to put it. Newest blockers first.

## Blocking live AI (M2b and everything that uses a live model)

### 1. Gemini API key in `.env.local`
- **What:** `GEMINI_API_KEY` is empty in `/Users/jithinrajan/Desktop/forge/.env.local`. The line is there, with nothing after the `=`.
- **Why:** no live call can be made without it. The adapter, the automatic fallback from `gemini-3.5-flash-lite` to `gemini-3.1-flash-lite`, the call log and the 150-call budget are built and unit-tested with a mocked network, but have never touched the real API.
- **Where:** open `.env.local` in an editor and paste the key after `GEMINI_API_KEY=`. Do not paste it in chat. Then tell me, or run:
  1. `AI_PROVIDER=gemini RECORD_FIXTURES=1 PORT=3123 npm start`
  2. in another terminal: `BASE=http://localhost:3123 npm run check:m2b` (about 10 live calls)

### 2. Switch the live site to Gemini (after item 1 passes)
- **What:** in Vercel, Settings, Environment Variables, set `AI_PROVIDER=gemini`, `GEMINI_MODEL_PRIMARY=gemini-3.5-flash-lite`, `GEMINI_MODEL_FALLBACK=gemini-3.1-flash-lite`, and confirm `GEMINI_API_KEY` is there. Redeploy.
- **Why:** I cannot change settings in your Vercel account. Until then the live site keeps showing sample data with the banner.
- **Note:** on Vercel the call count is per server instance and only in the logs, because its file system is read-only. My own 150-call budget is counted in `logs/ai-calls.jsonl` on this machine.

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
