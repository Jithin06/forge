# Proposed changes to the eval cases

**Nothing here is applied.** `data/eval-cases.json` is unchanged. Approve, change or reject each line, and I will edit the file and wait for your word before running the eval.

Reminder of how a case is scored: the top route's space must be in the accepted set, and code puts routes that are open to the student ahead of ask-first ones. Two things changed that ordering:
- a 3D print work order at the Maker Space is now "Open to you" for every audience;
- the Maker Space is open to Viterbi undergraduates, and still ask first for everyone else.

## Existing cases

| Case | Audience | Accepted now | Proposed | Why |
| --- | --- | --- | --- | --- |
| phone-stand-wood | Viterbi undergrad | bfms | no change | The Maker Space is open to this student and sorts first whichever way it is built there |
| club-sign-acrylic | Other USC undergrad | bfms | no change | BME is not open; no other space lists a laser cutter |
| night-light | Viterbi grad | bfms, bme-innovation, ahmanson-lab | add **its-printing** | ITS prints by request and is open; a work order at the Maker Space is open too, so either can be first |
| pi-enclosure | Viterbi undergrad | bfms, bme-innovation, ahmanson-lab | add **its-printing** | Same reason: the box can be a staff-made print |
| cardboard-model | Other USC grad | bfms | no change | Laser cutting cardboard; the plan should say to bring your own |
| tiny-figurine | Viterbi undergrad | bfms | no change | Resin print by work order |
| plant-shelf | Other USC undergrad | bfms | add **roski-shops**, **iya-hall** | All three list woodworking and all three are ask first for this student, so the order is the model's |
| metal-bracket | Viterbi undergrad | bfms, bme-innovation | no change | The Maker Space is open and sorts first. Roski and Iovine and Young list metal work but are ask first |
| guitar-pedal | Other USC grad | bfms | no change, **but see the risk below** | Only the Maker Space and BME list soldering |
| podcast | Other USC undergrad | digital-creative-lab | add **ahmanson-lab** | Its equipment page lists studio and wireless microphones and an audio interface, and it is open |
| oral-history | Other USC grad | digital-creative-lab | add **ahmanson-lab** | Same |
| audio-drama | Other USC undergrad | digital-creative-lab | add **ahmanson-lab** | Same |
| tech-workshop | Other USC undergrad | ahmanson-lab | no change | |
| podcast-and-sign | Viterbi undergrad | digital-creative-lab, bfms | add **ahmanson-lab** | For the recording half |
| tote-bag | Other USC undergrad | none (no route is right) | **your call**: keep none, or accept sda-technical-theatre-lab | No space lists a sewing machine. The Dramatic Arts page names a Costume Shop but lists no equipment and does not say who may use it. I lean to keeping "none" |

### One risk to decide before running
**guitar-pedal:** the Ahmanson Lab is open to everyone and is tagged with the electronics capability because of its Arduino and Raspberry Pi kits. Its page lists no soldering iron. If the model sends this student there first, the case fails, and I think it should fail. If you would accept it, add ahmanson-lab.

## Proposed new cases

| Id | Idea | Audience | Accepted | What it tests |
| --- | --- | --- | --- | --- |
| research-poster | A printed poster of my research for a poster session, 36 by 48 inches, in color. I have the file ready and need one copy. | Other USC undergrad | its-printing, digital-creative-lab | A non-engineering idea with a real listed price |
| video-interview | A two-minute video interview with a professor for a class project. I need a camera, a microphone and a quiet place to film. | Other USC grad | ahmanson-lab, digital-creative-lab | Video, both spaces open |
| keychain-print | A small 3D printed keychain with my initials on it. Just one. | Other USC undergrad | bfms, its-printing, ahmanson-lab, digital-creative-lab | The work order must show "Open to you" for a non-Viterbi student, at the non-Viterbi price |
| grad-laser | A laser-cut plywood box with finger joints to hold my desk supplies, about shoebox size. | Viterbi grad | bfms, bme-innovation | The Maker Space route must read "Ask first" with the special-approval note, and the material line "Bring your own" |
| steel-sculpture | A small welded steel sculpture, about a foot tall, for an art class. | Other USC undergrad | roski-shops, iya-hall, bfms | Routing to a school shop that is ask first for everyone |
| stage-flat | A painted plywood flat, four by eight feet, as scenery for a student play. | Other USC undergrad | sda-technical-theatre-lab, roski-shops, iya-hall, bfms | A space with no listed equipment: the route should say to ask its staff |

That would make 21 cases: about 21 ask-free plan calls, and up to roughly 32 with look-agains at the current rate of 1.5 answers per plan.

## Checks I would add to the eval, if you agree
- A work-order route's badge is "Open to you" for all four audiences.
- A Maker Space route that the student runs themself never shows a Maker Space sheet price, only "Bring your own".
- No plan shows "Cheapest" on a route priced from the general table.
