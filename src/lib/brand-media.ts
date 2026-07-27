import { existsSync } from "node:fs";
import { join } from "node:path";

// Server-only, same idea as lib/logos.ts: resolve whether a brand's historical
// photograph exists in public/brands/ so pages can fall back to a Sketchfab
// thumbnail instead of rendering a broken image. Re-runs at build / in dev.

const BRANDS_DIR = join(process.cwd(), "public", "brands");
const EXTS = ["jpg", "jpeg", "webp", "png", "avif"] as const;

/** Public path to the brand's ambience photo, or null if none is present. */
export function brandPhotoSrc(brandId: string): string | null {
  for (const ext of EXTS) {
    if (existsSync(join(BRANDS_DIR, `${brandId}.${ext}`))) {
      return `/brands/${brandId}.${ext}`;
    }
  }
  return null;
}
