"use client";

import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Studio } from "./Studio";
import { CarModel } from "./CarModel";
import { CARS } from "@/lib/cars";
import { useGarage } from "@/lib/garage";

// Don't preload everything — only preload adjacent models on the fly.
// With 77+ models, eager preload would kill RAM and bandwidth.

export default function Scene() {
  const index = useGarage((s) => s.index);
  const car = CARS[index];

  // Preload the prev + next car for smooth carousel switching.
  useEffect(() => {
    const prevIdx = (index - 1 + CARS.length) % CARS.length;
    const nextIdx = (index + 1) % CARS.length;
    useGLTF.preload(CARS[prevIdx].url);
    useGLTF.preload(CARS[nextIdx].url);
  }, [index]);

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [5, 2.2, 6.5], fov: 40 }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
    >
      <Studio>
        {/* key={car.id} → remount + Suspense while the next GLB resolves */}
        <Suspense fallback={null}>
          <CarModel key={car.id} url={car.url} targetLength={car.targetLength} />
        </Suspense>
      </Studio>
    </Canvas>
  );
}
