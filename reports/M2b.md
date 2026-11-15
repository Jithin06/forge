# M2b. Live AI on Gemini

All M2b checks that can run now pass on the live model. Live calls used: **18 of 150** (17 answered, 1 rejected). The limit you set for this step was under 20.

## Checks
`BASE=http://localhost:3123 npm run check:m2b`, against a local server with `AI_PROVIDER=gemini`.

| Check | Result | Evidence |
| --- | --- | --- |
| The three M2 ideas each produce a valid plan from the live model | Pass | Phone stand, night light and club sign each returned 201, passed zod and grounding, and came back with `fixture: false`. Each plan had one route, at the Maker Space |
| A photo of a hand sketch changes the live plan | Pass, weakly | Same text, with and without the stand-in sketch. Without: power tools and hand tools, plywood. With: the laser cutter, plywood. The sketch's handwritten "clear acrylic" did not change the material; the text said wood and the model followed the text. The sketch is a drawing I made, not a real hand sketch |
| Raw live output contains no dollar amounts | Pass | 4 raw outputs scanned, 4,360 characters |
| A real scrap photo yields a sensible live draft | **Not run** | Left out to stay under 20 calls, and there is no real photo yet |
| The "Sample data" banner is gone in live mode | Pass | Every response carries `fixture: false`, which is what hides the banner. Not looked at in a browser in live mode |

## What the first real responses turned up, and the fixes
1. **Gemini rejected the plan schema** (HTTP 400, "schema produces a constraint that has too many states"). Nested arrays with length limits were the cause. The schema sent to Gemini now carries structure and enums only; the prompt states the limits and zod still enforces them on the reply. This cost 1 rejected call.
2. **Two plans needed a retry** because a route had fewer than 3 steps. The prompt now says so explicitly. Retries now log their reason on the server. No retry since.
3. **Every idea was asked "When do you need it?"**, though nothing in the space data lets a deadline change the route or cost. The model is now told to ask it only when the student mentions a date or sounds urgent. After the fix the detailed phone stand idea is asked 1 question (what it must handle); the M2 target of 0 questions for a detailed idea is **not yet met live** for that idea.
4. **Steps were machine operating instructions**, and a warning invented a detail about a lid lock (see "before" below). The prompt now forbids both in specific terms. The "after" example below is the result.
5. Response format: the reply shape matched what I had read in the docs, so the adapter needed no change beyond the schema.

Tokens, from the call log: plan calls average 3197 in and 420 out (10 calls); ask calls average 3105 in and 273 out (6 calls). No rate limit (429) was hit, so the fallback model has not been exercised live.

## One complete live example

Model `gemini-3.5-flash-lite`, first attempt, after the prompt fixes. Saved in full, with the earlier version, in `reports/m2b-live-example.json`.

**Idea text** (audience: Viterbi undergrad; experience: never built anything)

> An engraved acrylic sign with my club's name for our tabling booth, about 12 inches wide. We need one.

**What the ask step returned for it:** summary "You want to make an engraved acrylic sign for your club's tabling booth."; answers read from the text: {"size": ["shoebox"], "demands": ["looks"], "quantity": ["one"]}.

**Raw model output**

```json
{
  "needs": [
    {
      "why": "To cut and engrave the acrylic sheet.",
      "capability": "laser_cutting"
    }
  ],
  "routes": [
    {
      "steps": [
        {
          "title": "Design the sign",
          "detail": "Draw your club name using design software."
        },
        {
          "title": "Take training",
          "detail": "Complete the required safety training for the laser cutter (cuts flat sheets very precisely)."
        },
        {
          "title": "Ask staff to check",
          "detail": "Have staff review your digital file before cutting."
        },
        {
          "title": "Make the sign",
          "detail": "Use the laser cutter (cuts flat sheets very precisely) to cut and engrave your acrylic sheet."
        }
      ],
      "process": "Cut and engrave an acrylic sheet using a laser cutter (cuts flat sheets very precisely).",
      "space_id": "bfms",
      "warnings": [
        {
          "fix": "Use a bold font for your club name.",
          "issue": "Fine text may be hard to read on clear acrylic."
        }
      ],
      "materials": [
        {
          "unit": "sheet",
          "category": "acrylic",
          "material_id": "acrylic_sheet",
          "quantity_low": 1,
          "quantity_high": 1
        }
      ],
      "fit_reason": "The laser cutter handles acrylic sheets easily and creates clean engraved text.",
      "equipment_ids": [
        "laser_vls675"
      ]
    }
  ],
  "summary": "An engraved acrylic sign for a club tabling booth.",
  "clarifying_question": null,
  "not_supported_reason": null
}
```

