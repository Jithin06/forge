# Forge

Tell Forge what you want to make. It finds where at USC you can make it, what it takes to get in, what it will cost, and what you can get for free.

Built for the AI@USC Hackathon, November 14 to 15, 2026. The code was written by Claude under Jithin's direction. `SPEC.md` is the source of truth for what is built.

Live: https://forge-beta-hazel.vercel.app

Student project. Not an official USC service.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in Supabase values; AI_PROVIDER=fixture needs no key
npm run dev                  # http://localhost:3000
```

Production build: `npm run build && npm start`.

## Database

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/schema.sql`. It creates every table with row-level security on and no policies, the `claim_scrap` and `expire_holds` functions, the `impact` view and the public `scrap-photos` bucket.
3. Put the project URL, the public (anon or publishable) key and the service role (or secret) key in `.env.local`.

All reads and writes go through server routes with the service key. The public key can only start sign-in.

## Modes

| Variable | Values | What it does |
| --- | --- | --- |
| `AI_PROVIDER` | `fixture` (default), `gemini` | `fixture` answers from saved examples in `data/fixtures/` and shows a "Sample data" banner. `gemini` calls `GEMINI_MODEL_PRIMARY`, falling back to `GEMINI_MODEL_FALLBACK` on a 429 |
| `AUTH_MODE` | `google` (default), `test` | `test` adds a picker of test accounts and a "Test sign-in" banner. Never use it in production |
| `AI_CALL_BUDGET` | a number | Stops live AI calls after that many. Calls are counted in `logs/ai-calls.jsonl` |
| `RECORD_FIXTURES` | `1` | Saves each live answer into `data/fixtures/` |

## Checks

| Command | What it checks |
| --- | --- |
| `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` | Types, lint, 70 unit tests, production build |
| `npm run check:rls` | The public key cannot read any table, call the claim function or upload photos |
| `npm run check:secrets` | No server secret in the client bundle or in git (run after a build) |
| `npm run check:seed` | Seeding twice neither duplicates nor overwrites a space |
| `npm run check:m2`, `check:m3`, `check:m4`, `check:m5` | Each milestone's checks through the running app. Set `BASE` to the server's address; M3 to M5 need `AUTH_MODE=test` |
| `npm run race` | 5 users claim one item at once; exactly 1 must succeed |
| `npm run check:m2b`, `check:live`, `eval` | Live-model checks and the eval. They cost live AI calls |
| `npm run results` | Rewrites `RESULTS.md` from what the scripts measure |
| `npm run clean:test` | Removes data made by test accounts and check scripts |

Each milestone's report is in `reports/`. What is still needed from Jithin is in `NEEDS.md`.

## Layout

See section 4 of `SPEC.md`.
