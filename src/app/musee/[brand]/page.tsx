import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  MUSEUM_BRANDS,
  getMuseumBrand,
  museumBaseVariant,
  museumModelHref,
} from "@/content/museum";
import { brandEditorial } from "@/content/brands";
import { brandLogoSrc } from "@/lib/logos";
import { ModelCard } from "@/components/museum/ModelCard";
import { BrandLogo } from "@/components/museum/BrandLogo";
import { SiteHeader } from "@/components/ui/SiteHeader";

type BrandParams = { params: Promise<{ brand: string }> };

export function generateStaticParams() {
  return MUSEUM_BRANDS.map((b) => ({ brand: b.id }));
}

export async function generateMetadata(props: BrandParams): Promise<Metadata> {
  const { brand } = await props.params;
  const b = getMuseumBrand(brand);
  return {
    title: b ? `${b.name} — Musée` : "Musée",
    description: b
      ? `Tous les modèles ${b.name} du musée, en 3D et en détail.`
      : undefined,
  };
}

export default async function BrandPage(props: BrandParams) {
  const { brand } = await props.params;
  const b = getMuseumBrand(brand);
  if (!b) notFound();

  const ed = brandEditorial(b.id);
  const models = [...b.models].sort((m1, m2) => {
    const y1 = museumBaseVariant(m1).year ?? Infinity;
    const y2 = museumBaseVariant(m2).year ?? Infinity;
    return y1 - y2 || m1.name.localeCompare(m2.name);
  });

  return (
    <main className="min-h-dvh">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
      <header className="mb-16 md:mb-20">
        <Link
          href="/musee"
          className="mb-10 inline-block text-xs uppercase tracking-[0.3em] text-neutral-500 transition hover:text-neutral-900"
        >
          ← Toutes les marques
        </Link>
        <div>
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-accent">
            {models.length} modèle{models.length > 1 ? "s" : ""}
            {ed?.origin ? ` · ${ed.origin}` : ""}
          </p>
          <BrandLogo
            brandId={b.id}
            brandName={b.name}
            src={brandLogoSrc(b.id)}
            // wide wordmarks (Porsche) would otherwise run the full page width
            className="h-14 max-w-[20rem] md:h-20 md:max-w-[30rem]"
            wordmarkClassName="text-4xl md:text-6xl"
          />
          {ed?.tagline && (
            <p className="mt-6 max-w-xl text-base leading-relaxed text-neutral-500">
              {ed.tagline}
            </p>
          )}
        </div>
      </header>

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((m) => {
          const base = museumBaseVariant(m);
          return (
            <li key={m.id}>
              <ModelCard
                href={museumModelHref(b.id, m)}
                name={m.name}
                year={base.year}
                thumbnail={base.sketchfab?.thumbnail ?? null}
                extraCount={m.variants.length - 1}
              />
            </li>
          );
        })}
      </ul>
      </div>
    </main>
  );
}
