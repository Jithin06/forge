# Part 1. Plan quality

**Not finished.** The code, prompt, checks and data are done and tested. Two of the three live plans (phone stand, night light) have not been made on the final prompt: the provider returned 503 on both, and my next live run was refused by the permission system in this session. Live calls used in this part: **19 of 30** (call log lines 31 to 49).

## Route counts

| Idea | First run (first version of the new prompt) | Final prompt |
| --- | --- | --- |
| Phone stand | 1 route | **not measured** (503, then timeout) |
| Night light | 2 routes (Ahmanson Lab, Maker Space) | **not measured** (503, then timeout) |
| Club sign | 1 route | **2 routes** (Maker Space, BME), first attempt |

In the first run both single-route plans gave a reason that was wrong: they left BME out "because it is restricted to BME-affiliated students". The model is not supposed to judge who may use a space, and it had read that in the space's blurb. Three fixes followed, and the club sign then returned two routes:
1. The blurb is no longer sent to the model.
2. The prompt says a way may be left out only because the equipment cannot do the job or it ignores what the student asked for.
3. Code now notices when a space with the same kind of equipment was passed over, and asks the model once to add it or give an equipment reason. The second answer stands either way.

## What changed, by item

1. **Routes.** The model must first fill `ways_considered` (every space, every kind of equipment, each marked offered or left out with a reason), then return up to three routes. Code refuses: two routes with the same space and the same equipment; a single route without `single_route_reason`; fewer routes than the ways marked offered. The plan page shows the reason in a panel titled "Why there is only one way". 10 new unit tests cover this.
2. **Repeated explanations.** The model is told not to explain machines. The plan page now shows each tool's name, and its plain description from the space data only the first time that tool (or the same description) appears in the plan. Code decides this, so it holds for every plan.
3. **Invented details.** The prompt limits what may be said about a machine to its entry in the space data. `npm run check:quality` reads the live plans for the three ideas and fails if a step or warning matches a list of operating phrases (load the filament, set the power, press start and so on). It passed on every live plan that came back (26 lines read across 4 plans). RESULTS.md says this is enforced by the prompt and that check, not by code.
4. **Questions.** The check is now "a detailed idea is asked at most one question". Live: phone stand 0, night light 1, club sign 0 then 1.
5. **Ahmanson Lab.** I opened `polymathic.usc.edu/ahmanson-lab-equipment`, `/ahmanson-lab` and `/lab-space`. Added, all marked estimated: an Ultimaker S5 3D printer with its build size, Arduino and Raspberry Pi kits, a video camera, a photo camera, microphones and an audio interface; the workshop series; the sentence about staff lab hours. **There is no separate "Lab Hours" page**: the "Lab Equipment & Hours" link leads to the equipment page, which states no times, so no hours were added. The page does not say who may borrow equipment or how, so no training or booking facts were added. Computers, VR headsets, the drone and the EEG headset are named in the blurb only, because the vocabulary has no capability for them. The eval case `tech-workshop` stays, now supported by the workshop text on a page I opened. I also added the lab to the accepted sets of `night-light` and `pi-enclosure`; that is my judgment for you to check.
6. **Fixtures.** Fixture mode now reads recordings of the live model for all five ideas. The club sign, vague and blocked recordings are from the final prompt. **The phone stand and night light recordings are from the first run**, and the phone stand one carries the wrong single-route reason described above. One short live run replaces them.

## Other changes you should know about
- When the first Gemini model answers 5xx, the app now tries the fallback model, as it already did for 429. In this run the fallback was too slow for a plan and timed out at 30 seconds, so this did not rescue either plan.
- In fixture mode, an idea with a recording keeps its recorded plan even if different tap answers are chosen.
- Unit tests no longer read `data/fixtures/`. Their hand-written plans moved to `src/lib/test-data/`.
- `check:m2` compares audiences on the club sign now, and recomputes cost in the script instead of comparing to typed-in numbers.

