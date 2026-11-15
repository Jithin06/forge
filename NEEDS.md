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