**Final computed plan** (everything below except the model's own words was added by code)

```json
{
  "summary": "An engraved acrylic sign for a club tabling booth.",
  "audience": "viterbi_undergrad",
  "routes": [
    {
      "space_id": "bfms",
      "space_name": "Baum Family Maker Space",
      "space_location": "Ground floor, Science and Engineering Library",
      "equipment": [
        {
          "id": "laser_vls675",
          "name": "Universal VLS6.75 laser cutter",
          "plain_name": "Laser cutter (cuts flat sheets precisely)"
        }
      ],
      "process": "Cut and engrave an acrylic sheet using a laser cutter (cuts flat sheets very precisely).",
      "fit_reason": "The laser cutter handles acrylic sheets easily and creates clean engraved text.",
      "steps": [
        {
          "title": "Design the sign",
          "detail": "Draw your club name using design software."
        },
        {
          "title": "Take training",
          "detail": "Complete the required safety training for the laser cutter (cuts flat sheets very precisely)."
        },
        {
          "title": "Ask staff to check",
          "detail": "Have staff review your digital file before cutting."
        },
        {
          "title": "Make the sign",
          "detail": "Use the laser cutter (cuts flat sheets very precisely) to cut and engrave your acrylic sheet."
        }
      ],
      "warnings": [
        {
          "issue": "Fine text may be hard to read on clear acrylic.",
          "fix": "Use a bold font for your club name."
        }
      ],
      "eligibility": {
        "status": "ask_first",
        "note": "The Maker Space says it is for Viterbi undergraduates. Confirm at the front desk."
      },
      "trainings": [
        {
          "id": "level_1",
          "name": "Level 1: Orientation and safety",
          "how_to_sign_up": null,
          "restricted_to": null
        }
      ],
      "cost_lines": [
        {
          "category": "acrylic",
          "material_id": "acrylic_sheet",
          "name": "Acrylic sheet (about 12 x 24 in)",
          "quantity_low": 1,
          "quantity_high": 1,
          "unit": "sheet",
          "unit_price_usd": 12,
          "low_usd": 12,
          "high_usd": 12
        }
      ],
      "total": {
        "low": 12,
        "high": 12
      },
      "prices_estimated": true,
      "scrap": [
        []
      ],
      "with_scrap": {
        "low": 12,
        "high": 12
      },
      "labels": []
    }
  ],
  "first_visit": [
    "Go to Baum Family Maker Space, Ground floor, Science and Engineering Library. Listed hours: Monday to Friday 11 AM to 10 PM; Saturday 10 AM to 5 PM.",
    "Take the Level 1 orientation and safety training. It lets you use the non-powered hand tools.",
    "Take the training level for the tools you need: Level 2 for hand tools and handheld drills, Level 3 for power tools, Level 4 for electronics."
  ],
  "clarifying_question": null,
  "not_supported_reason": null,
  "none_open": true
}
```

**Before the prompt fix, the same idea got these steps:**

- Design the sign: Draw your club name in design software for the laser cutter (cuts flat sheets very precisely).
- Prepare the machine: Place the acrylic sheet inside the laser cutter and focus the beam.
- Run the job: Start the machine to engrave your text and cut out the sign.

and this warning: Laser cutting creates fumes. Fix: Wait for the lid to unlock before opening.

## For you to judge
- The route, equipment and material are right and all ids are real. Cost is $12 from my estimated acrylic price; the badge is "Ask first" because Maker Space access is unconfirmed.
- Only one route was offered for each of the three ideas. The hand-written samples had two or three.
- The plain-language explanation "(cuts flat sheets very precisely)" is repeated in three places instead of once.
- "Take training" names no level; code adds "Level 1: Orientation and safety" beside it.
- The first-visit list still carries the space's generic step about Levels 2 to 4, which this route does not need.

## Not done
- The hand-written fixtures have not been replaced by recordings (SPEC 4.1). Live answers are saved in `data/fixtures/recorded/` and are not loaded by fixture mode; see `data/fixtures/README.md`.
- The live site is still on sample data until its Vercel settings change.
