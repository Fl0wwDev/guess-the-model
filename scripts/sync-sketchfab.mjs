#!/usr/bin/env node
/**
 * sync-sketchfab.mjs
 *
 * Maps our local registry variants (src/lib/cars.ts) to Sketchfab model UIDs
 * from a Sketchfab *collection*, by normalized name match. Writes
 *   src/content/sketchfab/<brand>.json   { <variantId>: { uid, thumbnail, name, author, license } }
 * which the museum uses to embed the model + show a card thumbnail.
 *
 * Usage:
 *   node scripts/sync-sketchfab.mjs <brandId> <collectionUid>
 *   e.g. node scripts/sync-sketchfab.mjs ferrari e82e32907e864ec88a9c903bb662afb4
 *
 * Manual overrides (for names that don't match): add to
 *   src/content/sketchfab/<brand>.overrides.json   { <variantId>: "<uid>" }
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

const ROOT = process.cwd();
const [, , brandId, collectionUid] = process.argv;

if (!brandId || !collectionUid) {
  console.error(
    "Usage: node scripts/sync-sketchfab.mjs <brandId> <collectionUid>"
  );
  process.exit(1);
}

// ── Load registry (parse the BRANDS JSON literal out of the generated TS) ──

function loadBrands() {
  const src = readFileSync(join(ROOT, "src", "lib", "cars.ts"), "utf-8");
  const marker = "export const BRANDS: Brand[] = ";
  const start = src.indexOf(marker);
  if (start === -1) throw new Error("Could not find BRANDS in cars.ts");
  const json = src.slice(start + marker.length);
  return JSON.parse(json.slice(0, json.indexOf("];\n") + 1));
}

const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// ── Fetch every model in the collection (paginated) ───────────────────

async function fetchCollectionModels(uid) {
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

/** Pick a ~1024px-wide thumbnail (retina-friendly; fallback to the largest). */
function pickThumb(model) {
  const imgs = ((model.thumbnails || {}).images || [])
    .slice()
    .sort((a, b) => a.width - b.width);
  if (!imgs.length) return null;
  const pick = imgs.find((i) => i.width >= 1024) || imgs[imgs.length - 1];
  return pick.url;
}

// ── Main ──────────────────────────────────────────────────────────────

const brands = loadBrands();
const brand = brands.find((b) => b.id === brandId);
if (!brand) throw new Error(`Brand "${brandId}" not found in registry`);

const models = await fetchCollectionModels(collectionUid);
console.log(
  `\nCollection ${collectionUid}: ${models.length} Sketchfab models`
);

// Index Sketchfab models by normalized name (keep first on collision).
const byName = new Map();
for (const m of models) {
  const k = norm(m.name);
  if (!byName.has(k)) byName.set(k, m);
}

// Optional manual overrides.
const overridesPath = join(
  ROOT,
  "src",
  "content",
  "sketchfab",
  `${brandId}.overrides.json`
);
const overrides = existsSync(overridesPath)
  ? JSON.parse(readFileSync(overridesPath, "utf-8"))
  : {};

const mapping = {};
const unmatched = [];
const usedUids = new Set();

for (const model of brand.models) {
  for (const v of model.variants) {
    let m = null;
    if (overrides[v.id]) {
      m = models.find((x) => x.uid === overrides[v.id]) || null;
    }
    if (!m) m = byName.get(norm(v.name)) || null;

    if (m) {
      mapping[v.id] = {
        uid: m.uid,
        thumbnail: pickThumb(m),
        name: m.name,
        author: (m.user || {}).displayName || null,
        license: (m.license || {}).slug || null,
      };
      usedUids.add(m.uid);
    } else {
      unmatched.push(`${v.id}  (“${v.name}”)`);
    }
  }
}

// ── Write ─────────────────────────────────────────────────────────────

const outPath = join(ROOT, "src", "content", "sketchfab", `${brandId}.json`);
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(mapping, null, 2) + "\n", "utf-8");

// ── Report ────────────────────────────────────────────────────────────

const matched = Object.keys(mapping).length;
const totalVariants = brand.models.reduce((s, m) => s + m.variants.length, 0);
console.log(`\n✅ ${outPath}`);
console.log(`   matched ${matched}/${totalVariants} variants`);

if (unmatched.length) {
  console.log(`\n⚠️  ${unmatched.length} unmatched variant(s):`);
  unmatched.forEach((u) => console.log(`   - ${u}`));
}

const unusedModels = models.filter((m) => !usedUids.has(m.uid));
if (unusedModels.length) {
  console.log(
    `\nℹ️  ${unusedModels.length} Sketchfab model(s) not mapped to any local variant:`
  );
  unusedModels.forEach((m) => console.log(`   - ${m.name}  (${m.uid})`));
}
console.log();
