"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SketchfabEmbed } from "./SketchfabEmbed";
import type { CarSpecs } from "@/content/specs";
import type { SketchfabModel } from "@/content/sketchfab";

export type ExplorerVariant = {
  id: string;
  name: string;
  year: number | null;
  specs: CarSpecs | null;
  sketchfab: SketchfabModel | null;
};

type Props = {
  brandName: string;
  modelName: string;
  baseVariantId: string;
  /** Base variant first, then the rest chronologically. */
  variants: ExplorerVariant[];
};

export default function ModelExplorer({
  brandName,
  modelName,
  baseVariantId,
  variants,
}: Props) {
  const [selectedId, setSelectedId] = useState(baseVariantId);
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];
  const sf = selected.sketchfab;

  return (
    <section className="lg:grid lg:h-[calc(100dvh-4rem)] lg:grid-cols-2">
      {/* ── 3D on the left, flush to the edge (vecarz-style) ──────── */}
      <div className="relative h-[52vh] bg-[#eceae7] lg:h-full">
        {sf ? (
          <SketchfabEmbed
            uid={sf.uid}
            title={`${brandName} ${modelName}`}
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-xs uppercase tracking-[0.3em] text-neutral-400">
              Modèle 3D indisponible
            </span>
          </div>
        )}
      </div>

      {/* ── Text on the right ─────────────────────────────────────── */}
      <div className="flex flex-col px-6 py-10 lg:overflow-y-auto lg:border-l lg:border-black/10 lg:px-14 lg:py-12 xl:px-20">
        <div className="lg:my-auto lg:w-full lg:max-w-xl">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-accent">
            {brandName}
          </p>
          <h1 className="font-serif text-5xl leading-[0.95] tracking-tight text-neutral-900 md:text-6xl xl:text-7xl">
            {modelName}
          </h1>

          {variants.length > 1 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {variants.map((v) => {
                const active = v.id === selectedId;
                return (
                  <button
                    key={v.id}
                    onClick={() => setSelectedId(v.id)}
                    aria-pressed={active}
                    className={`rounded-full border px-4 py-1.5 text-xs transition active:scale-95 ${
                      active
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-black/15 bg-black/[0.02] text-neutral-500 hover:border-black/30 hover:text-neutral-900"
                    }`}
                  >
                    {variantLabel(v, baseVariantId)}
                  </button>
                );
              })}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              {/* spec sheet */}
              <div className="mt-8 border-t border-black/10 pt-2">
                <SpecsTable specs={selected.specs} year={selected.year} />
              </div>

              {/* story */}
              {selected.specs?.anecdote && (
                <div className="mt-8">
                  <h2 className="font-serif text-xl italic text-neutral-800">
                    L&apos;histoire
                  </h2>
                  <p className="mt-3 text-base leading-relaxed text-neutral-600">
                    {selected.specs.anecdote}
                  </p>
                </div>
              )}

              {/* attribution */}
              {sf && (
                <p className="mt-8 text-xs leading-relaxed text-neutral-400">
                  Modèle 3D{sf.author ? ` par ${sf.author}` : ""}
                  {sf.license ? ` · ${licenseLabel(sf.license)}` : ""} ·{" "}
                  <a
                    href={`https://sketchfab.com/models/${sf.uid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline decoration-black/20 underline-offset-2 transition hover:text-neutral-900"
                  >
                    voir sur Sketchfab
                  </a>
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function variantLabel(v: ExplorerVariant, baseId: string): string {
  const isBase = v.id === baseId;
  const short = v.name.replace(/^\d{4}\s+\w+\s+/i, "");
  return isBase ? `${short || v.name} · base` : short || String(v.year ?? "");
}

function SpecsTable({
  specs,
  year,
}: {
  specs: CarSpecs | null;
  year: number | null;
}) {
  const rows: [string, string | undefined][] = [
    ["Année", year ? String(year) : undefined],
    ["Puissance", specs?.ch ? `${specs.ch} ch` : undefined],
    ["Vitesse max", specs?.vitesseMax ? `${specs.vitesseMax} km/h` : undefined],
    ["0–100 km/h", specs?.zeroCent ? `${specs.zeroCent} s` : undefined],
    ["Poids", specs?.poids ? `${formatKg(specs.poids)} kg` : undefined],
    ["Moteur", specs?.moteur],
    ["Prix", specs?.prix],
    ["Production", specs?.production],
  ];

  return (
    <dl className="divide-y divide-black/[0.07]">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="flex items-baseline justify-between gap-6 py-2.5"
        >
          <dt className="shrink-0 text-[0.7rem] uppercase tracking-[0.18em] text-neutral-400">
            {label}
          </dt>
          <dd className="text-right text-sm font-medium text-neutral-900">
            {value ?? "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Deterministic thousands separator (non-breaking space) — avoids the
 *  server/client toLocaleString hydration mismatch. */
function formatKg(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function licenseLabel(slug: string): string {
  const m: Record<string, string> = {
    by: "CC BY",
    "by-sa": "CC BY-SA",
    "by-nc": "CC BY-NC",
    "by-nc-sa": "CC BY-NC-SA",
    "by-nd": "CC BY-ND",
    "by-nc-nd": "CC BY-NC-ND",
    cc0: "CC0",
  };
  return m[slug] ?? slug;
}
