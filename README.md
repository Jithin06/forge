# Forge

Tell Forge what you want to make. It finds where at USC you can make it, what it takes to get in, what it will cost, and what you can get for free.

Built for the AI@USC Hackathon, November 14 to 15, 2026. The code was written by Claude under Jithin's direction. `SPEC.md` is the source of truth for what is built.

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

## Checks

| Command | What it checks |
| --- | --- |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm run build` | Production build |
| `npm run check:rls` | The public key cannot read any table, call the claim function or upload photos |
| `npm run check:secrets` | No server secret in the client bundle or in git (run after a build) |

## Layout

See section 4 of `SPEC.md`.
