# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

@ROADMAP.md

## Project

"Guess the Model" — a **non-commercial fan** web app for car enthusiasts. Two features:

- **Quiz** (core): a rotatable/zoomable 3D car; the user guesses the model via elegant multiple-choice cards.
- **Showcase / Museum** (a core future vision, beyond the quiz): an elegant, immersive **brand museum** — the user strolls through a manufacturer (e.g. Ferrari) and its **entire history**. Each model card carries full specs (horsepower, French *chevaux fiscaux*, release year, **sales figures**), **anecdotes** and story. A guided, cinematic journey through the marque and its timeline — not just a flat catalog. Reference/inspiration: vecarz.com (dark editorial, serif headings, embedded 3D, rich spec sheet).

**THE APP IS FULL SKETCHFAB — there is no local 3D asset, anywhere.** Every car (museum AND landing garage) streams from Ddiaz Design's Sketchfab collections. Sketchfab renders at full quality on their infra → zero local optimization, zero lag, thumbnails free from their CDN, 100% coverage by construction. The former 2.7 GB `public/models/` GLB tree, the `cars.ts` folder registry, the whole react-three-fiber stack and the gltf-transform pipeline were **deleted** in this pivot. Trade-offs accepted knowingly: the app **needs internet + Sketchfab uptime** (it no longer works offline), and a model disappears if its author deletes it.

  - Catalogue build: `npm run build:museum` (`scripts/build-museum.mjs`) reads `src/content/museum/collections.json` (brand → collection uid, + `modelKeys` hints for brands with no seed, like BMW), fetches each collection from the Sketchfab v3 API (no token needed), **groups models into variants** (seeded from `src/content/museum/seeds.json`, then token match, then first-token fallback), picks a base variant, and writes `src/content/museum/<brand>.json`. Loader + helpers: `src/content/museum.ts` (`MUSEUM_BRANDS`, `getMuseumBrand/Model`, `museumBaseVariant`). To add a brand: add its collection uid to the config + rerun.
  - `src/content/museum/seeds.json` is **load-bearing**: a frozen snapshot of the old folder registry's model names. It is what keeps generated model ids byte-identical across rebuilds, and therefore what keeps the hand-authored specs in `src/content/specs/` resolving. Verify with a rebuild + `git diff` on `src/content/museum/*.json` — it must be empty.
  - `<SketchfabEmbed>` (`src/components/museum/`) drives the **Sketchfab Viewer API** client-side: it reframes the camera on load (authors' saved framings are wildly inconsistent) and reports `viewerready` so callers can crossfade a poster over the 1–3 s boot.
  - Museum routes: `/musee` (brand grid, logos) → `/musee/[brand]` (model grid, chronological, thumbnails) → `/musee/[brand]/[model]` (editorial **3D-left / text-right split**, light theme: `<SketchfabEmbed>` + serif title + variant switcher + spec sheet + story + related models). Specs are hand-authored in `src/content/specs/<brand>.json` keyed by variant id (never generated).
  - **Landing garage** (`/`): a dark cinematic carousel over the *whole* catalogue (`src/content/showcase.ts` → brand-interleaved so ←/→ never repeats a marque; `src/components/garage/GarageShowcase.tsx`). Because switching model means booting a new viewer, the model's Sketchfab CDN **thumbnail is shown instantly as a poster** and the live viewer crossfades in on `viewerready`; the index must sit still for `SETTLE_MS` before a viewer is booted at all, so holding an arrow key flies through posters instead of spawning 20 iframes. The page is a Server Component that passes only the ~118 slim showcase entries to the client — the catalogue JSON never enters the client bundle.

### Sketchfab embed parameters — free tier only (hard rule)

Per Sketchfab's own parameter reference, **every `ui_*` embed option except `ui_stop` and `ui_theme` is gated behind a Premium plan**, and the ToS separately forbids hiding the watermark below Premium. `transparent`, `double_click` and `orbit_constraint_*` are Pro-gated (the viewer really does deny non-entitled params — gating follows the **model owner's** plan, not ours). So `<SketchfabEmbed>` passes only unrestricted params: `autostart`, `preload`, `camera`, `autospin`, `dnt`, `annotations_visible`, `dof_circle`, `max_texture_size`, `ui_stop`, `ui_theme`. Notably **`preload` stays 0** — Sketchfab documents `preload: 1` as not recommended (slower time-to-interaction, known to crash mobile Safari).

