import { create } from 'zustand';

interface WindData {
  speed: number;
  direction: { x: number; y: number };
  turbulence: number;
  time: number;
}

interface WindState {
  windData: WindData;
  setWindData: (data: WindData) => void;
}

export const useWindStore = create<WindState>((set) => ({
  windData: {
    speed: 1.0,
    direction: { x: 1, y: 0 },
    turbulence: 1.0,
    time: 0
  },
  setWindData: (data) => set({ windData: data }),
}));