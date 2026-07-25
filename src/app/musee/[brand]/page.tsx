import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BRANDS, BRAND_MAP, baseVariant } from "@/lib/cars";
import { modelHref } from "@/lib/museum";
import { brandLogoSrc } from "@/lib/logos";
import { getSketchfab } from "@/content/sketchfab";
import { ModelCard } from "@/components/museum/ModelCard";
import { BrandLogo } from "@/components/museum/BrandLogo";

type BrandParams = { params: Promise<{ brand: string }> };

export function generateStaticParams() {
  return BRANDS.map((b) => ({ brand: b.id }));
}

export async function generateMetadata(props: BrandParams): Promise<Metadata> {
  const { brand } = await props.params;
  const b = BRAND_MAP.get(brand);
  return {
    title: b ? `${b.name} — Musée` : "Musée",
    description: b
      ? `Tous les modèles ${b.name} du musée, en 3D et en détail.`
      : undefined,
  };
}

export default async function BrandPage(props: BrandParams) {
  const { brand } = await props.params;
  const b = BRAND_MAP.get(brand);
  if (!b) notFound();

  // Chronological order (base-variant year) for a timeline feel; unknown → end.
  const models = [...b.models].sort((m1, m2) => {
    const y1 = baseVariant(m1).year ?? Infinity;
    const y2 = baseVariant(m2).year ?? Infinity;
    return y1 - y2 || m1.name.localeCompare(m2.name);
  });

  return (
    <main className="mx-auto min-h-dvh max-w-6xl px-6 py-16 md:px-10 md:py-24">
      <header className="mb-16 md:mb-20">
        <Link
          href="/musee"
          className="mb-10 inline-block text-xs uppercase tracking-[0.3em] text-neutral-500 transition hover:text-neutral-900"
        >
          ← Musée
        </Link>
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="mb-4 text-sm uppercase tracking-[0.3em] text-accent">
              {models.length} modèle{models.length > 1 ? "s" : ""}
            </p>
            <BrandLogo
              brandId={b.id}
              brandName={b.name}
              src={brandLogoSrc(b.id)}
              className="h-14 md:h-20"
              wordmarkClassName="text-4xl md:text-6xl"
            />
          </div>
        </div>
      </header>

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((m) => {
          const base = baseVariant(m);
          return (
            <li key={m.id}>
              <ModelCard
                href={modelHref(m)}
                name={m.name}
                year={base.year}
                thumbnail={getSketchfab(base.id)?.thumbnail ?? null}
                extraCount={m.variants.length - 1}
              />
            </li>
          );
        })}
      </ul>
    </main>
  );
}
