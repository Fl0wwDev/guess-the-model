# public/models/

Optimized, web-ready **GLB** car models live here.

Pipeline (run on the Mac, never on the Pi):

```
npx gltf-transform optimize raw.glb car.glb \
  --compress meshopt --texture-compress ktx2 --texture-size 2048
```

Budgets: hero car 80–150k tris · secondary 40–80k · textures ≤ 2K ·
~2–4 MB per car GLB. Keep a licensing record for every downloaded model
(source, license, whether web embedding is permitted).
