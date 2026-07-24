#!/usr/bin/env bash
#
# Optimize a raw GLB into a web-ready car asset under public/models/.
# Geometry -> meshopt; textures -> KTX2/Basis when `toktx` (KTX-Software) is on
# PATH, otherwise meshopt-only.
#
# Usage:
#   ./scripts/optimize-car.sh <input.glb> <output-name> [texture-size]
#   - output-name may include a brand subfolder, e.g. "ferrari/f40"
#   - texture-size defaults to 2048; use 1024 for lighter cars / less lag
#
# Example:
#   ./scripts/optimize-car.sh "downloads/Ferrari F40.glb" ferrari/f40 1024
#   -> writes public/models/ferrari/f40.glb
#
set -euo pipefail

IN="${1:?usage: optimize-car.sh <input.glb> <output-name> [texture-size]}"
NAME="${2:?output name required (e.g. ferrari/f40)}"
TEX="${3:-2048}"
OUT="public/models/${NAME}.glb"
mkdir -p "$(dirname "$OUT")"

if command -v toktx >/dev/null 2>&1; then
  KTX="--texture-compress ktx2"
  echo "KTX2 enabled (toktx found)"
else
  KTX=""
  echo "toktx absent -> meshopt-only. Install KTX-Software for KTX2."
fi

# --join false / --simplify false: keep body/glass/wheels separate and control
# decimation in Blender (protect the recognizable silhouette).
npx gltf-transform optimize "$IN" "$OUT" \
  --compress meshopt --texture-size "$TEX" --join false --simplify false $KTX

ls -la "$OUT"
