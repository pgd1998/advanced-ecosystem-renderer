import { useMemo, useRef } from 'react';
import * as THREE from 'three';

export default function SimpleTestGrass() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { geometry, material, matrices } = useMemo(() => {
    // Very simple grass blade - just a basic plane
    const grassGeometry = new THREE.PlaneGeometry(1, 3, 1, 1); // 1m x 3m, minimal segments
    
    // Simple material
    const grassMaterial = new THREE.MeshBasicMaterial({
      color: '#4CAF50',
      side: THREE.DoubleSide
    });

    // Just 4 grass blades for testing
    const count = 4;
    const matrixArray = new Float32Array(count * 16);
    const dummy = new THREE.Object3D();
    
    // Position them in a simple 2x2 grid
    const positions = [
      [-5, 0, -5],
      [5, 0, -5], 
      [-5, 0, 5],
      [5, 0, 5]
    ];
    
    for (let i = 0; i < count; i++) {
      dummy.position.set(positions[i][0], positions[i][1], positions[i][2]);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      dummy.matrix.toArray(matrixArray, i * 16);
    }

    console.log(`Simple test: ${count} blades, matrix array length: ${matrixArray.length}`);

    return { 
      geometry: grassGeometry, 
      material: grassMaterial, 
      matrices: matrixArray 
    };
  }, []);

  return (
    <group>
      {/* Soil ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#2a1f1a" roughness={0.9} />
      </mesh>
      
      {/* Test grass */}
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, 4]}
        castShadow={false}
        receiveShadow={false}
      >
        <primitive object={material} attach="material" />
        <bufferAttribute
          attach="instanceMatrix"
          args={[matrices, 16]}
          usage={THREE.StaticDrawUsage}
        />
      </instancedMesh>
    </group>
  );
}