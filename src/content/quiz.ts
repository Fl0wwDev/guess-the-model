// The quiz pool, derived at build time from the museum catalogue.
//
// One entry per MODEL (its base variant), never per variant: the answer is a
// model name, so two variants of the same car would make two questions with the
// same answer — and the tuner variants (widebody kits, film liveries) would be
// unfair to guess a base model from.

import {
  MUSEUM_BRANDS,
  hdThumbnail,
  museumBaseVariant,
  museumModelHref,
} from "./museum";
import { categoryOf, type CarCategory } from "./categories";
import { getSpecs } from "./specs";

export type QuizCar = {
  /** Museum model id — also the answer's identity. */
  id: string;
  brandId: string;
  brandName: string;
  /** Model name alone, e.g. "F40" — this is what the player picks. */
  name: string;
  category: CarCategory;
  year: number | null;
  /** Sketchfab uid of the base variant — the 3D revealed after the answer. */
  uid: string;
  /** Highest-resolution thumbnail available: the quiz zooms into it. */
  image: string | null;
  /** One line of bragging rights shown on the reveal. */
  hint: string | null;
  href: string;
};

function buildPool(): QuizCar[] {
  const out: QuizCar[] = [];
  for (const brand of MUSEUM_BRANDS) {
    for (const model of brand.models) {
      // A model with no usable name can't be an answer (the catalogue has one
      // such entry, derived from the "&" of "Fast & Furious").
      if (!model.name || model.name.length < 2) continue;
      const base = museumBaseVariant(model);
      const uid = base.sketchfab?.uid;
      if (!uid) continue;

      const specs = getSpecs(base.id);
      const hint =
        specs?.ch && specs?.moteur
          ? `${specs.moteur} · ${specs.ch} ch`
          : specs?.moteur ?? (specs?.ch ? `${specs.ch} ch` : null);

      out.push({
        id: model.id,
        brandId: brand.id,
        brandName: brand.name,
        name: model.name,
        category: categoryOf(model.id),
        year: base.year,
        uid,
        image: hdThumbnail(uid) ?? base.sketchfab.thumbnail,
        hint,
        href: museumModelHref(brand.id, model),
      });
    }
  }
  return out;
}

export const QUIZ_POOL: QuizCar[] = buildPool();
export const QUIZ_POOL_SIZE = QUIZ_POOL.length;

export function quizPoolCounts(): Record<CarCategory | "toutes", number> {
  return {
    toutes: QUIZ_POOL.length,
    sportive: QUIZ_POOL.filter((c) => c.category === "sportive").length,
    citadine: QUIZ_POOL.filter((c) => c.category === "citadine").length,
  };
}
