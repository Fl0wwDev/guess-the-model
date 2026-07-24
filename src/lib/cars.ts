export type Car = {
  id: string;
  /** Display name (the answer in the quiz). */
  name: string;
  brand: string;
  /** Path to the optimized GLB under public/models/<brand>/. */
  url: string;
  /** Real-world-ish length (world units) used to normalize scale. */
  targetLength: number;
};

/**
 * The working garage. GLBs are optimized (meshopt) and organized by brand under
 * public/models/<brand>/. See public/models/CREDITS.md for provenance.
 * Add cars here — the scene, the switcher and (later) the quiz all read this.
 * Focus: Ferrari & Porsche.
 */
export const CARS: Car[] = [
  {
    id: "ferrari-f40",
    name: "Ferrari F40",
    brand: "Ferrari",
    url: "/models/ferrari/f40.glb",
    targetLength: 4.4,
  },
  {
    id: "ferrari-458",
    name: "Ferrari 458 Italia",
    brand: "Ferrari",
    url: "/models/ferrari/458-italia.glb",
    targetLength: 4.5,
  },
  {
    id: "ferrari-sf90",
    name: "Ferrari SF90 Spider",
    brand: "Ferrari",
    url: "/models/ferrari/sf90-spider.glb",
    targetLength: 4.7,
  },
  {
    id: "ford-gt40",
    name: "Ford GT40",
    brand: "Ford",
    url: "/models/ford/gt40.glb",
    targetLength: 4.2,
  },
  {
    id: "toyota-supra",
    name: "Toyota Supra MK4",
    brand: "Toyota",
    url: "/models/toyota/supra-mk4.glb",
    targetLength: 4.5,
  },
  {
    id: "dodge-challenger",
    name: "Dodge Challenger R/T",
    brand: "Dodge",
    url: "/models/dodge/challenger-rt.glb",
    targetLength: 5.0,
  },
];
