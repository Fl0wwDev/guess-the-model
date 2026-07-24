# content/

Build-time, typed data (Zod-validated). No runtime database in v1.

Planned:

- `brands/` — one entry per manufacturer (name, country, mini-history).
- `models/` — MDX/TS per car: history prose + specs frontmatter (year, power, 0–100, top speed, engine…) and a `modelPath` pointing at the optimized GLB in `public/models/`.
- `quiz.ts` / `quiz.json` — the question bank, Zod-validated:
  `{ id, modelRef, prompt, choices[], correctIndex, difficulty }`.

A malformed spec or a quiz item missing its correct answer must fail the build,
not ship broken.
