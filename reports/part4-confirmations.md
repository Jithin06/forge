# Part 4. Confirmation steps, and the final UI review

Done. Every one of the seven actions now opens a step that says what will happen, with a confirm button named for the action and a cancel button named for staying put. No other action gained one.

## The seven

| Action | Title | Buttons | What it says |
| --- | --- | --- | --- |
| Student claims a piece (scrap page and inside a plan) | Claim this piece? | Claim this piece / Not now | The piece by name; held for 48 hours; where to pick it up and the pickup note; what happens if it is not picked up; that it can be cancelled under My stuff |
| Student cancels a claim | Cancel your claim? | Cancel my claim / Keep my claim | The piece goes back in the bin at once; cannot be undone; can be claimed again if still there |
| Staff publish a piece | Publish this piece to the scrap bin? | Publish to the scrap bin / Keep editing | Title and material; visible to every student at once; can be taken out from the Claims tab |
| Staff mark picked up | Mark this piece as picked up? | Mark as picked up / Not yet | Piece and student; ends the hold, removes it for good, adds one to the reuse count; cannot be undone here |
| Staff release a hold | Release this hold? | Release the hold / Keep the hold | Piece and student; back in the bin for anyone; the student is not told |
| Staff remove a piece | Remove this piece from the bin? | Remove from the bin / Keep it in the bin | No longer shown; cannot be undone; would need posting again |
| Staff confirm a group of facts | Confirm hours for Baum Family Maker Space? (per group) | Confirm hours / Do not confirm | "This will show as "Confirmed by staff" to every student, in place of "Estimated", under your name (email) and today's date (date)." Confirm only what you have checked. Unsaved changes are not included |

## Keyboard and screen reader
One shared component, a native modal dialog with the alertdialog role, named by its title and described by its text.
- Focus moves into the dialog, onto the cancel button (the safe choice).
- Tab and Shift+Tab stay inside.
- Escape cancels. So does a tap outside the dialog.
- Focus returns to the button that opened it. When that button no longer exists after the action (a claimed piece, a removed row, a published draft), focus goes to the result message instead, which is also announced.
- While the action runs, both buttons are disabled and Escape does nothing, so it cannot be sent twice.

All of this was checked with real key presses in Chrome, for all seven, at each width: 121 keyboard checks, 0 failed. After every Escape the script also checked that nothing had changed.

## Things you should know
- **The "Confirm" dialog was opened and cancelled only. I confirmed nothing.**
- **The student page shows "Confirmed by staff on (date)" without the staff member's name.** The name (email) is stored and is returned by the public spaces API. The dialog uses your wording, "under your name". Say if you want the name on the chip too, or the dialog reworded.
- **Signed out, pressing "Claim this piece" goes to sign-in first**, then comes back and opens the confirmation. Before, the claim completed by itself on return; now nothing is claimed until it is confirmed.
- Two bugs found and fixed by the first run: closing the confirmation also closed the item sheet behind it; Tab could leave the dialog for the browser's own controls.
- Also fixed: a doubled full stop after a warning or step title that already ended in one.

## UI review

```
UI review: every screen and state touched in Parts 1 to 4
Viewed at: 390 / 768 / 1280  (screenshots: yes)
Flows walked: first visit welcome (empty, then filled) -> home -> empty submit;
  idea -> questions -> waiting -> plan (vague, one route with reason, two routes);
  claim from a plan; spaces list and two space pages; scrap -> item sheet ->
  claim confirmation -> claimed -> My stuff -> profile edit (signed out and
  signed in) -> cancel confirmation -> cancelled; sign-in; staff gate, post,
  draft, publish confirmation, published, claims, remove / picked up / release
  confirmations, space info, confirm-facts confirmation; three not-found pages
Fixed: item sheet closed with the nested confirmation; Tab left the dialog;
  doubled full stop on plan warnings
Not fixed: none found
Accessibility scan: axe-core on every step except the waiting screen,
  including each open dialog: 0 violations
```

41 screens per width (40 at 768 and 1280, where the publish dialog is looked at once), 121 in all, 0 layout breaks. Production build, fixture mode, test sign-in. Screenshots: `reports/final/`.

**Not checked:** a real screen reader (roles, names and focus were checked, not speech); a real phone; storage blocked; the load-failure states; real Google sign-in. In fixture mode the phone stand sample still shows the wrong single-route reason described in Part 1.

Test pieces, photos and plans made by the review were removed with `npm run clean:test`. No live AI calls were made in Parts 2 to 4; the log is at 49.
