# What the deck still needs from Jithin

Nothing here blocks this version. Each item says what to decide and which slide it changes. Updated Nov 15.

## App bugs the screenshots show

I did not change app code or app data. These are for you to fix or accept.

1. **Scrap is matched by kind of material, not size (slide 3, step 4): the app no longer claims a saving.** `src/lib/compute/scrapMatch.ts` still compares the category only, so the free piece (about 8.5 x 11 in) is smaller than the line above it (12 x 24 in). The screen now says so honestly: the line reads "May be free with scrap", the cost stays at the price new, and under it "Could cost less with free scrap. Check the piece is big enough." The screenshot was retaken on Nov 15 and shows one piece tagged "Sample". In the pitch, say "a free piece to start from", not that the cost drops.
2. **The plan on slide 3 is older than the app's data.** It was made on Nov 14. It says "The space provides wood sheets" and "Ask the staff how to sign up". Since Nov 15 the Maker Space sells no material and training sign-up is by QR code. A new live plan would fix both. Each one costs 2 to 4 of the 10 model calls left in the local budget, so I did not make one.
3. **The same plan has a model slip.** "staff operate the printer", about a laser cutter. It is the app's real output, so I left it.
4. **A plywood sample item carries the warning "Do not laser cut PVC".** It would show in a retaken step 4.

## Before submitting

5. **The live site is in test sign-in mode.** `https://forge-beta-hazel.vercel.app` answered on Nov 15 with `auth_mode: "test"`. On Nov 14 it was in Google sign-in mode. In test mode every page carries a gold "Test sign-in" banner. Decide which mode judges should see, and check that plans there come from a live model and not sample data.
6. **Real scrap photos (slides 3 and 4).** No real photo of a real leftover is in the app. The ten sample items use generated images. The slides still show the drawn stand-in and say "test piece". Post one real leftover as staff, then retake the draft, claim and held screenshots.
7. **The confirm screenshot is cropped (slide 6).** I could not sign in as real staff, so the card shows only the top of the dialog, above the test-account paragraph. With a real staff sign-in the whole dialog can go back.
8. **The third ask (slide 7).** "Staff at other spaces and student clubs: confirm your page, post your leftovers." Today only the Maker Space can post scrap, and clubs have no page or account. It is worded as a request, so it is not a false claim, but be ready for the question.
9. **Maker Space training order.** The brief says Level 2 is the entry point. The app says Level 1 orientation comes first. The deck shows only what the app shows.
10. **Your story (slide 2).** The slide works without one. If you have one true story from the desk, it goes in the spoken notes.

## Numbers to recheck on the day

| On the slide | Source | Recheck |
| --- | --- | --- |
| "20/21" and "45 of 45" (slide 5) | `RESULTS.md`, "Eval", run on Nov 15 | If the eval is run again, use the new figures exactly as printed. |
| "125/125 automated checks pass" (slide 5) | `RESULTS.md`, "Automated tests"; `npm test` on Nov 15 | Run `npm test` after any code change. |
| "If 5 claim at once, exactly 1 gets it" (slide 4) | `RESULTS.md`, "Race test"; `scripts/race-test.mts` | Run `npm run race` if the claim code changes. |
| "8 campus spaces" and the names (slide 6) | The eight files in `data/spaces/` | Recount if a space is added. |
| "None are confirmed yet" (slide 6) | `RESULTS.md`, "Spaces listed" | If real staff confirm anything, change the sentence. |
| "$6" and "Estimated prices" (slide 3 screenshot) | 1 sheet times $6.00 in `data/typical-prices.json` | Retake if that price changes. |

Nothing was removed for being untraceable. One number was replaced: "89 of 89" is now "125/125".

## Left out on purpose

- **Cost per plan.** `RESULTS.md` says it is not computed.
- **Pieces reused.** 0 today.
- **The one eval miss.** The tote-bag idea should have had no route and got one. The slide says 20 of 21 and does not name the miss. Have it ready if asked.

## Small things

- Your line reads "MS Computer Science. Robotics Engineer at the Baum Family Maker Space." Change it on slides 1 and 7 if you prefer other wording.
- The repository link is not on the last slide. Add it if the repository is public.
- The QR code was read by a decoder library from the slide image. I did not test it with a phone camera.
