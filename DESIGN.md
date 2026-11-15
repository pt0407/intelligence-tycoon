# Design system: liquid glass

## Ground

A deep field, #070a14, with four soft colour sources drifting slowly behind everything: indigo, sky, rose and teal at low opacity. The field is the backdrop that glass needs to refract. It moves very slowly and stops under reduced motion.

## Glass

- Panel fill: a top-lit gradient from rgba(255,255,255,0.10) to rgba(255,255,255,0.03).
- Blur: backdrop-filter blur(22px) saturate(160%). Shadows carry an offset and a soft blur.
- Edge: 1px rgba(255,255,255,0.16) border, with an inner top highlight, inset 0 1px 0 rgba(255,255,255,0.28).
- Radius: 20px for panels and the ticker, 12px for tiles and controls, 999px only for tags.
- Fallback: without backdrop-filter support, panels become a solid #121626 at 92% opacity.

## Type

- IBM Plex Sans (self-hosted, OFL): 400 body, 600 headings and labels.
- IBM Plex Mono (self-hosted, OFL): figures in tables and the ticker only.
- Ink: #f1f4fb. Secondary ink: rgba(226,232,245,0.74). Both meet 4.5:1 on the glass over the darkest field.
- Figures use tabular numerals.

## Colour

- Accent (you, the active tab, selection): #9ee8ff, ice blue. One accent only.
- Up: #6ee7b7. Down and errors: #fca5a5.
- Text never sits on the bright parts of the colour field. The field stays dark behind all text.

## Components

- Ticker: a floating glass bar, sticky, inset 12px from the edges, with the year as the largest figure.
- Tabs: pill-shaped glass segments. The active tab gets a brighter fill and the accent text.
- Buttons: glass tiles. Primary is a brighter glass tile with ice-blue text. On press they scale to 0.98 (transform only).
- Rows and tables stay flat inside a glass panel. Glass is never nested inside glass.
- Bars: 3px rules with rounded ends.

## Motion

- The colour field drifts over about 40 seconds. Transform only.
- Modal: fade and rise, 220ms, ease-out.
- Hover and focus colour changes: 180ms.
- Everything stops under prefers-reduced-motion. Reduced transparency makes the glass solid.

## Focus

A 2px ice-blue outline with a 2px offset on every interactive element.
