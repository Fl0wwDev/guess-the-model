"use client";

import { useState } from "react";

type Props = {
  brandId: string;
  brandName: string;
  /** Resolved logo path from the server (brandLogoSrc). `null` → wordmark;
   *  `undefined` → try /logos/<brandId>.svg with an onError fallback. */
  src?: string | null;
  /** Height/color classes for the logo image, e.g. "h-16". */
  className?: string;
  /** Text-size classes for the serif wordmark fallback, e.g. "text-4xl". */
  wordmarkClassName?: string;
};

/**
 * Brand logo: renders a logo file from public/logos/ if present, otherwise an
 * elegant serif wordmark. Prefer passing `src={brandLogoSrc(id)}` from a server
 * component (no 404 / flash). Drop real logo files in public/logos/ to upgrade —
 * no code change needed. See public/logos/README.
 */
export function BrandLogo({
  brandId,
  brandName,
  src,
  className = "h-10",
  wordmarkClassName = "text-2xl",
}: Props) {
  const [failed, setFailed] = useState(false);
  const resolved = src === undefined ? `/logos/${brandId}.svg` : src;

  if (failed || resolved === null) {
    return (
      <span className={`font-serif leading-none tracking-tight ${wordmarkClassName}`}>
        {brandName}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={`Logo ${brandName}`}
      onError={() => setFailed(true)}
      className={`w-auto object-contain ${className}`}
    />
  );
}
