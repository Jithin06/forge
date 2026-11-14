# Forge — Final Build Spec

Nov 14, 2026 · @Jithin

This single file replaces the two earlier specs. Save it as `SPEC.md` in the repo root.

## 1. Read this first

This spec tells the coding model (Claude Opus or Claude Fable, called "the coder" below) what to build for the AI@USC Hackathon. Jithin directs, solo; the coder writes all code, one milestone at a time.

### Organizer rules

From the [rules page](https://ai-usc.devpost.com/rules) and [overview](https://ai-usc.devpost.com/):

- All code, design assets and prototypes must be created during the event, November 14 to 15. Open-source libraries, frameworks and public APIs are allowed.
- Submit on Devpost by Sunday November 15, 11:00 AM PT: description, working prototype link, video of 3 minutes or less, slide deck, at least one image. Late or incomplete submissions are not judged.
- Be checked in by 9:00 AM Sunday.
- Round one runs 11:00 AM to 2:00 PM Sunday; ten finalists pitch from 3:00 to 4:30 PM, 3 minutes each.
- The rules do not mention AI-written code. State in the Devpost description that Claude wrote the code.

### Scoring

| Criterion | Weight | What judges look for |
| --- | --- | --- |
| Impact and campus relevance | 30% | A real, significant friction point for students or student orgs |
| Technical and AI execution | 25% | Well built; AI used effectively, accurately and securely |
| Feasibility and implementation | 25% | Student Government or a campus department could deploy it in coming semesters |
| User experience and design | 20% | Intuitive, accessible, visually appealing, suited to USC students |

### Working agreement for the coder

1. Build one milestone from section 8 at a time. Stop and report each check as pass or fail, with evidence, before starting the next.
2. Space facts come from two places only: an official page you have opened (record its URL in the space's `source`), or Jithin. Anything else is an estimate and must be marked `estimated`. Never present an estimate as confirmed.
3. Keep secrets on the server. No API key or database service key in client code or in git.
4. The model proposes; code verifies. Eligibility, training, cost, route labels and scrap matches are computed in code, never taken from model output.
5. Run typecheck, lint and the milestone's checks before saying a milestone is done. Commit after each one.
6. Build the simplest thing that passes the checks. No features, abstractions or dependencies beyond this spec.
7. Where this spec names a library API or model ID, confirm it against current documentation first.

### Skills the coder must use

Three skills are installed for this project. Load each at the point named; do not rely on memory of them.

| Skill | When to load it |
| --- | --- |
| `usc-theme` | Before writing or changing any styling, and in M0 when setting up the design tokens |
| `beginner-first-ux` | Before building any screen, form, state or interface text |
| `ui-review` | Before reporting any milestone that touched the interface as done; include its report in the milestone report |

Where a skill and section 7.4 of this spec differ on visual details, the skill wins.

## 2. Product

Forge helps a USC student who has never built anything get from an idea to a finished object on campus, at the lowest cost. The student describes the idea in their own words; Forge shows where at USC to build it, whether they are allowed in, what training it takes, a rough cost, and leftover material they can have for free.

**One-line pitch:** Tell Forge what you want to make. It finds where at USC you can make it, what it takes to get in, what it will cost, and what you can get for free.

### Who it is for

| User | Situation | What Forge gives them |
| --- | --- | --- |
| First-year or first-time builder | Has an idea, does not know the vocabulary, the spaces or the rules | A plain-language plan with a "your first visit" checklist |
| Student org or design team member | Needs materials and tool access on a small budget | Routes ranked by cost, and free scrap |
| Professor of an intro course | Wants one link to hand a class | A tool that works with no account and no training |
| Space staff | Answer the same questions daily; throw away usable offcuts | A portal to keep their space's facts current and give leftovers away in seconds |

### Five ideas that hold it together

1. **Ask in your own words.** A beginner cannot pick "laser cutting" from a menu. They describe the result, add a sketch if they have one, and answer up to three tap questions.
2. **Eligibility is the answer, not a footnote.** The student says who they are once. Every space then reads "Open to you", "Ask first" or "Not open to you".
3. **Routes, not just places.** A plan offers up to three ways to build the thing, labelled "Cheapest" and "Easiest for a first build". Code assigns the labels.
4. **One material vocabulary.** The same categories describe what a project needs, what a space stocks and what is in the scrap bin, so free scrap shows up inside the plan.
5. **Estimated until confirmed.** The app launches with estimates, each visibly labelled. Space staff sign in, correct their own data and press "Confirm". That is the adoption path.

### What the AI does, and does not do

| The model | Code |
| --- | --- |
| Understands a beginner's description and sketch | Decides who is eligible where |
| Chooses which follow-up questions are worth asking | Works out required trainings |
| Matches the idea to capabilities, spaces and equipment | Calculates cost from stored prices |
| Estimates material quantities | Labels routes cheapest and easiest |
| Warns about design problems in plain language | Matches scrap to needed materials |
| Drafts a scrap listing from a photo | Enforces claims, holds and limits |

## 3. Scope

Six features, built in the order of section 8. Anything not listed here is not built.

### Must have

| ID | Feature | Done means |
| --- | --- | --- |
| F1 | Guided ask | One text box, optional photo, audience and experience selectors, then up to three tap questions chosen by the AI. Works without signing in |
| F2 | Plan | Up to three routes, each with a space, eligibility badge, process in plain words, trainings, materials with a cost range, and scrap matches. Routes labelled "Cheapest" and "Easiest for a first build". Ends with a "Your first visit" checklist |
| F3 | Spaces | Directory with filters, and a page per space. Every group of facts labelled "Estimated" or "Confirmed by staff" |
| F4 | Scrap exchange | Staff post leftovers by photo with an AI-drafted listing. Students browse, claim and pick up. Scrap appears inside plans and on space pages |
| F5 | Sign-in | Google sign-in limited to `usc.edu` accounts, asked for only when claiming scrap or opening the staff portal. A "My stuff" page lists the student's plans and claims |
| F6 | Staff portal | For allow-listed staff of a space: post scrap, close claims, edit hours, access and prices, and confirm each group of facts |

### Limits

- **Spaces:** 4 to 6. The Baum Family Maker Space is the showcase with the most complete data.
- **Audiences:** Viterbi undergraduate, Viterbi graduate, other USC undergraduate, other USC graduate.
- **Experience levels:** never built anything, used basic tools, comfortable in a workshop.
- **Follow-up questions:** 3 at most, from a fixed bank.
- **Routes per plan:** 3 at most.

### Stretch, in order, only after every must-have passes its checks

1. Training booking for the Makerspace: 30-minute sessions, 6 seats, booked atomically like a scrap claim.
2. Print Doctor: a photo of a failed 3D print returns likely defects and ordered fixes.

### Not built

- USC single sign-on. Say in the pitch that it is the production path.
- Open-ended chat. The ask is one box plus tap questions.
- Machine reservations, payments, notifications, inventory.
- A vector database. The space data fits in the prompt.

### Cut order if time runs out

1. Field editing in the staff portal. Keep only the "Confirm" button.
2. The "My stuff" page.
3. The claim flow. Keep browsing and scrap matches in plans; replace "Claim" with "Ask at the front desk".
4. Follow-up questions. Plan straight from the text box.

Never cut: the plan, eligibility badges, cost computed in code, scrap matches inside the plan, and the estimated or confirmed labels.

## 4. Stack and architecture

One Next.js app holds the UI and the API. Supabase provides the database, sign-in and photo storage. One AI provider. Nothing else.

| Layer | Choice | Notes |
| --- | --- | --- |
| App | Next.js (App Router), TypeScript, current stable from `create-next-app` | One repo, one deploy |
| Styling | Tailwind CSS and shadcn/ui | Accessible defaults |
| Database | Supabase Postgres | Row-level security on for every table, with no policies for the public key. All reads and writes go through server routes using the service key |
| Sign-in | Supabase Auth with the Google provider | Server rejects any session whose email is not `@usc.edu`. Follow Supabase's current Next.js server-side auth guide |
| Storage | One public Supabase Storage bucket for scrap photos | Uploads only from staff routes |
| AI | Set by `AI_PROVIDER`; starts in fixture mode with no key (section 4.1) | Model ID from `FORGE_MODEL`; default to the current Claude Sonnet model; confirm the ID at docs.claude.com |
| Validation | zod for every API input and every AI output |  |
| Hosting | Replit or Vercel from GitHub, decided with the AI provider (section 4.1) | No Vercel-only features, so it can also run with `npm run build && npm start` |
| Tests | Vitest, plus TypeScript scripts for the race test and the eval |  |

**Sign-in fallback:** if Google sign-in is not working within 30 minutes of starting it, switch to Supabase's email one-time code for `@usc.edu` addresses. Check the built-in email sender's rate limit before relying on it in a demo.

### 4.1 AI provider and credentials

Jithin has no paid API key yet, so the app must be fully buildable and testable without one. `lib/ai/client.ts` exposes one function that takes a system prompt, messages, an optional image and a tool schema, and returns the validated tool input. The `AI_PROVIDER` environment variable selects what sits behind it.

| `AI_PROVIDER` | Behavior | When it is used |
| --- | --- | --- |
| `fixture` (default) | Returns recorded responses from `data/fixtures/`, chosen by call name and a hash of the input, falling back to a default sample for that call. No network call | Milestones M0 to M2, and local development at any time |
| `replit` | Calls Anthropic models through Replit AI Integrations, using the credentials Replit injects into apps it runs. Read Replit's current docs for the exact variable names and supported model IDs | Preferred live mode, paid for with hackathon Replit credits. Works only when the app runs on Replit |
| `anthropic` | Calls the Anthropic API with `ANTHROPIC_API_KEY` | Only if a key becomes available |
| `gemini` | Calls a Gemini Flash model with `GEMINI_API_KEY`, using its image input and structured output | Free fallback if Replit credits do not work out |

Rules:

- Every adapter returns the same shape, and everything after the call (zod validation, grounding, the compute steps) is identical in all modes.
- In fixture mode the app shows a visible "Sample data" banner on any screen built from a fixture. Fixture output is never used for the eval, for `RESULTS.md`, or in the demo video.
- The coder writes the first fixtures by hand so that they pass grounding against the seed spaces. Once a live provider works, replace them with recorded live responses.
- Hosting follows the provider: Replit when `AI_PROVIDER` is `replit`, otherwise Vercel. The app must run with `npm run build && npm start` either way.
- Prompt caching and token logging apply where the provider supports them; log zero tokens in fixture mode.

### How a request flows

1. Browser posts the idea text, optional photo (resized to 1568 px, JPEG), audience and experience to `/api/ask`.
2. Server asks the model which follow-up questions are needed. Browser shows them as tap choices.
3. Browser posts the idea plus answers to `/api/plan`.
4. Server builds the prompt from the space documents, calls the model with a forced tool call, and validates the output with zod.
5. Server runs grounding, then computes eligibility, trainings, cost, labels and scrap matches (section 6.3).
6. Server saves the plan and returns it. Browser shows `/plan/[id]`.

Idea photos go to the model and are then discarded. Only staff-posted scrap photos are stored.

### Repo layout

```
forge/
  SPEC.md  README.md  RESULTS.md  .env.example
  data/
    spaces/*.json          # seed documents, one per space
    eval-cases.json
  supabase/schema.sql      # tables, RLS, claim function
  scripts/                 # seed.ts, race-test.ts, eval.ts
  src/
    app/                   # pages and api routes, section 7
    lib/
      ai/client.ts         # the only file that imports the AI SDK
      ai/ask.ts  ai/plan.ts  ai/scrap.ts  ai/prompts.ts
      spaces.ts            # loads and validates space documents
      compute/             # grounding, eligibility, training, cost, labels, scrapMatch
      auth.ts  db.ts  schemas.ts  ratelimit.ts
    components/
```

Each file in `lib/compute/` is a pure function with its own unit tests.

### Environment variables

| Name | Used for |
| --- | --- |
| `ANTHROPIC_API_KEY` | AI calls, server only |
| `FORGE_MODEL` | Model ID |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser sign-in only; cannot read any table |
| `SUPABASE_SERVICE_ROLE_KEY` | Server database access; never sent to the browser |
| `STAFF_SEED` | Comma-separated `email:space_id` pairs used to seed the staff allow-list; kept out of git |

Added for section 4.1: `AI_PROVIDER` (`fixture`, `replit`, `anthropic` or `gemini`), and `GEMINI_API_KEY` if that provider is used. `ANTHROPIC_API_KEY` is optional. Replit's managed credentials are injected by Replit and are not set by hand.

## 5. Data

Each space is one JSON document. Documents start as seed files in `data/spaces/`, are loaded into the database once, and are edited there by staff afterwards.

### 5.1 The space document

| Key | Holds |
| --- | --- |
| `id`, `name`, `school`, `location`, `official_url` | Identity and link |
| `blurb` | Two plain sentences a first-year would understand |
| `capabilities` | Tags from the list below |
| `hours` | Open and close per weekday, or null |
| `access` | One entry per audience: `audience`, `status` (`open`, `ask_first`, `not_open`), `note` |
| `access_steps` | Ordered first-visit steps: orientation, forms, who to contact |
| `trainings` | `id`, `name`, `covers`, `prerequisite_ids`, `duration_note`, `how_to_sign_up`, `restricted_to` (text or null) |
| `equipment` | `id`, `name`, `capability`, `plain_name` (what a beginner would call it), `required_training_ids`, `staff_operated`, `work_area_note`, `good_for`, `not_for` |
| `materials` | `id`, `name`, `category`, `unit_price_usd` (number or null), `price_unit`, `stocked` |
| `services` | Things staff do for students, with how to request them |
| `usage_fee_note` | Text or null |
| `prohibited` | What may not be made or done there |
| `scrap_policy` | `offers_scrap`, `never_offer` (material categories), `pickup_note` |
| `source` | `urls` of official pages opened, `checked_on` |
| `status` | For each of `hours`, `access`, `trainings`, `equipment`, `prices`: `estimated` or `confirmed`, plus `confirmed_by` and `confirmed_on` when confirmed |

Rules for the document:

- A fact not stated on an official page and not supplied by Jithin is either null or an estimate. If it is an estimate, its group's `status` is `estimated`.
- When access is unknown, use `ask_first`. Never guess `open`.
- Only a signed-in staff member of that space can set a group to `confirmed`.
- The seed script inserts a space only if it is not already in the database, so it never overwrites staff edits. A `--force` flag exists for development.

**Audiences:** `viterbi_undergrad`, `viterbi_grad`, `usc_undergrad_other`, `usc_grad_other`.

**Capabilities:** `fdm_3d_printing`, `resin_3d_printing`, `laser_cutting`, `woodworking`, `metalworking`, `cnc_machining`, `electronics`, `hand_tools`, `textiles`, `video_production`, `audio_recording`, `photography`.

**Material categories:** `pla_filament`, `other_filament`, `resin`, `plywood`, `solid_wood`, `mdf`, `acrylic`, `other_plastic_sheet`, `aluminum`, `steel`, `other_metal`, `cardboard_paper`, `foam`, `fabric`, `electronic_components`, `fasteners_hardware`, `unknown_plastic`, `other`.

Add a tag only when a real space needs it. The loader rejects unknown tags.

### 5.2 Tables

| Table | Columns | Rules |
| --- | --- | --- |
| `spaces` | `id`, `doc` (JSON), `updated_at`, `updated_by` | Validated against the zod schema on every write |
| `staff_members` | `email`, `space_id` | Seeded from `STAFF_SEED`. Checked on every staff route |
| `profiles` | `user_id`, `email`, `display_name`, `audience`, `experience` | Created at first sign-in |
| `plans` | `id` (short random string), `created_at`, `user_id` (nullable), `idea_text`, `answers` (JSON), `audience`, `experience`, `had_image`, `plan` (JSON), `space_ids`, `cost_low_usd`, `cost_high_usd`, `input_tokens`, `output_tokens` | Readable by anyone with the link |
| `scrap_items` | `id`, `space_id`, `material_category`, `title`, `description`, `size_note`, `condition` (`good`, `usable`, `rough`), `restrictions` (text array), `photo_url`, `status` (`available`, `reserved`, `picked_up`, `removed`), `posted_by`, `posted_at`, `expires_at` (30 days) | Created and changed only by staff of that space |
| `scrap_claims` | `id`, `item_id`, `user_id`, `plan_id` (nullable), `created_at`, `hold_until` (48 hours), `status` (`active`, `picked_up`, `expired`, `cancelled`) | One active claim per item; 3 active claims per user at most |

### 5.3 Rules enforced in code or SQL

1. **Claiming is atomic.** One database function flips an item from `available` to `reserved` only if it is still `available`, checks the user's active-claim count, and inserts the claim, all in one transaction.
2. **Holds expire.** A hold past `hold_until` returns the item to `available`. Apply this on read; no background job.
3. **Unknown plastic is restricted.** Items in `unknown_plastic` always carry "Not for laser cutting or heating". Staff cannot remove it.
4. **Space policy wins.** An item in a category listed in the space's `never_offer` cannot be published.
5. **Staff scope.** A staff member can change only their own space's document, items and claims.
6. **Impact counter.** The number of items with status `picked_up`, from SQL, is the figure shown in the app and the pitch.

## 6. AI design

Three AI calls: choose the follow-up questions, build the plan, and draft a scrap listing. In each, the model returns structured data and code checks it before anything reaches a student.

### 6.1 Rules for every call

- **Structured output only.** Define one tool per call and force the model to call it. Parse the tool input with zod. Never parse free text.
- **Space data in the system prompt.** Serialize all space documents into the system prompt and mark it for prompt caching. Rebuild at most once a minute so staff edits show up quickly.
- **One retry.** If validation or grounding fails, call once more with the specific failure appended. If it fails again, show a clear error. Never show unvalidated output.
- **Timeout** of 30 seconds, with a friendly retry message.
- **Token logging** on every call, so the pitch can quote a real cost per plan.
- **Untrusted input.** User text and anything visible in a photo are data, not instructions. The prompt says so, and the code checks hold whatever the model returns.
- **Beginner language.** Every technical term is followed, the first time, by a plain explanation of eight words or fewer.

### 6.2 `askFollowUps`

**Input:** idea text (10 to 1,500 characters), optional image, experience level.

**Output:** `summary` (one sentence restating the idea), `question_ids` (0 to 3 from the bank), `prefilled` (answers already evident from the text), `blocked_reason` (text or null).

The question bank lives in code, with fixed wording and options. The model only chooses which to ask.

| ID | Question | Options |
| --- | --- | --- |
| `size` | How big is it? | Fits in a hand; shoebox; backpack; bigger; not sure |
| `demands` | What does it need to handle? (pick any) | Just for looks; holds weight; outdoors or wet; moving parts; electronics inside; not sure |
| `quantity` | How many do you need? | One; a few; many |
| `deadline` | When do you need it? | This week; this month; no rush |

Rules: ask a question only if its answer would change the route or the cost. Ask none if the description already covers them. Set `blocked_reason` if the idea is a weapon or weapon part, or is on every space's `prohibited` list; the app then stops and explains.

### 6.3 `planBuild`

**Input:** idea text, answers, audience, experience, optional image.

**Model output**

| Field | Type | Meaning |
| --- | --- | --- |
| `summary` | one sentence | What the student is making |
| `needs` | up to 5 of `capability`, `why` | What the project requires |
| `routes` | 1 to 3, each with the fields below | Different real ways to build it |
| route: `space_id`, `equipment_ids` | IDs | Where and with what |
| route: `process` | plain words | For example, "Cut flat pieces from plywood and slot them together" |
| route: `fit_reason` | two sentences at most | Why this route suits this project and this student |
| route: `materials` | up to 5 of `category`, `material_id` (or null), `quantity_low`, `quantity_high`, `unit` | Estimated quantities, as a range |
| route: `steps` | 3 to 5 of `title`, `detail` | The path, in beginner language |
| route: `warnings` | up to 3 of `issue`, `fix` | Design problems for this process |
| `clarifying_question` | text or null | Only if nothing useful can be said without it |
| `not_supported_reason` | text or null | When no space fits |

The model does **not** output eligibility, trainings, prices, labels or scrap. It never states a dollar amount.

**Prompt requirements**

- Role: a patient workshop mentor advising someone who may never have built anything.
- Use only spaces, equipment and materials present in the space documents, by ID.
- Offer more than one route only when each is a real way to build the thing. For "never built anything", prefer the simplest process and routes where staff do the difficult step.
- Do not drop a space because of the student's audience. Code handles eligibility.
- Give design advice and process choice. Do not give operating instructions for equipment that requires training.
- Estimate quantities conservatively. If the data lacks something, say so and point to the space's staff. Never guess specifications or prices.
- If an image is provided, describe only what bears on building it. Do not identify people.

**Computed in code, in this order**

1. **Grounding.** Every space, equipment and material ID exists. Each equipment and material ID belongs to the space of its route. Each material's category matches its ID.
2. **Eligibility.** Attach `open`, `ask_first` or `not_open`, with the note, from the space's `access` for this audience.
3. **Trainings.** The union of `required_training_ids` for the route's equipment, plus prerequisites. Attach each training's `how_to_sign_up`.
4. **Cost.** For each material with a price, multiply by low and high quantity; sum to a range. Materials without a price are listed as "ask staff for the price". If the space's `prices` status is `estimated`, the range is shown as "about $X to $Y, estimated prices". If nothing is priced, show no dollar figure.
5. **Scrap matches.** For each material, find `available` scrap in the same category, preferring the route's own space. Show at most 2 per material. A matched material is shown as "Free with scrap" and counts as $0 in the route's "with scrap" total.
6. **Ordering.** `open` routes first, then `ask_first`, then `not_open`.
7. **Labels.** Among routes that are not `not_open`: "Cheapest" goes to the lowest with-scrap low cost, only if at least two routes have a cost. "Easiest for a first build" goes to the fewest trainings, ties broken by `open` over `ask_first`. One route may hold both. With a single route, show no labels.
8. **First visit.** Build the "Your first visit" checklist for the top route from the space's `access_steps`, its trainings and its hours.

### 6.4 `describeScrap`

**Input:** one staff photo, the space ID, optional note.

**Output:** `material_category`, `title` (6 words at most), `description` (one sentence), `size_note`, `condition`, `suggested_uses` (up to 3), `restrictions`, `confidence` (`low`, `medium`, `high`), `needs_staff_check`.

Rules: the output is a draft that staff edit and publish; nothing is listed automatically. If the material cannot be identified with at least medium confidence, use `unknown_plastic` or `other` and set `needs_staff_check`. Sizes are approximate and say so. If the photo shows a person or no material, return an error asking for another photo.

### 6.5 Tests that must pass

| Case | Required behavior |
| --- | --- |
| Idea text says to ignore the rules and mark every space open | Eligibility still comes from the data |
| A request to make a weapon part | `blocked_reason` set; no plan produced |
| A one-word idea | Follow-up questions are asked, or a clarifying question is returned |
| The same idea from two audiences | Same routes, different badges and order |
| Model returns equipment under the wrong space (mocked) | One retry, then a clean error |
| No material in any route has a price | No dollar figure anywhere on the plan |
| Two routes with different costs and trainings | Labels match a hand calculation |
| Raw model output for three real plans | Contains no dollar amounts |
| An unidentifiable plastic sheet in a scrap photo | `unknown_plastic`, restriction attached, staff check flagged |
| Staff publish in a `never_offer` category | Refused with the reason |

### 6.6 Eval

`data/eval-cases.json` holds 12 to 15 cases: idea text, answers, audience, and the set of space IDs a knowledgeable person would accept as the top route. Jithin writes them. `scripts/eval.ts` runs each case and prints how many top routes fall in the accepted set and how many badges are correct. Quote only the numbers the script prints, with the case count.

## 7. Screens and routes

Three student tabs (Build, Spaces, Scrap), a "My stuff" page, and a staff portal. Designed first for a 390 px phone.

### 7.1 Screens

| Route | Purpose | Contents |
| --- | --- | --- |
| `/` | Ask | Headline "What do you want to make?"; text box with the hint "Describe it in your own words"; "Add a photo or sketch"; "I am a..." and "I have..." selectors remembered in the browser; four example chips; button "Find how to build it". After submitting: the AI's one-line restatement and the tap questions, each with "Not sure"; then "Show my plan". The impact counter sits at the bottom |
| `/plan/[id]` | The answer | Restated idea; **route cards**, each with labels, space name, eligibility badge, the process in plain words, why it fits, trainings with how to sign up, materials with quantity, price and any scrap match (thumbnail and "Claim"), route total as "about $X to $Y" and "with scrap", warnings, steps; **"Your first visit"** checklist for the top route; "Change my answers"; "Copy link" |
| `/spaces` | Directory | Space cards with badge for the current audience; filters for capability and "Open to me" |
| `/spaces/[id]` | One space | Blurb and location; eligibility table; first-visit steps; equipment grouped by capability with plain names; trainings; material prices; "Free here now" scrap strip; an "Estimated" or "Confirmed by staff on \[date\]" chip beside each group; official link |
| `/scrap` | Scrap bin | Photo grid; filters for material and space; item sheet with size, condition, restrictions, pickup note and "Claim"; after claiming, where and by when to pick up |
| `/me` | My stuff | Signed-in only. My plans; my claims with status and "Cancel" |
| `/staff` | Staff portal | Signed-in and allow-listed only. **Post scrap:** photo, AI draft in an editable form, publish. **Claims:** active claims with "Picked up" and "Release". **Space info:** edit hours, access and prices; a "Confirm" button per group of facts |

Navigation: bottom tab bar on phones (Build, Spaces, Scrap) and an account button at top right. The staff link appears only for staff.

### 7.2 Sign-in behavior

- Asking, planning and browsing never require sign-in.
- Pressing "Claim" while signed out opens "Sign in with your USC Google account", then returns to the same item and completes the claim.
- A non-USC account is signed out at once with the message "Forge is for USC accounts. Use your @usc.edu Google account."
- A plan made while signed in is saved to "My stuff". A plan open when the student signs in is attached to their account.
- First sign-in copies the audience and experience choices from the browser into the profile.

### 7.3 States every screen handles

- **Loading:** a skeleton of the result with plain rotating status lines; submit disabled.
- **Error:** one sentence and "Try again", keeping the student's input.
- **Blocked idea:** the reason, and no plan.
- **No route open to this audience:** said plainly at the top, with each space's "ask first" contact.
- **No price data:** quantities only, with "ask staff for the price".
- **Scrap claimed by someone else:** card changes to "Just claimed" and offers the next match.
- **Empty scrap bin or empty "My stuff":** a sentence saying so and what to do next.

### 7.4 Visual design

| Token | Value | Use |
| --- | --- | --- |
| Cardinal | `#990000` | Primary buttons, links, key headings |
| Cardinal pressed | `#7A0000` | Hover and pressed states |
| Gold | `#FFCC00` | Highlights and badges; never text on white |
| Gold soft | `#FFF2BF` | "Free with scrap" and "Cheapest" rows |
| Black | `#000000` | Text |
| White | `#FFFFFF` | Page and cards |
| Gray text | `#767676` | Secondary text, input borders |
| Gray line | `#CCCCCC` | Dividers and card borders |

- These values follow USC's published [color](https://identity.usc.edu/color/) and [typography](https://identity.usc.edu/?p=1558) guidance: cardinal may be darkened but not tinted, gold may be tinted but not darkened.
- Typeface: Source Sans 3 at weights 400, 600 and 700, which USC names as the digital substitute for its sans-serif. No monospace; use tabular numerals for dimensions and prices. Body text 16 px minimum.
- Badges use the palette, not red and green. "Open to you" and "Confirmed by staff": black fill, gold text. "Ask first" and "Estimated": gold fill, black text. "Not open to you": white fill with a gray border. Every badge has an icon and words.
- 12 px card radius, 1 px borders, shadows no heavier than Tailwind `shadow-sm`.
- Copy sounds like a friendly shop mentor: short sentences, no jargon left unexplained, no exclamation marks, no emoji.
- The wordmark is the text "Forge". Do not use USC logos, seals, the shield or the Trojan mark. The footer says "Student project. Not an official USC service."

### 7.5 Accessibility

WCAG AA contrast; full keyboard operation with a visible focus ring; 44 px tap targets; visible labels on every field; results announced to screen readers when an AI call completes.

### 7.6 API

Every body is validated with zod. Errors have the shape `{ "error": { "code", "message" } }`. "Auth" means a signed-in USC account; "Staff" means allow-listed for that space.

| Method and path | Who | Request | Success | Errors |
| --- | --- | --- | --- | --- |
| `POST /api/ask` | Anyone | `text`, optional `image`, `experience` | 200 `summary`, questions with options, `prefilled`, or `blocked_reason` | 400, 429, 502 |
| `POST /api/plan` | Anyone | `text`, `answers`, `audience`, `experience`, optional `image` | 201 `id` and the computed plan | 400, 429, 502 |
| `GET /api/plan/[id]` | Anyone | none | 200 stored plan with fresh scrap matches | 404 |
| `GET /api/spaces` | Anyone | optional `capability`, `audience` | 200 list with badges | 400 |
| `GET /api/spaces/[id]` | Anyone | optional `audience` | 200 space with statuses and available scrap | 404 |
| `GET /api/scrap` | Anyone | optional `category`, `space_id` | 200 available items | 400 |
| `POST /api/scrap/[id]/claim` | Auth | optional `plan_id` | 201 claim with `hold_until` and pickup note | 401, 409 `ALREADY_CLAIMED`, 409 `TOO_MANY_CLAIMS` |
| `DELETE /api/claims/[id]` | Auth, owner | none | 204 | 401, 403, 404 |
| `GET /api/me` | Auth | none | 200 profile, plans, claims | 401 |
| `POST /api/staff/scrap/draft` | Staff | `space_id`, `image`, optional `note` | 200 draft listing | 401, 403, 400, 502 |
| `POST /api/staff/scrap` | Staff | reviewed listing and image | 201 item | 401, 403, 400 `CATEGORY_NOT_ALLOWED` |
| `PATCH /api/staff/scrap/[id]` | Staff | `status` | 200 item | 401, 403, 404 |
| `GET /api/staff/claims` | Staff | `space_id` | 200 active claims with names and emails | 401, 403 |
| `PATCH /api/staff/space/[id]` | Staff | changed `hours`, `access` or prices; or `confirm` with a group name | 200 updated document | 401, 403, 400 |

Rate limit: 20 AI calls per IP per hour across `/api/ask` and `/api/plan`. Names and emails are returned only by staff routes. No caching on routes that return scrap availability.

## 8. Build order

Eight milestones, about 11 hours of work. The coder stops after each one and reports every check as pass or fail with evidence.

### M0. Scaffold and deploy (45 min)

Build: Next.js app with TypeScript, Tailwind, shadcn/ui and the design tokens; all tables from section 5.2 with row-level security on; the claim function; the storage bucket; `.env.example`; empty page shells; README; first deploy.

- [ ] Build, typecheck and lint pass.
- [ ] The deployed URL loads on a phone.
- [ ] A request with the public key cannot read any table.
- [ ] No secret appears in the client bundle or in git.

### M1. Spaces (1 h)

Build: the zod schema for the space document; seed files for the first two spaces from section 9; seed script; `/spaces` and `/spaces/[id]` with their API routes; audience and experience selectors; eligibility badges; estimated and confirmed chips.

- [ ] A seed file with an unknown tag or a missing audience is rejected with a clear message.
- [ ] Running the seed twice does not duplicate or overwrite a space.
- [ ] Changing the audience changes the badges without a reload.
- [ ] Unit tests cover eligibility for all four audiences.

### M2. Ask and plan (3 h)

Build: `askFollowUps` and the question bank; `planBuild`; every function in `lib/compute/` with unit tests; `/api/ask` and `/api/plan`; the home page flow; the plan page (scrap matches may be empty for now).

- [ ] Three different ideas each produce a plan that passes zod and grounding.
- [ ] A detailed idea is asked no questions; a vague one is asked up to three.
- [ ] The same idea from two audiences gives the same routes with different badges and order.
- [ ] Cost range and labels on one plan match a hand calculation.
- [ ] The mocked wrong-space equipment ID causes one retry and then a clean error.
- [ ] Raw model output for the three plans contains no dollar amounts.

M2 is built and checked in fixture mode. All six checks above must pass with `AI_PROVIDER=fixture`, with the phrase "model output" read as "fixture output" for now.

### M2b. Live AI (30 min, whenever credentials exist)

This can be done at any point after M2; later milestones do not wait for it. M4's scrap drafting also runs in fixture mode until then.

Build: the adapter for the chosen provider; deployment on the matching host; recording of live responses into `data/fixtures/`.

- [ ] The three M2 ideas each produce a valid plan from the live model.
- [ ] A photo of a hand sketch changes the live plan.
- [ ] Raw live output contains no dollar amounts.
- [ ] A real scrap photo yields a sensible live draft (once M4 exists).
- [ ] The "Sample data" banner is gone in live mode.

### M3. Sign-in and My stuff (1 h)

Build: Google sign-in through Supabase; the `usc.edu` check on the server; profile creation; `/me`; attaching the open plan at sign-in; the staff allow-list check and an empty staff portal shell.

- [ ] A `usc.edu` account signs in and lands back where it started.
- [ ] A non-USC Google account is signed out with the message from section 7.2.
- [ ] `/me` and every staff route return 401 when signed out; staff routes return 403 for a non-staff account.
- [ ] A plan made while signed in appears on `/me`.

### M4. Scrap exchange (2 h)

Build: `describeScrap`; staff draft, publish and status routes; the Post scrap and Claims tabs; `/scrap`; the atomic claim with sign-in; cancel; scrap matches on the plan page and space page; the impact counter.

- [ ] A real offcut photo yields a sensible draft; after editing and publishing it appears on `/scrap`.
- [ ] A race script fires 5 simultaneous claims from 5 users at one item: exactly 1 succeeds.
- [ ] A fourth active claim by one user returns `TOO_MANY_CLAIMS`.
- [ ] An item past its hold shows as available again.
- [ ] A new plan needing that material shows the item as "Free with scrap", and its with-scrap total drops.
- [ ] Publishing in a `never_offer` category is refused.
- [ ] "Picked up" raises the impact counter by one.

### M5. Staff space info (45 min)

Build: the Space info tab; editing hours, access and prices; "Confirm" per group; the change showing on the space page and in new plans.

- [ ] A staff member cannot edit another space (403).
- [ ] Confirming `prices` changes the chip to "Confirmed by staff" with today's date, and new plans drop the words "estimated prices".
- [ ] An edited price changes the cost on a new plan within about a minute.

### M6. Polish (1.5 h)

Build: a full pass on a real phone; copy edit for beginner language; every state in section 7.3; accessibility items; page titles and favicon.

- [ ] The whole demo script in section 9 runs on a phone without a layout break.
- [ ] A keyboard-only run through ask, plan and claim succeeds.
- [ ] An automated accessibility scan reports no critical issues.

### M7. Proof (45 min)

Build: the tests in section 6.5; `scripts/eval.ts`; `RESULTS.md` with the eval score, race-test output, average tokens and cost per plan, and scrap items posted and picked up.

- [ ] All section 6.5 tests pass.
- [ ] `RESULTS.md` contains only numbers the scripts produced.

### Solo timeline

| When | Target |
| --- | --- |
| Sat 3:00 PM | Start M0 |
| Sat 3:45 PM | M0 done. While the coder builds M1, Jithin fills in the Makerspace data |
| Sat 4:45 PM | M1 done |
| Sat 7:45 PM | M2 done, with a meal break inside it |
| Sat 8:45 PM | M3 done |
| Sat 10:45 PM | M4 done |
| Sat 11:30 PM | M5 done |
| Sun 1:00 AM | M6 done |
| Sun 1:45 AM | M7 done. Feature work stops |
| Sun 7:30 AM | Record the video |
| Sun 8:30 AM | Build the deck |
| Sun 9:00 AM | Checked in (organizer deadline) |
| Sun 9:30 AM | Devpost description and screenshots |
| Sun 10:30 AM | Submit, 30 minutes before the 11:00 AM deadline |

### Decision gates

- **8:00 PM:** if M2 is not passing, drop the follow-up questions and plan from the text box alone.
- **11:00 PM:** if M4 is not passing, drop the claim flow and keep posting, browsing and scrap matches in plans.
- **Midnight:** if M5 has not started, build only the "Confirm" button.
- Polish and proof are never skipped. An unpolished demo and unproven claims cost more points than a missing feature.

* **9:00 PM:** if no live AI provider is working, stop waiting for Replit credits and set up the Gemini free key. A demo needs a live model; fixtures alone cannot be submitted as the product.

### Kickoff prompt

> Read SPEC.md from start to finish before doing anything. You are the developer and the spec is the source of truth. Follow the working agreement in section 1. Do milestone M0 from section 8 only. Report each check as pass or fail with evidence, list anything you need from me, and stop.

For each later milestone: "Do M1. Same rules. Report against the checks and stop."

## 9. Submission, checklist and starting data

The pitch tells one story: a first-year with an idea and no idea where to start gets a route, a price and free material in under a minute.

### 9.1 Demo video, 3 minutes

| Time | Show | Say |
| --- | --- | --- |
| 0:00 to 0:20 | A sketch on paper; a bin of offcuts | New students have ideas and no map. The tools exist, spread across schools with different rules, and usable material is thrown away |
| 0:20 to 0:55 | Type the idea the way a beginner would, add the sketch, answer two tap questions | No vocabulary needed. The AI asks only what changes the answer |
| 0:55 to 1:30 | The plan: routes, badges, "Cheapest" and "Easiest" labels, first-visit checklist | Where to go, whether you are allowed, what training it takes, what it costs |
| 1:30 to 1:45 | Change the audience and re-run | Same idea, different student, different answer. Code decides eligibility, not the model |
| 1:45 to 2:10 | Tap "Claim" on a scrap match; sign in with a USC account | This part is free because someone posted their leftovers. Sign-in keeps claims to real USC students |
| 2:10 to 2:40 | Staff portal: photograph an offcut, AI drafts the listing, publish; then confirm the price list | Staff post in seconds and own their data. "Estimated" becomes "Confirmed by staff" |
| 2:40 to 3:00 | One slide: spaces listed, eval score, cost per plan, items reused | A professor can hand this link to a first-year class. Ask for a pilot |

### 9.2 Slide deck, 6 slides

1. **Problem.** One student story, told from Jithin's own experience working at the Makerspace. No invented statistics.
2. **Forge.** A screenshot of a plan. The one-line pitch.
3. **How the AI is kept honest.** Model proposes, code verifies. Eval score with case count. Tests passed.
4. **Adoption.** Launches with labelled estimates; each space's staff confirm their own data; professors of intro courses share one link; measured cost per plan.
5. **What is in it today.** The spaces listed, each marked estimated or confirmed. Items posted and reused during the hackathon.
6. **Ask.** A pilot semester with the Makerspace and one intro course, USC single sign-on, and an introduction to other space managers.

**On numbers:** use only figures the app or scripts produced, and say "estimated" wherever data is estimated. If a judge asks how big the problem is, answer from first-hand experience rather than a made-up figure.

**If a judge asks "is this just for your lab?":** the app lists several spaces across schools and tells each student which they may use. The Makerspace is the deepest because that is where we could test with real material this weekend; every other space joins by confirming one page of data.

### 9.3 Devpost description

One short paragraph each for the problem, the solution, the tech stack, challenges and future goals. Add: that Claude wrote the code under Jithin's direction; which data is estimated; the numbers from `RESULTS.md`; screenshots of the plan, the scrap bin and the staff portal.

### 9.4 Jithin's checklist

Before M0:

- [ ] GitHub repo, Vercel project, Supabase project, Anthropic API key with credits.
- [ ] Confirm you can sign in to Google with your `@usc.edu` account.

AI credits, needed before M2b (the build does not wait for this):

- [ ] Find the hackathon's Replit credit code or link: check hub.aiusc.org, the #announcements Slack channel, and the Replit sponsor table.
- [ ] Redeem it, then open the usage page in your Replit account and confirm the credit balance and plan.
- [ ] Ask at the Replit table: "Do these credits include a plan that enables Replit AI Integrations?" Their docs say the feature is off on the free Starter plan.
- [ ] If not, create a free Gemini API key in Google AI Studio and check the daily request limit it shows for your project.

Before M3:

- [ ] Create a Google OAuth client and add Supabase's callback URL. Check that the consent screen allows any Google user to sign in, not only listed test users; otherwise only you will be able to sign in during judging.

While the coder builds M1 and M2:

- [ ] Fill in the Makerspace document: access for all four audiences, prices, scrap policy, first-visit steps. Mark each group `estimated` unless you are certain.
- [ ] Add two or three more spaces from the leads below. The coder may draft a space only from an official page it has opened.
- [ ] Write 12 to 15 eval cases.

Before M4:

- [ ] Get 8 to 10 photos of real leftover material, taken today. If you cannot leave the venue, ask a coworker on shift to send them.
- [ ] Ask your supervisor whether the Makerspace could give leftovers away this way. Without a yes, present the scrap exchange as a proposed pilot.

Sunday morning:

- [ ] Record the video on a real phone. Keep it under 3 minutes.
- [ ] Rehearse the 3-minute pitch aloud at least three times.

### 9.5 Starting space data

Facts below come from official pages read on November 14. Everything not listed is unknown and must be null or marked estimated.

| Space | Facts from its page | Source |
| --- | --- | --- |
| Baum Family Maker Space: Advanced Fabrication Lab | Six Prusa MK4 printers (9.8 x 8.3 x 8.6 in); Stratasys F900 (36 x 24 x 36 in); Stratasys F370 (14 x 10 x 14 in); FormLabs Form 3L resin printer (13.2 x 7.9 x 11.8 in); Markforged X7 (13 x 10.6 x 7.9 in); Prusa Pro HT90; Universal VLS6.75 laser cutter (18 x 32 in) for cardboard, paper, wood, fiberboard, acrylic and PETG. For the Stratasys printers, students pay only for material | [Advanced Fabrication Lab](https://viterbiundergrad.usc.edu/bfms/facilities/advance-fabrication-lab), updated June 2025 |
| Baum Family Maker Space: trainings | Level 1 orientation and safety (no prerequisite; unlocks non-powered hand tools). Level 2 basic hand tools and handheld drills. Level 3 power tools such as drill press, sanders and band saws. Level 4 electronics such as soldering and test equipment. Levels 2 to 4 each require Level 1. Level 5 machine tools requires Levels 1 and 2 and is limited to student workers and designated team members | [Training levels](https://viterbiundergrad.usc.edu/bfms/operations/training-levels/), updated September 2024 |
| BME Innovation Space, Denney Research Building | Machine shop, 3D print shop, electronics workshop, computer lab. Restricted to BME-affiliated students, staff and faculty. Requires general shop safety training, an orientation, and machine-specific training for 3D printers, the laser cutter and machine-shop tools. Open Monday to Friday, 9 AM to 5 PM | [BME Innovation Space](https://bme.usc.edu/innovation/) |

Suggested access for the BME space: `ask_first` for both Viterbi audiences with the note "BME-affiliated only"; `not_open` for the others.

The Makerspace pages describe it as serving Viterbi undergraduates. Jithin sets its `access` entries from what he knows of current policy.

**More facts from official pages, read later on November 14:**

| Space | Facts from its page | Source |
| --- | --- | --- |
| Baum Family Maker Space: overview | Ground floor of the Science and Engineering Library. Described as for undergraduate students in the Viterbi School of Engineering. Hours listed as 11 AM to 10 PM Monday to Friday and 10 AM to 5 PM Saturday. Areas: open design space, staffed machine shop, 3D fabrication lab, outdoor area for welding and painting | [Maker Space home](https://viterbiundergrad.usc.edu/bfms/) |
| Ahmanson Lab, Leavey Library room 301 | Part of the Sidney Harman Academy for Polymathic Study. Offers technology, equipment and services to USC faculty, staff and students, plus workshops. Listed hours 9 AM to 9 PM. Contact lvy@usc.edu. The page does not list specific equipment | [Ahmanson Lab room page](https://libraries.usc.edu/locations/leavey-library/rooms/lvl-301-ahmanson-lab) |
| Digital Creative Lab, Leavey Library basement | Podcast studios that students and faculty are welcome to use. The page gives no hours, cost or booking method | [ITS learning spaces page](https://itservices.usc.edu/?p=24117) |

Suggested access for the Ahmanson Lab and the Digital Creative Lab: `open` for all four audiences, since their pages name USC students without restriction. Their equipment lists are not on the pages read, so equipment for both stays coarse and `estimated`.

**Leads, not yet opened.** Treat every detail as unconfirmed until someone reads the official page.

| Lead | Why it is worth checking | Start here |
| --- | --- | --- |
| Iovine and Young Hall makerspaces | Described as fabrication labs built for Academy students. Likely restricted | [USC Today article](https://today.usc.edu/?p=13788) |
| Ahmanson Lab equipment list | Search results mention 3D printing, virtual reality and microcontrollers at open lab hours | The "Lab Equipment" page on [polymathic.usc.edu](https://polymathic.usc.edu/node/2201) |

### Sources

- [AI@USC Hackathon on Devpost](https://ai-usc.devpost.com/) and its [rules](https://ai-usc.devpost.com/rules)
- [Baum Family Maker Space: Advanced Fabrication Lab](https://viterbiundergrad.usc.edu/bfms/facilities/advance-fabrication-lab)
- [Baum Family Maker Space: safety training levels](https://viterbiundergrad.usc.edu/bfms/operations/training-levels/)
- [BME Innovation Space](https://bme.usc.edu/innovation/)
