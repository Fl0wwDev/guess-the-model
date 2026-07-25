#!/usr/bin/env node
/**
 * build-museum.mjs
 *
 * Builds the museum catalogue DIRECTLY from Ddiaz Design's Sketchfab
 * collections (full Sketchfab — no local GLB). For each brand in
 * src/content/museum/collections.json it fetches the collection, groups models
 * into (model → variants), picks a base variant, and writes
 *   src/content/museum/<brand>.json
 * Each variant carries its Sketchfab uid + thumbnail, so coverage is 100% by
 * construction (no fragile name matching).
 *
 * Grouping is SEEDED from the existing folder registry (src/lib/cars.ts) so the
 * ids for brands we already had stay identical → hand-authored specs keep
 * working. Brands without a seed (e.g. BMW) use the `modelKeys` list in the
 * config, then a first-token fallback.
 *
 * Run:  npm run build:museum
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";

const ROOT = process.cwd();
const CONFIG = join(ROOT, "src", "content", "museum", "collections.json");

// ── helpers ───────────────────────────────────────────────────────────

const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const slugify = (s) =>
  (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const extractYear = (name) => {
  const m = String(name).match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0], 10) : null;
};

// Tuner / junk / chassis tokens to skip when guessing a model from a name.
const JUNK = new Set([
  "free", "fast", "furious", "donnas", "donna", "s", "mansory", "vorsteiner",
  "liberty", "walk", "lb", "lbworks", "pandem", "varis", "duke", "dynamics",
  "dtm", "fiberwerkz", "rocket", "bunny", "prior", "design", "widebody",
  "bodykit", "body", "kit", "by", "the", "based", "★", "md4",
]);
const isChassis = (t) => /^[efgu]\d{2}$/i.test(t); // BMW-style E92, F80…

/** Penalty: higher = LESS likely to be the plain base variant. (from registry) */
function basePenalty(name) {
  const s = name.toLowerCase();
  let score = 0;
  if (/(csr2|from[_\s-]|donna|_nfs|forzavista|ripped|fast furious|mansory|vorsteiner|liberty|pandem|varis|widebody|body kit|duke)/.test(s))
    score += 1000;
  if (/(spider|spyder|cabrio|cabriolet|roadster|aperta|targa|\bgts\b|convertible)/.test(s))
    score += 20;
  if (/(\blm\b|gt2|gt3|gt4|\bgte\b|challenge|competizione|corsa|\bxx\b|evoluzione|\bevo\b|modificata|pista|\bk\b|racecar|trofeo|dtm|gts)/.test(s))
    score += 15;
  if (/(anniversary|_70th|70th|edition|deborah|patrol|heritage|ad personam)/.test(s))
    score += 12;
  if (/(scuderia|tdf|speciale|superleggera|\bstradale\b|\bcs\b|\bcsl\b|gts|sto|\bsv\b|svj|ultimae)/.test(s))
    score += 6;
  return score;
}

// ── load registry seeds (existing model ids/names per brand) ──────────

function loadRegistrySeeds() {
  const path = join(ROOT, "src", "lib", "cars.ts");
  if (!existsSync(path)) return {};
  const src = readFileSync(path, "utf-8");
  const marker = "export const BRANDS: Brand[] = ";
  const i = src.indexOf(marker);
  if (i === -1) return {};
  const json = src.slice(i + marker.length);
  const brands = JSON.parse(json.slice(0, json.indexOf("];\n") + 1));
  const seeds = {};
  for (const b of brands) {
    seeds[b.id] = b.models.map((m) => ({
      modelId: m.id,
      modelName: m.name,
      keyNorm: norm(m.name),
    }));
  }
  return seeds;
}

// ── fetch a collection ────────────────────────────────────────────────

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

function pickThumb(model) {
  const imgs = ((model.thumbnails || {}).images || [])
    .slice()
    .sort((a, b) => a.width - b.width);
  if (!imgs.length) return null;
  return (imgs.find((i) => i.width >= 1024) || imgs[imgs.length - 1]).url;
}

/** Strip year + brand (whole word only) from a name → the "phrase". */
function phraseOf(name, brandName) {
  return String(name)
    .replace(/\b(19|20)\d{2}\b/g, " ")
    .replace(new RegExp(`\\b${brandName}\\b`, "ig"), " ")
    .replace(/\s+/g, " ")
    .trim();
}

const toks = (s) => s.split(/[\s-]+/).map(norm).filter(Boolean);

/** Does keyToks appear as a consecutive run in phraseToks? The first key token
 *  may prefix-match (so "F12" catches "F12tdf"); the rest need equality. */
