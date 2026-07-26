// Landing-page garage carousel — a flat, curated walk through the whole museum
// catalogue (full Sketchfab: every entry is a Sketchfab uid + CDN thumbnail).
// Built from the same data as /musee, so there is exactly one catalogue.

import {
  MUSEUM_BRANDS,
  museumBaseVariant,
  museumModelHref,
  type MuseumBrand,
} from "./museum";

export type ShowcaseCar = {
  /** Museum model id, e.g. "ferrari-f40". */
  id: string;
  brandId: string;
  brandName: string;
  /** Model name alone, e.g. "F40". */
  name: string;
  year: number | null;
  /** Sketchfab uid of the model's base variant. */
  uid: string;
  /** Sketchfab CDN thumbnail — used as the instant poster before the viewer boots. */
  thumbnail: string | null;
  /** Number of extra variants beyond the base (shown as a hint). */
  variantCount: number;
  /** Link to this model's museum page. */
  href: string;
};

/** Models of one brand, oldest first (undated last), like the museum grid. */
function chronological(brand: MuseumBrand): ShowcaseCar[] {
  return [...brand.models]
    .sort((a, b) => {
      const ya = museumBaseVariant(a).year ?? Infinity;
      const yb = museumBaseVariant(b).year ?? Infinity;
      return ya - yb || a.name.localeCompare(b.name);
    })
    .map((m) => {
      const base = museumBaseVariant(m);
      return {
        id: m.id,
        brandId: brand.id,
        brandName: brand.name,
        name: m.name,
        year: base.year,
        uid: base.sketchfab.uid,
        thumbnail: base.sketchfab.thumbnail,
        variantCount: m.variants.length,
        href: museumModelHref(brand.id, m),
      };
    });
}

/**
 * Round-robin interleave of the brands: pressing → never shows the same marque
 * twice in a row, so the carousel feels like a curated garage rather than an
 * alphabetical dump. Within a brand the order stays chronological, and the
 * whole thing is deterministic (same order on server and client — no hydration
 * mismatch, and a shareable index).
 */
function buildShowcase(): ShowcaseCar[] {
  const perBrand = MUSEUM_BRANDS.map(chronological);
  const longest = Math.max(0, ...perBrand.map((list) => list.length));
  const out: ShowcaseCar[] = [];
  for (let i = 0; i < longest; i++) {
    for (const list of perBrand) {
      if (i < list.length) out.push(list[i]);
    }
  }
  return out;
}

export const SHOWCASE: ShowcaseCar[] = buildShowcase();
