"use client";

import dynamic from "next/dynamic";

// The Canvas must never render on the server (see CLAUDE.md → Architecture).
// This 'use client' boundary dynamically imports the WebGL stage with ssr:false.
const ModelStage = dynamic(() => import("./ModelStage"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <span className="text-xs uppercase tracking-[0.3em] text-muted">
        Chargement…
      </span>
    </div>
  ),
});

type ModelViewerProps = {
  url: string;
  targetLength?: number;
  autoRotate?: boolean;
};

export default function ModelViewer(props: ModelViewerProps) {
  return <ModelStage {...props} />;
}
