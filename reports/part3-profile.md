# Part 3. Profile

Done. Checked in a browser at 390 px against a fixture-mode production build with test sign-in; the full UI review at three widths is in `reports/part4-confirmations.md`.

## What was built
1. **Profile section at the top of My stuff**: name, "I am a..." and "I have...", each editable. Signed in, each change is saved to the account (`PATCH /api/me`) and the page says "Saved to your account." Signed out, My stuff no longer shows only a sign-in wall: it shows the profile, saves it in the browser, says "Saved in this browser.", and has a "Sign in to keep it" panel.
2. **Welcome step**: the first time someone opens the home page with no profile, they see "Welcome to Forge" with the two choices and "Continue to my idea". It is not shown again once both are chosen, in this browser or, when signed in, on the account. Signing in on a new browser brings the account's profile, so there is no welcome there either.
3. **Home page**: the two selectors are replaced by one line, for example "Viterbi undergrad, never built anything", with a "Change" link to the profile.
4. **Badges follow the profile without a reload**: every badge reads one shared profile store. The spaces list and space pages already did. The plan page did not: a plan's badges were fixed when it was made. Now the plan page asks the server for the same plan as seen by the current profile (`GET /api/plan/:id?audience=`), which recomputes badges, route order and the first-visit list only. Routes, steps, materials and costs are untouched. The band says "Badges are for: ..." with a Change link. A change made in another tab reaches open pages too.

## Decisions I made that you may want to change
- **Signing in keeps a profile edited while signed out.** If the profile was changed in this browser while signed out, sign-in carries name and choices to the account, also when the account already had a profile. If nothing was edited, the account's values win.
- **A shared plan link shows the viewer's badges**, not the author's, when the viewer has a profile.
- The welcome step shows only on the home page. Someone who lands first on Spaces still sees the "I am a..." chips there, as before.
- When signed out, the header still says "Sign in". The profile is reached from "Change" on the home page and on a plan.
- No database change was needed: the `profiles` table already had the three columns.

## Checks
- Browser walk-through, 18 of 19 printed checks passed; the one failure was a wrong selector in my script, and a later check in the same run confirms that line is on the page.
  - welcome shown once; Continue without choices explains what is missing; focus moves to the idea heading
  - reload does not ask again; home shows the one line and no selectors
  - signed out: change saved in the browser; plan badges in another tab changed from "Ask first, Ask first" to "Ask first, Not open to you" with no reload; spaces list followed
  - sign-in kept the browser profile on the account; a change while signed in was saved to the account
  - a second browser signed in to the same account showed no welcome
  - `PATCH /api/me`: 400 for an unknown audience, 401 when signed out
- 2 new unit tests: a plan re-seen by another audience equals a plan made for that audience, for every pair; only badges and order change.
- `npm test` 91 of 91; lint and typecheck clean.
- The walk-through signed in as the test student and changed that account's profile. Its name was put back to "Test Student"; its audience is now "Viterbi undergrad" and experience "never".

## Not checked
- Real Google sign-in carrying the profile (Google sign-in is not set up).
- Storage blocked (private mode): the code falls back to memory for the page view; not exercised in a browser.
