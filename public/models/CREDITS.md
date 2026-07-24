# Model credits & provenance

Private/personal project — these records cost nothing and are the prerequisite
if the project is ever made public (see `CLAUDE.md` → IP posture). Organized by
brand under `public/models/<brand>/`.

| File | Car | Source | License (note) |
|---|---|---|---|
| `ferrari/f40.glb` | Ferrari F40 | Sketchfab (manual download) | check creator's license before any public use |
| `ferrari/458-italia.glb` | Ferrari 458 Italia 2011 | Sketchfab (manual download) | check creator's license before public use |
| `ferrari/sf90-spider.glb` | Ferrari SF90 Spider 2021 | Sketchfab (manual download) | check creator's license before public use |
| `ford/gt40.glb` | Ford GT40 | GitHub `Vivekkk-1/3D-Models` (orig. Sketchfab) | repo BSL-1.0; verify before public use |
| `toyota/supra-mk4.glb` | Toyota Supra MK4 (A80) | GitHub `Vivekkk-1/3D-Models` (orig. Sketchfab) | repo BSL-1.0; verify before public use |
| `dodge/challenger-rt.glb` | Dodge Challenger R/T | GitHub `Vivekkk-1/3D-Models` (orig. Sketchfab) | repo BSL-1.0; verify before public use |

Pipeline: `npm run optimize:car -- <raw.glb> <brand>/<name> [texture-size]`
(meshopt geometry; textures resized — Ferraris at 1k for less lag; KTX2 pending
a `toktx` install). Raw downloads kept under `downloads/`.

> Private/offline use is fine as-is. Before any public release, re-check each
> original creator's license and the brand trademark/trade-dress notes in `CLAUDE.md`.