⚠️ **Consequence for the QUIZ**: `ui_infos=0` (the option that hides the model-name bar) is Premium-only, so a Sketchfab embed **shows the answer**. A full-Sketchfab quiz therefore needs one of: a Sketchfab Premium plan, questions built on cropped *detail thumbnails* instead of live 3D, geometrically cropping the iframe past the info bar (ToS-adjacent), or re-introducing local GLB for the quiz alone. Unresolved — decide before building the quiz loop.

Art direction target: cinematic, Apple/Porsche-vitrine quality. Solo developer, built on a Mac M4 (arm64). Future hosting: self-hosted on a Raspberry Pi (arm64) — **deferred**; for now the app runs locally only.

## Commands

- `npm run dev` — dev server (Turbopack) at http://localhost:3000
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint
- `npm run build:museum` — rebuild `src/content/museum/<brand>.json` from the Sketchfab collections (needs internet)

There is no asset pipeline: nothing is downloaded, optimized or served locally.

## Non-negotiable version constraints

- React 19 + Next 16. See `AGENTS.md`: Next 16 has real breaking changes vs older knowledge — read `node_modules/next/dist/docs/` before writing Next-specific code.
- **Do not reinstall a 3D stack without a decision.** `three`, `@react-three/fiber|drei|postprocessing`, `@gltf-transform/cli` and `leva` were removed with the full-Sketchfab pivot. If a local renderer ever comes back (most likely for the quiz — see above), the old pinning trap applies again: `three` had to be hard-pinned to `0.185.1` because `postprocessing` peer-requires `three < 0.186`, and the stable line is R3F 9.x + drei 10.x + postprocessing 3.x (never the v10/v11 WebGPU alphas).
- `gsap` + `@gsap/react` + `lenis` are still installed for future scroll cinematics but **not used yet**. `zustand` is kept for the quiz store (`src/lib/store.ts`); `motion` powers the React transitions.

## Architecture

- **Framework decision**: Next.js (App Router) does BOTH the SEO Showcase (static/SSG) and the stateful Quiz (client) in one app. Astro was rejected — its islands/MPA model fights persistent embeds + GSAP/Lenis scroll cinematics.
- **All 3D rendering happens inside a Sketchfab iframe**, on Sketchfab's infra and the visitor's GPU. Our own performance budget is therefore about **how many viewers we boot and when** — never more than one live viewer per screen, always behind a thumbnail poster, and never booted while the user is still scrubbing.
- Layout:
  - `src/app/` — routes. `/` landing garage, `/musee/**` the museum (SSG); later `/quiz`.
  - `src/components/garage/` — the landing carousel (`GarageShowcase`).
  - `src/components/museum/` — `SketchfabEmbed` (the single 3D primitive), `ModelExplorer`, `ModelCard`, `BrandLogo`.
  - `src/components/ui/` — QCM cards, glass panels, transitions. Motion (ex-Framer Motion) for React mount/exit/layout; GSAP + ScrollTrigger for scroll cinematics. **Never animate the same DOM node with both.**
  - `src/lib/` — Zustand quiz store (`store.ts`), server-side logo resolution (`logos.ts`).
  - `src/content/` — build-time typed data (museum catalogue, showcase list, hand-authored specs).
  - `public/logos/<brand>.svg` — optional brand logos; `BrandLogo` falls back to a serif wordmark.
- **State**: Zustand for quiz state, plain `useState` elsewhere. No TanStack Query until a real remote API exists.

## Art-direction recipe (the "soul")

The 3D lighting is the model author's — we no longer control materials, lights or post. The soul now lives in **page composition around the embed**:

- Two worlds: the landing is **dark** (`#08080a`, serif Playfair headings, accent `#e10600`, glass-blur buttons); the museum is **light** (`#f4f2ef`) so the Sketchfab studio background blends instead of clashing on black. Keep them distinct on purpose.
- On the dark landing, the viewer sits in a **light "vitrine" panel** (`rounded-3xl`, `ring-1 ring-white/10`) rather than bleeding full-screen — a light box on a dark page reads as intentional; a light rectangle to the edges reads as a bug.
- **Never let the user look at an empty frame.** Sketchfab CDN thumbnails are the poster layer; the live viewer only fades in on `viewerready`. Preload neighbouring posters.
- Camera: `cameraDistance` on `<SketchfabEmbed>` multiplies the author's saved distance (`< 1` closer, `> 1` further). The museum uses the default `0.7` (tight editorial framing); the landing uses `1.05` (a hero needs air). `entranceAnimation={false}` skips Sketchfab's fly-in when a poster is already showing the car.
- `max_texture_size` is the one real perf lever left — the garage caps at 2048 to boot faster; the museum detail page keeps full resolution.
- `@media (prefers-reduced-motion: reduce)` is baked into `globals.css` from day one.

