#!/usr/bin/env node
/**
 * fetch-hd-thumbnails.mjs
 *
 * Writes src/content/museum/thumbnails-hd.json — `{ "<uid>": "<1920px url>" }`.
 *
 * Why a separate file instead of a field in the catalogue: the quiz zooms hard
 * into a thumbnail (up to ~3x) and the 1024px one the catalogue stores goes to
 * mush. The 1920px variant exists on Sketchfab's CDN but its URL is NOT
 * derivable from the 1024px one — the trailing hash differs per size — so it has
 * to be fetched. Keeping it out of `<brand>.json` means this can be re-run any
 * time without touching model/variant ids, which the hand-authored specs are
 * keyed on. Missing uid → the museum's 1024px thumbnail is used, just softer.
 *
 *   npm run fetch:thumbs
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MUSEUM = join(ROOT, "src", "content", "museum");
// collections.json is a flat { brandId: { name, collection, … } } map.
const brands = JSON.parse(
  readFileSync(join(MUSEUM, "collections.json"), "utf-8")
);

async function fetchCollection(uid) {
  const out = [];
  let url = `https://api.sketchfab.com/v3/collections/${uid}/models?count=24`;
  while (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Sketchfab API ${res.status} for ${url}`);
    const data = await res.json();
    out.push(...(data.results || []));
    url = data.next || null;
  }
  return out;
}

/** Largest thumbnail on offer, or null. */
function pickHd(model) {
  const imgs = ((model.thumbnails || {}).images || [])
    .slice()
    .sort((a, b) => b.width - a.width);
  return imgs.length ? imgs[0].url : null;
}

// Which uids we actually care about — everything in the catalogue.
const wanted = new Set();
for (const brandId of Object.keys(brands)) {
  const cat = JSON.parse(readFileSync(join(MUSEUM, `${brandId}.json`), "utf-8"));
  for (const m of cat.models) for (const v of m.variants) wanted.add(v.sketchfab.uid);
}

const hd = {};
for (const [brandId, cfg] of Object.entries(brands)) {
  const models = await fetchCollection(cfg.collection);
  let n = 0;
  for (const m of models) {
    if (!wanted.has(m.uid)) continue;
    const url = pickHd(m);
    if (url) {
      hd[m.uid] = url;
      n++;
    }
  }
  console.log(`${brandId.padEnd(12)} ${String(n).padStart(3)} vignettes HD`);
}

const missing = [...wanted].filter((u) => !hd[u]);
if (missing.length) {
  console.log(`\n⚠ ${missing.length} uid sans vignette HD (repli sur le 1024px)`);
}

writeFileSync(
  join(MUSEUM, "thumbnails-hd.json"),
  JSON.stringify(Object.fromEntries(Object.keys(hd).sort().map((k) => [k, hd[k]])), null, 1) + "\n"
);
console.log(`\n✓ ${Object.keys(hd).length}/${wanted.size} vignettes HD écrites`);
