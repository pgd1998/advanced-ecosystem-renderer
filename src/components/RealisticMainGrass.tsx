import { useMemo } from 'react';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

interface RealisticMainGrassProps {
  fieldSize?: number;
  density?: number;
  bladeWidth?: number;
  bladeHeight?: number;
}

export default function RealisticMainGrass({
  fieldSize = 100, // Match terrain size (100m x 100m)
  density = 15,    // Lower density for full coverage
  bladeWidth = 0.1,   // 10cm wide (more visible)
  bladeHeight = 0.4   // 40cm tall (more visible)
}: RealisticMainGrassProps) {
  
  const noise2D = useMemo(() => createNoise2D(), []);

  // Use EXACT same grass blade creation as realistic patch
  const createGrassBlade = useMemo(() => {
    return () => {
      // Use same geometry creation as successful realistic patch
      const geometry = new THREE.PlaneGeometry(bladeWidth, bladeHeight, 3, 16);
      const positions = geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < positions.length; i += 3) {
        const originalY = positions[i + 1];
        const y = originalY + bladeHeight/2; // Shift so y goes from 0 to bladeHeight
        const x = positions[i];
        
        // Ensure we don't divide by zero or get NaN
        if (y >= 0 && y <= bladeHeight) {
          // Smoother taper using cosine for rounded tip
          const heightRatio = Math.min(Math.max(y / bladeHeight, 0), 1);
          const taperAngle = heightRatio * Math.PI * 0.45;
          const taperFactor = Math.cos(taperAngle) * 0.9;
          
          // Only apply taper if factor is valid
          if (!isNaN(taperFactor) && isFinite(taperFactor)) {
            positions[i] = x * taperFactor;
          }
          
          // Natural grass bend - proportional to blade height
          const bendAmount = Math.pow(heightRatio, 2.5) * (bladeHeight * 0.125);
          if (!isNaN(bendAmount) && isFinite(bendAmount)) {
            positions[i + 2] = bendAmount;
            
            // Add very subtle wave for organic feel
            const waveAmount = Math.sin(heightRatio * Math.PI * 2) * (bladeHeight * 0.008);
            if (!isNaN(waveAmount) && isFinite(waveAmount)) {
              positions[i + 2] += waveAmount;
            }
          }
          
          // Slight droop at the tip for softness
          if (heightRatio > 0.7) {
            const droopFactor = (heightRatio - 0.7) / 0.3;
            const droopAmount = droopFactor * droopFactor * (bladeHeight * 0.067);
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
          positions[i] = 0;
        }
      }
      
      geometry.computeVertexNormals();
      return geometry;
    };
  }, [bladeWidth, bladeHeight]);

  // Use EXACT same grass data generation as realistic patch
  const grassData = useMemo(() => {
    const blades = [];
    const spacing = fieldSize / density;
    
    console.log(`Realistic main grass: ${fieldSize}m x ${fieldSize}m, ${density}x${density} density, ${density * density} blades, ${spacing.toFixed(3)}m spacing`);
    
    for (let x = 0; x < density; x++) {
      for (let z = 0; z < density; z++) {
        // Position with random offset - EXACT same as realistic patch
        const posX = (x * spacing - fieldSize/2) + (Math.random() - 0.5) * spacing * 0.5;
        const posZ = (z * spacing - fieldSize/2) + (Math.random() - 0.5) * spacing * 0.5;
        
        // Add terrain height variation using noise (like original GrassField)
        const terrainHeight = noise2D(posX * 0.01, posZ * 0.01) * 2;
        
        // Random attributes for each blade - EXACT same as realistic patch
        const blade = {
          position: [posX, terrainHeight, posZ] as [number, number, number],
          rotation: [
            (Math.random() - 0.5) * 0.3,  // Lean X
            Math.random() * Math.PI * 2,   // Random Y rotation
            (Math.random() - 0.5) * 0.3   // Lean Z
          ] as [number, number, number],
          scale: 0.8 + Math.random() * 0.4, // Scale variation
          color: new THREE.Color(
            `hsl(${105 + Math.random() * 25}, ${35 + Math.random() * 20}%, ${28 + Math.random() * 12}%)`
          )
        };
        
        blades.push(blade);
      }
    }
    
    return blades;
  }, [fieldSize, density]);

  const bladeGeometry = useMemo(() => createGrassBlade(), [createGrassBlade]);

  return (
    <group position={[0, 0, 0]}>
      {/* Render individual grass blades - EXACT same as realistic patch */}
      {grassData.map((blade, index) => (
        <mesh
          key={index}
          geometry={bladeGeometry}
          position={blade.position}
          rotation={blade.rotation}
          scale={[blade.scale * 1.1, blade.scale * 1.3, blade.scale]}
        >
          <meshPhysicalMaterial 
            color={blade.color}
            side={THREE.DoubleSide}
            roughness={0.95}
            metalness={0}
            sheen={0.5}
            sheenColor={new THREE.Color('#90ee90')}
            sheenRoughness={0.8}
            clearcoat={0.05}
            clearcoatRoughness={1}
            transmission={0.02}
            thickness={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}