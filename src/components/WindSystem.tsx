import React from 'react';
import { useFrame } from '@react-three/fiber';
import { useWindStore } from '@store/windStore';

export default function WindSystem() {
  const { setWindData } = useWindStore();

  useFrame((state, delta) => {
    // Reduce update frequency for better performance
    if (state.frameloop === 'demand' || Math.floor(state.clock.elapsedTime * 30) % 2 === 0) {
      const time = state.clock.elapsedTime;
      
      // Generate simpler wind patterns
      const windSpeed = 0.5 + Math.sin(time * 0.2) * 0.2;
      const windDirection = {
        x: Math.sin(time * 0.1) * 0.6,
        y: Math.cos(time * 0.1) * 0.6
      };
      
      const turbulence = Math.sin(time * 1.0) * 0.1 + 0.9;
      
      setWindData({
        speed: windSpeed,
        direction: windDirection,
        turbulence,
        time
      });
    }
  });

  return null; // This component doesn't render anything visible
}