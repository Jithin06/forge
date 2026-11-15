# Part 2. Restyle

Done in commit `2ccd0a3`, before this four-part instruction arrived, and checked again at the end of Part 4 (see `reports/part4-confirmations.md` for the final UI review).

- Every screen and state follows `design/forge-design-reference.html` and the "Visual energy" section of the usc-theme skill: the cardinal pegboard band, 2 px black outlines with hard shadows, build tickets for routes with a ruler strip and a cost stub, gold claim buttons, rotated tags, one black band for the reuse counter.
- No sample text or numbers were copied from the reference.
- No live AI calls; fixture mode throughout.

## Changes that go past colour and shape
Say if you want any of these reverted.
- Home has a three-step "How it works" list and a "Free right now" strip of what is in the scrap bin (hidden when the bin is empty).
- On a plan, "Watch out for" and "Steps" fold under "See the steps": open on the first route, closed on the others.
- The scrap material filter is a row of chips, not a dropdown.
- Scrap cards carry a gold "See and claim" button that opens the same item sheet as before.
- Free pieces on a space page link to the scrap bin filtered to that space.
- Skeletons no longer pulse, because the theme allows three motions only.

## Review at that commit
28 screens per width at 390, 768 and 1280 on a production build: 0 layout breaks, 0 axe-core violations. One fix: the scrap filter row overflowed sideways at 390. Screenshots: `reports/restyle/`.
