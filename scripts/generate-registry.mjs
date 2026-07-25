#!/usr/bin/env node
/**
 * generate-registry.mjs
 *
 * Scans public/models/ and generates src/lib/cars.ts with a hierarchical
 * registry: Brand → CarModel → CarVariant.
 *
 * Handles two directory layouts:
 *   public/models/<brand>/<model>/<variant>.glb   (organized — Ferrari, Lambo, Porsche)
 *   public/models/<brand>/<file>.glb              (flat — Bugatti, Dodge, Ford, Toyota)
 *
 * Run:  npm run generate:registry
 */

import {
  readdirSync,
  statSync,
  writeFileSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { join, basename, extname } from "node:path";

const ROOT = process.cwd();
const MODELS_DIR = join(ROOT, "public", "models");
const OUTPUT = join(ROOT, "src", "lib", "cars.ts");
const OVERRIDES_FILE = join(ROOT, "src", "lib", "base-variants.json");

// ── Brand display names ─────────────────────────────────────────────

const BRAND_DISPLAY = {
  bugatti: "Bugatti",
  dodge: "Dodge",
  ferrari: "Ferrari",
  ford: "Ford",
  lamborghini: "Lamborghini",
  porsche: "Porsche",
  toyota: "Toyota",
};

// ── Name helpers ────────────────────────────────────────────────────

/**
 * Words that should stay fully UPPERCASE in display names.
 * Extend this set as you add more brands/models.
 */
const FORCE_UPPER = new Set([
  "gt",  "gto", "gts", "gtb", "gt2", "gt3", "gt4",
  "sv",  "svj", "rs",  "rt",  "lm",  "lp",  "se",  "st",
  "ff",  "sf",  "sp",  "sc",  "tr",  "tb",  "qv",  "hp",
  "rwd", "awd", "fxx", "rwb", "nfs", "xx",
  "lbworks", "lbsilhouette", "lmdh",
  "evo", "bhp",
]);

/** Capitalize a single word smartly for car names. */
function smartCap(word) {
  const lo = word.toLowerCase();
  if (/^\d/.test(word)) return word;                       // "2019" → "2019"
  if (FORCE_UPPER.has(lo)) return word.toUpperCase();      // "gto" → "GTO"
  if (/^[a-z]{1,2}$/i.test(word)) return word.toUpperCase(); // "sp" → "SP"
  if (/^[a-z]+\d/i.test(word) && word.length <= 7)        // "lp700" → "LP700"
    return word.toUpperCase();
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** Turn a raw filename stem into a human display name. */
function filenameToDisplay(filename) {
  return basename(filename, extname(filename))
    .replace(/[_-]+/g, " ")       // underscores / hyphens → spaces
    .replace(/\s+/g, " ")         // collapse double spaces
    .trim()
    .split(" ")
    .map(smartCap)
    .join(" ");
}

/** Extract leading 4-digit year from a filename, or null. */
function extractYear(filename) {
  const m = basename(filename).match(/^(\d{4})[_\s-]/);
  return m ? parseInt(m[1], 10) : null;
}

/** URL-safe slug from an arbitrary string. */
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Directory name → display name (just swap _ for space, keep casing). */
function dirToDisplay(name) {
  return name.replace(/_/g, " ");
}

/**
 * Infer a short model name from a flat .glb filename by stripping year
 * and brand prefix.  e.g. "2024_bugatti_mistral.glb" → "Mistral"
 */
function inferModelName(filename, brandId) {
  let stem = basename(filename, ".glb");
  // strip leading year
  stem = stem.replace(/^\d{4}[_\s-]+/, "");
  // strip "free_" prefix (some Sketchfab downloads)
  stem = stem.replace(/^free[_\s-]+/i, "");
  // strip brand name
  const brandRe = new RegExp(`^${brandId}[_\\s-]+`, "i");
  stem = stem.replace(brandRe, "");
  // cleanup and capitalize
  return stem
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map(smartCap)
    .join(" ");
}

// ── Base-variant selection ──────────────────────────────────────────

/**
 * Manual overrides: { "<modelId>": "<variantId>" }.
 * Anything listed here beats the heuristic. Edit src/lib/base-variants.json
 * (NOT this file) to pin a base variant. Missing file → {} (heuristic only).
 */
function loadOverrides() {
  if (!existsSync(OVERRIDES_FILE)) return {};
  try {
    return JSON.parse(readFileSync(OVERRIDES_FILE, "utf-8"));
  } catch (e) {
    console.warn(`⚠️  Could not parse ${OVERRIDES_FILE}: ${e.message}`);
    return {};
  }
}

const OVERRIDES = loadOverrides();

/**
 * Penalty score for a variant filename stem — higher = LESS likely to be the
 * "base" version of a model. The base is the plain, closed-roof, road-going,
 * factory-standard car; open-tops, race/track editions, hardcore specials,
 * anniversary editions and non-official (game-ripped) files are demoted.
 * Purely RELATIVE within one model — a lone variant is always the base.
 */
function basePenalty(stem) {
  const s = stem.toLowerCase();
  let score = 0;
  // Non-official / game rips (CSR2, Forza, NFS…) — avoid at almost any cost.
  if (/(csr2|from[_\s-]|donnas|_nfs|forzavista|ripped)/.test(s)) score += 1000;
  // Open-top bodies.
  if (/(spider|spyder|cabrio|cabriolet|roadster|aperta|targa|_gts\b|[_\s]gts$)/.test(s))
    score += 20;
  // Race / track-only / evolutions.
  if (/(_lm\b|gt2|gt3|gt4|gte\b|challenge|competizione|corsa|_xx\b|[_\s]xx[_\s-]|evoluzione|_evo\b|modificata|pista|_k\b|-k\b)/.test(s))
    score += 15;
  // Anniversary / named editions.
  if (/(anniversary|_70th|edition|deborah|patrol)/.test(s)) score += 12;
  // Hardcore road specials (still a real car, mild demotion so the plain one wins).
  if (/(scuderia|tdf|speciale|superleggera|\bstradale\b)/.test(s)) score += 6;
  return score;
}

/** Pick the base variant of a model. Override wins; else lowest penalty, then
 * earliest year, then alphabetical (stable). */
function pickBaseVariantId(modelId, variants) {
  const override = OVERRIDES[modelId];
  if (override) {
    if (variants.some((v) => v.id === override)) return override;
    console.warn(
      `⚠️  base-variant override "${override}" not found in model "${modelId}" — using heuristic.`
    );
  }
  const ranked = [...variants].sort((a, b) => {
    const pa = basePenalty(a._stem);
    const pb = basePenalty(b._stem);
    if (pa !== pb) return pa - pb;
    const ya = a.year ?? Infinity;
    const yb = b.year ?? Infinity;
    if (ya !== yb) return ya - yb;
    return a.id.localeCompare(b.id);
  });
  return ranked[0].id;
}

// ── Scanner ─────────────────────────────────────────────────────────

function scanBrand(brandDir, brandId) {
  const brandName = BRAND_DISPLAY[brandId] || smartCap(brandId);
  const entries = readdirSync(brandDir, { withFileTypes: true });

  const models = [];

  // ── Organized layout: subdirectories are model folders ────────────
  const modelDirs = entries.filter(
    (e) => e.isDirectory() && !e.name.startsWith(".")
  );

  for (const dir of modelDirs) {
    const modelPath = join(brandDir, dir.name);
    const glbs = readdirSync(modelPath).filter((f) => f.endsWith(".glb"));
    if (glbs.length === 0) continue;

    const modelDisplayName = dirToDisplay(dir.name);
    const modelId = `${brandId}-${slugify(dir.name)}`;

    const variants = glbs
      .sort() // alphabetical ≈ chronological for year-prefixed names
      .map((f) => ({
        id: `${modelId}--${slugify(basename(f, ".glb"))}`,
        name: filenameToDisplay(f),
        year: extractYear(f),
        url: `/models/${brandId}/${dir.name}/${f}`,
        _stem: basename(f, ".glb"),
      }));

    const baseVariantId = pickBaseVariantId(modelId, variants);
    variants.forEach((v) => delete v._stem);

    models.push({
      id: modelId,
      name: modelDisplayName,
      brandId,
      baseVariantId,
      variants,
    });
  }

  // ── Flat layout: loose .glb files at brand root ──────────────────
  const rootGlbs = entries
    .filter((e) => e.isFile() && e.name.endsWith(".glb"))
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const file of rootGlbs) {
    const shortName = inferModelName(file.name, brandId);
    const modelId = `${brandId}-${slugify(shortName)}`;

    const variantId = `${modelId}--${slugify(basename(file.name, ".glb"))}`;
    models.push({
      id: modelId,
      name: shortName,
      brandId,
      baseVariantId: variantId,
      variants: [
        {
          id: variantId,
          name: filenameToDisplay(file.name),
          year: extractYear(file.name),
          url: `/models/${brandId}/${file.name}`,
        },
      ],
    });
  }

  // Sort models alphabetically by name
  models.sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }));

  return { id: brandId, name: brandName, models };
}

