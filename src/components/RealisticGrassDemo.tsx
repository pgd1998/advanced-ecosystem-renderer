import { useMemo } from 'react';
import * as THREE from 'three';

export default function RealisticGrassDemo() {
  // Create more realistic grass blade geometry
  const createGrassBlade = useMemo(() => {
    return () => {
      // Create a more complex grass blade with multiple segments
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),                    // Base
        new THREE.Vector3(0.0001, 0.003, 0.0002),     // Slight bend at 3mm
        new THREE.Vector3(0.0002, 0.006, 0.0005),     // More bend at 6mm
        new THREE.Vector3(0.0003, 0.009, 0.0008),     // Continue bending
        new THREE.Vector3(0.0004, 0.012, 0.001),      // Near tip
        new THREE.Vector3(0.0004, 0.015, 0.0012)      // Tip at 15mm
      ]);

      // Create a tapered profile for the blade
      const bladeShape = new THREE.Shape();
      
      // Create blade cross-section (very thin)
      bladeShape.moveTo(0, -0.0005);  // 0.5mm width at base
      bladeShape.lineTo(0, 0.0005);
      
      // Extrude along the curve with tapering
      const extrudeSettings = {
        steps: 20,
        bevelEnabled: false,
        extrudePath: curve,
      };

      // Create geometry with custom tapering
      const geometry = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
      
      // Manually taper the geometry vertices
      const positions = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        const y = positions[i + 1];
        // Taper based on height (0 to 0.015)
        const taper = 1 - (y / 0.015) * 0.9; // Taper to 10% at tip
        positions[i] *= taper;     // x
        positions[i + 2] *= taper; // z
      }
      
      geometry.computeVertexNormals();
      return geometry;
    };
  }, []);

  // Create smooth, soft grass blade geometry scaled up
  const createSimpleGrassBlade = useMemo(() => {
    return () => {
      // Use moderate scaling: 1.2cm wide x 12cm tall (scale factor 10x from original)
      const geometry = new THREE.PlaneGeometry(0.012, 0.12, 3, 16); // More reasonable scale
      const positions = geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < positions.length; i += 3) {
        const originalY = positions[i + 1];
        const y = originalY + 0.06; // Shift so y goes from 0 to 0.12 (12cm)
        const x = positions[i];
        
        // Ensure we don't divide by zero or get NaN
        if (y >= 0 && y <= 0.12) {
          // Smoother taper using cosine for rounded tip
          const heightRatio = Math.min(Math.max(y / 0.12, 0), 1); // Clamp between 0 and 1
          const taperAngle = heightRatio * Math.PI * 0.45;
          const taperFactor = Math.cos(taperAngle) * 0.9; // Cosine taper for round tip
          
          // Only apply taper if factor is valid
          if (!isNaN(taperFactor) && isFinite(taperFactor)) {
            positions[i] = x * taperFactor; // Gentler taper
          }
          
          // Natural grass bend - moderate scaling
          const bendAmount = Math.pow(heightRatio, 2.5) * 0.015; // Proportional to 12cm height
          if (!isNaN(bendAmount) && isFinite(bendAmount)) {
            positions[i + 2] = bendAmount;
            
            // Add very subtle wave for organic feel
            const waveAmount = Math.sin(heightRatio * Math.PI * 2) * 0.001;
            if (!isNaN(waveAmount) && isFinite(waveAmount)) {
              positions[i + 2] += waveAmount;
            }
          }
          
          // Slight droop at the tip for softness
          if (heightRatio > 0.7) {
            const droopFactor = (heightRatio - 0.7) / 0.3;
            const droopAmount = droopFactor * droopFactor * 0.008;
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
  }, []);

  // Create varied grass blades with moderate scaling
  const grassData = useMemo(() => {
    const blades = [];
    const patchSize = 3; // 3m (moderate scale up from 3cm)
    const density = 70; // Double the density (was 25, now 50)
    const spacing = patchSize / density;
    
    for (let x = 0; x < density; x++) {
      for (let z = 0; z < density; z++) {
        // Position with random offset
        const posX = (x * spacing - patchSize/2) + (Math.random() - 0.5) * spacing * 0.5;
        const posZ = (z * spacing - patchSize/2) + (Math.random() - 0.5) * spacing * 0.5;
        
        // Random attributes for each blade
        const blade = {
          position: [posX, 0, posZ] as [number, number, number],
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
  }, []);

  const simpleBladeGeo = useMemo(() => createSimpleGrassBlade(), [createSimpleGrassBlade]);

  return (
    <group position={[0, 0, 0]}>
      {/* Dark soil ground - moderate scaling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial 
          color="#2a1f1a" 
          roughness={0.9}
        />
      </mesh>
      
      {/* Add some dirt particles for realism - moderate scaling */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh
          key={`dirt-${i}`}
          position={[
            (Math.random() - 0.5) * 3,
            Math.random() * 0.002,
            (Math.random() - 0.5) * 3
          ]}
        >
          <sphereGeometry args={[0.002 + Math.random() * 0.003, 4, 4]} />
          <meshStandardMaterial color="#1a0f0a" roughness={1} />
        </mesh>
      ))}
      
      {/* Render individual grass blades */}
      {grassData.map((blade, index) => (
        <mesh
          key={index}
          geometry={simpleBladeGeo}
          position={blade.position}
          rotation={blade.rotation}
          scale={[blade.scale * 1.1, blade.scale * 1.3, blade.scale]}
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
      
      {/* Reference objects - moderate scaling */}
      <group position={[1.8, 0, 1.8]}>
        {/* 50cm reference line */}
        <mesh>
          <boxGeometry args={[0.5, 0.01, 0.01]} />
          <meshBasicMaterial color="yellow" />
        </mesh>
        
        {/* 1m height reference */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.01, 1, 0.01]} />
          <meshBasicMaterial color="cyan" />
        </mesh>
      </group>
    </group>
  );
}