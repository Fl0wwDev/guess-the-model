# Brand logos

Drop a logo file here named by the brand id and the museum picks it up
automatically (no code change). Until then, an elegant serif wordmark is shown.

Currently present: `ferrari.svg`, `bmw.svg`, `porsche.svg`, `lamborghini.svg`,
`bugatti.svg`. All but Ferrari were fetched from Wikimedia Commons by
`npm run fetch:brands` (`scripts/fetch-brand-assets.mjs`) — add a brand there to
extend the set, rather than downloading by hand.

Tips:
- **SVG** is best (transparent background, scales perfectly).
- Resolution is server-side (`src/lib/logos.ts` probes `svg`, `png`, `webp`), so a
  missing file costs a wordmark fallback, never a 404 or a broken-image flash.
- The museum grid renders logos at `h-20`/`h-24` capped to 58 % of the cell width —
  a logo with lots of built-in padding will look small; crop the viewBox if so.
- Brand logos are **trademarks**. The Commons files are tagged public domain for
  *copyright* (simple shapes / text marks) — that says nothing about trademark.
  Fine for this private, non-distributed, non-commercial app; do not ship them in
  a public build without checking usage rights.
