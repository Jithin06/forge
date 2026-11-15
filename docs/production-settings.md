# Production settings (Vercel)

Vercel, the forge project, Settings, Environment Variables. Set these for the **Production** environment, then redeploy (Deployments, the latest one, Redeploy). A change does nothing until a new deployment is made.

## Set these

| Variable | Value | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xjruxfndvqlzvamlndqn.supabase.co` | Already set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your `sb_publishable_...` key | Already set. Public by design |
| `SUPABASE_SERVICE_ROLE_KEY` | your `sb_secret_...` key | Already set. Secret. Type it into Vercel only |
| `AI_PROVIDER` | `gemini` | Currently `fixture`. This is what turns live AI on and removes the "Sample data" banner |
| `GEMINI_API_KEY` | your Gemini key | Secret. Type it into Vercel only |
| `GEMINI_MODEL_PRIMARY` | `gemini-3.5-flash-lite` | Tried first |
| `GEMINI_MODEL_FALLBACK` | `gemini-3.1-flash-lite` | Tried automatically when the primary answers 429 |
| `AI_DAILY_BUDGET` | `450` | Live AI calls allowed per Pacific calendar day. Optional: 450 is the default when it is not set |
| `AUTH_MODE` | `test` for now; `google` once Google sign-in is set up | `test` lets any visitor sign in as the test student or test staff, with a gold banner on every page. Switch to `google` after NEEDS.md item 4 |

## Do not set these on Vercel

| Variable | Why |
| --- | --- |
| `AI_CALL_BUDGET` | A fixed total that never resets. It is for local work only (150 in `.env.local`). If it is set on the live site, the site stops answering for good once the total is reached, and the daily cap is ignored |
| `RECORD_FIXTURES` | Saves answers to disk. Vercel's disk is read-only |
| `AI_CALL_LOG` | A local file path |
| `RATE_LIMIT_PER_HOUR` | Testing only. Leave the default of 20 AI calls per visitor address per hour |
| `STAFF_SEED` | Read only by `npm run seed` on your machine |
| `ANTHROPIC_API_KEY`, `FORGE_MODEL` | Not used by the Gemini provider |

## How the caps work

- **Local:** `AI_CALL_BUDGET=150` in `.env.local`. Counted in `logs/ai-calls.jsonl`. Never resets.
- **Live site:** whenever `AI_CALL_BUDGET` is not set, a daily cap applies: `AI_DAILY_BUDGET`, 450 by default. The day is the Pacific calendar day, because Gemini's requests-per-day quota resets at midnight Pacific time. When the cap is reached, visitors see "Forge is busy, try again in a minute." and what they typed is kept.
- **Why 450:** each of the two models has its own 500 a day on your key. 450 leaves room on the primary, and the fallback is extra headroom, not part of the count.
- **A request counts** when it is sent, including one that Gemini rejects. A plan that needs a retry counts twice.
- **Your local calls and the live site share Gemini's quota** if both use a key from the same Google project: Google applies limits per project, not per key. The two caps are counted separately, so local work can still eat into the live site's 500.

## One database step for an exact daily cap

The daily count is kept in the database so that every server copy shares it. That needs one small table and function, which are now at the end of `supabase/schema.sql` under "daily live-AI call counter".

1. Supabase, SQL Editor, New query.
2. Paste the whole of `supabase/schema.sql` and run it. It is safe to run again; it changes nothing that already exists.
3. Check with `npm run check:rls`: it now also confirms the public key cannot read `ai_usage`.

**Until you do this** the cap still works, but each server copy counts on its own in memory, so the real total can exceed 450 on a busy day, and a restart starts that copy from zero. The server logs a warning once when this is the case.

## After redeploying, check
- The home page shows no "Sample data" banner after you make a plan.
- Vercel, Logs: each live call prints a line like `live AI call 12 of 450 for 2026-11-15 Pacific`. If it ends with "(this server copy only)", the database step above has not been done.
