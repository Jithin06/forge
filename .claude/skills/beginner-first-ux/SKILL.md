---
name: beginner-first-ux
description: UX and copy rules for mobile-first apps used by first-time, non-expert users, including AI result screens. Use when designing or building any screen, form, flow, empty or error state, or writing interface text.
---

# Beginner-first UX

Use this whenever you build a screen or write words a user will read. The user to design for is someone doing this for the first time, on a phone, standing up, slightly unsure they belong here. If it works for them it works for everyone.

## The five-second test

Before building a screen, write one sentence: "On this screen the user wants to ___, and the one thing we want them to tap is ___." If you cannot fill both blanks, the screen is doing too much. Split it.

## Layout

- Design at 390 px wide first, then widen. On desktop, keep content in a column no wider than about 680 px; do not stretch cards across the monitor.
- One primary action per screen, visually the strongest thing on it. Everything else is secondary or a plain link.
- Put the answer first. On a result screen the top third must already answer the user's question; details follow.
- Tap targets are at least 44 by 44 px with 8 px between them. Primary actions sit within thumb reach at the bottom on phones.
- Show three to five options, not twelve. Hide the rest behind "Show more".
- Lists the user compares get one consistent row shape. Do not vary card layouts for decoration.

## Asking for input

- Ask in the user's words, not the system's. "What do you want to make?" beats "Select fabrication process".
- Prefer tapping to typing. Offer choices as large chips and always include "Not sure".
- Never ask for something you can infer or look up, and never ask for the same thing twice. Remember choices in the browser.
- Every field has a visible label above it. Placeholders are examples, not labels.
- Give examples the user can tap to fill the box. A blank box is intimidating.
- Do not put a login wall in front of value. Ask for sign-in at the moment it is needed, say why in one line, and return the user to exactly where they were.

## Words

Write like a friendly expert standing next to the user.

- Short sentences. Common words. Sentence case. No exclamation marks, no emoji.
- The first time a technical term appears, follow it with a plain explanation of eight words or fewer: "laser cutter (cuts flat sheets very precisely)".
- Buttons say what happens: "Find how to build it", "Claim this piece". Never "Submit" or "OK". The same action keeps the same name everywhere.
- Tell people what to do next, not just what is true. "Level 2 training needed" becomes "Take the 30-minute Level 2 training first. Sign up at the front desk."
- Numbers come with units and honesty: "about $4 to $9, estimated prices".

| Instead of | Write |
| --- | --- |
| Invalid input | Tell us a bit more. One sentence is enough |
| Unauthorized | Sign in with your school account to claim this |
| No results | Nothing matches yet. Try describing it differently |
| Access: restricted | Not open to you. Here is who to ask |
| Processing... | Checking which spaces have what you need |

## Waiting on AI

An AI call takes several seconds, and a spinner alone feels broken.

- Show a skeleton shaped like the result, with a plain status line that changes every couple of seconds and describes real steps.
- Disable the submit control and keep the user's input visible.
- After about 20 seconds, say it is taking longer than usual and offer "Keep waiting" and "Try again".
- On failure, keep everything the user typed. One sentence on what happened, one button to retry.

## Showing AI results

- Lead with the recommendation, then the reason in one or two sentences. Users trust a result they can see the reason for.
- Separate what is known from what is estimated, visibly. Label estimates as estimates next to the number, not in a footnote.
- Never show a figure the system did not compute or look up.
- Give the user a way to correct the system: "Change my answers" or "That's not what I meant".
- If the system cannot help, say so plainly and name a person or place that can.

## States every screen needs

Build these with the screen, not afterwards:

1. **Loading** as above.
2. **Empty:** a sentence on why it is empty and a button for the obvious next step.
3. **Error:** what happened, what to do, input preserved.
4. **Partial:** some data missing. Show what you have and mark what is missing.
5. **Success:** confirm in the same words as the button ("Claimed"), then say what happens next and by when.
6. **Not allowed:** say why and who to ask. Never a dead end.

## Accessibility floor

- Text contrast at least 4.5 to 1; control edges and essential icons at least 3 to 1.
- Everything works by keyboard, with a visible focus ring, in a sensible order.
- Status is never shown by color alone; add an icon and words.
- Form errors are tied to their field and announced. Results that appear after a wait are announced to screen readers.
- Body text 16 px or larger; inputs 16 px so phones do not zoom.
- Respect the reduced-motion setting. Use motion only to show what changed after the user acts.
- Images that carry meaning have alt text; decorative ones have empty alt.

## Things that make an interface feel generic

Avoid these unless the content truly calls for them:

- Every section wrapped in an identical rounded card with the same shadow.
- All-caps, letter-spaced labels above headings.
- Numbered markers (01, 02, 03) on things that are not a sequence.
- Arrows appended to every link and button.
- Fade-and-slide animations on every section as it scrolls in.
- A hero made of a big number, a small label and a gradient.
- Filler copy that sells instead of explains.

## Before you finish a screen

- [ ] The five-second sentence still describes the screen.
- [ ] One primary action.
- [ ] All six states exist.
- [ ] No unexplained jargon.
- [ ] Works at 390 px with one thumb.
- [ ] Works by keyboard.
