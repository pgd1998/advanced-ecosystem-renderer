import { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

interface GrassFieldLODProps {
  count?: number;
  fieldSize?: number;
}

export default function GrassFieldLOD({ 
  count = 3000, // Further reduced for LOD system
  fieldSize = 50 
}: GrassFieldLODProps) {
  const meshRefs = useRef<THREE.InstancedMesh[]>([]);
  const noise2D = useMemo(() => createNoise2D(), []);
  const { camera } = useThree();
  const windTime = useRef(0);

  // Create multiple LOD geometries
  const createGrassBlade = (lod: 'high' | 'medium' | 'low') => {
    const segments = lod === 'high' ? [2, 8] : lod === 'medium' ? [1, 4] : [1, 2];
    const geometry = new THREE.PlaneGeometry(0.05, 0.4, segments[0], segments[1]);
    const positions = geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < positions.length; i += 3) {
      const originalY = positions[i + 1];
      const y = originalY + 0.2;
      const x = positions[i];
      
      if (y >= 0 && y <= 0.4) {
        const heightRatio = Math.min(Math.max(y / 0.4, 0), 1);
        const taperAngle = heightRatio * Math.PI * 0.45;
        const taperFactor = Math.cos(taperAngle) * 0.9;
        
        if (!isNaN(taperFactor) && isFinite(taperFactor)) {
          positions[i] = x * taperFactor;
        }
        
        const bendAmount = Math.pow(heightRatio, 2.5) * 0.05;
        if (!isNaN(bendAmount) && isFinite(bendAmount)) {
          positions[i + 2] = bendAmount;
          
          const waveAmount = Math.sin(heightRatio * Math.PI * 2) * 0.003;
          if (!isNaN(waveAmount) && isFinite(waveAmount)) {
            positions[i + 2] += waveAmount;
          }
        }
        
        if (heightRatio > 0.7) {
          const droopFactor = (heightRatio - 0.7) / 0.3;
          const droopAmount = droopFactor * droopFactor * 0.02;
          if (!isNaN(droopAmount) && isFinite(droopAmount)) {
            positions[i + 1] = y - droopAmount;
          } else {
            positions[i + 1] = y;
          }
        } else {
          positions[i + 1] = y;
        }
      }
    }
    
    for (let i = 0; i < positions.length; i++) {
      if (isNaN(positions[i]) || !isFinite(positions[i])) {
        positions[i] = 0;
      }
    }
    
    geometry.computeVertexNormals();
    return geometry;
  };

  // Create LOD levels with different counts and geometries
  const lodData = useMemo(() => {
    const levels = [
      { distance: 30, count: Math.floor(count * 0.4), lod: 'high' as const },
      { distance: 80, count: Math.floor(count * 0.4), lod: 'medium' as const },
      { distance: 150, count: Math.floor(count * 0.2), lod: 'low' as const }
    ];

    return levels.map(level => {
      const geometry = createGrassBlade(level.lod);
      
      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        roughness: 0.9,
        metalness: 0.05,
        alphaTest: 0.5,
      });

      const matrixArray = new Float32Array(level.count * 16);
      const colors = new Float32Array(level.count * 3);
      const dummy = new THREE.Object3D();
      
      // Distribute grass with distance-based culling
      for (let i = 0; i < level.count; i++) {
        // Distribute across the field
        const x = (Math.random() - 0.5) * fieldSize;
        const z = (Math.random() - 0.5) * fieldSize;
        const height = noise2D(x * 0.01, z * 0.01) * 2;
        
        dummy.position.set(x, height, z);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        dummy.rotation.x = (Math.random() - 0.5) * 0.15;
        dummy.rotation.z = (Math.random() - 0.5) * 0.15;
        
        const baseScale = 0.7 + Math.random() * 0.5;
        dummy.scale.set(
          baseScale,
          baseScale * (0.8 + Math.random() * 0.4),
          baseScale
        );
        
        dummy.updateMatrix();
        dummy.matrix.toArray(matrixArray, i * 16);
        
        const hue = 105 + Math.random() * 25;
        const saturation = 35 + Math.random() * 20;
        const lightness = 28 + Math.random() * 12;
        
        const color = new THREE.Color(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }

      return {
        geometry,
        material,
        matrices: matrixArray,
        colorArray: colors,
        count: level.count,
        distance: level.distance
      };
    });
  }, [count, fieldSize, noise2D]);

  // Dynamic LOD switching based on camera distance
  useFrame((_, delta) => {
    windTime.current += delta * 0.5;
    
    const cameraPosition = camera.position;
    
    meshRefs.current.forEach((mesh, index) => {
      if (!mesh) return;
      
      const lodLevel = lodData[index];
      const distance = cameraPosition.distanceTo(mesh.position);
      
      // Show/hide based on distance
      mesh.visible = distance <= lodLevel.distance;
      
      // Apply wind animation only to visible meshes
      if (mesh.visible && distance < 50) {
        const windStrength = Math.min(1, 30 / distance);
        mesh.rotation.z = Math.sin(windTime.current) * 0.006 * windStrength;
        mesh.rotation.x = Math.cos(windTime.current * 0.7) * 0.004 * windStrength;
      }
    });
  });

  // Setup instance colors for each LOD level
  useEffect(() => {
    lodData.forEach((data, index) => {
      const mesh = meshRefs.current[index];
      if (mesh && data.colorArray) {
        const colorAttribute = new THREE.InstancedBufferAttribute(data.colorArray, 3);
        mesh.geometry.setAttribute('instanceColor', colorAttribute);
      }
    });
  }, [lodData]);

  return (
    <group>
      {lodData.map((data, index) => (
        <instancedMesh
          key={index}
          ref={el => { if (el) meshRefs.current[index] = el; }}
          args={[data.geometry, data.material, data.count]}
          castShadow={false}
          receiveShadow={false}
          frustumCulled={true}
        >
          <primitive object={data.material} attach="material" />
          <bufferAttribute
            attach="instanceMatrix"
            args={[data.matrices, 16]}
            usage={THREE.StaticDrawUsage}
          />
        </instancedMesh>
      ))}
    </group>
  );
}