# Pitch deck: first draft

```
Deck: deck/out/forge-deck.pdf  (6 slides, 0.38 MB)
Headlines:
  1. New builders have ideas, but no map of where to build.
  2. Describe your idea. Forge shows where to build it and the cost.
  3. The model proposes. Code decides access, training, cost and labels.
  4. Each space's own staff keep its page true, in minutes.
  5. Four spaces are listed today, and every fact is labelled.
  6. We ask for one pilot semester.
Numbers used and their source lines in RESULTS.md:
  - "79 of 79 tests pass" (slide 3): "79 of 79 unit tests pass, in 10 of 10 files"
  - "0 pieces reused so far" (slide 5): "Picked up (the impact counter, counted in SQL over all items): 0"
  - "Four spaces", all "Estimated" (slide 5): the "Spaces listed" table, all four rows "none" confirmed
  - Inside the screenshots (slide 2): "$7 to $8, estimated prices" and "$1 to $2" are computed by the app from the coder's estimated prices
Estimated data shown and how it is labelled:
  - Slide 2 screenshot: the app's own words "estimated prices"; caption "Real screens, sample data."
  - Slide 5: a gold "Estimated" chip on each space
Viewed slide PNGs: yes, all six, after each rebuild
Open questions for the presenter: see below
```

Word count: 208 (budget 220). Every headline is 12 words or fewer and at most two lines. No text under 26 px. Nothing outside the safe margins. Source Sans 3 at 400, 600 and 700, loaded from a local package. Speaker notes: `deck/notes.md`, 287 words plus two parts for Jithin, timed to 3:00.

Rebuild with `node deck/build.mjs`. Retake screenshots with `node deck/shots.mjs` (needs a test-mode server on 3123 and a google-mode server on 3124).

## Open questions for the presenter
1. **Slide 1 has no story.** The skill says to tell one specific true story and not to fill the gap, so the slide shows a dashed box asking for yours. The deck cannot be submitted with that box.
2. **Slide 3 says "Live-model eval: not run yet."** Once `npm run eval` has run, replace the hero with the eval score and its case count, exactly as `RESULTS.md` prints it.
3. **Slide 2's screenshots show sample data**, and say so. Retake them once the app is on a live model, and with a real photo of a real offcut instead of my drawn stand-in.
4. **Slide 4 has no cost per use.** The skill asks for a measured one; none exists until a live model has run.
5. **Slide 5's reuse counter is 0.** It is true. If real pieces are posted and picked up before submission it will rise; if not, consider leading the slide with the spaces and dropping the number.
6. **Slide 6:** is `github.com/Jithin06/forge` public? If not, remove it. Do you want anything else in the ask?
7. Your name appears as "Jithin". Add a surname if you want one.

Not done from the skill's checklist: I did not view the PNGs at 25 percent size to judge legibility at arm's length, and no appendix slides were made.
