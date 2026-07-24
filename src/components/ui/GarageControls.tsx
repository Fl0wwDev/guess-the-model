"use client";

import { CARS } from "@/lib/cars";
import { useGarage } from "@/lib/garage";

const buttonClass =
  "pointer-events-auto rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm backdrop-blur-md transition hover:border-white/30 hover:bg-white/10 active:scale-95";

export default function GarageControls() {
  const { index, next, prev } = useGarage();
  const car = CARS[index];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-sm uppercase tracking-[0.25em] text-accent">
          {car.brand}
        </p>
        <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
          {car.name}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <button className={buttonClass} onClick={prev} aria-label="Voiture précédente">
          ← Précédente
        </button>
        <span className="w-12 text-center text-xs tabular-nums text-muted">
          {index + 1} / {CARS.length}
        </span>
        <button className={buttonClass} onClick={next} aria-label="Voiture suivante">
          Suivante →
        </button>
      </div>
    </div>
  );
}
