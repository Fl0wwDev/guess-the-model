"use client";

import { useEffect, useRef } from "react";

type Props = {
  /** Highest-resolution thumbnail we have. */
  image: string | null;
  /** Stable per question — picks the focal point, so a reload frames the same crop. */
  seed: string;
  /** Zoom-out window; the caller scores against the same duration. */
  durationMs: number;
  /** Stop the animation where it is (the player has answered). */
  frozen?: boolean;
  /** Called every frame with the eased progress 0→1. Write to the DOM here —
   *  do NOT set React state, this runs at 60 fps. */
  onFrame?: (progress: number) => void;
  className?: string;
};

/** Magnification at t=0. 3.2x on a 1920px thumbnail ≈ 600px of source. */
const START_SCALE = 3.2;
/** What a reduced-motion viewer gets instead: a single, static, gentler crop. */
const STATIC_SCALE = 1.55;

/** Deterministic 0→1 from a string — same question, same framing. */
function hash01(s: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * Deliberately ease-IN, not ease-out. An ease-out spends its first seconds
 * giving the answer away — measured at 5 s of a 14 s round it had already
 * dropped to nearly the full car. This keeps the crop tight while the player is
 * actually looking, then opens up quickly at the end for whoever is stuck.
 */
const easeInQuad = (p: number) => Math.pow(p, 1.7);

/**
 * The question's visual: a hard zoom into the car that eases back out to the
 * full shot over `durationMs`. It is the whole game loop in one element — the
 * player races the zoom, and the 1–3 s the live Sketchfab viewer needs to boot
 * underneath is spent thinking rather than waiting.
 *
 * Everything is written straight to `style` from a rAF loop: at 60 fps React
 * state would re-render the answer cards on every frame for nothing. It also
 * sidesteps the global `prefers-reduced-motion` override in globals.css, which
 * would otherwise collapse a CSS transition to 0.01 ms and hand out the full
 * picture instantly — here reduced motion gets an explicit static crop instead.
 */
export function ZoomStage({
  image,
  seed,
  durationMs,
  frozen = false,
  onFrame,
  className = "",
}: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const onFrameRef = useRef(onFrame);
  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    const el = imgRef.current;
    if (!el || frozen) return;

    // Keep the focal point off the very edges: at 3.2x a corner origin lands on
    // background, not on the car.
    const fx = 24 + hash01(seed, 1) * 52;
    const fy = 30 + hash01(seed, 2) * 42;
    el.style.transformOrigin = `${fx.toFixed(1)}% ${fy.toFixed(1)}%`;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      el.style.transform = `scale(${STATIC_SCALE})`;
      // The clock still runs — scoring stays time-based, only the motion goes.
      const start = performance.now();
      const id = window.setInterval(() => {
        const p = Math.min(1, (performance.now() - start) / durationMs);
        onFrameRef.current?.(p);
        if (p >= 1) window.clearInterval(id);
      }, 200);
      return () => window.clearInterval(id);
    }

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = easeInQuad(p);
      el.style.transform = `scale(${(START_SCALE - (START_SCALE - 1) * eased).toFixed(4)})`;
      onFrameRef.current?.(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seed, durationMs, frozen]);

  return (
    <div className={`relative overflow-hidden bg-neutral-900 ${className}`}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          key={seed}
          src={image}
          alt="Détail de la voiture à reconnaître"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover will-change-transform"
          style={{ transform: `scale(${START_SCALE})` }}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.3em] text-white/40">
          Image indisponible
        </div>
      )}
    </div>
  );
}
