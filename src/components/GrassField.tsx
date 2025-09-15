import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import grassVertexShader from '@shaders/grass/grass.vert';
import grassFragmentShader from '@shaders/grass/grass.frag';

interface GrassFieldProps {
  count?: number;
  fieldSize?: number;
}

export default function GrassField({ 
  count = 50000, 
  fieldSize = 100 
}: GrassFieldProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const noise2D = useMemo(() => createNoise2D(), []);

  const { geometry, material, matrices } = useMemo(() => {
    // Create grass blade geometry
    const grassGeometry = new THREE.PlaneGeometry(0.5, 2, 1, 4);
    
    // Bend the grass blade for more natural look
    const positions = grassGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      const y = positions[i + 1];
      const bend = (y + 1) * 0.3; // Bend factor based on height
      positions[i] += Math.sin(bend) * 0.1; // Slight curve
    }
    
    grassGeometry.computeVertexNormals();

    // Create shader material for grass
    const grassMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        windStrength: { value: 1.0 },
        windDirection: { value: new THREE.Vector2(1, 0) },
        grassColor: { value: new THREE.Color('#4a7c59') },
        grassTipColor: { value: new THREE.Color('#7fb069') }
      },
      vertexShader: grassVertexShader,
      fragmentShader: grassFragmentShader,
      side: THREE.DoubleSide,
      transparent: true
    });

    // Generate grass positions
    const matrixArray = new Float32Array(count * 16);
    const dummy = new THREE.Object3D();
    
    for (let i = 0; i < count; i++) {
      // Random position within field
      const x = (Math.random() - 0.5) * fieldSize;
      const z = (Math.random() - 0.5) * fieldSize;
      
      // Get terrain height at this position
      const height = noise2D(x * 0.01, z * 0.01) * 3;
      
      // Position grass blade
      dummy.position.set(x, height, z);
      
      // Random rotation
      dummy.rotation.y = Math.random() * Math.PI * 2;
      
      // Random scale for variety
      const scale = 0.8 + Math.random() * 0.4;
      dummy.scale.set(scale, scale, scale);
      
      dummy.updateMatrix();
      dummy.matrix.toArray(matrixArray, i * 16);
    }

    return { 
      geometry: grassGeometry, 
      material: grassMaterial, 
      matrices: matrixArray 
    };
  }, [count, fieldSize, noise2D]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
      
      // Dynamic wind effect
      const windTime = state.clock.elapsedTime * 0.5;
      materialRef.current.uniforms.windDirection.value.set(
        Math.sin(windTime) * 0.5 + 0.5,
        Math.cos(windTime * 1.3) * 0.5 + 0.5
      );
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow
      receiveShadow
    >
      <primitive object={material} ref={materialRef} attach="material" />
      <bufferAttribute
        attach="instanceMatrix"
        args={[matrices, 16]}
        usage={THREE.StaticDrawUsage}
      />
    </instancedMesh>
  );
}