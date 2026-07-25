// Museum specs, keyed by **variant id** (see src/lib/cars.ts).
// Hand-authored, NOT generated. The registry generator never touches this.
// Add a brand file under ./specs/<brand>.json and register it below.

import ferrari from "./specs/ferrari.json";

/** Technical + editorial data shown on a model's museum page. All optional:
 *  the UI degrades to "—" for any missing field. */
export type CarSpecs = {
  /** Free text, era-dependent, e.g. "≈ 400 000 € (à la sortie)". */
  prix?: string;
  /** Puissance en chevaux (ch DIN). */
  ch?: number;
  /** Poids (kg) — à sec ou en ordre de marche selon la source. */
  poids?: number;
  /** Vitesse maximale, km/h. */
  vitesseMax?: number;
  /** 0 à 100 km/h, en secondes. */
  zeroCent?: number;
  /** Description moteur, e.g. "V8 3.9L biturbo". */
  moteur?: string;
  /** Volume / série, e.g. "1 311 exemplaires (1987–1992)". */
  production?: string;
  /** Anecdote / histoire, une à deux phrases. */
  anecdote?: string;
};

const SPECS: Record<string, CarSpecs> = {
  ...(ferrari as Record<string, CarSpecs>),
};

/** Specs for a given variant id, or undefined if none authored yet. */
export function getSpecs(variantId: string): CarSpecs | undefined {
  return SPECS[variantId];
}

/** Does this variant have any authored specs? */
export function hasSpecs(variantId: string): boolean {
  return variantId in SPECS;
}
