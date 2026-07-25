"use client";

import {
  OrbitControls,
  Environment,
  Lightformer,
  ContactShadows,
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

type StudioProps = {
  /** The subject — usually a <Suspense><CarModel/></Suspense>. */
  children: React.ReactNode;
  /** Spin the camera slowly. On for hero/garage, off when the user is reading specs. */
  autoRotate?: boolean;
  /** OrbitControls look-at point. */
  target?: [number, number, number];
};

/**
 * Shared cinematic studio rig — the app's visual "soul", reused by the garage
 * carousel (Scene) and the museum single-model viewer (ModelStage). Renders
 * INSIDE a <Canvas>: background/fog, a warm key + cool fill light, a procedural
 * area-light environment (no HDRI file), a grounded contact shadow, sober post
 * (subtle bloom + vignette on top of R3F's default ACES tone mapping), and
 * damped orbit controls. See CLAUDE.md → "Art-direction recipe".
 */
export function Studio({
  children,
  autoRotate = true,
  target = [0, 0.6, 0],
}: StudioProps) {
  return (
    <>
      <color attach="background" args={["#08080a"]} />
      <fog attach="fog" args={["#08080a", 12, 30]} />

      <ambientLight intensity={0.15} />
      <directionalLight position={[6, 8, 4]} intensity={1.2} color="#fff2e0" />

      {children}

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
        autoRotate={autoRotate}
        autoRotateSpeed={0.6}
        target={target}
      />
    </>
  );
}
