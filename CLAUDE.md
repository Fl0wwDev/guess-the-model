# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

"Guess the Model" — a **non-commercial fan** web app for car enthusiasts. Two features:

- **Quiz** (core): a rotatable/zoomable 3D car; the user guesses the model via elegant multiple-choice cards.
- **Showcase**: a premium catalog of iconic sports cars with mini-history + specs.

Art direction target: cinematic, Apple/Porsche-vitrine quality. Solo developer, built on a Mac M4 (arm64). Future hosting: self-hosted on a Raspberry Pi (arm64) — **deferred**; for now the app runs locally only.

## Commands

- `npm run dev` — dev server (Turbopack) at http://localhost:3000
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint

3D asset optimization (run on the Mac, never on the Pi):

```
npx gltf-transform optimize <in>.glb <out>.glb --compress meshopt --texture-compress ktx2 --texture-size 2048
```

## Non-negotiable version constraints

- **`three` is hard-pinned to `0.185.1` (no caret).** `postprocessing` (via `@react-three/postprocessing`) peer-requires `three < 0.186`; bumping past 0.185 breaks the `EffectComposer`. Re-verify this pairing before ANY three upgrade.
- Stay on the **stable** R3F line: `@react-three/fiber` 9.x + `@react-three/drei` 10.x + `@react-three/postprocessing` 3.x. Do NOT pull the R3F v10-alpha / drei v11-alpha (WebGPU) line into this product.
- React 19 + Next 16. See `AGENTS.md`: Next 16 has real breaking changes vs older knowledge — read `node_modules/next/dist/docs/` before writing Next-specific code.

## Architecture

- **Framework decision**: Next.js (App Router) does BOTH the SEO Showcase (static/SSG) and the stateful WebGL Quiz (client) in one app. Astro was rejected — its islands/MPA model fights the persistent 3D canvas + GSAP/Lenis scroll cinematics.
- **The `<Canvas>` must never render on the server.** It is mounted browser-only: `src/components/three/Experience.tsx` (a `'use client'` component) dynamically imports the `Scene` with `{ ssr: false }`. Never place `<Canvas>` in a Server Component.
- **Rendering runs on the visitor's GPU** (especially mid-range mobile), NOT on the Pi — the Pi only serves static files. All performance budgets target the client device.
- Layout:
  - `src/app/` — routes. `/` landing today; later `/quiz` (client) and `/showcase/[brand]/[model]` (SSG).
  - `src/components/three/` — `Scene` (Canvas + lighting rig + car), `Experience` (ssr:false wrapper). Later: `CarModel`, `LightingRig`, `PostFX`.
  - `src/components/ui/` — QCM cards, glass panels, transitions. Motion (ex-Framer Motion) for React mount/exit/layout; GSAP + ScrollTrigger for scroll cinematics. **Never animate the same DOM node with both.**
  - `src/lib/` — Zustand store (`store.ts`), 3D loader config, perf gating.
  - `src/content/` — build-time typed data (brands, models, quiz bank), Zod-validated.
  - `public/models/` — optimized `.glb`. `public/decoders/` — self-hosted meshopt/KTX2 wasm.
- **State**: Zustand for quiz/3D state. No TanStack Query until a real remote API exists.

## Art-direction recipe (the "soul")

- Lighting: drei `<Environment>` assembled from `<Lightformer>` area lights (key/fill/rim) — procedural, no external HDRI file. Ground with `<ContactShadows>`; `<AccumulativeShadows>` for a static hero.
- Car paint: `meshPhysicalMaterial`, high metalness + low roughness + `clearcoat: 1` / low `clearcoatRoughness`.
- Post: keep it **sober** — subtle `Bloom` (`luminanceThreshold` ~0.9) + `Vignette`, plus the Canvas default ACES tone mapping. Do NOT double tone-map. Add `DepthOfField`/N8AO on desktop only. SSR (screen-space reflections) does not exist in the lib — fake reflections via env map + reflective floor.
- Perf guardrails (client): `dpr={[1,2]}`, `antialias:false` (SMAA later), gate heavy effects off on mobile via `<PerformanceMonitor>`/`<AdaptiveDpr>`, mutate in `useFrame` via refs not React state.

## 3D asset pipeline

- Runtime format: **GLB**. Geometry → **meshopt** (default; faster decode than Draco). Textures → **KTX2/Basis** (ETC1S for color/AO/roughness, UASTC for normals). Budgets: hero 80–150k tris, secondary 40–80k, textures ≤ 2K, ~2–4 MB per car GLB.
- Load via drei `useGLTF` + `<Suspense>`; `useGLTF.preload()` the next car; frame with `<Bounds>`. Register meshopt/KTX2 decoders once; self-host the wasm under `public/decoders/`.

## Model sourcing & IP posture (fan, non-commercial)

- **Manufacturers do NOT publish downloadable 3D models.** Every recognizable branded car is fan-made; its shape + badges are the manufacturer's trademark/design IP. **Sketchfab** (free + Creative Commons filter) is the primary source; **Poly Pizza / Quaternius** (CC0) are the safe low-poly tier.
- Read the license badge on EVERY model: **CC-BY** needs attribution; **CC-BY-NC** forbids any monetization (ads/donations break it); **CC-BY-ND forbids the decimation/GLB conversion the pipeline needs — unusable**; Sketchfab "Editorial" bans app use.
- Ferrari actively DMCAs fan models (Sketchfab purge, Oct 2023) — expect gaps/instability for that marque. Keep the app genuinely non-commercial, don't sell/redistribute models, add a disclaimer, keep a per-model licensing record. This is not legal advice.

## Deployment (deferred to the very end)

Single arm64 Docker image built natively on the M4 (no multi-arch/QEMU), served by Caddy behind a Cloudflare Tunnel, heavy assets on R2/edge cache with an explicit Cache Rule (`.glb/.ktx2/.wasm` are NOT edge-cached by default). Do not add Docker/hosting until the app is feature-complete.
