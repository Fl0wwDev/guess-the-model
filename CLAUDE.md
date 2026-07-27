# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

@ROADMAP.md

## Project

"Guess the Model" — a **non-commercial fan** web app for car enthusiasts. Two features:

- **Quiz** (core): a rotatable/zoomable 3D car; the user guesses the model via elegant multiple-choice cards.
- **Showcase / Museum** (a core future vision, beyond the quiz): an elegant, immersive **brand museum** — the user strolls through a manufacturer (e.g. Ferrari) and its **entire history**. Each model card carries full specs (horsepower, French *chevaux fiscaux*, release year, **sales figures**), **anecdotes** and story. A guided, cinematic journey through the marque and its timeline — not just a flat catalog. Reference/inspiration: vecarz.com (dark editorial, serif headings, embedded 3D, rich spec sheet).

**THE APP IS FULL SKETCHFAB — there is no local 3D asset, anywhere.** Every car streams from Ddiaz Design's Sketchfab collections (the museum is the only place that mounts a viewer at all). Sketchfab renders at full quality on their infra → zero local optimization, zero lag, thumbnails free from their CDN, 100% coverage by construction. The former 2.7 GB `public/models/` GLB tree, the `cars.ts` folder registry, the whole react-three-fiber stack and the gltf-transform pipeline were **deleted** in this pivot. Trade-offs accepted knowingly: the app **needs internet + Sketchfab uptime** (it no longer works offline), and a model disappears if its author deletes it.

  - Catalogue build: `npm run build:museum` (`scripts/build-museum.mjs`) reads `src/content/museum/collections.json` (brand → collection uid, + `modelKeys` hints for brands with no seed, like BMW), fetches each collection from the Sketchfab v3 API (no token needed), **groups models into variants** (seeded from `src/content/museum/seeds.json`, then token match, then first-token fallback), picks a base variant, and writes `src/content/museum/<brand>.json`. Loader + helpers: `src/content/museum.ts` (`MUSEUM_BRANDS`, `getMuseumBrand/Model`, `museumBaseVariant`). To add a brand: add its collection uid to the config + rerun.
  - `src/content/museum/seeds.json` is **load-bearing**: a frozen snapshot of the old folder registry's model names. It is what keeps generated model ids byte-identical across rebuilds, and therefore what keeps the hand-authored specs in `src/content/specs/` resolving. Verify with a rebuild + `git diff` on `src/content/museum/*.json` — it must be empty.
  - `<SketchfabEmbed>` (`src/components/museum/`) drives the **Sketchfab Viewer API** client-side: it reframes the camera on load (authors' saved framings are wildly inconsistent) and reports `viewerready` so callers can crossfade a poster over the 1–3 s boot.
  - Museum routes: `/musee` (**vecarz-style split**: full-height historical photograph left, scrollable hairline-ruled logo grid right — hovering or focusing a marque crossfades its photo in and swaps the caption; `BrandExplorer`) → `/musee/[brand]` (model grid, chronological, thumbnails) → `/musee/[brand]/[model]` (editorial **3D-left / text-right split**, light theme: `<SketchfabEmbed>` + serif title + variant switcher + spec sheet + story + related models). Specs live in `src/content/specs/<brand>.json` keyed by variant id (researched + verified, never generated from Sketchfab).
  - **Brand photographs** (`public/brands/<brand>.jpg`) and **logos** (`public/logos/<brand>.svg`) come from Wikimedia Commons via `npm run fetch:brands` (`scripts/fetch-brand-assets.mjs`), which also rewrites `public/brands/CREDITS.md`. Both are **optional at runtime**: `src/lib/brand-media.ts` / `logos.ts` probe the filesystem server-side, and the museum falls back to the marque's emblematic Sketchfab thumbnail (and a serif wordmark) — no broken image, ever. The editorial layer (origin, tagline, photo credit, crop focus) is hand-written in `src/content/brands.ts`; **if you change a photo, update its credit there too** — the CC licences require it and the credit is rendered under the panel.
  - **Landing** (`/`): deliberately **no 3D and no imagery** — a typographic menu (serif hero + ruled entries for Musée / Quiz / À propos) that paints instantly and never waits on Sketchfab. The Sketchfab carousel that used to live here (`GarageShowcase`, `src/content/showcase.ts`) was **deleted**; all 3D now lives in the museum and the quiz, one viewer per screen. `/a-propos` carries the project blurb and the Ddiaz Design / Commons credits.
  - **Quiz** (`/quiz`): see the spoiler rule below — the question is a **zooming crop of the car's photo**, the answer is the **live 3D**. `src/content/quiz.ts` builds the pool (one row per model, base variant only — a tuner variant would be unfair to guess a base model from), `src/lib/quiz-deck.ts` is the pure deck/scoring logic, `ZoomStage` is the animated crop and `QuizGame` the loop. `src/content/categories.ts` splits the catalogue into **sportives / citadines**: everything is a sportive unless it is listed as an everyday car, and Ferrari + Porsche are sportives *including their SUVs* (a Purosangue and a Cayenne count, a BMW X3 does not).
  - **Shared chrome**: `SiteHeader` (`src/components/ui/`) is on every page including inside the `/musee` right-hand column. It is `h-16` and the model page sizes its 3D column with `calc(100dvh - 4rem)` — **those two numbers are coupled**.

### Sketchfab embed parameters — free tier only (hard rule)

Per Sketchfab's own parameter reference, **every `ui_*` embed option except `ui_stop` and `ui_theme` is gated behind a Premium plan**, and the ToS separately forbids hiding the watermark below Premium. `transparent`, `double_click` and `orbit_constraint_*` are Pro-gated (the viewer really does deny non-entitled params — gating follows the **model owner's** plan, not ours). So `<SketchfabEmbed>` passes only unrestricted params: `autostart`, `preload`, `camera`, `autospin`, `dnt`, `annotations_visible`, `dof_circle`, `max_texture_size`, `ui_stop`, `ui_theme`. Notably **`preload` stays 0** — Sketchfab documents `preload: 1` as not recommended (slower time-to-interaction, known to crash mobile Safari).

