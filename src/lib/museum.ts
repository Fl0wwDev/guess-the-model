import type { CarModel } from "./cars";

/**
 * URL slug for a model = its id with the brand prefix stripped.
 * "ferrari-250-gto" → "250-gto". Reversible: modelId = `${brand}-${slug}`
 * (brand ids never contain hyphens).
 */
export function modelSlug(model: CarModel): string {
  return model.id.slice(model.brandId.length + 1);
}

/** Museum path for a model, e.g. "/musee/ferrari/f40". */
export function modelHref(model: CarModel): string {
  return `/musee/${model.brandId}/${modelSlug(model)}`;
}

/** Rebuild a model id from URL params. */
export function modelIdFrom(brand: string, slug: string): string {
  return `${brand}-${slug}`;
}
