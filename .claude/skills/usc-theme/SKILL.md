---
name: usc-theme
description: USC cardinal-and-gold design tokens, type, contrast and trademark rules for web UI. Use whenever building or restyling any page or component for a USC student project, or when asked for USC colors, a Trojan theme, or styling.
---

# USC theme

Use this before writing or changing any UI. It gives one palette, one typeface, the pairings that are safe, and the lines a student project must not cross.

## Why these rules

USC's identity is two colors and type, used with restraint. The university publishes exact values and which combinations are allowed, mostly for accessibility. A student project should feel unmistakably USC by following those rules, and must not look like an official USC product, because the marks are restricted to official university business. So: borrow the colors and the discipline, never the logos.

Values below come from identity.usc.edu (color and typography pages, read November 2026). Contrast ratios are computed with the WCAG formula.

## Tokens

Define these once as CSS variables in the global stylesheet and reference them everywhere. Never type a hex value in a component.

| Token | Hex | Use |
| --- | --- | --- |
| `--cardinal` | `#990000` | Primary buttons, links, key headings, active tab |
| `--cardinal-pressed` | `#7A0000` | Hover and pressed state of cardinal controls |
| `--gold` | `#FFCC00` | Highlights, the "free" and "cheapest" accents, focus ring on dark |
| `--gold-soft` | `#FFF2BF` | Highlighted card or row background |
| `--black` | `#000000` | Body text and headings |
| `--white` | `#FFFFFF` | Page and card background |
| `--gray-text` | `#767676` | Secondary text on white, input borders |
| `--gray-line` | `#CCCCCC` | Dividers and card borders only |

USC's rules that shape this table:

- Cardinal may be darkened (10, 20 or 30 percent black) but never lightened. Do not invent a pink or rose tint of cardinal for backgrounds.
- Gold may be lightened (75, 50 or 25 percent) but never darkened. `--gold-soft` is the 25 percent tint. `#FFE680` (50) and `#FFD940` (75) are also allowed.
- Cardinal and gold carry equal weight. Do not let the page become all red with one yellow dot; give gold real jobs.
- Gradients are not needed. Use flat color.

If the project uses Tailwind with shadcn/ui, map these variables onto the semantic tokens the installed version expects (primary, primary-foreground, accent, muted, border, ring). Check the current shadcn theming docs for the exact variable names rather than assuming them.

## Safe and unsafe pairings

| Text | Background | Ratio | Verdict |
| --- | --- | --- | --- |
| White | Cardinal | 8.9 | Use for primary buttons |
| Cardinal | White | 8.9 | Use for links and headings |
| Gold | Cardinal | 5.9 | Fine for large text and icons |
| Cardinal | Gold | 5.9 | Fine |
| Black | Gold | 13.9 | Use for gold badges |
| Gold | Black | 13.9 | Use for dark badges |
| Black | Gold soft | 18.7 | Use for highlighted rows |
| Cardinal | Gold soft | 7.9 | Fine |
| Gray text | White | 4.5 | Only for secondary text at 14 px or larger |
| Gold | White | 1.5 | Never. Gold is not a text color on white |
| White | Gold | 1.5 | Never |
| Black | Cardinal | 2.4 | Never |
| Cardinal | Black | below 3 | Never |
| Gray text | Gold soft | 4.1 | Never; use black |
| Gray line | White | 1.6 | Decorative only; not for input borders |

When in doubt, compute the ratio. Body text needs 4.5, large text and essential icons need 3.

## Typography

USC's sans is National 2, which a student project cannot license for the web. USC names Source Sans 3 as the digital substitute, so use it for everything.

- Load Source Sans 3 from Google Fonts through the framework's font loader. Weights 400, 600 and 700 only. USC's identity excludes light and extra-bold weights and all condensed widths.
- One family. No second display face and no monospace; for dimensions and prices turn on tabular numerals instead.
- Scale (px): 15 secondary, 16 body, 18 lead, 22 card title, 28 page title, 40 hero on phones and up to 56 on desktop. Line height 1.5 for body, 1.15 for titles.
- Sentence case everywhere. No all-caps labels and no letter-spaced eyebrows.
- Keep line length under about 70 characters.

## Marks: what never to use

- No USC shield, monogram, seal, Trojan head, "SC" interlock, or the "USC" letters styled as a logo.
- Do not set the project's name in a Caslon-style serif next to cardinal and gold; that imitates USC's logotype system.
- Plain text such as "for USC students" is fine.
- Every page footer carries a line like "Student project. Not an official USC service."

## Status without red and green

Cardinal is already the brand color, so it cannot also mean "error", and green is outside the palette. Encode status with shape, icon and words, using only the tokens above:

| Meaning | Style |
| --- | --- |
| Positive ("Open to you", "Confirmed by staff") | Black fill, gold text, check icon |
| Caution ("Ask first", "Estimated") | Gold fill, black text, question icon |
| Negative ("Not open to you", "Full") | White fill, gray-text border and text, slash icon |
| Free or best value | Gold-soft row with a solid gold left edge, black text |
| Error message | Black text, cardinal 4 px left edge, alert icon, a sentence saying what to do |

Every badge has text. Color alone never carries meaning.

## Component recipes

- **Primary button:** cardinal fill, white 600-weight text, 12 px radius, 48 px tall on phones. Hover and pressed use `--cardinal-pressed`. One primary button per screen.
- **Secondary button:** white fill, 1.5 px cardinal border, cardinal text.
- **Link:** cardinal, underlined. Do not rely on color alone for links inside text.
- **Card:** white, 1 px `--gray-line` border, 12 px radius, no shadow or `shadow-sm` at most. Do not put every piece of content in an identical card; reserve cards for things the user compares or taps.
- **Input:** 1 px `--gray-text` border (the lighter gray fails contrast for control edges), 16 px text so phones do not zoom, label above.
- **Focus ring:** 2 px black outline with 2 px offset on light surfaces; 2 px gold on cardinal or black surfaces. Never remove outlines.
- **Spacing:** multiples of 4 px; 16 px page gutter on phones, 24 px between sections.

## One signature detail

Pick a single motif from the project's subject and use it in one place only. For a workshop or maker tool, a thin strip of ruler tick marks in gold along the top edge of the main result card works, drawn with a repeating CSS gradient. Do not repeat it on every card.

## Before you finish

- [ ] No hex values outside the token file.
- [ ] No gold text on white, no black on cardinal, no tinted cardinal.
- [ ] Only Source Sans 3 at 400, 600, 700.
- [ ] No USC marks; footer disclaimer present.
- [ ] Every status has an icon and words.
- [ ] Gold has a real job on the screen, not just a hairline.
