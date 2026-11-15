# Design system: trading desk

## Palette

- Ground: #0b0c0d. Panels: #111315. Raised row: #171a1d.
- Hairlines: #22262b (panel edges), #1a1d21 (row dividers).
- Text: #d8dde3 primary, #8b939c secondary. Secondary text is tinted from the ground, not pure grey, and meets 4.5:1 on panels.
- Accent (you, selection, the single live value): amber #e0a526.
- Up: #5fb37a. Down and errors: #d9534f. Used only on figures that moved, never as decoration.
- Selection: #26313d.

## Type

- IBM Plex Sans (self-hosted, OFL) for everything written: 400 body, 600 headings and labels.
- IBM Plex Mono (self-hosted, OFL) only for figures in tables and the ticker. Never as a "tech" costume.
- Figures always use tabular numerals.
- Body 13px, dense. Headings 11px uppercase with 0.08em tracking, set as panel labels. Display 28px for the verdict only.

## Structure

- No rounded cards. Panels are rectangles with a 1px hairline. Radius 2px on controls, 0 on panels.
- No shadows. Elevation is the hairline and the ground colour.
- Sections are separated by rules and a labelled header row, not by space alone.
- Lists and figures use ruled rows with right-aligned tabular numbers.

## Components

- Ticker: one bar across the top with the year, company vitals and the index as ruled cells. No progress bar. The year is the largest text.
- Tabs: text tabs on a ruled bar. The active tab has an amber underline.
- Buttons: ghost (hairline) by default. Primary is amber text on the ground, no filled colour block.
- Bars: a 2px line showing share or capability, not a rounded pill.
- Charts: a thin line in text colour, with the event labels set beside it.

## Motion

Only the year change: a short fade on the ticker figure. Everything respects prefers-reduced-motion.

## Focus and selection

Focus ring: 1px amber outline, 2px offset. Selection uses the selection colour above.
