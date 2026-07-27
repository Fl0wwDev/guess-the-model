// Sportive vs citadine — the quiz's only filter.
//
// The line: **a sportive exists to go fast** (supercars, GT, roadsters, coupés,
// race cars, and BMW's M / M Performance line-up). **A citadine exists to carry
// people and stuff** (berlines, breaks, SUV, crossovers).
//
// One deliberate exception, and it is the whole reason this file is a list and
// not a heuristic: **at Ferrari and Porsche everything counts as a sportive**,
// SUV included. A Purosangue, a Cayenne and a Macan therefore stay sportives
// while a BMW X3 does not.
//
// Everything not listed below is a sportive, so adding a brand of supercars
// costs nothing. Flipping one car = moving one line.

import { MUSEUM_BRANDS } from "./museum";

export type CarCategory = "sportive" | "citadine";

export const CATEGORY_LABEL: Record<CarCategory, string> = {
  sportive: "Sportives",
  citadine: "Citadines",
};

/** Museum model ids that are everyday cars. Anything absent is a sportive. */
const CITADINES = new Set<string>([
  // ── BMW — SUV et crossovers
  "bmw-x1",
  "bmw-x2",
  "bmw-x3",
  "bmw-x4",
  "bmw-x5",
  "bmw-x6",
  "bmw-x7",
  // ── BMW — berlines, breaks, limousines, compactes
  "bmw-1-series", // gamme compacte, même si cette variante-là est un coupé 128i
  "bmw-3-series",
  "bmw-4-series", // 430i xDrive Coupé — coupé de série, pas une M
  "bmw-5-series", // Gran Turismo
  "bmw-218i", // Gran Coupé 1.5
  "bmw-328i", // E46 Sport
  "bmw-330i",
  "bmw-335i", // Gran Turismo
  "bmw-750li",
  // ── Lamborghini — les trois qui ne sont pas des sportives
  "lamborghini-urus", // SUV
  "lamborghini-estoque", // berline 4 portes (concept)
  "lamborghini-lanzador", // crossover GT (concept)
]);

export function categoryOf(modelId: string): CarCategory {
  return CITADINES.has(modelId) ? "citadine" : "sportive";
}

/** How many museum models fall in each bucket — shown in the quiz picker. */
export function categoryCounts(): Record<CarCategory, number> {
  const counts: Record<CarCategory, number> = { sportive: 0, citadine: 0 };
  for (const brand of MUSEUM_BRANDS) {
    for (const model of brand.models) counts[categoryOf(model.id)]++;
  }
  return counts;
}