⚠️ **The QUIZ spoiler rule — settled, do not re-litigate.** `ui_infos=0` (the option that hides the model-name bar) is Premium-only, and it is not merely unenforced: on a model owned by a basic account the request is **rewritten server-side to `uiInfos:true`**. Verified by screenshotting a raw embed with the parameter set — the bar still reads "1987 Ferrari F40 / by Ddiaz Design". A live Sketchfab viewer therefore **cannot host a "guess the model" question**, and cropping the iframe past that bar would hide the Sketchfab logo and the links back to the model page, which the ToS forbids.

The resolution, and the whole shape of `/quiz`: **the viewer hosts the answer, not the question.**

1. The question is a hard zoom (3.2×) into the car's own photograph, easing out over 14 s. Score decays with the zoom, so answering early pays.
2. The Sketchfab viewer for that same car is **mounted from the first frame of the question**, `opacity-0` behind the crop. It boots while the player thinks.
3. On answer the crop dissolves and the viewer — already warm — takes over, name and CC attribution included, which is exactly where they belong.

The 1–3 s boot is spent inside thinking time and is never felt, and nothing about Sketchfab's chrome is hidden. The crop layer must stay **opaque and `inset-0`**: it is the only thing keeping the answer off screen while the viewer is warming up underneath.

Art direction target: cinematic, Apple/Porsche-vitrine quality. Solo developer, built on a Mac M4 (arm64). Future hosting: self-hosted on a Raspberry Pi (arm64) — **deferred**; for now the app runs locally only.

## Commands