## Checks run
- `npm test`: 89 of 89.
- `npm run check:m2` in fixture mode: all pass.
- `npm run check:quality` (live), last full run: 9 of 11. The two failures are "a live plan came back" for the phone stand and the night light.
- Lint and typecheck clean.

## A mistake of mine in this part
While writing this report, a shell quoting error ran four commands that were quoted in its text: a build, a server start (which failed, the port was in use), `check:quality` against a fixture-mode server, and `npm run results`. No live call was made (the log stayed at 49) and nothing was deleted. The fixture-mode run overwrote four rows of `reports/plan-quality.json`; I restored them from the printed output of the real run and the file says so. The check now stops at once if the server is in fixture mode.

## One complete live plan (club sign, final prompt)

Full JSON, with the raw model output: `reports/part1-live-example.json`.

**Idea:** An engraved acrylic sign with my club's name for our tabling booth, about 12 inches wide. We need one.

**Student:** Viterbi undergrad, never built anything. **Answers:** {"size": ["shoebox"], "quantity": ["one"], "demands": ["not_sure"]}. Model attempts: 1.

**Summary:** An engraved acrylic sign for a club tabling booth.

**Ways the model considered first** (not shown to students):

- ahmanson-lab: Laser cut acrylic sign. left_out: This space does not have a laser cutter.
- bfms: Laser cut and engrave acrylic sheet. offered: The space has a laser cutter and acrylic sheets.
- bme-innovation: Laser cut acrylic sign. offered: The space has a laser cutter for acrylic.
- digital-creative-lab: Laser cut acrylic sign. left_out: This space only has podcast studios.

### Way 1 of 2: Baum Family Maker Space  (ask_first; tags: easiest)

**Cut and engrave an acrylic sheet with a laser cutter**

This space has the laser cutter and acrylic sheets you need.

- Tools: Universal VLS6.75 laser cutter (Laser cutter (cuts flat sheets precisely))
- Training: Level 1: Orientation and safety
- Material: {"category": "acrylic", "material_id": "acrylic_sheet", "name": "Acrylic sheet (about 12 x 24 in)", "quantity_low": 1, "quantity_high": 1, "unit": "sheet", "unit_price_usd": 12, "low_usd": 12, "high_usd": 12}
- Cost: {"low": 12, "high": 12} (estimated prices)

Steps:
1. **Design the sign.** Draw your club name and sign outline in design software.
2. **Take the training.** Complete the required safety training for the laser cutter.
3. **Ask staff for help.** Ask the space staff to check your design file before cutting.

Watch out for:
- Fine text might be hard to read when engraved. Use a clear, bold font for your club name.

### Way 2 of 2: BME Innovation Space  (ask_first; tags: none)

**Cut and engrave an acrylic sign using a laser cutter**

This space provides a laser cutter to make your sign.

- Tools: Laser cutter (description not repeated)
- Training: General shop safety; Orientation; Laser cutter training
- Material: {"category": "acrylic", "material_id": null, "name": "Acrylic", "quantity_low": 1, "quantity_high": 1, "unit": "sheet", "unit_price_usd": null, "low_usd": null, "high_usd": null}
- Cost: null

Steps:
1. **Design the sign.** Create your club name layout in design software.
2. **Take the training.** Complete the required training for the laser cutter.
3. **Ask staff for help.** Ask the space staff to check your file and help you make the sign.

Watch out for:
- This space does not list materials. Ask staff what acrylic sheets to bring.

**Your first visit:**
- Go to Baum Family Maker Space, Ground floor, Science and Engineering Library. Listed hours: Monday to Friday 11 AM to 10 PM; Saturday 10 AM to 5 PM.
- Take the Level 1 orientation and safety training. It lets you use the non-powered hand tools.
- Take the training level for the tools you need: Level 2 for hand tools and handheld drills, Level 3 for power tools, Level 4 for electronics.

## Found while working, not changed
The Maker Space's **equipment** group is marked "Confirmed by staff" in the database, by forge-test-staff@usc.edu on Nov 14. No script of mine confirms equipment, and RESULTS.md at 6:45 PM showed nothing confirmed. I left it as it is. See NEEDS.md.
