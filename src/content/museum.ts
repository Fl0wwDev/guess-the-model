// Museum catalogue — built from Ddiaz Design's Sketchfab collections by
// scripts/build-museum.mjs (npm run build:museum). Full Sketchfab, no local GLB.
// Do NOT edit the per-brand JSON by hand; edit the collection config + rerun.

import ferrari from "./museum/ferrari.json";
import lamborghini from "./museum/lamborghini.json";
import porsche from "./museum/porsche.json";
import bmw from "./museum/bmw.json";
import bugatti from "./museum/bugatti.json";

export type MuseumSketchfab = {
  uid: string;
  thumbnail: string | null;
  name: string;
  author: string | null;
  license: string | null;
};

export type MuseumVariant = {
  id: string;
  name: string;
  year: number | null;
  sketchfab: MuseumSketchfab;
};

export type MuseumModel = {
  id: string;
  name: string;
  baseVariantId: string;
  variants: MuseumVariant[];
};

export type MuseumBrand = {
  id: string;
  name: string;
  models: MuseumModel[];
};

/** Display order of the museum brands. */
export const MUSEUM_BRANDS: MuseumBrand[] = [
  ferrari,
  lamborghini,
  porsche,
  bmw,
  bugatti,
] as MuseumBrand[];

const BRAND_MAP = new Map(MUSEUM_BRANDS.map((b) => [b.id, b]));
const MODEL_MAP = new Map(
  MUSEUM_BRANDS.flatMap((b) => b.models.map((m) => [m.id, m]))
);

export function getMuseumBrand(id: string): MuseumBrand | undefined {
  return BRAND_MAP.get(id);
}

/** Model id is `${brandId}-${slug}`; brand ids never contain hyphens. */
export function museumModelSlug(model: MuseumModel, brandId: string): string {
  return model.id.slice(brandId.length + 1);
}

export function museumModelHref(brandId: string, model: MuseumModel): string {
  return `/musee/${brandId}/${museumModelSlug(model, brandId)}`;
}

export function getMuseumModel(
  brandId: string,
  slug: string
): MuseumModel | undefined {
  return MODEL_MAP.get(`${brandId}-${slug}`);
}

/** Base variant of a model (falls back to the first). */
export function museumBaseVariant(model: MuseumModel): MuseumVariant {
  return (
    model.variants.find((v) => v.id === model.baseVariantId) ?? model.variants[0]
  );
}
