import { create } from "zustand";
import { CARS } from "./cars";

interface GarageState {
  index: number;
  next: () => void;
  prev: () => void;
  setIndex: (i: number) => void;
}

/** Which car is currently on the turntable (preview/garage mode). */
export const useGarage = create<GarageState>((set) => ({
  index: 0,
  next: () => set((s) => ({ index: (s.index + 1) % CARS.length })),
  prev: () => set((s) => ({ index: (s.index - 1 + CARS.length) % CARS.length })),
  setIndex: (i) => set({ index: i }),
}));