// ── Main ────────────────────────────────────────────────────────────

const brandDirs = readdirSync(MODELS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith("."))
  .sort((a, b) => a.name.localeCompare(b.name));

const brands = brandDirs.map((d) =>
  scanBrand(join(MODELS_DIR, d.name), d.name)
);

const totalModels = brands.reduce((s, b) => s + b.models.length, 0);
const totalVariants = brands.reduce(
  (s, b) => s + b.models.reduce((s2, m) => s2 + m.variants.length, 0),
  0
);

// ── Generate TypeScript ─────────────────────────────────────────────

const ts = `\
// ─────────────────────────────────────────────────────────────────────
// AUTO-GENERATED by scripts/generate-registry.mjs — do not edit by hand.
// Run:  npm run generate:registry
// Generated: ${new Date().toISOString()}
// ${brands.length} brands · ${totalModels} models · ${totalVariants} variants
// ─────────────────────────────────────────────────────────────────────

/* ── Types ─────────────────────────────────────────────────────────── */

export type CarVariant = {
  /** Unique id, e.g. "ferrari-f40--1987-ferrari-f40" */
  id: string;
  /** Display name, e.g. "1987 Ferrari F40" */
  name: string;
  /** Year extracted from filename, or null */
  year: number | null;
  /** Path to the GLB under public/, e.g. "/models/ferrari/F40/1987_ferrari_f40.glb" */
  url: string;
};

export type CarModel = {
  /** Unique id, e.g. "ferrari-f40" */
  id: string;
  /** Model display name, e.g. "F40" */
  name: string;
  /** Brand slug, e.g. "ferrari" */
  brandId: string;
  /** Id of the "base" variant (plain factory version) — used by quiz + museum
   *  hero. Chosen by heuristic, overridable via src/lib/base-variants.json. */
  baseVariantId: string;
  /** All available GLB variants (editions, years, tuners, etc.) */
  variants: CarVariant[];
};

export type Brand = {
  /** Slug, e.g. "ferrari" */
  id: string;
  /** Display name, e.g. "Ferrari" */
  name: string;
  /** All models for this brand, sorted alphabetically */
  models: CarModel[];
};

/* ── Registry ──────────────────────────────────────────────────────── */

export const BRANDS: Brand[] = ${JSON.stringify(brands, null, 2)};

/* ── Flat helpers ──────────────────────────────────────────────────── */

/** Every model across all brands. */
export const ALL_MODELS: CarModel[] = BRANDS.flatMap((b) => b.models);

/** Every variant across all models. */
export const ALL_VARIANTS: CarVariant[] = ALL_MODELS.flatMap((m) => m.variants);

/** Quick lookup by id. */
export const BRAND_MAP = new Map<string, Brand>(BRANDS.map((b) => [b.id, b]));
export const MODEL_MAP = new Map<string, CarModel>(ALL_MODELS.map((m) => [m.id, m]));
export const VARIANT_MAP = new Map<string, CarVariant>(
  ALL_VARIANTS.map((v) => [v.id, v])
);

/** The base variant of a model (falls back to the first variant). */
export function baseVariant(model: CarModel): CarVariant {
  return (
    model.variants.find((v) => v.id === model.baseVariantId) ?? model.variants[0]
  );
}

/* ── Legacy compat (flat Car type used by garage / quiz) ───────────── */

export type Car = {
  id: string;
  /** Model id (key into MODEL_MAP), e.g. "ferrari-f40". */
  modelId: string;
  /** Display name shown in the garage. */
  name: string;
  brand: string;
  /** Brand slug, e.g. "ferrari". */
  brandId: string;
  /** URL of the base variant GLB. */
  url: string;
  /** Scale reference — kept for the quiz; default 4.5 for auto-generated. */
  targetLength: number;
};

/**
 * One entry per **model** (not per variant), using the BASE variant's URL.
 * Used by the garage carousel and the quiz (base version only).
 */
export const CARS: Car[] = ALL_MODELS.map((m) => {
  const brand = BRAND_MAP.get(m.brandId)!;
  const base = baseVariant(m);
  return {
    id: m.id,
    modelId: m.id,
    name: \`\${brand.name} \${m.name}\`,
    brand: brand.name,
    brandId: m.brandId,
    url: base.url,
    targetLength: 4.5,
  };
});
`;

writeFileSync(OUTPUT, ts, "utf-8");

// ── Summary ─────────────────────────────────────────────────────────

console.log(`\n✅ Generated ${OUTPUT}`);
console.log(`   ${brands.length} brands · ${totalModels} models · ${totalVariants} variants\n`);

for (const b of brands) {
  const vCount = b.models.reduce((s, m) => s + m.variants.length, 0);
  console.log(`   ${b.name.padEnd(14)} ${String(b.models.length).padStart(3)} models  ${String(vCount).padStart(4)} variants`);
}
console.log();
