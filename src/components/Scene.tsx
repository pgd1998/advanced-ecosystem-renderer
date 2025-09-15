import React from 'react';
import { Environment, Sky } from '@react-three/drei';
import Terrain from './Terrain';
import GrassField from './GrassField';
import Lighting from './Lighting';
import WindSystem from './WindSystem';

export default function Scene() {
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
      
      <Environment preset="sunset" />
      
      <fog attach="fog" args={['#98FB98', 50, 200]} />
      
      <WindSystem />
      <Terrain />
      <GrassField />
    </>
  );
}