function matchTokens(phraseToks, keyToks) {
  if (!keyToks.length) return false;
  for (let i = 0; i + keyToks.length <= phraseToks.length; i++) {
    let ok = true;
    for (let j = 0; j < keyToks.length; j++) {
      const pt = phraseToks[i + j];
      const kt = keyToks[j];
      if (j === 0) {
        if (!(pt === kt || (kt.length >= 3 && pt.startsWith(kt)))) {
          ok = false;
          break;
        }
      } else if (pt !== kt) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

/** Guess a model {id,name} for a Ddiaz model, seeded then heuristic. */
function classify(model, brandId, brandName, seeds, extraKeys) {
  const phrase = phraseOf(model.name, brandName);
  const phraseToks = toks(phrase);

  // 1) seed from existing registry model names (longest/most specific first)
  for (const s of seeds) {
    if (matchTokens(phraseToks, toks(s.modelName))) {
      return { id: s.modelId, name: s.modelName };
    }
  }
  // 2) manual model keys (e.g. BMW)
  for (const key of extraKeys) {
    if (matchTokens(phraseToks, toks(key))) {
      return { id: `${brandId}-${slugify(key)}`, name: key };
    }
  }
  // 3) fallback: first significant token of the phrase
  const raw = phrase.split(/\s+/).filter(Boolean);
  let idx = 0;
  while (
    idx < raw.length - 1 &&
    (JUNK.has(raw[idx].toLowerCase()) || isChassis(raw[idx]))
  )
    idx++;
  const key = raw[idx] || phrase || "modele";
  return { id: `${brandId}-${slugify(key)}`, name: key };
}

// ── build one brand ───────────────────────────────────────────────────

async function buildBrand(brandId, cfg, seeds) {
  const brandName = cfg.name;
  const models = await fetchCollection(cfg.collection);

  // Most-specific first: more tokens, then longer, so "FXX K" beats "FXX".
  const seedList = (seeds[brandId] || [])
    .slice()
    .sort(
      (a, b) =>
        toks(b.modelName).length - toks(a.modelName).length ||
        b.keyNorm.length - a.keyNorm.length
    );
  const extraKeys = (cfg.modelKeys || [])
    .slice()
    .sort(
      (a, b) => toks(b).length - toks(a).length || norm(b).length - norm(a).length
    );

  const groups = new Map(); // modelId → { id, name, variants[] }
  for (const m of models) {
    const cls = classify(m, brandId, brandName, seedList, extraKeys);
    if (!groups.has(cls.id))
      groups.set(cls.id, { id: cls.id, name: cls.name, variants: [] });
    groups.get(cls.id).variants.push({
      id: `${cls.id}--${slugify(m.name)}`,
      name: m.name,
      year: extractYear(m.name),
      sketchfab: {
        uid: m.uid,
        thumbnail: pickThumb(m),
        name: m.name,
        author: (m.user || {}).displayName || null,
        license: (m.license || {}).slug || null,
      },
    });
  }

  const modelsOut = [...groups.values()].map((g) => {
    g.variants.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999) || a.id.localeCompare(b.id));
    const base = g.variants
      .slice()
      .sort(
        (a, b) =>
          basePenalty(a.name) - basePenalty(b.name) ||
          (a.year ?? 9999) - (b.year ?? 9999) ||
          a.id.localeCompare(b.id)
      )[0];
    return { id: g.id, name: g.name, baseVariantId: base.id, variants: g.variants };
  });

  // chronological by base year
  modelsOut.sort((a, b) => {
    const ya = a.variants.find((v) => v.id === a.baseVariantId)?.year ?? 9999;
    const yb = b.variants.find((v) => v.id === b.baseVariantId)?.year ?? 9999;
    return ya - yb || a.name.localeCompare(b.name);
  });

  const out = { id: brandId, name: brandName, models: modelsOut };
  const outPath = join(ROOT, "src", "content", "museum", `${brandId}.json`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n", "utf-8");

  const vCount = modelsOut.reduce((s, m) => s + m.variants.length, 0);
  console.log(
    `  ${brandName.padEnd(13)} ${String(modelsOut.length).padStart(3)} models  ${String(vCount).padStart(4)} variants`
  );
  return modelsOut;
}

// ── main ──────────────────────────────────────────────────────────────

const config = JSON.parse(readFileSync(CONFIG, "utf-8"));
const seeds = loadRegistrySeeds();

console.log("\nBuilding museum from Sketchfab collections…\n");
for (const [brandId, cfg] of Object.entries(config)) {
  await buildBrand(brandId, cfg, seeds);
}
console.log();
