import { useMemo, useRef } from 'react';
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
  count = 15000, 
  fieldSize = 80 
}: GrassFieldProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const noise2D = useMemo(() => createNoise2D(), []);

  const { geometry, material, matrices } = useMemo(() => {
    // Create simple grass blade using PlaneGeometry and modify it
    const grassGeometry = new THREE.PlaneGeometry(0.2, 2, 1, 4);
    
    // Bend the grass blade for more natural look
    const positions = grassGeometry.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      const y = positions[i + 1];
      const x = positions[i];
      
      // Taper the width towards the tip
      const heightFactor = (y + 1) / 2; // 0 to 1 from bottom to top
      positions[i] = x * (1 - heightFactor * 0.5); // Narrow at top
      
      // Add slight curve
      const bend = heightFactor * 0.3;
      positions[i + 2] += Math.sin(bend * Math.PI) * 0.1;
    }
    
    grassGeometry.computeVertexNormals();

    // Create realistic grass material with custom shaders
    const grassMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        windStrength: { value: 0.5 },
        windDirection: { value: new THREE.Vector2(1, 0.5) },
        grassColor: { value: new THREE.Color('#2d5016') },
        grassTipColor: { value: new THREE.Color('#7cb342') }
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
      
      // Get terrain height at this position (smaller scale for gentler terrain)
      const height = noise2D(x * 0.01, z * 0.01) * 2;
      
      // Position grass blade at ground level
      dummy.position.set(x, height, z);
      
      // Random rotation for natural look
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.rotation.x = (Math.random() - 0.5) * 0.2; // Slight random lean
      dummy.rotation.z = (Math.random() - 0.5) * 0.2;
      
      // Random scale for variety (taller grass looks more realistic)
      const scale = 1.2 + Math.random() * 1.0;
      dummy.scale.set(scale * 0.9, scale, scale * 0.9);
      
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
    // Update shader uniforms for wind animation
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
      
      // Dynamic wind direction and strength
      const windTime = state.clock.elapsedTime * 0.5;
      materialRef.current.uniforms.windDirection.value.set(
        Math.sin(windTime) * 0.8 + 0.5,
        Math.cos(windTime * 1.3) * 0.6 + 0.4
      );
      
      // Varying wind strength for natural gusts
      const gustStrength = 0.3 + Math.sin(windTime * 2.1) * 0.2;
      materialRef.current.uniforms.windStrength.value = gustStrength;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow={false}
      receiveShadow={false}
    >
      <primitive ref={materialRef} object={material} attach="material" />
      <bufferAttribute
        attach="instanceMatrix"
        args={[matrices, 16]}
        usage={THREE.StaticDrawUsage}
      />
    </instancedMesh>
  );
}