# M2b. Live AI on Gemini: built, not yet run live

**Status: blocked on one thing.** `GEMINI_API_KEY` is empty in `.env.local`, so no live call has been made. Live calls used so far: **0 of 150**.

## What is built
- `AI_PROVIDER=gemini` adapter in `src/lib/ai/client.ts`, calling Google's Interactions API with a JSON schema for structured output.
- Model IDs confirmed in Google's docs on Nov 14: `gemini-3.5-flash-lite` (primary) and `gemini-3.1-flash-lite` (fallback). Both pages list image input and structured outputs as supported. Both IDs are environment variables: `GEMINI_MODEL_PRIMARY`, `GEMINI_MODEL_FALLBACK`. No Flash (non-Lite) model is used anywhere.
- On a 429 from the primary, the fallback is tried automatically. If both return 429 the API answers 429 with "Forge is busy, try again in a minute." and the page keeps what the student typed.
- Every request sent to a live model is appended to `logs/ai-calls.jsonl` with a running count. `AI_CALL_BUDGET=150` in `.env.local` stops calls before the 151st. A grounding retry is a second request, so it is counted.
- `RECORD_FIXTURES=1` saves each live response into `data/fixtures/` as `live-<hash>.json`.
- `store: false` is sent, so idea text and photos are not kept by Google's API.

## Checks
| Check | Result | Evidence |
| --- | --- | --- |
| The three M2 ideas each produce a valid plan from the live model | Not run | Needs the key. `npm run check:m2b` is ready |
| A photo of a hand sketch changes the live plan | Not run | Stand-in sketch at `data/samples/sketch-phone-stand.jpg` |
| Raw live output contains no dollar amounts | Not run | |
| A real scrap photo yields a sensible live draft | Not run | Needs the key and a real photo |
| The "Sample data" banner is gone in live mode | Not run | |

What is verified without the network (unit tests, `src/lib/ai/gemini.test.ts`, 6 tests): request shape, image part, fallback on 429, busy after two 429s, budget stop, call log count, schema reduced to keywords Google documents.

**Risk to know:** the request and response shapes come from reading the docs, not from a real response. The first live run may need a small fix.