## Build & tooling gotchas (hard-won)

- **Tailwind v4 must stay scoped to `src/`.** `globals.css` uses `@import "tailwindcss" source("../");`. Without the `source(...)`, Tailwind v4's automatic content detection walks the **whole project root**, and any large asset tree sitting there **hangs the first compile indefinitely** (dev AND `next build`, both Turbopack and webpack; every route stalls because the CSS is in the root layout). Symptom: `next-swc` pegs 2–3 cores with a runaway memory footprint, stuck on "Creating an optimized production build" / "Compiling …". That trap was the multi-GB `public/models/` tree — now deleted, but **never remove the `source("../")` scope**; `.gitignore` still guards `*.glb` and `/public/models/` so it cannot come back by accident.
- After the fix: `next build` ≈ 7 s, dev route compiles 1–3 s (the three.js/R3F stack compiles in ~3 s — it was never the bottleneck).
- **Do NOT run `next build` as a dev feedback loop.** Use `npm run dev` (on-demand per-route compile) + `npx tsc --noEmit` for types. Builds are only for the final Pi deploy (deferred).

## Model sourcing & IP posture (PRIVATE, personal, non-distributed use)

**Decision: this app is for private/personal use only — runs on localhost (or the home LAN at most), never exposed to the public internet, never monetized, never shared publicly.** Under that scope the restrictions that matter (public redistribution, public display, commercial use, shipping extractable assets in a public product) are never triggered.

Going full Sketchfab **improved** this posture — we embed, we no longer copy:

- **Nothing is downloaded or redistributed.** Embedding via Sketchfab's own viewer is an explicitly licensed use in their ToS. No extractable asset ships with our app.
- Ddiaz Design's models are **CC BY-NC-SA 4.0**. Attribution is satisfied *on our page*, not by the viewer chrome: CC 4.0 §3(a)(2) allows credit "in any reasonable manner based on the medium", and `ModelExplorer` renders author + license + a link back to the model. Keep that credit block on every page that shows a model. **NC** is satisfied by private non-commercial use. **SA** is not triggered — an embed is not Adapted Material, so share-alike never reaches our code.
- Provenance is now automatic: author + license slug come straight from the Sketchfab API into `src/content/museum/<brand>.json`. The old hand-kept GLB credits file is archived at `docs/reference-models/_local-glb-credits.md`.
- **Do not hide the Sketchfab watermark or info bar** below a Premium plan — the ToS prohibits it explicitly (see the embed-parameters rule above).
- **Do NOT rip manufacturer configurators**, and don't re-download models "just in case" — that would reactivate the redistribution questions this pivot removed.

⚠️ **If this is EVER exposed publicly (Cloudflare Tunnel, port-forward, a shared link) or monetized, the full IP analysis reactivates**: trademark/trade-dress exposure (Ferrari DMCA'd fan models in 2023; BMW v. TurboSquid), the **NC** clause (any monetization breaks CC BY-NC-SA outright), and — given a FR/EU jurisdiction — an IP-lawyer consult. Private-use ≠ safe-to-publish. Not legal advice.

⚠️ One extra reason to stay private, specific to embedding: Sketchfab's ToS traffic fair-use clause is measured "across all your models" of the **account that owns them** — i.e. heavy public embedding of Ddiaz Design's collections spends *their* quota and could get *their* account throttled or asked to upgrade. Our streaming is a cost we impose on a third party. On localhost it is negligible; publicly it would not be.

## Deployment (deferred to the very end)

**Private-use scope:** run on localhost (`npm run dev` / `start`) or, if wanted, a container on the **home LAN only**. Do NOT expose it publicly (no Cloudflare Tunnel, no port-forward) — public exposure reactivates the IP posture above. The original arm64 Docker/Caddy/Pi plan still applies technically (single native arm64 image built on the M4, no multi-arch/QEMU) but only for LAN use. Do not add Docker/hosting until the app is feature-complete.

Full Sketchfab makes the Pi story *easier* (the image is a few MB of HTML/JS — no 2.7 GB of assets, no GPU work on the Pi) but adds a hard dependency: **the app is useless without internet access to Sketchfab**. There is no offline mode and no local fallback.
