"use client";

import dynamic from "next/dynamic";

// The WebGL <Canvas> must never render on the server (no window/WebGL there).
// A client component + dynamic import with ssr:false guarantees browser-only mount.
const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-background">
      <span className="animate-pulse text-xs uppercase tracking-[0.3em] text-muted">
        Chargement…
      </span>
    </div>
  ),
});

export default function Experience() {
  return <Scene />;
}
