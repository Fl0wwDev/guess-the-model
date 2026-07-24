"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Lightformer,
  ContactShadows,
  useGLTF,
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { CarModel } from "./CarModel";
import { CARS } from "@/lib/cars";
import { useGarage } from "@/lib/garage";

// Preload every car so switching is instant (no stall on the reveal).
CARS.forEach((c) => useGLTF.preload(c.url));

export default function Scene() {
  const index = useGarage((s) => s.index);
  const car = CARS[index];

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [5, 2.2, 6.5], fov: 40 }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#08080a"]} />
      <fog attach="fog" args={["#08080a", 12, 30]} />

      <ambientLight intensity={0.15} />
      <directionalLight position={[6, 8, 4]} intensity={1.2} color="#fff2e0" />

      {/* key={car.id} → remount + Suspense while the next GLB resolves */}
      <Suspense fallback={null}>
        <CarModel key={car.id} url={car.url} targetLength={car.targetLength} />
      </Suspense>

      {/* Soft grounded shadow (independent of lights) */}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.6}
        scale={16}
        blur={2.6}
        far={9}
        resolution={1024}
        color="#000000"
      />

      {/* Procedural studio HDRI built from area lights — no external file */}
      <Environment resolution={256}>
        <Lightformer
          form="rect"
          intensity={3}
          position={[0, 6, -6]}
          scale={[12, 6, 1]}
          color="#ffffff"
        />
        <Lightformer
          form="rect"
          intensity={1.2}
          position={[-6, 2, 2]}
          scale={[6, 6, 1]}
          color="#bcd4ff"
        />
        <Lightformer
          form="rect"
          intensity={4}
          rotation={[0, Math.PI / 2, 0]}
          position={[6, 3, 1]}
          scale={[3, 6, 1]}
          color="#ffd7a8"
        />
        <Lightformer form="ring" intensity={2} position={[0, 4, 4]} scale={4} />
      </Environment>

      {/* Sober cinematic post — ACES tone mapping is on by default in R3F */}
      <EffectComposer>
        <Bloom
          mipmapBlur
          intensity={0.55}
          luminanceThreshold={0.9}
          luminanceSmoothing={0.2}
        />
        <Vignette eskil={false} offset={0.25} darkness={0.85} />
      </EffectComposer>

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        minDistance={4.5}
        maxDistance={11}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.05}
        autoRotate
        autoRotateSpeed={0.6}
        target={[0, 0.6, 0]}
      />
    </Canvas>
  );
}
