"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Studio } from "./Studio";
import { CarModel } from "./CarModel";

type ModelStageProps = {
  /** Path to the GLB under public/models/. */
  url: string;
  targetLength?: number;
  /** Spin the turntable. Off by default in the museum so specs stay readable. */
  autoRotate?: boolean;
};

/**
 * A single-car turntable on the shared Studio rig. Used by the museum model
 * page (one car at a time), separate from the garage carousel (Scene). The
 * `key={url}` remounts + re-suspends when the visitor switches variant.
 */
export default function ModelStage({
  url,
  targetLength = 4.5,
  autoRotate = false,
}: ModelStageProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [5, 2.2, 6.5], fov: 40 }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
    >
      <Studio autoRotate={autoRotate}>
        <Suspense fallback={null}>
          <CarModel key={url} url={url} targetLength={targetLength} />
        </Suspense>
      </Studio>
    </Canvas>
  );
}
