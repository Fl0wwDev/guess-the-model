# content/

Build-time, typed data. No runtime database in v1.

Current:

- `museum/collections.json` — brand → Ddiaz Design Sketchfab collection uid
  (+ `modelKeys` hints for brands with no seed, e.g. BMW). **The one file to edit
  to add a brand**, then `npm run build:museum`.
- `museum/seeds.json` — frozen grouping seeds (model names per brand). Keeps
  museum model ids stable across rebuilds so hand-authored specs keep resolving.
  Do not rename or reorder.
- `museum/<brand>.json` — **generated** by `scripts/build-museum.mjs`
  (brand → models → variants, each variant carrying its Sketchfab uid, CDN
  thumbnail, author and license). Never edit by hand.
- `museum.ts` — loader + helpers (`MUSEUM_BRANDS`, `getMuseumBrand/Model`,
  `museumBaseVariant`, `museumModelHref`).
- `showcase.ts` — flat, brand-interleaved list derived from the museum data,
  feeding the landing-page garage carousel.
- `specs/<brand>.json` + `specs.ts` — **hand-authored** spec sheet & anecdote per
  variant id (power, chevaux fiscaux, price, production, story). The generator
  never touches these.

Planned:

- `quiz.ts` / `quiz.json` — the question bank:
  `{ id, modelRef, prompt, choices[], correctIndex, difficulty }`. A quiz item
  missing its correct answer must fail the build, not ship broken.
