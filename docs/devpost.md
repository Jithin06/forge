# Devpost description (first draft)

Follows SPEC.md section 9.3. Bracketed parts need Jithin. Numbers must be copied from `RESULTS.md` on the day of submission; the ones here are from the run on the evening of Nov 14, 2026.

## Forge

Tell Forge what you want to make. It finds where at USC you can make it, what it takes to get in, what it will cost, and what you can get for free.

Prototype: https://forge-beta-hazel.vercel.app
Code: https://github.com/Jithin06/forge

## The problem

[Jithin: two or three sentences in your own words, from working at the Maker Space. One student, one idea, where they got stuck. No statistics.]

USC has places to build things, but they belong to different schools and have different rules about who may use them, what training comes first and what materials cost. A student who has never built anything does not know the names of the tools, let alone which room has them. Meanwhile, usable offcuts are thrown away.

## What Forge does

A student describes an idea in their own words, adds a photo of a sketch if they have one, and answers up to three tap questions. Forge returns up to three ways to build it. Each one names a space, shows a badge saying whether that student may use it ("Open to you", "Ask first" or "Not open to you"), lists the trainings needed, estimates materials and cost, and shows free leftover material that matches. The plan ends with a "Your first visit" checklist. Space staff sign in to post leftovers from a photo, close out claims, correct their space's hours, access and prices, and confirm them, which turns "Estimated" into "Confirmed by staff".

## How it is built

One Next.js app (TypeScript, Tailwind CSS, shadcn/ui) holds the pages and the API. Supabase provides the Postgres database, sign-in and photo storage; row-level security is on for every table with no policies, so only the server can read or write. The AI provider is Google Gemini (`gemini-3.5-flash-lite`, falling back to `gemini-3.1-flash-lite` when rate limited). Every model answer is structured data checked with zod.

The model proposes; code verifies. The model reads the idea and suggests routes. Code decides eligibility, works out trainings and their prerequisites, adds up cost from stored prices, labels routes "Cheapest" and "Easiest for a first build", and matches scrap. A route that names equipment a space does not have is rejected and retried once. Claiming scrap is one database transaction, so two students cannot claim the same piece.

**Claude wrote the code, under Jithin's direction.** Jithin wrote the spec, made the product decisions and reviewed each milestone.

## What is measured

- 79 of 79 automated tests pass, including the ten AI safety cases in the spec.
- Race test: 5 simultaneous claims from 5 users on one item: 1 succeeded, 4 got ALREADY_CLAIMED.
- [Eval: not run yet. After `npm run eval`, write: "Top route in the accepted set: X of 15 test ideas. Badges correct: Y of Z." and say who wrote the cases.]
- Average tokens per plan call (10 live calls): 3197 in, 420 out. [Re-copy from RESULTS.md at submission.]
- Scrap pieces posted by real staff: 0. Picked up: 0.

## What is estimated

Four spaces are listed: the Baum Family Maker Space, the BME Innovation Space, the Ahmanson Lab and the Digital Creative Lab. **Every fact about all four is marked "Estimated"** and none has been confirmed by staff. Hours, equipment and training levels come from each space's official pages, read on Nov 14, 2026. The two Leavey Library spaces list very little on their pages, so Forge shows very little and tells students to ask. Access for the Maker Space is shown as "Ask first" for everyone because it has not been confirmed. **Material prices at the Maker Space are the coder's own unverified estimates**, labelled as estimates in the app. [Jithin: update this paragraph after you correct the data.]

Sign-in in the prototype [uses a test account picker / uses Google sign-in limited to usc.edu accounts: keep the one that is true at submission]. USC single sign-on is the production path.

## Challenges

- Keeping the AI from deciding things it must not decide. The fix was structural: the model has no field in which to state eligibility, training or price, and code rejects answers that mention a dollar amount or a tool the space does not have.
- Honest data. We could not confirm most facts in a weekend, so every group of facts carries an "Estimated" or "Confirmed by staff" label, and only a space's own staff can confirm.
- Building without a paid AI key. The whole app was built and tested against recorded sample answers first, with a visible "Sample data" banner, then connected to a live model.
- [Jithin: one challenge of your own.]

## What is next

- A pilot semester with the Maker Space and one intro course.
- USC single sign-on in place of Google sign-in.
- More spaces: each joins when its staff confirm one page of data.
- Training booking for the Maker Space, and a "Print Doctor" that reads a photo of a failed 3D print. Neither is built.

## Screenshots to attach
1. A plan (routes, badges, labels, free scrap).
2. The scrap bin.
3. The staff portal (the AI draft in the editable form).
