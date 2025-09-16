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

  // Use EXACT same blade geometry as your successful realistic patch
  const createGrassBlade = (lod: 'high' | 'medium' | 'low' = 'medium') => {
    // Use same segments as realistic patch for quality
    const segments = [3, 16]; // Same as successful realistic patch
    // Make blades very large so they're definitely visible: 1m x 3m
    const geometry = new THREE.PlaneGeometry(1, 3, segments[0], segments[1]);
    const positions = geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < positions.length; i += 3) {
      const originalY = positions[i + 1];
      const y = originalY + 1.5; // Shift so y goes from 0 to 3 (3m tall)
      const x = positions[i];
      
      // Ensure we don't divide by zero or get NaN
      if (y >= 0 && y <= 3) {
        // Smoother taper using cosine for rounded tip
        const heightRatio = Math.min(Math.max(y / 3, 0), 1); // Clamp between 0 and 1
        const taperAngle = heightRatio * Math.PI * 0.45;
        const taperFactor = Math.cos(taperAngle) * 0.9; // Cosine taper for round tip
        
        // Only apply taper if factor is valid
        if (!isNaN(taperFactor) && isFinite(taperFactor)) {
          positions[i] = x * taperFactor; // Gentler taper
        }
        
        // Natural grass bend - scaled for 3m blade
        const bendAmount = Math.pow(heightRatio, 2.5) * 0.3; // Proportional to blade height
        if (!isNaN(bendAmount) && isFinite(bendAmount)) {
          positions[i + 2] = bendAmount;
          
          // Add subtle wave for organic feel - scaled for 3m blade
          const waveAmount = Math.sin(heightRatio * Math.PI * 2) * 0.03;
          if (!isNaN(waveAmount) && isFinite(waveAmount)) {
            positions[i + 2] += waveAmount;
          }
        }
        
        // Slight droop at the tip for softness - scaled for 3m blade
        if (heightRatio > 0.7) {
          const droopFactor = (heightRatio - 0.7) / 0.3;
          const droopAmount = droopFactor * droopFactor * 0.2;
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

    // Use the same realistic material as the successful patch
    const grassMaterial = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.95,  // More matte, less shiny
      metalness: 0,      // No metallic look
      sheen: 0.5,        // Soft fabric-like sheen
      sheenColor: new THREE.Color('#90ee90'),  // Light green sheen
      sheenRoughness: 0.8,
      clearcoat: 0.05,   // Very subtle coating
      clearcoatRoughness: 1,
      transmission: 0.02, // Tiny bit of translucency
      thickness: 0.1
    });

    // Use realistic patch density approach with performance scaling
    // Your successful patch: 70x70 = 4,900 blades in 3m x 3m (very realistic!)
    // Scale this density to main field but with performance considerations
    const patchDensity = 70; // From your successful realistic patch
    const patchSize = 3; // 3m x 3m successful patch
    const densityRatio = patchDensity / patchSize; // 23.33 blades per meter
    
    // For 30m field, this would be 700x700 = 490,000 blades (too much!)
    // Start with very few blades so we can see them
    const gridSize = 5; // Just 5x5 = 25 blades to start
    const calculatedCount = count || (gridSize * gridSize);
    const spacing = fieldSize / gridSize;
    
    console.log(`Realistic density approach: ${fieldSize}m x ${fieldSize}m, Grid: ${gridSize}x${gridSize}, Grass count: ${calculatedCount}, Spacing: ${spacing.toFixed(2)}m`);

    // Generate grass positions using the EXACT same grid as realistic patch
    const matrixArray = new Float32Array(calculatedCount * 16);
    const colors = new Float32Array(calculatedCount * 3);
    const dummy = new THREE.Object3D();
    
    let bladeIndex = 0;
    
    // Fill exactly calculatedCount positions
    for (let i = 0; i < calculatedCount; i++) {
      const x = i % gridSize;
      const z = Math.floor(i / gridSize);
      
      // Position with random offset
      const posX = (x * spacing - fieldSize/2) + (Math.random() - 0.5) * spacing * 0.5;
      const posZ = (z * spacing - fieldSize/2) + (Math.random() - 0.5) * spacing * 0.5;
      
      // Get terrain height at this position
      const height = noise2D(posX * 0.01, posZ * 0.01) * 2;
      
      // Position grass blade at ground level
      dummy.position.set(posX, height, posZ);
      
      // Grass attributes
      dummy.rotation.set(
        (Math.random() - 0.5) * 0.3,  // Lean X
        Math.random() * Math.PI * 2,   // Random Y rotation
        (Math.random() - 0.5) * 0.3   // Lean Z
      );
      
      // Scale variation
      const scale = 0.8 + Math.random() * 0.4;
      dummy.scale.set(
        scale * 1.1, // Slightly wider
        scale * 1.3, // Height variation
        scale        // Depth
      );
      
      dummy.updateMatrix();
      dummy.matrix.toArray(matrixArray, i * 16);
      
      // Generate realistic grass colors
      const hue = 105 + Math.random() * 25;
      const saturation = 35 + Math.random() * 20;
      const lightness = 28 + Math.random() * 12;
      
      const color = new THREE.Color(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      bladeIndex++;
    }

    console.log(`Generated ${bladeIndex} grass blades, expected ${calculatedCount}`);
    
    return { 
      geometry: grassGeometry, 
      material: grassMaterial, 
      matrices: matrixArray,
      colorArray: colors,
      actualCount: calculatedCount // Use calculatedCount to match matrix array size
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