import type { Metadata } from "next";
import {
  MUSEUM_BRANDS,
  getMuseumModelById,
  museumBaseVariant,
} from "@/content/museum";
import { BRAND_EDITORIAL } from "@/content/brands";
import { brandLogoSrc } from "@/lib/logos";
import { brandPhotoSrc } from "@/lib/brand-media";
import BrandExplorer, {
  type BrandEntry,
} from "@/components/museum/BrandExplorer";

export const metadata: Metadata = {
  title: "Musée — Guess the Model",
  description:
    "Une traversée immersive de l'histoire des grands constructeurs automobiles.",
};

export default function MuseumHome() {
  const brands: BrandEntry[] = MUSEUM_BRANDS.map((brand) => {
    const ed = BRAND_EDITORIAL[brand.id];
    const years = brand.models
      .flatMap((m) => m.variants.map((v) => v.year))
      .filter((y): y is number => typeof y === "number");

    // A real photograph if one was downloaded, otherwise the Sketchfab thumbnail
    // of the marque's emblematic model — never an empty panel.
    const photo = brandPhotoSrc(brand.id);
    const emblematic =
      (ed && getMuseumModelById(ed.fallbackModelId)) ?? brand.models[0];
    const fallbackThumb = emblematic
      ? museumBaseVariant(emblematic).sketchfab.thumbnail
      : null;

    return {
      id: brand.id,
      name: brand.name,
      models: brand.models.length,
      variants: brand.models.reduce((n, m) => n + m.variants.length, 0),
      logoSrc: brandLogoSrc(brand.id),
      image: photo ?? fallbackThumb,
      focus: ed?.focus ?? "50% 50%",
      origin: ed?.origin ?? "",
      tagline: ed?.tagline ?? "",
      years: years.length
        ? `${Math.min(...years)} – ${Math.max(...years)}`
        : null,
      credit:
        photo && ed?.photo
          ? {
              caption: ed.photo.caption,
              author: ed.photo.author,
              license: ed.photo.license,
            }
          : null,
    };
  });

  return <BrandExplorer brands={brands} />;
}
