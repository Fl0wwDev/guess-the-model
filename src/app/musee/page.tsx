import Link from "next/link";
import type { Metadata } from "next";
import { MUSEUM_BRANDS } from "@/content/museum";
import { brandLogoSrc } from "@/lib/logos";
import { BrandLogo } from "@/components/museum/BrandLogo";

export const metadata: Metadata = {
  title: "Musée — Guess the Model",
  description:
    "Une traversée immersive de l'histoire des grands constructeurs automobiles.",
};

export default function MuseumHome() {
  return (
    <main className="mx-auto min-h-dvh max-w-7xl px-6 py-16 md:px-10 md:py-24">
      <header className="mb-16 md:mb-24">
        <Link
          href="/"
          className="mb-10 inline-block text-xs uppercase tracking-[0.3em] text-neutral-500 transition hover:text-neutral-900"
        >
          ← Accueil
        </Link>
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-accent">
          Le Musée
        </p>
        <h1 className="max-w-3xl font-serif text-5xl leading-[1.02] tracking-tight text-neutral-900 md:text-7xl">
          Traversez l&apos;histoire, marque par marque.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-neutral-500">
          Choisissez un constructeur, parcourez ses modèles et explorez chaque
          voiture en 3D, avec ses caractéristiques et son histoire.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {MUSEUM_BRANDS.map((brand) => (
          <Link
            key={brand.id}
            href={`/musee/${brand.id}`}
            className="group flex aspect-[4/3] flex-col overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg"
          >
            <div className="flex flex-1 items-center justify-center px-6 py-12">
              <BrandLogo
                brandId={brand.id}
                brandName={brand.name}
                src={brandLogoSrc(brand.id)}
                className="h-16 md:h-20"
                wordmarkClassName="text-3xl md:text-4xl"
              />
            </div>
            <div className="flex items-center justify-between border-t border-black/[0.06] px-5 py-3.5">
              <span className="text-[0.7rem] uppercase tracking-[0.2em] text-neutral-400">
                {brand.models.length} modèle{brand.models.length > 1 ? "s" : ""}
              </span>
              <span className="text-neutral-300 transition group-hover:translate-x-1 group-hover:text-neutral-600">
                →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
