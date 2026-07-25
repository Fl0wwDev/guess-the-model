import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  MUSEUM_BRANDS,
  getMuseumBrand,
  getMuseumModel,
  museumBaseVariant,
  museumModelSlug,
  museumModelHref,
} from "@/content/museum";
import { getSpecs } from "@/content/specs";
import { brandLogoSrc } from "@/lib/logos";
import ModelExplorer, {
  type ExplorerVariant,
} from "@/components/museum/ModelExplorer";
import { ModelCard } from "@/components/museum/ModelCard";
import { BrandLogo } from "@/components/museum/BrandLogo";

type ModelParams = { params: Promise<{ brand: string; model: string }> };

export function generateStaticParams() {
  return MUSEUM_BRANDS.flatMap((b) =>
    b.models.map((m) => ({ brand: b.id, model: museumModelSlug(m, b.id) }))
  );
}

export async function generateMetadata(props: ModelParams): Promise<Metadata> {
  const { brand, model } = await props.params;
  const b = getMuseumBrand(brand);
  const m = getMuseumModel(brand, model);
  if (!b || !m) return { title: "Musée" };
  return {
    title: `${b.name} ${m.name} — Musée`,
    description: getSpecs(m.baseVariantId)?.anecdote,
  };
}

export default async function ModelPage(props: ModelParams) {
  const { brand, model } = await props.params;
  const b = getMuseumBrand(brand);
  const m = getMuseumModel(brand, model);
  if (!b || !m) notFound();

  const base = museumBaseVariant(m);
  const ordered = [
    base,
    ...m.variants
      .filter((v) => v.id !== base.id)
      .sort((a, c) => (a.year ?? Infinity) - (c.year ?? Infinity)),
  ];

  const variants: ExplorerVariant[] = ordered.map((v) => ({
    id: v.id,
    name: v.name,
    year: v.year,
    specs: getSpecs(v.id) ?? null,
    sketchfab: v.sketchfab ?? null,
  }));

  const related = b.models
    .filter((x) => x.id !== m.id)
    .map((x) => ({ x, base: museumBaseVariant(x) }))
    .sort((a, c) => (a.base.year ?? Infinity) - (c.base.year ?? Infinity))
    .slice(0, 6);

  return (
    <main className="min-h-dvh">
      {/* Breadcrumb */}
      <nav className="flex h-16 items-center gap-4 px-6 text-xs uppercase tracking-[0.3em] text-neutral-500 md:px-10">
        <Link href="/musee" className="transition hover:text-neutral-900">
          Musée
        </Link>
        <span aria-hidden className="text-black/20">
          /
        </span>
        <Link
          href={`/musee/${b.id}`}
          className="flex items-center gap-2 text-neutral-700 transition hover:text-neutral-900"
        >
          <BrandLogo
            brandId={b.id}
            brandName={b.name}
            src={brandLogoSrc(b.id)}
            className="h-5"
            wordmarkClassName="text-sm"
          />
        </Link>
      </nav>

      <ModelExplorer
        brandName={b.name}
        modelName={m.name}
        baseVariantId={m.baseVariantId}
        variants={variants}
      />

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
          <h2 className="mb-6 text-sm uppercase tracking-[0.3em] text-neutral-500">
            Autres {b.name}
          </h2>
          <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
            {related.map(({ x, base: xb }) => (
              <li key={x.id}>
                <ModelCard
                  href={museumModelHref(b.id, x)}
                  name={x.name}
                  year={xb.year}
                  thumbnail={xb.sketchfab?.thumbnail ?? null}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
