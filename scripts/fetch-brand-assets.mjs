#!/usr/bin/env node
/**
 * Downloads the museum's brand assets from Wikimedia Commons:
 *
 *   - public/brands/<brand>.jpg  — the historical photograph shown on /musee
 *                                  when a marque is hovered
 *   - public/logos/<brand>.svg   — the marque's logo for the same grid
 *
 * and rewrites public/brands/CREDITS.md with the author + licence of every
 * photograph, which is what the CC licences require of us.
 *
 * Idempotent: a file that already exists is left alone (delete it to refresh).
 * Commons' thumbnail renderer rate-limits hard (HTTP 429), so this walks the
 * list slowly and retries — expect it to take a couple of minutes on a cold run.
 *
 *   node scripts/fetch-brand-assets.mjs          # only what is missing
 *   node scripts/fetch-brand-assets.mjs --force  # re-download everything
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BRANDS_DIR = join(ROOT, "public", "brands");
const LOGOS_DIR = join(ROOT, "public", "logos");
const UA = "guess-the-model/0.1 (personal, non-commercial museum webapp)";
const FORCE = process.argv.includes("--force");

/** Photographs: 3/4 views with the car centred, because the panel crops to portrait. */
const PHOTOS = {
  ferrari: { file: "A Ferrari F50.jpg", caption: "Ferrari F50, 1995" },
  lamborghini: {
    file: "1971 Lamborghini Miura P400 SV.jpg",
    caption: "Lamborghini Miura P400 SV, 1971",
  },
  porsche: {
    file: "Porsche 911 Carrera RS 2.7 (1972) Solitude Revival 2022 1X7A0355.jpg",
    caption: "Porsche 911 Carrera RS 2.7, 1972",
  },
  bmw: {
    file: "BMW M1 Procar of BMW Motorsport (BMW M-color) Classic-Gala 2022 1X7A0148.jpg",
    caption: "BMW M1 Procar, 1979",
  },
  bugatti: { file: "Bugatti Type 35.jpg", caption: "Bugatti Type 35, 1924" },
};

/** Logos: SVG only, and only files Commons tags as public domain / simple shapes.
 *  Trademarks stay their owners' — this is nominative, private, non-commercial use. */
const LOGOS = {
  bmw: "BMW.svg",
  porsche: "Porsche Wordmark Logo Black.svg",
  lamborghini: "Lamborghini - logo wordmark (italy, 1963-).svg",
  bugatti: "Bugatti logo.svg",
  // ferrari: already in public/logos/ferrari.svg
};

const PHOTO_WIDTH = 2000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (s) => (s ? String(s).replace(/<[^>]*>/g, "").trim() : null);
const isJpeg = (b) => b?.[0] === 0xff && b?.[1] === 0xd8;

async function imageInfo(title, width) {
  const u = new URL("https://commons.wikimedia.org/w/api.php");
  u.search = new URLSearchParams({
    action: "query",
    format: "json",
    titles: "File:" + title,
    prop: "imageinfo",
    iiprop: "url|size|mime|extmetadata",
    ...(width ? { iiurlwidth: String(width) } : {}),
  });
  const res = await fetch(u, { headers: { "User-Agent": UA } });
  const json = await res.json();
  return Object.values(json.query?.pages ?? {})[0]?.imageinfo?.[0] ?? null;
}

async function download(url, { validate } = {}) {
  for (let i = 0; i < 8; i++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (!validate || validate(buf)) return buf;
    }
    // 429 from the thumbnail renderer is the common case — back off and retry.
    await sleep(4000 + i * 2000);
  }
  return null;
}

mkdirSync(BRANDS_DIR, { recursive: true });
mkdirSync(LOGOS_DIR, { recursive: true });

const credits = [];

for (const [brand, { file, caption }] of Object.entries(PHOTOS)) {
  const out = join(BRANDS_DIR, `${brand}.jpg`);
  const info = await imageInfo(file, PHOTO_WIDTH);
  if (!info) {
    console.log(`✗ ${brand}: introuvable sur Commons — ${file}`);
    continue;
  }
  const meta = info.extmetadata ?? {};
  credits.push({
    brand,
    caption,
    file,
    page: info.descriptionurl,
    author: strip(meta.Artist?.value) ?? "auteur inconnu",
    license: strip(meta.LicenseShortName?.value) ?? "voir la page Commons",
    licenseUrl: meta.LicenseUrl?.value ?? null,
  });

  if (existsSync(out) && !FORCE) {
    console.log(`· ${brand}.jpg déjà présent`);
    continue;
  }
  const buf = await download(info.thumburl ?? info.url, { validate: isJpeg });
  if (!buf) {
    console.log(`✗ ${brand}.jpg : Commons a refusé (429 ?) — relancer plus tard`);
    continue;
  }
  writeFileSync(out, buf);
  console.log(`✓ ${brand}.jpg  ${(buf.length / 1024) | 0} KB`);
  await sleep(1500);
}

for (const [brand, file] of Object.entries(LOGOS)) {
  const out = join(LOGOS_DIR, `${brand}.svg`);
  if (existsSync(out) && !FORCE) {
    console.log(`· ${brand}.svg déjà présent`);
    continue;
  }
  const info = await imageInfo(file);
  if (!info) {
    console.log(`✗ ${brand}: logo introuvable — ${file}`);
    continue;
  }
  const buf = await download(info.url, {
    validate: (b) => b.subarray(0, 400).toString("utf8").includes("<svg"),
  });
  if (!buf) {
    console.log(`✗ ${brand}.svg : échec du téléchargement`);
    continue;
  }
  writeFileSync(out, buf);
  console.log(`✓ ${brand}.svg  ${(buf.length / 1024) | 0} KB`);
  await sleep(1500);
}

writeFileSync(
  join(BRANDS_DIR, "CREDITS.md"),
  `# Photographies des marques

Fichiers téléchargés depuis **Wikimedia Commons** par \`scripts/fetch-brand-assets.mjs\`.
Elles ne sont **pas** dans le domaine public : chaque licence impose de créditer
l'auteur. Ce crédit est affiché sur \`/musee\` sous la photo, via
\`BRAND_EDITORIAL[<marque>].photo\` dans \`src/content/brands.ts\` — si vous changez
une photo, mettez les deux à jour.

Usage **privé et non commercial** uniquement (cf. \`CLAUDE.md\` → IP posture).

${credits
  .map(
    (c) => `## ${c.brand}

- **Sujet** : ${c.caption}
- **Fichier** : \`${c.file}\`
- **Auteur** : ${c.author}
- **Licence** : ${c.license}${c.licenseUrl ? ` (${c.licenseUrl})` : ""}
- **Source** : ${c.page}
`
  )
  .join("\n")}
## Logos

Les logos de \`public/logos/\` viennent aussi de Commons, sous étiquette « domaine
public » (formes simples / marques textuelles) côté **droit d'auteur**. Le **droit
des marques** reste celui de leurs propriétaires : usage nominatif, privé, non
commercial, sans affiliation.
`
);
console.log("\n✓ public/brands/CREDITS.md écrit");

// Machine-readable copy, so src/content/brands.ts can be updated without guessing.
writeFileSync(
  join(BRANDS_DIR, "credits.json"),
  JSON.stringify(credits, null, 2) + "\n"
);
