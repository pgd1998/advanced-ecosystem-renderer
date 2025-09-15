import React from 'react';
import { useFrame } from '@react-three/fiber';
import { useWindStore } from '@store/windStore';

export default function WindSystem() {
  const { setWindData } = useWindStore();

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Generate dynamic wind patterns
    const windSpeed = 0.5 + Math.sin(time * 0.3) * 0.3;
    const windDirection = {
      x: Math.sin(time * 0.2) * 0.8,
      y: Math.cos(time * 0.15) * 0.8
    };
    
    const turbulence = Math.sin(time * 2.0) * 0.2 + 0.8;
    
    setWindData({
      speed: windSpeed,
      direction: windDirection,
      turbulence,
      time
    });
  });

  return null; // This component doesn't render anything visible
}