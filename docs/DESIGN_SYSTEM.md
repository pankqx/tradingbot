# Design system

Direction: "paper and ink". A cool bond-paper surface with ink-dark type, pine green as the single accent, saffron for entry levels, and ledger-style hairline structure instead of stacked cards.

- **Type:** IBM Plex Sans for UI and data (tabular figures via `.num`), Fraunces for page titles and large prices only.
- **Colour tokens** (`globals.css`): `paper`, `surface`, `raised`, `line`, `ink`/`ink-2`/`ink-3`, `accent`, `up`, `down`, `warn`, each with a light and a dark value. Dark is a separate palette (pine-black layers with emerald accent), not an inversion.
- **Theme:** `data-theme` on `<html>`, set by an inline script before paint; choice (`light` / `dark` / `system`) persisted in `localStorage`.
- **Motion:** one entrance sequence (sparkline draw, row fade), plus feedback for actions (menus, bars). All disabled under `prefers-reduced-motion`.
- **Signature element:** the trade setup drawn on the chart as risk and reward zones (canvas primitive in `price-chart.tsx`), with a matching risk ladder on the signal page.
- **Accessibility:** visible focus ring, semantic roles for tabs/radio groups, text contrast checked against both palettes, non-colour cues (arrows, labels) next to red/green.
