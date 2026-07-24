"use client";

import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Lightformer,
  ContactShadows,
  RoundedBox,
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

/**
 * Placeholder car built from primitives — proves the material/lighting/shadow
 * pipeline before real GLB models are sourced. Replace with <CarModel /> later.
 */
function PlaceholderCar() {
  const wheels: [number, number][] = [
    [-1.05, 1.45],
    [1.05, 1.45],
    [-1.05, -1.45],
    [1.05, -1.45],
  ];

  return (
    <group>
      {/* Body — glossy clearcoat car paint */}
      <RoundedBox
        args={[2.2, 0.55, 4.4]}
        radius={0.18}
        smoothness={6}
        position={[0, 0.55, 0]}
      >
        <meshPhysicalMaterial
          color="#b1121a"
          metalness={0.9}
          roughness={0.35}
          clearcoat={1}
          clearcoatRoughness={0.06}
          envMapIntensity={1.2}
        />
      </RoundedBox>

      {/* Cabin / glass-ish dark canopy */}
      <RoundedBox
        args={[1.7, 0.5, 2.1]}
        radius={0.16}
        smoothness={6}
        position={[0, 1.0, -0.15]}
      >
        <meshPhysicalMaterial
          color="#0b0b0d"
          metalness={0.4}
          roughness={0.15}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </RoundedBox>

      {/* Wheels */}
      {wheels.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.35, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.42, 0.42, 0.34, 40]} />
          <meshStandardMaterial color="#121214" metalness={0.6} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

export default function Scene() {
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

      <PlaceholderCar />

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
