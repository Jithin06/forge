# What the deck still needs from Jithin

Nothing here blocks this version. Each item says what to decide and which slide it changes.

## Before submitting

1. **Scrap approval (slide 4).** If your supervisor has approved giving leftovers away, delete "Proposed pilot." from the note under the third screenshot in `deck/index.html`. If not, leave it.
2. **Real scrap photos (slides 3 and 4).** The piece in the screenshots is the drawn stand-in, and the slides say "test piece". Post one real leftover as staff, then retake the scrap draft, claim and held screenshots, and the cost crop on slide 3.
3. **The plan screenshot has a model slip (slide 3).** The live plan says "staff operate the printer" about a laser cutter. It is the app's real output, so I left it. If it bothers you, make another live plan and run `PLAN=<new id> node deck/shots.mjs`.
4. **The live site (slide 7, QR code).** The QR code scans to `https://forge-beta-hazel.vercel.app`, which answers and lists eight spaces. It is in Google sign-in mode, so check that sign-in works there before judges try to claim scrap, and that plans come from a live model and not sample data.
5. **Maker Space training order.** The brief says Level 2 is the entry point. The app says Level 1 orientation comes first, and the plan on slide 3 shows Levels 1, 2 and 5 for the laser cutter. One of them is wrong. Fix the data if it is the app, then retake the plan crops.
6. **Your story (slide 2).** The slide works without one. If you have one true story from the desk, it goes in the spoken notes (`deck/notes.md`, slide 2), and can replace the first paragraph on the slide.
7. **The ask (slide 7).** Three lines in `deck/index.html` under `<ol class="asks">`. Change the wording freely.

## Numbers to recheck on the day

| On the slide | Source | Recheck |
| --- | --- | --- |
| "89 of 89 unit tests pass" (slide 5) | `RESULTS.md`, "Automated tests" | Code has changed since `RESULTS.md` was generated at 9:30 PM. Run `npm run results` and update the slide if the count moved. |
| "5 students claim at once, exactly 1 gets it" (slide 4) | `RESULTS.md`, "Race test" | Same. |
| "8 campus spaces are listed today" (slide 6) | Live query of the app's spaces list, Nov 14 | `RESULTS.md` says 4. Regenerating it should bring it to 8. |
| "None are confirmed yet" (slide 6) | Same live query | If real staff confirm anything, change the sentence. |
| "$0" and "about $6 new, estimated prices" (slide 3 screenshot) | Computed by the app from estimated prices | Retake if the Maker Space prices are corrected. |

## Left out on purpose, to add when measured

- **Eval score (slide 5).** Not run. When it has, put it in place of the unit-test figure, written with its base as `RESULTS.md` prints it.
- **Cost per plan (slide 6).** Not computed.
- **Pieces reused (slide 4).** 0 today.

## Small things

- Your line reads "MS Computer Science. Robotics Engineer at the Baum Family Maker Space." Change it on slides 1 and 7 if you prefer other wording.
- The repository link is not on the last slide. Add it if the repository is public.
- I could not test the QR code with a phone camera. A decoder read it correctly from the slide image.
