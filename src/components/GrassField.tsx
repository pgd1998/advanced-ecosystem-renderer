import { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

interface GrassFieldProps {
  count?: number;
  fieldSize?: number;
}

export default function GrassField({ 
  count, // Will be calculated based on density
  fieldSize = 30 // 30m x 30m scaled version of the realistic patch
}: GrassFieldProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const noise2D = useMemo(() => createNoise2D(), []);
  const { camera } = useThree();
  const windTime = useRef(0);

  // Create grass blade geometry scaled up from the realistic patch
  const createGrassBlade = (lod: 'high' | 'medium' | 'low' = 'medium') => {
    // Adjust segments based on LOD
    const segments = lod === 'high' ? [2, 8] : lod === 'medium' ? [1, 4] : [1, 2];
    // Scale from realistic patch: original was 0.0012m x 0.012m, scale up by factor of ~40
    // This gives us ~5cm wide x 50cm tall grass blades
    const geometry = new THREE.PlaneGeometry(0.05, 0.5, segments[0], segments[1]);
    const positions = geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < positions.length; i += 3) {
      const originalY = positions[i + 1];
      const y = originalY + 0.25; // Shift so y goes from 0 to 0.5 (50cm)
      const x = positions[i];
      
      // Ensure we don't divide by zero or get NaN
      if (y >= 0 && y <= 0.5) {
        // Smoother taper using cosine for rounded tip
        const heightRatio = Math.min(Math.max(y / 0.5, 0), 1); // Clamp between 0 and 1
        const taperAngle = heightRatio * Math.PI * 0.45;
        const taperFactor = Math.cos(taperAngle) * 0.9; // Cosine taper for round tip
        
        // Only apply taper if factor is valid
        if (!isNaN(taperFactor) && isFinite(taperFactor)) {
          positions[i] = x * taperFactor; // Gentler taper
        }
        
        // Natural grass bend - scaled proportionally
        const bendAmount = Math.pow(heightRatio, 2.5) * 0.06; // Proportional bend for 50cm grass
        if (!isNaN(bendAmount) && isFinite(bendAmount)) {
          positions[i + 2] = bendAmount;
          
          // Add subtle wave for organic feel
          const waveAmount = Math.sin(heightRatio * Math.PI * 2) * 0.003;
          if (!isNaN(waveAmount) && isFinite(waveAmount)) {
            positions[i + 2] += waveAmount;
          }
        }
        
        // Slight droop at the tip for softness
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
    
    // Verify no NaN values before computing normals
    for (let i = 0; i < positions.length; i++) {
      if (isNaN(positions[i]) || !isFinite(positions[i])) {
        positions[i] = 0; // Reset to 0 if NaN
      }
    }
    
    geometry.computeVertexNormals();
    return geometry;
  };

  const { geometry, material, matrices, colorArray, actualCount } = useMemo(() => {
    const grassGeometry = createGrassBlade('medium');

    // Use realistic but performance-friendly material
    const grassMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.95,
      metalness: 0,
      alphaTest: 0.1, // For better transparency performance
    });

    // Replicate the EXACT realistic patch scaled up
    // Original patch: 25x25 = 625 blades in 0.03m (3cm) patch
    // Scale factor: 30m / 0.03m = 1000x
    // We'll use the exact same 25x25 grid but scaled up
    const gridSize = 25; // Same as realistic patch
    const calculatedCount = count || (gridSize * gridSize);
    const spacing = fieldSize / gridSize; // 30m / 25 = 1.2m spacing between blades
    
    console.log(`Scaled realistic patch: ${fieldSize}m x ${fieldSize}m, Grid: ${gridSize}x${gridSize}, Grass count: ${calculatedCount}, Spacing: ${spacing}m`);

    // Generate grass positions using the EXACT same grid as realistic patch
    const matrixArray = new Float32Array(calculatedCount * 16);
    const colors = new Float32Array(calculatedCount * 3);
    const dummy = new THREE.Object3D();
    
    let bladeIndex = 0;
    
    for (let x = 0; x < gridSize && bladeIndex < calculatedCount; x++) {
      for (let z = 0; z < gridSize && bladeIndex < calculatedCount; z++) {
        // Position with random offset like the realistic patch
        const posX = (x * spacing - fieldSize/2) + (Math.random() - 0.5) * spacing * 0.5;
        const posZ = (z * spacing - fieldSize/2) + (Math.random() - 0.5) * spacing * 0.5;
        
        // Get terrain height at this position
        const height = noise2D(posX * 0.01, posZ * 0.01) * 2;
        
        // Position grass blade at ground level
        dummy.position.set(posX, height, posZ);
        
        // Random attributes for each blade (same as realistic patch)
        dummy.rotation.set(
          (Math.random() - 0.5) * 0.3,  // Lean X
          Math.random() * Math.PI * 2,   // Random Y rotation
          (Math.random() - 0.5) * 0.3   // Lean Z
        );
        
        // Scale variation like the realistic patch
        const scale = 0.8 + Math.random() * 0.4; // Scale variation
        dummy.scale.set(
          scale * 1.1, // Slightly wider like the patch
          scale * 1.3, // Height variation like the patch
          scale
        );
        
        dummy.updateMatrix();
        dummy.matrix.toArray(matrixArray, bladeIndex * 16);
        
        // Generate realistic grass colors (same as patch)
        const hue = 105 + Math.random() * 25; // Green range
        const saturation = 35 + Math.random() * 20;
        const lightness = 28 + Math.random() * 12;
        
        const color = new THREE.Color(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
        colors[bladeIndex * 3] = color.r;
        colors[bladeIndex * 3 + 1] = color.g;
        colors[bladeIndex * 3 + 2] = color.b;
        
        bladeIndex++;
      }
    }

    return { 
      geometry: grassGeometry, 
      material: grassMaterial, 
      matrices: matrixArray,
      colorArray: colors,
      actualCount: bladeIndex
    };
  }, [count, fieldSize, noise2D]);

  // Optimized wind animation with LOD
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    windTime.current += delta * 0.5;
    
    // Only animate if camera is close enough
    const distance = camera.position.distanceTo(meshRef.current.position);
    if (distance < 100) {
      // Very subtle wind animation
      const windStrength = Math.min(1, 50 / distance); // Fade with distance
      meshRef.current.rotation.z = Math.sin(windTime.current) * 0.008 * windStrength;
      meshRef.current.rotation.x = Math.cos(windTime.current * 0.7) * 0.005 * windStrength;
    }
  });

  // Setup instance colors
  useEffect(() => {
    if (meshRef.current && colorArray) {
      const colorAttribute = new THREE.InstancedBufferAttribute(colorArray, 3);
      meshRef.current.geometry.setAttribute('instanceColor', colorAttribute);
    }
  }, [colorArray]);

  return (
    <group>
      {/* Dark soil ground like the realistic patch */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[fieldSize * 1.2, fieldSize * 1.2]} />
        <meshStandardMaterial 
          color="#2a1f1a" 
          roughness={0.9}
        />
      </mesh>
      
      {/* Grass field */}
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, actualCount]}
        castShadow={false}  // Disabled for performance
        receiveShadow={false}
        frustumCulled={true}  // Enable culling for performance
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