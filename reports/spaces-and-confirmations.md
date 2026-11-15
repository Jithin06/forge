# Maker Space facts, real confirmations, staff privacy, more spaces, quieter "Estimated"

All eight items are done. The eval was not run. Live calls in this round: 31 (log lines 50 to 80 of the 150 cap).

## 1. Maker Space facts
- **Access:** Viterbi undergrad open; Viterbi grad ask first with your note; other USC ask first.
- **Trainings:** Level 4 and Level 5 each follow Level 2. Level 5 has no restriction. The laser cutter needs Level 5, so a laser route lists Level 1, 2 and 5. Level 3 is unchanged (after Level 1); see NEEDS.md.
- **3D printers:** all six are marked staff-operated with no training. The service "3D print work order" carries the form link, the three steps and the payment rule.
- **Prices:** read from the chart image on the prices page (last updated Feb 21, 2024). Thirteen printing materials now carry that page as their source. The chart has a separate, higher table for non-Viterbi students (Prusa only), so a material can now have a price per audience, and cost is computed for the student's audience. The five sheet materials keep my estimates.
- **Staff-made routes:** when every tool on a route is staff-operated, the route is `staff_fabrication`: no trainings, steps "Prepare the file", "Submit the work order", "Collect and pay" (the model's wording if it used those titles, otherwise the service's own steps), the request form linked on the plan, and a first-visit list made of the work-order steps. "Easiest for a first build" prefers such a route.
- All five status groups stay estimated.

## 2. Confirmations must be real
- The test account's confirmation of Maker Space equipment is gone (the space was re-seeded from its file).
- A confirmation by a test account shows as "Test confirmation" (white chip, flask icon) while test sign-in is on, and is ignored when it is off: the group reads as estimated.
- Tested both ways, twice: 6 unit tests, and `npm run check:confirmations`, which runs two copies of the same build (test mode and non-test mode) against the real database, confirms hours with the test staff account, reads both copies, then restores the stored status. 10 of 10 checks passed and the status is back to estimated.

## 3. Staff privacy
- Every read of a space goes through one function that removes who confirmed, and turns a price source of "staff (address)" into "staff". Only the state and the date go out.
- Test: a unit test, and the check above reads 11 public pages and API routes in each mode for "confirmed_by" and the staff address. None found.
- The dialog now says it will show to every student as "Confirmed by staff" with today's date, and "Your name is recorded but not shown." With a test account it adds that students will see "Test confirmation".

## 4. Live run
Six ideas, final prompt, last full run:

| Idea | Routes | Spaces |
| --- | --- | --- |
| Phone stand | 3 | Maker Space, Roski woodshop, Iovine and Young Hall |
| Night light | 2 | Ahmanson Lab, BME |
| Club sign | 2 | Maker Space, BME |
| Podcast | 2 | Digital Creative Lab, Ahmanson Lab |
| Research poster | 2 | ITS Printing, Digital Creative Lab |
| Video interview | 2 | Digital Creative Lab, Ahmanson Lab |

- **Model calls per plan: 1.5** on average in that run (9 answers for 6 plans; three plans were asked to look again because a space with the same equipment was passed over). One further request failed at the provider and was retried on the fallback model. Across all 13 plans made in this round the average is 1.31.
- 32 of 32 quality checks passed: no operating instructions, no repeated bracket explanations, no dollar amounts, at most one question for a detailed idea.
- The model varies between runs. The run before (same data, one prompt revision earlier) gave the phone stand 2 routes (laser at the Maker Space and BME) and the night light 3 (work orders at ITS and the Maker Space, plus Ahmanson).

### Why this took 31 calls, not 6
The six fixtures needed an ask and a plan each, and I ran the set twice plus the poster a third time, because the first runs exposed defects that needed a fix and a fresh recording:
1. A borrowed Maker Space price made a poster at the Digital Creative Lab look like $1. Borrowed prices now apply only to work the Maker Space also does.
2. A borrowed price could win "Cheapest". It no longer can.
3. A space that lists no trainings could win "Easiest". Unknown is no longer treated as zero.
4. The model guessed how to book, because it never saw each space's own first-visit steps. It sees them now and is told to say "ask staff" otherwise.
5. A poster was priced for 1 inch, not 48. The unit is now "inch of the longest side".

## 5. More spaces
Updated from official pages: BME (rooms, hours, equipment detail, the three training steps), Digital Creative Lab (production studio, plotters, 3D printer, podcast kit and hours, booking by email). Ahmanson Lab: the guide's leads were already covered.

Added, each from an official page I opened:
- **ITS Printing Services at Leavey**: plotters with real per-inch prices; 3D printing by request. Open to all.
- **Iovine and Young Hall maker spaces**: 3D printing, CNC, woodworking, welding. Ask first.
- **Roski sculpture studio and shared woodshop**: woodshop, metal shop, tool crib. Ask first.
- **Technical Theatre Lab (Scene Shop)**, Dramatic Arts: no equipment listed. Ask first.

Not added: Cinematic Arts (its pages mention no shop). The guide's "Garage" name is not on the Academy's page, so the space carries the page's name.

Home page chips: phone stand, night light, club sign, podcast, research poster, video interview. Each has a recorded fixture. The night light sample is the earlier recording, kept because it shows staff-made routes; its file says so.

## 6. Estimates where a page is silent
Each space other than the Maker Space carries an `estimates` block with the basis "typical for campus workshops": first-visit lines, a training note, a cost note. Every line says "likely" or "typically" (a test enforces this). On a plan they appear in gray with "Not from this space's page". Cost ranges at a space with no price list use the Maker Space's prices, labelled "typical campus price", with a sentence under the total. Hours, access and equipment are never estimated: unknown hours link to the space's page, unknown access is ask first.

## 7. Quieter "Estimated"
The gold chip is replaced by small gray text with an info icon. Tapping or pressing Enter opens a two-sentence explanation. "Confirmed by staff" stays the black and gold badge. Eligibility badges are unchanged.

## Checks
- `npm test`: 107 of 107 (16 new).
- `npm run check:quality` (live): 32 of 32.
- `npm run check:confirmations`: 10 of 10.
- `npm run check:m2` in fixture mode: all pass.
- UI review at 390, 768 and 1280 on a production build: 51 screens and 39 keyboard checks per width, 0 layout breaks. axe-core found one real issue (gray date text on a hovered gold card in My stuff), fixed and re-checked: 0 violations.
- Lint and typecheck clean. Test pieces and plans removed.

## Not checked, and known weak points
- The recorded poster plan tells the student to save the file as a PDF, which no page states. The prompt forbids naming file types; the small model did it anyway.
- The final phone stand recording uses "solid wood", which the Maker Space does not list, so that plan shows "Ask staff for prices" on all three routes.
- I did not open the pages behind the guide's own links; I searched for each official page myself.
- Real Google sign-in, a real screen reader and a real phone remain unchecked.
