import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { createNoise2D } from 'simplex-noise';

interface TerrainProps {
  size?: number;
  resolution?: number;
  heightScale?: number;
}

export default function Terrain({ 
  size = 100, 
  resolution = 64, 
  heightScale = 4 
}: TerrainProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const noise2D = useMemo(() => createNoise2D(), []);

  const { geometry, material } = useMemo(() => {
    // Create plane geometry
    const geo = new THREE.PlaneGeometry(size, size, resolution - 1, resolution - 1);
    
    // Get position attribute
    const positions = geo.attributes.position.array as Float32Array;
    
    // Generate height map using noise
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 1];
      
      // Multi-octave noise for realistic terrain
      let height = 0;
      height += noise2D(x * 0.01, z * 0.01) * heightScale;
      height += noise2D(x * 0.02, z * 0.02) * heightScale * 0.5;
      height += noise2D(x * 0.04, z * 0.04) * heightScale * 0.25;
      height += noise2D(x * 0.08, z * 0.08) * heightScale * 0.125;
      
      positions[i + 2] = height;
    }
    
    // Recompute normals for proper lighting
    geo.computeVertexNormals();
    
    // Create material with realistic ground appearance
    const mat = new THREE.MeshLambertMaterial({
      color: '#3d5a3d',
      side: THREE.DoubleSide
    });
    
    return { geometry: geo, material: mat };
  }, [size, resolution, heightScale, noise2D]);

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle terrain breathing effect
      const time = state.clock.elapsedTime;
      meshRef.current.position.y = Math.sin(time * 0.1) * 0.1;
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow={false}
    />
  );
}