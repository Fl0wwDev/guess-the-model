import { existsSync } from "node:fs";
import { join } from "node:path";

// Server-only: resolves whether a brand logo file exists in public/logos/.
// Lets pages render the wordmark fallback directly (no 404, no broken-image
// flash) until you drop a real logo in. Re-runs at build / in dev.

const LOGOS_DIR = join(process.cwd(), "public", "logos");
const EXTS = ["svg", "png", "webp"] as const;

/** Public path to the brand's logo file, or null if none is present. */
export function brandLogoSrc(brandId: string): string | null {
  for (const ext of EXTS) {
    if (existsSync(join(LOGOS_DIR, `${brandId}.${ext}`))) {
      return `/logos/${brandId}.${ext}`;
    }
  }
  return null;
}
