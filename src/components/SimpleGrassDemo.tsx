import { useMemo } from 'react';
import * as THREE from 'three';

export default function SimpleGrassDemo() {
  const grassBlades = useMemo(() => {
    const blades = [];
    
    // Create a 3cm x 3cm patch (0.03m x 0.03m)
    // With grass blades spaced about 2mm apart
    const patchSize = 0.03; // 3cm in meters
    const spacing = 0.002; // 2mm spacing between blades
    const bladesPerRow = Math.floor(patchSize / spacing);
    
    for (let x = 0; x < bladesPerRow; x++) {
      for (let z = 0; z < bladesPerRow; z++) {
        // Position with slight random offset for natural look
        const posX = (x * spacing - patchSize/2) + (Math.random() - 0.5) * spacing * 0.3;
        const posZ = (z * spacing - patchSize/2) + (Math.random() - 0.5) * spacing * 0.3;
        
        // Random rotation for each blade
        const rotationY = Math.random() * Math.PI * 2;
        
        // Slight random lean
        const rotationX = (Math.random() - 0.5) * 0.2;
        const rotationZ = (Math.random() - 0.5) * 0.2;
        
        // Random height between 1-2cm (0.01-0.02m)
        const height = 0.01 + Math.random() * 0.01;
        
        blades.push({
          position: [posX, 0, posZ],
          rotation: [rotationX, rotationY, rotationZ],
          scale: [1, height / 0.015, 1] // Normalize to base height of 1.5cm
        });
      }
    }
    
    return blades;
  }, []);

  // Create a single grass blade geometry
  const bladeGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    
    // Create grass blade shape (tapered from bottom to top)
    const bladeWidth = 0.001; // 1mm wide at base
    const bladeHeight = 0.015; // 1.5cm tall
    
    // Start at bottom left
    shape.moveTo(-bladeWidth/2, 0);
    
    // Go up left side with slight curve
    shape.quadraticCurveTo(
      -bladeWidth/2 * 0.7, bladeHeight * 0.5,  // Control point
      -bladeWidth/2 * 0.2, bladeHeight         // End point (narrow at top)
    );
    
    // Top of blade (pointed)
    shape.lineTo(0, bladeHeight + 0.001); // Slight point at top
    
    // Go down right side with slight curve
    shape.lineTo(bladeWidth/2 * 0.2, bladeHeight);
    shape.quadraticCurveTo(
      bladeWidth/2 * 0.7, bladeHeight * 0.5,   // Control point
      bladeWidth/2, 0                          // End point at base
    );
    
    // Close the shape
    shape.lineTo(-bladeWidth/2, 0);
    
    // Extrude to give slight thickness
    const extrudeSettings = {
      depth: 0.0002, // 0.2mm thickness
      bevelEnabled: false
    };
    
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center(); // Center the geometry
    
    return geometry;
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* Ground plane for reference (3cm x 3cm brown patch) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.0001, 0]}>
        <planeGeometry args={[0.03, 0.03]} />
        <meshStandardMaterial color="#4a3c28" />
      </mesh>
      
      {/* Individual grass blades */}
      {grassBlades.map((blade, index) => (
        <mesh
          key={index}
          position={blade.position as [number, number, number]}
          rotation={blade.rotation as [number, number, number]}
          scale={blade.scale as [number, number, number]}
          geometry={bladeGeometry}
        >
          <meshStandardMaterial 
            color={`hsl(${110 + Math.random() * 20}, ${40 + Math.random() * 30}%, ${25 + Math.random() * 15}%)`}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      
      {/* Size reference: 1cm cube wireframe */}
      <mesh position={[0.02, 0.005, 0.02]}>
        <boxGeometry args={[0.01, 0.01, 0.01]} />
        <meshBasicMaterial color="red" wireframe opacity={0.5} transparent />
      </mesh>
    </group>
  );
}