"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";

type CarModelProps = {
  /** Path to an optimized GLB under public/models/. */
  url: string;
  /** Real-world-ish target length (world units) the car is scaled to. */
  targetLength?: number;
};

/**
 * Loads an optimized GLB and normalizes it: uniform scale to `targetLength`,
 * centered on X/Z, and grounded so its base sits on y=0 (so the turntable
 * rotates around the car and the contact shadow lines up). Clones the cached
 * scene so we never mutate drei's useGLTF cache (which is shared by URL).
 */
export function CarModel({ url, targetLength = 4.3 }: CarModelProps) {
  const { scene } = useGLTF(url);

  const model = useMemo(() => {
    const clone = scene.clone(true);

    // Scale so the longest horizontal dimension equals targetLength.
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const longest = Math.max(size.x, size.z) || 1;
    clone.scale.setScalar(targetLength / longest);

    // Recompute post-scale, then center X/Z and ground to y=0.
    const grounded = new THREE.Box3().setFromObject(clone);
    const center = grounded.getCenter(new THREE.Vector3());
    clone.position.x -= center.x;
    clone.position.z -= center.z;
    clone.position.y -= grounded.min.y;

    return clone;
  }, [scene, targetLength]);

  return <primitive object={model} />;
}
