import React from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Lighting() {
  const sunRef = React.useRef<THREE.DirectionalLight>(null);

  useFrame((state) => {
    if (sunRef.current) {
      const time = state.clock.elapsedTime * 0.1;
      const sunAngle = Math.sin(time) * 0.5 + 0.5;
      
      // Dynamic sun position for time-of-day effect
      sunRef.current.position.set(
        Math.cos(time) * 100,
        20 + sunAngle * 30,
        Math.sin(time) * 100
      );
      
      // Adjust intensity based on sun height
      sunRef.current.intensity = 0.5 + sunAngle * 1.5;
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} color="#98FB98" />
      
      <directionalLight
        ref={sunRef}
        position={[100, 50, 100]}
        intensity={2}
        color="#FFF8DC"
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={0.1}
        shadow-camera-far={300}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-bias={-0.0001}
      />
      
      <hemisphereLight
        args={['#87CEEB', '#228B22', 0.6]}
        position={[0, 50, 0]}
      />
      
      <pointLight
        position={[0, 10, 0]}
        intensity={0.2}
        color="#FFE4B5"
        distance={50}
        decay={2}
      />
    </>
  );
}