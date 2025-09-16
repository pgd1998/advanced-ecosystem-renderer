import { useControls } from 'leva';

export function useGrassControls() {
  return useControls('Grass Settings', {
    fieldSize: { value: 100, min: 50, max: 150, step: 10 },
    density: { value: 15, min: 5, max: 30, step: 1 },
    bladeWidth: { value: 0.1, min: 0.01, max: 0.3, step: 0.01 },
    bladeHeight: { value: 0.4, min: 0.1, max: 2.0, step: 0.1 }
  });
}