- `npm run dev` — dev server (Turbopack) at http://localhost:3000
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint
- `npm run build:museum` — rebuild `src/content/museum/<brand>.json` from the Sketchfab collections (needs internet)
- `npm run fetch:brands` — (re)download the brand photos + logos from Wikimedia Commons and rewrite `public/brands/CREDITS.md` (needs internet; Commons rate-limits, so it retries slowly)
- `npm run fetch:thumbs` — rewrite `src/content/museum/thumbnails-hd.json`, the 1920px thumbnail per uid that the quiz zooms into. Kept out of `<brand>.json` so it can be re-run without touching model ids (which the specs are keyed on); the 1920px CDN URL is **not** derivable from the 1024px one, the trailing hash differs per size.

There is no asset pipeline: nothing is downloaded, optimized or served locally.

## Non-negotiable version constraints

- React 19 + Next 16. See `AGENTS.md`: Next 16 has real breaking changes vs older knowledge — read `node_modules/next/dist/docs/` before writing Next-specific code.
- **Do not reinstall a 3D stack without a decision.** `three`, `@react-three/fiber|drei|postprocessing`, `@gltf-transform/cli` and `leva` were removed with the full-Sketchfab pivot. If a local renderer ever comes back (most likely for the quiz — see above), the old pinning trap applies again: `three` had to be hard-pinned to `0.185.1` because `postprocessing` peer-requires `three < 0.186`, and the stable line is R3F 9.x + drei 10.x + postprocessing 3.x (never the v10/v11 WebGPU alphas).
- `gsap` + `@gsap/react` + `lenis` are still installed for future scroll cinematics but **not used yet**. `zustand` is kept for the quiz store (`src/lib/store.ts`); `motion` powers the React transitions.

## Architecture

- **Framework decision**: Next.js (App Router) does BOTH the SEO Showcase (static/SSG) and the stateful Quiz (client) in one app. Astro was rejected — its islands/MPA model fights persistent embeds + GSAP/Lenis scroll cinematics.
- **All 3D rendering happens inside a Sketchfab iframe**, on Sketchfab's infra and the visitor's GPU. Our own performance budget is therefore about **how many viewers we boot and when** — never more than one live viewer per screen, always behind a thumbnail poster, and never booted while the user is still scrubbing.
- Layout:
  - `src/app/` — routes. `/` typographic landing menu, `/a-propos`, `/musee/**` the museum (SSG); later `/quiz`.
  - `src/components/sketchfab/` — `SketchfabEmbed`, the single 3D primitive.
  - `src/components/museum/` — `BrandExplorer` (the `/musee` split), `ModelExplorer`, `ModelCard`, `BrandLogo`.
  - `src/components/quiz/` — `QuizGame` (the loop), `ZoomStage` (the animated crop).
  - `src/components/ui/` — `SiteHeader` and shared chrome. Motion (ex-Framer Motion) for React mount/exit/layout; GSAP + ScrollTrigger for scroll cinematics. **Never animate the same DOM node with both.**
  - `src/lib/` — Zustand quiz store (`store.ts`), server-side asset probes (`logos.ts`, `brand-media.ts`).
  - `src/content/` — build-time typed data (museum catalogue, brand editorial, researched specs).
  - `public/logos/<brand>.svg` + `public/brands/<brand>.jpg` — optional; both degrade gracefully (see above).
- **State**: Zustand for quiz state, plain `useState` elsewhere. No TanStack Query until a real remote API exists.

## Art-direction recipe (the "soul")

The 3D lighting is the model author's — we no longer control materials, lights or post. The soul now lives in **page composition around the embed**:

- **One world, light.** `#f4f2ef` background, `#17171a` text, `--muted` for secondary, `--rule` for every hairline, accent `#e10600`, Playfair for display. The museum *has* to be light (Sketchfab renders models on a pale studio background, and a light viewer panel punched into a black page reads as a bug), so the landing and `/a-propos` align on the museum rather than the reverse. **Dark is an accent surface** — the `/musee` photo panel and the quiz stage — never the page. There used to be a dark landing; it was harmonised away on purpose.
- The landing earns its drama from **type and space alone** — no photo, no iframe. Content is capped at `max-w-6xl` and centred; left-aligned text against a full-width void reads as broken, not editorial.
- **Never let the user look at an empty frame.** Sketchfab CDN thumbnails are the poster layer; the live viewer only fades in on `viewerready`.
- On `/musee` the photo panel is **portrait while every source photo is landscape**. `object-cover` there was a mistake: it kept barely a third of the width and turned each car into an unreadable close-up. The panel now shows the photo **whole** (`object-contain`) floating over a **blurred, darkened copy of itself** (`scale-125 blur-2xl brightness-[0.45]`) — frame filled, nothing cut. Don't put a radius or a shadow on a contained image: the element box is the whole band, so they frame the letterbox instead of the photograph. The `focus` in `src/content/brands.ts` now only steers the mobile cards, which *do* crop.
- The quiz crop animates from a **rAF loop writing straight to `style`**, not a CSS transition. Two reasons: at 60 fps React state would re-render the answer cards for nothing, and the global `prefers-reduced-motion` rule in `globals.css` collapses any transition to 0.01 ms — which would hand out the full photo instantly and delete the game. Reduced motion gets an explicit static crop instead.
- Camera: `cameraDistance` on `<SketchfabEmbed>` multiplies the author's saved distance (`< 1` closer, `> 1` further). The museum uses the default `0.7` (tight editorial framing). `entranceAnimation={false}` skips Sketchfab's fly-in when a poster is already showing the car.
- `max_texture_size` is the one real perf lever left — the museum detail page keeps full resolution.
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
- **The brand photographs in `public/brands/` are the one thing we do copy** — from Wikimedia Commons, under CC BY-SA / CC0. Those licences allow redistribution *with attribution*, which is why the photographer + licence is rendered under the panel on `/musee` and recorded in `public/brands/CREDITS.md`. Do not swap in a press photo or a Google-Images find: those are all-rights-reserved and would break the posture this project otherwise keeps clean. The logos are Commons files tagged public-domain for **copyright**; the **trademarks** remain their owners' — nominative, private, non-commercial use only, and `/a-propos` says so.
- **Do not hide the Sketchfab watermark or info bar** below a Premium plan — the ToS prohibits it explicitly (see the embed-parameters rule above).
- **Do NOT rip manufacturer configurators**, and don't re-download models "just in case" — that would reactivate the redistribution questions this pivot removed.

⚠️ **If this is EVER exposed publicly (Cloudflare Tunnel, port-forward, a shared link) or monetized, the full IP analysis reactivates**: trademark/trade-dress exposure (Ferrari DMCA'd fan models in 2023; BMW v. TurboSquid), the **NC** clause (any monetization breaks CC BY-NC-SA outright), and — given a FR/EU jurisdiction — an IP-lawyer consult. Private-use ≠ safe-to-publish. Not legal advice.

⚠️ One extra reason to stay private, specific to embedding: Sketchfab's ToS traffic fair-use clause is measured "across all your models" of the **account that owns them** — i.e. heavy public embedding of Ddiaz Design's collections spends *their* quota and could get *their* account throttled or asked to upgrade. Our streaming is a cost we impose on a third party. On localhost it is negligible; publicly it would not be.

## Deployment (deferred to the very end)

**Private-use scope:** run on localhost (`npm run dev` / `start`) or, if wanted, a container on the **home LAN only**. Do NOT expose it publicly (no Cloudflare Tunnel, no port-forward) — public exposure reactivates the IP posture above. The original arm64 Docker/Caddy/Pi plan still applies technically (single native arm64 image built on the M4, no multi-arch/QEMU) but only for LAN use. Do not add Docker/hosting until the app is feature-complete.

Full Sketchfab makes the Pi story *easier* (the image is a few MB of HTML/JS — no 2.7 GB of assets, no GPU work on the Pi) but adds a hard dependency: **the app is useless without internet access to Sketchfab**. There is no offline mode and no local fallback.
