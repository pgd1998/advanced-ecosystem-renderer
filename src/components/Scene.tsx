import React from 'react';
import { Environment, Sky } from '@react-three/drei';
import Terrain from './Terrain';
import RealisticGrassDemo from './RealisticGrassDemo';
import Lighting from './Lighting';
import WindSystem from './WindSystem';

interface SceneProps {
  useLOD?: boolean;
}

export default function Scene({ useLOD = false }: SceneProps) {
  return (
    <>
      <Lighting />
      
      <Sky
        distance={450000}
        sunPosition={[100, 20, 100]}
        inclination={0.49}
        azimuth={0.25}
        turbidity={10}
        rayleigh={3}
        mieCoefficient={0.005}
        mieDirectionalG={0.7}
      />
      
      <Environment preset="sunset" background={false} />
      
      <fog attach="fog" args={['#98FB98', 80, 150]} />
      
      <WindSystem />
      <Terrain />
      <RealisticGrassDemo />
    </>
  );
}