import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useRealisticGrassControls } from '../hooks/useRealisticGrassControls';
import { createNoise2D } from 'simplex-noise';

export default function RealisticGrassDemo() {
  const controls = useRealisticGrassControls();
  const groupRef = useRef<THREE.Group>(null);
  const noise2D = useMemo(() => createNoise2D(), []);
  
  // Function to get terrain height at any position
  const getTerrainHeight = useMemo(() => {
    return (x: number, z: number) => {
      // Multi-octave noise for natural terrain variation
      let height = 0;
      height += noise2D(x * 2, z * 2) * 0.08;  // Small hills
      height += noise2D(x * 4, z * 4) * 0.04;  // Medium details
      height += noise2D(x * 8, z * 8) * 0.02;  // Fine details
      height += noise2D(x * 16, z * 16) * 0.01; // Very fine details
      return height;
    };
  }, [noise2D]);
  
  // Wind animation system
  useFrame((state) => {
    if (groupRef.current && controls.enableWind) {
      const time = state.clock.elapsedTime;
      
      // Apply wind animation to each grass blade
      const children = groupRef.current.children;
      children.forEach((child, index) => {
        // Skip terrain mesh and only apply to grass blades
        if (child instanceof THREE.Mesh && 
            child.geometry instanceof THREE.PlaneGeometry && 
            child.userData.isGrassBlade) {
          const blade = child;
          const positions = blade.geometry.attributes.position.array as Float32Array;
          const originalPositions = blade.userData.originalPositions;
          
          if (!originalPositions) {
            // Store original positions on first frame
            blade.userData.originalPositions = new Float32Array(positions);
            return;
          }
          
          // Wind parameters
          const windDir = (controls.windDirection * Math.PI) / 180;
          const windStrength = controls.windStrength;
          const windSpeed = controls.windSpeed;
          
          // Add wind gusts
          let gustMultiplier = 1;
          if (controls.windGusts) {
            gustMultiplier = 1 + Math.sin(time * 0.5 + index * 0.1) * 0.3 + 
                           Math.sin(time * 1.3 + index * 0.2) * 0.2;
          }
          
          const finalWindStrength = windStrength * gustMultiplier;
          
          // Apply wind to vertices
          for (let i = 0; i < positions.length; i += 3) {
            const originalY = originalPositions[i + 1];
            const y = originalY + controls.bladeHeight/2;
            
            if (y > 0) {
              // Height ratio for progressive wind effect
              const heightRatio = y / controls.bladeHeight;
              const windEffect = heightRatio * heightRatio; // More effect at top
              
              // Wind displacement - more subtle
              const windPhase = time * windSpeed + index * 0.1;
              const windX = Math.cos(windDir) * finalWindStrength * windEffect * 
                           (Math.sin(windPhase) * 0.7 + Math.sin(windPhase * 2.3) * 0.3);
              const windZ = Math.sin(windDir) * finalWindStrength * windEffect * 
                           (Math.sin(windPhase + 0.5) * 0.7 + Math.sin(windPhase * 1.7) * 0.3);
              
              positions[i] = originalPositions[i] + windX * controls.bladeWidth;
              positions[i + 2] = originalPositions[i + 2] + windZ * controls.bladeHeight * 0.2;
            }
          }
          
          blade.geometry.attributes.position.needsUpdate = true;
        }
      });
    }
  });
  
  // Create smooth, soft grass blade geometry with interactive controls
  const createSimpleGrassBlade = useMemo(() => {
    return () => {
      // Use controls for blade dimensions
      const geometry = new THREE.PlaneGeometry(controls.bladeWidth, controls.bladeHeight, 3, 16);
      const positions = geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < positions.length; i += 3) {
        const originalY = positions[i + 1];
        const y = originalY + controls.bladeHeight/2; // Shift based on control height
        const x = positions[i];
        
        // Ensure we don't divide by zero or get NaN
        if (y >= 0 && y <= controls.bladeHeight) {
          // Smoother taper using cosine for rounded tip
          const heightRatio = Math.min(Math.max(y / controls.bladeHeight, 0), 1); // Clamp between 0 and 1
          const taperAngle = heightRatio * Math.PI * 0.45;
          const taperFactor = Math.cos(taperAngle) * 0.9; // Cosine taper for round tip
          
          // Only apply taper if factor is valid
          if (!isNaN(taperFactor) && isFinite(taperFactor)) {
            positions[i] = x * taperFactor; // Gentler taper
          }
          
          // Natural grass bend - proportional to blade height
          const bendAmount = Math.pow(heightRatio, 2.5) * (controls.bladeHeight * 0.125);
          if (!isNaN(bendAmount) && isFinite(bendAmount)) {
            positions[i + 2] = bendAmount;
            
            // Add very subtle wave for organic feel - proportional to blade height
            const waveAmount = Math.sin(heightRatio * Math.PI * 2) * (controls.bladeHeight * 0.008);
            if (!isNaN(waveAmount) && isFinite(waveAmount)) {
              positions[i + 2] += waveAmount;
            }
          }
          
          // Slight droop at the tip for softness - proportional to blade height
          if (heightRatio > 0.7) {
            const droopFactor = (heightRatio - 0.7) / 0.3;
            const droopAmount = droopFactor * droopFactor * (controls.bladeHeight * 0.067);
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
  }, [controls.bladeWidth, controls.bladeHeight]);

  // Create terrain geometry
  const terrainGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(
      controls.patchSize * 1.2, 
      controls.patchSize * 1.2, 
      32, 32
    );
    
    const positions = geometry.attributes.position.array as Float32Array;
    
    // Apply terrain height to each vertex
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 1];
      positions[i + 2] = getTerrainHeight(x, z);
    }
    
    geometry.computeVertexNormals();
    return geometry;
  }, [controls.patchSize, getTerrainHeight]);

  // Create varied grass blades with interactive controls
  const grassData = useMemo(() => {
    const blades = [];
    const patchSize = controls.patchSize;
    const density = controls.density;
    const spacing = patchSize / density;
    
    for (let x = 0; x < density; x++) {
      for (let z = 0; z < density; z++) {
        // Position with random offset
        const posX = (x * spacing - patchSize/2) + (Math.random() - 0.5) * spacing * 0.5;
        const posZ = (z * spacing - patchSize/2) + (Math.random() - 0.5) * spacing * 0.5;
        const posY = getTerrainHeight(posX, posZ); // Follow terrain height
        
        // Random attributes for each blade
        const blade = {
          position: [posX, posY, posZ] as [number, number, number],
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
  }, [controls.patchSize, controls.density]);

  const simpleBladeGeo = useMemo(() => createSimpleGrassBlade(), [createSimpleGrassBlade]);

  return (
    <group 
      ref={groupRef}
      position={[controls.position.x, controls.position.y, controls.position.z]}
    >
      {/* Terrain with natural undulations */}
      <mesh 
        geometry={terrainGeometry} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.001, 0]}
      >
        <meshStandardMaterial 
          color="#2a1f1a" 
          roughness={0.9}
          wireframe={false}
        />
      </mesh>
      
      {/* Add small rocks scattered across terrain */}
      {Array.from({ length: 8 }).map((_, i) => {
        const rockX = (Math.random() - 0.5) * controls.patchSize * 0.8;
        const rockZ = (Math.random() - 0.5) * controls.patchSize * 0.8;
        const rockY = getTerrainHeight(rockX, rockZ);
        const rockSize = 0.02 + Math.random() * 0.04;
        
        return (
          <mesh
            key={`rock-${i}`}
            position={[rockX, rockY + rockSize/2, rockZ]}
            rotation={[
              Math.random() * Math.PI,
              Math.random() * Math.PI,
              Math.random() * Math.PI
            ]}
          >
            <dodecahedronGeometry args={[rockSize, 0]} />
            <meshStandardMaterial 
              color={`hsl(${20 + Math.random() * 15}, 20%, ${15 + Math.random() * 10}%)`}
              roughness={0.95} 
            />
          </mesh>
        );
      })}
      
      {/* Add some dirt particles and pebbles */}
      {Array.from({ length: 15 }).map((_, i) => {
        const dirtX = (Math.random() - 0.5) * controls.patchSize;
        const dirtZ = (Math.random() - 0.5) * controls.patchSize;
        const dirtY = getTerrainHeight(dirtX, dirtZ);
        
        return (
          <mesh
            key={`dirt-${i}`}
            position={[dirtX, dirtY + 0.002, dirtZ]}
          >
            <sphereGeometry args={[0.005 + Math.random() * 0.008, 6, 6]} />
            <meshStandardMaterial color="#1a0f0a" roughness={1} />
          </mesh>
        );
      })}
      
      {/* Render individual grass blades */}
      {grassData.map((blade, index) => (
        <mesh
          key={index}
          geometry={simpleBladeGeo}
          position={blade.position}
          rotation={blade.rotation}
          scale={[blade.scale * 1.1, blade.scale * 1.3, blade.scale]}
          userData={{ isGrassBlade: true }}
        >
          <meshPhysicalMaterial 
            color={blade.color}
            side={THREE.DoubleSide}
            roughness={0.95}  // More matte, less shiny
            metalness={0}      // No metallic look
            sheen={0.5}        // Soft fabric-like sheen
            sheenColor={new THREE.Color('#90ee90')}  // Light green sheen
            sheenRoughness={0.8}
            clearcoat={0.05}   // Very subtle coating
            clearcoatRoughness={1}
            transmission={0.02} // Tiny bit of translucency
            thickness={0.1}
          />
        </mesh>
      ))}
      
      {/* Reference objects - conditional display */}
      {controls.showReference && (
        <group position={[controls.patchSize * 0.6, 0, controls.patchSize * 0.6]}>
          {/* Reference line proportional to patch size */}
          <mesh>
            <boxGeometry args={[controls.patchSize * 0.1, 0.002, 0.002]} />
            <meshBasicMaterial color="yellow" />
          </mesh>
          
          {/* Height reference */}
          <mesh position={[0, controls.patchSize * 0.05, 0]}>
            <boxGeometry args={[0.002, controls.patchSize * 0.1, 0.002]} />
            <meshBasicMaterial color="cyan" />
          </mesh>
          
          {/* Wind direction indicator */}
          {controls.enableWind && (
            <group 
              rotation={[0, (controls.windDirection * Math.PI) / 180, 0]}
              position={[0, controls.patchSize * 0.02, 0]}
            >
              <mesh position={[controls.patchSize * 0.05, 0, 0]}>
                <boxGeometry args={[controls.patchSize * 0.08 * controls.windStrength, 0.005, 0.005]} />
                <meshBasicMaterial color="red" />
              </mesh>
              {/* Arrow tip */}
              <mesh position={[controls.patchSize * 0.08 * controls.windStrength, 0, 0]}>
                <coneGeometry args={[0.01, 0.02, 4]} />
                <meshBasicMaterial color="red" />
              </mesh>
            </group>
          )}
        </group>
      )}
    </group>
  );
}