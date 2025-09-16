import { useControls } from 'leva';

export function useRealisticGrassControls() {
  return useControls('Realistic Grass Patch', {
    patchSize: { value: 3, min: 1, max: 10, step: 0.5 },
    density: { value: 35, min: 10, max: 60, step: 5 }, // Reduced further to prevent context loss
    bladeWidth: { value: 0.012, min: 0.005, max: 0.05, step: 0.001 },
    bladeHeight: { value: 0.12, min: 0.05, max: 0.3, step: 0.01 },
    position: {
      value: { x: 0, y: 0, z: 0 },
      step: 0.1
    },
    showReference: true,
    enableWind: true
  });
}