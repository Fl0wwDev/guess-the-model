// Museum specs, keyed by **variant id** (see src/content/museum.ts).
// Researched + verified per variant, NOT generated from Sketchfab: the catalogue
// build only checks that every key here still resolves to a variant.
// Add a brand file under ./specs/<brand>.json and register it below.

import ferrari from "./specs/ferrari.json";
import lamborghini from "./specs/lamborghini.json";
import porsche from "./specs/porsche.json";
import bmw from "./specs/bmw.json";
import bugatti from "./specs/bugatti.json";

/** Technical + editorial data shown on a model's museum page. All optional:
 *  the UI simply drops any field it has no value for. */
export type CarSpecs = {
  /** Free text, era-dependent, e.g. "≈ 400 000 € (à la sortie)". */
  prix?: string;
  /** Puissance en chevaux (ch DIN). */
  ch?: number;
  /** Chevaux fiscaux français. */
  cvFiscaux?: number;
  /** Couple maximal, en Nm. */
  couple?: number;
  /** Poids (kg) — à sec ou en ordre de marche selon la source. */
  poids?: number;
  /** Vitesse maximale, km/h. */
  vitesseMax?: number;
  /** 0 à 100 km/h, en secondes. */
  zeroCent?: number;
  /** Description moteur, e.g. "V8 3.9L biturbo". */
  moteur?: string;
  /** Boîte + roues motrices, e.g. "double embrayage 7 rapports, propulsion". */
  transmission?: string;
  /** Volume / série, e.g. "1 311 exemplaires (1987–1992)". */
  production?: string;
  /** Anecdote / histoire, une à deux phrases. */
  anecdote?: string;
};

const SPECS: Record<string, CarSpecs> = {
  ...(ferrari as Record<string, CarSpecs>),
  ...(lamborghini as Record<string, CarSpecs>),
  ...(porsche as Record<string, CarSpecs>),
  ...(bmw as Record<string, CarSpecs>),
  ...(bugatti as Record<string, CarSpecs>),
};

/** Specs for a given variant id, or undefined if none authored yet. */
export function getSpecs(variantId: string): CarSpecs | undefined {
  return SPECS[variantId];
}

/** Does this variant have any authored specs? */
export function hasSpecs(variantId: string): boolean {
  return variantId in SPECS;
}
