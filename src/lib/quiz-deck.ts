import type { QuizCar } from "@/content/quiz";

export type QuizQuestion = {
  car: QuizCar;
  /** Four cars: the answer plus three decoys, already shuffled. */
  options: QuizCar[];
};

function shuffle<T>(list: readonly T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Decoys come from the SAME MARQUE first. Four Ferraris on screen means the
 * question is really "which Ferrari is this?" — mixing marques would hand the
 * answer over on the badge alone. Only when a marque is too thin (Lamborghini
 * has three citadines in the whole catalogue) do we widen to the same category,
 * then to anything.
 */
function pickDecoys(answer: QuizCar, pool: QuizCar[], n: number): QuizCar[] {
  const others = pool.filter((c) => c.id !== answer.id);
  const tiers = [
    others.filter((c) => c.brandId === answer.brandId),
    others.filter(
      (c) => c.brandId !== answer.brandId && c.category === answer.category
    ),
    others,
  ];

  const picked: QuizCar[] = [];
  const taken = new Set<string>([answer.id]);
  for (const tier of tiers) {
    for (const c of shuffle(tier)) {
      if (picked.length >= n) break;
      if (taken.has(c.id)) continue;
      taken.add(c.id);
      picked.push(c);
    }
    if (picked.length >= n) break;
  }
  return picked;
}

/** `count` questions, no model twice, decoys drawn from the same filtered pool. */
export function buildDeck(pool: QuizCar[], count: number): QuizQuestion[] {
  const cars = shuffle(pool).slice(0, Math.min(count, pool.length));
  return cars.map((car) => ({
    car,
    options: shuffle([car, ...pickDecoys(car, pool, 3)]),
  }));
}

/** Max points for a question answered instantly; floor is FLOOR × MAX. */
export const MAX_POINTS = 1000;
const FLOOR = 0.2;

/** Points for an answer given at eased progress `p` (0 = instant, 1 = zoomed out). */
export function pointsFor(progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  return Math.round(MAX_POINTS * (1 - (1 - FLOOR) * p));
}
