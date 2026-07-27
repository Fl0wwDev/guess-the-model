"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { SiteHeader } from "@/components/ui/SiteHeader";

export type BrandEntry = {
  id: string;
  name: string;
  models: number;
  variants: number;
  /** Resolved by the server: public/logos/<id>.svg or null → serif wordmark. */
  logoSrc: string | null;
  /** Historical photograph, or a Sketchfab thumbnail as fallback, or null. */
  image: string | null;
  /** object-position for that photo — the panel is portrait, photos are not. */
  focus: string;
  origin: string;
  tagline: string;
  /** Catalogue span, e.g. "1962 – 2026". */
  years: string | null;
  /** Photo credit, only when the image is a real photograph. */
  credit: { caption: string; author: string; license: string } | null;
};

/**
 * Museum entrance, vecarz-style: a full-height photograph on the left, a
 * scrollable grid of marques on the right. Hovering (or focusing) a marque
 * crossfades its historical photo in and swaps the caption.
 *
 * The photos are all mounted and toggled with opacity — five images is cheap,
 * and it means the crossfade never waits on a decode.
 */
export default function BrandExplorer({ brands }: { brands: BrandEntry[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = brands.find((b) => b.id === activeId) ?? null;
  /** Idle state still shows a photo — an empty panel reads as a bug. */
  const shown = active ?? brands[0];

  return (
    <div className="lg:grid lg:h-dvh lg:grid-cols-[1.02fr_1fr] lg:overflow-hidden">
      {/* ── Left: the photograph ─────────────────────────────────────── */}
      <aside className="relative hidden overflow-hidden bg-neutral-900 lg:block">
        {/* The panel is portrait and every photograph is landscape, so a plain
            object-cover would crop away two thirds of the width — the car ends
            up as an unreadable close-up. Instead the photo is shown WHOLE
            (object-contain) over a blurred, darkened copy of itself: the frame
            is filled, nothing is cut. */}
        {brands.map((b) =>
          b.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`bg-${b.id}`}
              src={b.image}
              alt=""
              aria-hidden
              decoding="async"
              className={`absolute inset-0 h-full w-full scale-125 object-cover blur-2xl brightness-[0.45] saturate-[1.15] transition-opacity duration-[900ms] ease-out ${
                b.id === shown?.id ? "opacity-100" : "opacity-0"
              }`}
            />
          ) : null
        )}

        {/* Scrim: heavier at rest so the intro text reads, lighter on hover so
            the car does. */}
        <div
          aria-hidden
          className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/35 transition-opacity duration-700 ${
            active ? "opacity-80" : "opacity-100"
          }`}
        />
        <div
          aria-hidden
          className={`absolute inset-0 bg-neutral-950 transition-opacity duration-700 ${
            active ? "opacity-0" : "opacity-25"
          }`}
        />

        <div className="relative flex h-full flex-col p-10 text-white xl:p-14">
          <p className="text-[0.7rem] uppercase tracking-[0.4em] text-white/60">
            {active ? active.origin : "Le Musée"}
          </p>

          {/* The sharp, uncropped photograph, floating in its own band. */}
          <div className="relative my-8 min-h-0 flex-1">
            {brands.map((b) =>
              b.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`fg-${b.id}`}
                  src={b.image}
                  alt=""
                  aria-hidden
                  decoding="async"
                  // No shadow / radius here: with object-contain the element box
                  // is the whole band, so a shadow would frame the letterbox
                  // rather than the photograph.
                  className={`absolute inset-0 h-full w-full object-contain transition-[opacity,transform] duration-[900ms] ease-out ${
                    b.id === shown?.id
                      ? "scale-100 opacity-100"
                      : "scale-[1.02] opacity-0"
                  }`}
                />
              ) : null
            )}
          </div>

          <div>
            {active ? (
              <>
                <h2 className="font-serif text-[clamp(2.5rem,4.4vw,4.5rem)] leading-[0.92] tracking-tight">
                  {active.name}
                </h2>
                <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-white/75">
                  {active.tagline}
                </p>
                <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.7rem] uppercase tracking-[0.2em] text-white/55">
                  <span>{active.models} modèles</span>
                  <span aria-hidden className="text-white/25">
                    ·
                  </span>
                  <span>{active.variants} variantes</span>
                  {active.years && (
                    <>
                      <span aria-hidden className="text-white/25">
                        ·
                      </span>
                      <span className="tabular-nums">{active.years}</span>
                    </>
                  )}
                </p>
              </>
            ) : (
              <>
                <h1 className="max-w-lg font-serif text-[clamp(2.5rem,4.4vw,4.5rem)] leading-[0.94] tracking-tight">
                  Traversez l’histoire, marque par marque.
                </h1>
                <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-white/70">
                  Chaque constructeur, chaque modèle, chaque variante — en 3D,
                  avec ses chiffres et son histoire.
                </p>
                <p className="mt-6 text-[0.7rem] uppercase tracking-[0.3em] text-white/40">
                  Survolez une marque
                </p>
              </>
            )}

            {/* Photo credit — required by the Commons licences. */}
            <p
              className={`mt-8 text-[0.62rem] leading-relaxed tracking-wide text-white/35 transition-opacity duration-500 ${
                shown?.credit ? "opacity-100" : "opacity-0"
              }`}
            >
              {shown?.credit
                ? `${shown.credit.caption} — photo ${shown.credit.author} · ${shown.credit.license} · Wikimedia Commons`
                : " "}
            </p>
          </div>
        </div>
      </aside>

      {/* ── Right: the marques ───────────────────────────────────────── */}
      <div className="flex flex-col lg:h-dvh lg:overflow-y-auto">
        <SiteHeader />

        {/* Mobile intro (the photo panel is desktop-only). */}
        <div className="px-6 pb-8 pt-8 lg:hidden">
          <p className="text-[0.7rem] uppercase tracking-[0.35em] text-accent">
            Le Musée
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-[0.98] tracking-tight text-neutral-900">
            Traversez l’histoire, marque par marque.
          </h1>
        </div>

        {/* Desktop: bare logo grid, hairline ruled — the photo does the talking. */}
        <ul className="hidden border-t border-l border-black/[0.07] lg:grid lg:grid-cols-2">
          {brands.map((b) => (
            <li key={b.id} className="border-b border-r border-black/[0.07]">
              <Link
                href={`/musee/${b.id}`}
                onMouseEnter={() => setActiveId(b.id)}
                onMouseLeave={() => setActiveId(null)}
                onFocus={() => setActiveId(b.id)}
                onBlur={() => setActiveId(null)}
                className="group relative flex aspect-[5/4] flex-col items-center justify-center gap-1 px-8 transition-colors duration-300 hover:bg-white focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/60"
              >
                <BrandLogo
                  brandId={b.id}
                  brandName={b.name}
                  src={b.logoSrc}
                  className="h-20 max-w-[58%] transition-transform duration-500 group-hover:scale-[1.06] xl:h-24"
                  wordmarkClassName="text-3xl xl:text-4xl text-neutral-900 transition-transform duration-500 group-hover:scale-[1.06]"
                />
                <span className="absolute bottom-4 text-[0.62rem] uppercase tracking-[0.22em] text-neutral-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {b.models} modèles →
                </span>
              </Link>
            </li>
          ))}

          {brands.length % 2 === 1 && (
            <li
              aria-hidden
              className="flex aspect-[5/4] items-center justify-center border-b border-r border-black/[0.07] px-8 text-center text-[0.62rem] uppercase leading-relaxed tracking-[0.22em] text-neutral-300"
            >
              D’autres marques
              <br />
              bientôt
            </li>
          )}
        </ul>

        {/* Mobile: no hover, so each marque carries its own photo. */}
        <ul className="grid grid-cols-1 gap-4 px-6 pb-16 sm:grid-cols-2 lg:hidden">
          {brands.map((b) => (
            <li key={b.id}>
              <Link
                href={`/musee/${b.id}`}
                className="group relative flex aspect-[16/10] items-end overflow-hidden rounded-2xl bg-neutral-900"
              >
                {b.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.image}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    decoding="async"
                    style={{ objectPosition: b.focus }}
                    className="absolute inset-0 h-full w-full object-cover opacity-80"
                  />
                )}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"
                />
                <div className="relative flex w-full items-end justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <h2 className="font-serif text-2xl leading-none tracking-tight text-white">
                      {b.name}
                    </h2>
                    <p className="mt-1.5 text-[0.62rem] uppercase tracking-[0.22em] text-white/60">
                      {b.origin}
                    </p>
                  </div>
                  <span className="shrink-0 text-[0.62rem] uppercase tracking-[0.22em] text-white/70">
                    {b.models} →
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
