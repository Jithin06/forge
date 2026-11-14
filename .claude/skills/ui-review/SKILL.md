---
name: ui-review
description: A pre-handoff review pass for web UI that checks each screen at phone and desktop widths, runs accessibility and copy checks, fixes problems, and reports. Use before reporting any UI work, milestone or demo as done.
---

# UI review

Run this before you tell the user that any work touching the interface is finished. Code that compiles is not the same as a screen that works, and you write UI without seeing it. This pass is how you see it.

## 1. Look at it

1. Start the app and list every route the change touched, plus the routes that link to them.
2. For each route, view it at 390 px, 768 px and 1280 px wide. If a browser or screenshot tool is available, take screenshots and actually inspect them. If none is available, say so in the report and reason from the markup and styles instead; do not claim to have looked.
3. At each width check:
   - Nothing overflows sideways. No horizontal scroll.
   - Text is not clipped, overlapping, or wrapping one word per line.
   - The primary action is visible without hunting.
   - Spacing is even; no doubled margins between sections.
   - Long real content (a 40-word description, a long name, a three-digit price) does not break the layout.

## 2. Use it

Walk each flow start to finish as a first-time user would:

- The happy path.
- Empty input, very long input, and input in the wrong format.
- A slow response and a failed response. Simulate both.
- Signed out, signed in, and signed in without permission, where the app has sign-in.
- Back button and page reload in the middle of the flow. The user's input should survive.

Every state should have a designed screen: loading, empty, error, partial, success, not allowed.

## 3. Keyboard and screen reader

- Tab through the page. Focus is always visible and moves in reading order.
- Every control works with Enter or Space. Dialogs trap focus and close with Escape.
- Each page has one h1 and headings that do not skip levels.
- Controls have accessible names; icons that act as buttons have labels.
- Run an automated accessibility scan (axe or the equivalent available in the project) on each route and fix every critical or serious issue.

## 4. Theme

If the project has a theme skill or token file, check against it:

- No color values typed into components; only tokens.
- Only the approved text and background pairings.
- Only the approved typeface and weights.
- Status shown with icon and words, not color alone.
- No logos or marks the project has no right to use.

## 5. Words

Read every string on the screen out loud, in order.

- Would a first-time user understand each one without help?
- Does every button say what happens when pressed?
- Is the same thing called the same name everywhere?
- Does every error say what to do next?
- Is every number labelled with its unit, and every estimate labelled as an estimate?
- Any leftover placeholder text, lorem ipsum, or TODO?

## 6. The generic check

Ask whether the screen could belong to any app. If it has identical shadowed cards everywhere, all-caps eyebrow labels, arrows on every link, numbered markers on non-sequences, or scroll animations on every section, remove them. Then look once more and remove one decoration that is not earning its place.

## 7. Fix, then report

Fix what you found, and re-check the screens you changed. Then report in this shape:

```
UI review: <what was reviewed>
Viewed at: 390 / 768 / 1280  (screenshots: yes or no)
Flows walked: <list>
Fixed: <short list>
Not fixed: <issue, why, and what it would take>
Accessibility scan: <tool, result>
```

Be exact about what you did and did not check. A review that says "looks good" without evidence is worth nothing to the person relying on it.
