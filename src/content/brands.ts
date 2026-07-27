// Editorial layer over the generated museum catalogue: what a marque *is*, and
// which historical photograph stands for it. Hand-authored — the Sketchfab build
// never touches this file.
//
// The photograph itself lives in public/brands/<id>.jpg (see scripts/fetch-brand-photos.mjs
// and public/brands/CREDITS.md). When the file is missing, the museum falls back to
// the Sketchfab thumbnail of `fallbackModelId`, so the page never shows a hole.

export type BrandPhoto = {
  /** What the photo shows, e.g. "Ferrari F40, 1987". */
  caption: string;
  /** Photographer / uploader, as credited on Wikimedia Commons. */
  author: string;
  /** Licence short name, e.g. "CC BY-SA 4.0". */
  license: string;
  /** Commons file page. */
  source: string;
};

export type BrandEditorial = {
  /** Ville d'origine · année de fondation. */
  origin: string;
  /** Une phrase, pas deux. Ce qui rend la marque singulière. */
  tagline: string;
  /** Museum model id whose Sketchfab thumbnail stands in when the photo is missing. */
  fallbackModelId: string;
  /** object-position for the photo — the panel is portrait, the photos are not. */
  focus?: string;
  /** Filled once the photo is downloaded; null keeps the fallback. */
  photo?: BrandPhoto | null;
};

export const BRAND_EDITORIAL: Record<string, BrandEditorial> = {
  ferrari: {
    origin: "Maranello · 1947",
    tagline:
      "Enzo Ferrari ne vendait des voitures de route que pour financer la course. Le rouge est resté.",
    fallbackModelId: "ferrari-f40",
    focus: "50% 55%",
    photo: {
      caption: "Ferrari F50, 1995",
      author: "MrWalkr",
      license: "CC BY-SA 4.0",
      source: "https://commons.wikimedia.org/wiki/File:A_Ferrari_F50.jpg",
    },
  },
  lamborghini: {
    origin: "Sant’Agata Bolognese · 1963",
    tagline:
      "Un constructeur de tracteurs vexé par une Ferrari — et la Miura invente le supercar à moteur central.",
    fallbackModelId: "lamborghini-miura",
    focus: "50% 50%",
    photo: {
      caption: "Lamborghini Miura P400 SV, 1971",
      author: "Chelsea Jay",
      license: "CC BY-SA 4.0",
      source:
        "https://commons.wikimedia.org/wiki/File:1971_Lamborghini_Miura_P400_SV.jpg",
    },
  },
  porsche: {
    origin: "Stuttgart · 1948",
    tagline:
      "Une seule silhouette tenue pendant soixante ans, avec le moteur du mauvais côté de l’essieu.",
    fallbackModelId: "porsche-911",
    focus: "50% 50%",
    photo: {
      caption: "Porsche 911 Carrera RS 2.7, 1972",
      author: "Alexander Migl",
      license: "CC BY-SA 4.0",
      source:
        "https://commons.wikimedia.org/wiki/File:Porsche_911_Carrera_RS_2.7_(1972)_Solitude_Revival_2022_1X7A0355.jpg",
    },
  },
  bmw: {
    origin: "Munich · 1916",
    tagline:
      "Née des moteurs d’avion bavarois, elle a inventé la berline de sport — et n’a jamais quitté la piste.",
    fallbackModelId: "bmw-3-0-csl",
    focus: "50% 50%",
    photo: {
      caption: "BMW M1 Procar, 1979",
      author: "Alexander Migl",
      license: "CC BY-SA 4.0",
      source:
        "https://commons.wikimedia.org/wiki/File:BMW_M1_Procar_of_BMW_Motorsport_(BMW_M-color)_Classic-Gala_2022_1X7A0148.jpg",
    },
  },
  bugatti: {
    origin: "Molsheim · 1909",
    tagline:
      "Ettore Bugatti dessinait ses voitures comme des objets d’art — et gagnait quand même les Grands Prix.",
    fallbackModelId: "bugatti-atlantic",
    focus: "50% 50%",
    photo: {
      caption: "Bugatti Type 35, 1924",
      author: "Dontpanic (Dogcow)",
      license: "CC BY-SA 3.0",
      source: "https://commons.wikimedia.org/wiki/File:Bugatti_Type_35.jpg",
    },
  },
};

export function brandEditorial(brandId: string): BrandEditorial | undefined {
  return BRAND_EDITORIAL[brandId];
}
