"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { SketchfabEmbed } from "@/components/sketchfab/SketchfabEmbed";
import type { ShowcaseCar } from "@/content/showcase";

/** How long the index must sit still before we boot a viewer for it. Holding
 *  the arrow key then flies through posters instead of spawning 20 iframes. */
const SETTLE_MS = 420;

const navClass =
  "rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm backdrop-blur-md transition hover:border-white/30 hover:bg-white/10 active:scale-95";

/**
 * The landing garage — full Sketchfab. Every car is streamed from Sketchfab, so
 * switching model means booting a new viewer (~1–3 s). To keep ←/→ instant we
 * show the model's Sketchfab CDN thumbnail as a poster immediately and crossfade
 * to the live viewer when it reports its first frame.
 */
export default function GarageShowcase({ cars }: { cars: ShowcaseCar[] }) {
  const [index, setIndex] = useState(0);
  /** The index we actually stream — trails `index` until it settles. */
  const [liveIndex, setLiveIndex] = useState(0);
  /** uid of the viewer that has painted its first frame (derived → no reset effect). */
  const [readyUid, setReadyUid] = useState<string | null>(null);

  const car = cars[index];
  const live = cars[liveIndex];

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + cars.length) % cars.length);
    },
    [cars.length]
  );

  // Settle → stream. The poster switches instantly; the viewer waits.
  useEffect(() => {
    if (index === liveIndex) return;
    const t = setTimeout(() => setLiveIndex(index), SETTLE_MS);
    return () => clearTimeout(t);
  }, [index, liveIndex]);

  // Warm the neighbours' posters so arrowing never shows an empty frame.
  useEffect(() => {
    for (const d of [1, -1, 2]) {
      const src = cars[(index + d + cars.length) % cars.length]?.thumbnail;
      if (src) new Image().src = src;
    }
  }, [index, cars]);

  // ← / → anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  /** Only reveal the viewer when it is both current and painted. */
  const showViewer = index === liveIndex && readyUid === live?.uid;

  // An empty catalogue means the Sketchfab build never ran — fail quiet, not hard.
  if (!car || !live) return null;

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between px-6 py-6 md:px-10">
        <span className="text-sm font-medium uppercase tracking-[0.3em] text-muted">
          Guess the Model
        </span>
        <Link
          href="/musee"
          className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.25em] backdrop-blur-md transition hover:border-accent/60 hover:text-foreground"
        >
          Musée →
        </Link>
      </header>

      {/* ── The stage: poster underneath, live Sketchfab on top ────── */}
      <div className="relative mx-4 min-h-0 flex-1 overflow-hidden rounded-3xl bg-[#eceae7] ring-1 ring-white/10 md:mx-10">
        <AnimatePresence initial={false}>
          {car.thumbnail && (
            <motion.img
              key={car.id}
              src={car.thumbnail}
              alt=""
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </AnimatePresence>

        {/* The viewer fades in over the poster once its first frame is up. */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            showViewer ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <SketchfabEmbed
            key={live.uid}
            uid={live.uid}
            title={`${live.brandName} ${live.name}`}
            cameraDistance={1.05}
            autospin={0.18}
            entranceAnimation={false}
            maxTextureSize={2048}
            onReady={setReadyUid}
            className="h-full w-full"
          />
        </div>

        {/* Vignettes the light vitrine into the dark page. Must sit ABOVE the
            iframe (an inset shadow on the panel would be painted under it). */}
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.14)]" />

        {/* Loading whisper while the stream boots (the poster is already up). */}
        <div
          className={`pointer-events-none absolute bottom-4 right-5 text-[0.65rem] uppercase tracking-[0.3em] text-neutral-500 transition-opacity duration-300 ${
            showViewer ? "opacity-0" : "opacity-100"
          }`}
        >
          Chargement 3D…
        </div>
      </div>

      {/* ── Caption + controls ─────────────────────────────────────── */}
      <div className="flex shrink-0 flex-col gap-5 px-6 py-7 md:flex-row md:items-end md:justify-between md:px-10 md:py-9">
        {/* Stable live region (it must pre-exist the change to be announced). */}
        <div aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={car.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <p className="mb-2 text-sm uppercase tracking-[0.25em] text-accent">
                {car.brandName}
                {car.year ? ` · ${car.year}` : ""}
              </p>
              <h1 className="font-serif text-4xl leading-[1.02] tracking-tight md:text-6xl">
                {car.name}
              </h1>
              <div className="mt-3 flex items-baseline gap-3">
                <Link
                  href={car.href}
                  className="text-xs uppercase tracking-[0.25em] text-muted underline decoration-white/20 underline-offset-4 transition hover:text-foreground"
                >
                  Voir la fiche →
                </Link>
                {car.variantCount > 1 && (
                  <span className="text-[0.65rem] uppercase tracking-[0.2em] text-muted/60">
                    {car.variantCount} variantes
                  </span>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          <div className="flex items-center gap-3">
            <button
              className={navClass}
              onClick={() => go(-1)}
              aria-label="Voiture précédente"
            >
              ← Précédente
            </button>
            <span className="w-16 text-center text-xs tabular-nums text-muted">
              {index + 1} / {cars.length}
            </span>
            <button
              className={navClass}
              onClick={() => go(1)}
              aria-label="Voiture suivante"
            >
              Suivante →
            </button>
          </div>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-muted/70">
            Flèches ← → · glisser pour orbiter · molette pour zoomer
          </p>
        </div>
      </div>
    </div>
  );
}
