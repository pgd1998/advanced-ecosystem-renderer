import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, extend } from '@react-three/fiber';
import { useRealisticGrassControls } from '../hooks/useRealisticGrassControls';
import { createNoise2D } from 'simplex-noise';
import { shaderMaterial } from '@react-three/drei';

// Custom shader material for grass with wind animation
const GrassShaderMaterial = shaderMaterial(
  // Uniforms
  {
    time: 0,
    windStrength: 0.3,
    windSpeed: 1.0,
    windDirection: new THREE.Vector2(1, 0),
    gustIntensity: 1.0,
  },
  // Vertex Shader
  `
    uniform float time;
    uniform float windStrength;
    uniform float windSpeed;
    uniform vec2 windDirection;
    uniform float gustIntensity;
    
    attribute vec3 instanceColor;
    attribute float instanceRandom;
    
    varying vec3 vColor;
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      vColor = instanceColor;
      
      vec3 pos = position;
      vec3 worldPos = (instanceMatrix * vec4(pos, 1.0)).xyz;
      
      // Height-based wind effect (stronger at top)
      float heightRatio = (pos.y + 0.06) / 0.12; // Normalized height
      heightRatio = clamp(heightRatio, 0.0, 1.0);
      float windEffect = heightRatio * heightRatio;
      
      // Calculate wind with gusts
      float windPhase = time * windSpeed + instanceRandom * 3.14159;
      float gust = 1.0 + sin(time * 0.5 + instanceRandom * 6.28) * 0.3 * gustIntensity;
      
      // Complex wind pattern
      float windX = sin(windPhase) * 0.7 + sin(windPhase * 2.3) * 0.3;
      float windZ = sin(windPhase + 0.5) * 0.7 + sin(windPhase * 1.7) * 0.3;
      
      // Apply wind displacement
      pos.x += windDirection.x * windX * windStrength * windEffect * gust * 0.02;
      pos.z += windDirection.y * windZ * windStrength * windEffect * gust * 0.02;
      
      // Slight bending for realism
      pos.y -= abs(windX * windStrength * windEffect * 0.01);
      
      vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader
  `
    uniform float time;
    varying vec3 vColor;
    varying vec2 vUv;
    
    void main() {
      // Gradient from base to tip
      float gradient = vUv.y;
      vec3 finalColor = vColor * (0.7 + gradient * 0.3);
      
      // Add subtle sheen
      float sheen = sin(time * 2.0 + vUv.y * 10.0) * 0.02;
      finalColor += vec3(0.5, 0.9, 0.3) * sheen;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

// Extend to make it available in JSX
extend({ GrassShaderMaterial });

export default function OptimizedGrassDemo() {
  const controls = useRealisticGrassControls();
  console.log('OptimizedGrassDemo rendering with density:', controls.density);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<any>(null);
  const noise2D = useMemo(() => createNoise2D(), []);
  
  // Function to get terrain height at any position
  const getTerrainHeight = useMemo(() => {
    return (x: number, z: number) => {
      let height = 0;
      height += noise2D(x * 2, z * 2) * 0.08;
      height += noise2D(x * 4, z * 4) * 0.04;
      height += noise2D(x * 8, z * 8) * 0.02;
      height += noise2D(x * 16, z * 16) * 0.01;
      return height;
    };
  }, [noise2D]);

  // Create terrain geometry
  const terrainGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(
      controls.patchSize * 1.2, 
      controls.patchSize * 1.2, 
      32, 32
    );
    
    const positions = geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 1];
      positions[i + 2] = getTerrainHeight(x, z);
    }
    
    geometry.computeVertexNormals();
    return geometry;
  }, [controls.patchSize, getTerrainHeight]);

  // Create grass blade geometry (reusable for all instances)
  const bladeGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(controls.bladeWidth, controls.bladeHeight, 3, 16);
    const positions = geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < positions.length; i += 3) {
      const originalY = positions[i + 1];
      const y = originalY + controls.bladeHeight/2;
      const x = positions[i];
      
      if (y >= 0 && y <= controls.bladeHeight) {
        const heightRatio = Math.min(Math.max(y / controls.bladeHeight, 0), 1);
        const taperAngle = heightRatio * Math.PI * 0.45;
        const taperFactor = Math.cos(taperAngle) * 0.9;
        
        if (!isNaN(taperFactor) && isFinite(taperFactor)) {
          positions[i] = x * taperFactor;
        }
        
        const bendAmount = Math.pow(heightRatio, 2.5) * (controls.bladeHeight * 0.125);
        if (!isNaN(bendAmount) && isFinite(bendAmount)) {
          positions[i + 2] = bendAmount;
          
          const waveAmount = Math.sin(heightRatio * Math.PI * 2) * (controls.bladeHeight * 0.008);
          if (!isNaN(waveAmount) && isFinite(waveAmount)) {
            positions[i + 2] += waveAmount;
          }
        }
        
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
    
    for (let i = 0; i < positions.length; i++) {
      if (isNaN(positions[i]) || !isFinite(positions[i])) {
        positions[i] = 0;
      }
    }
    
    geometry.computeVertexNormals();
    return geometry;
  }, [controls.bladeWidth, controls.bladeHeight]);

  // Create instance data
  const { matrices, colors, randoms } = useMemo(() => {
    const density = controls.density;
    const patchSize = controls.patchSize;
    const spacing = patchSize / density;
    const count = density * density;
    
    const matrices = new Float32Array(count * 16);
    const colors = new Float32Array(count * 3);
    const randoms = new Float32Array(count);
    
    let index = 0;
    
    for (let x = 0; x < density; x++) {
      for (let z = 0; z < density; z++) {
        const posX = (x * spacing - patchSize/2) + (Math.random() - 0.5) * spacing * 0.5;
        const posZ = (z * spacing - patchSize/2) + (Math.random() - 0.5) * spacing * 0.5;
        const posY = getTerrainHeight(posX, posZ);
        
        // Create transform matrix
        const matrix = new THREE.Matrix4();
        
        // Set position
        matrix.setPosition(posX, posY, posZ);
        
        // Apply rotation
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationFromEuler(new THREE.Euler(
          (Math.random() - 0.5) * 0.3,
          Math.random() * Math.PI * 2,
          (Math.random() - 0.5) * 0.3
        ));
        matrix.multiply(rotationMatrix);
        
        // Apply scale
        const scale = 0.8 + Math.random() * 0.4;
        const scaleMatrix = new THREE.Matrix4();
        scaleMatrix.makeScale(scale * 1.1, scale * 1.3, scale);
        matrix.multiply(scaleMatrix);
        
        // Store matrix
        matrix.toArray(matrices, index * 16);
        
        // Generate color
        const hue = 105 + Math.random() * 25;
        const saturation = 35 + Math.random() * 20;
        const lightness = 28 + Math.random() * 12;
        const color = new THREE.Color(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
        colors[index * 3] = color.r;
        colors[index * 3 + 1] = color.g;
        colors[index * 3 + 2] = color.b;
        
        // Store random value for wind variation
        randoms[index] = Math.random();
        
        index++;
      }
    }
    
    return { matrices, colors, randoms };
  }, [controls.density, controls.patchSize, getTerrainHeight]);

  // Update instance matrices and attributes
  useEffect(() => {
    if (meshRef.current) {
      const mesh = meshRef.current;
      
      // Set instance matrices
      mesh.instanceMatrix = new THREE.InstancedBufferAttribute(matrices, 16);
      mesh.instanceMatrix.needsUpdate = true;
      
      // Add custom attributes for colors and random values
      mesh.geometry.setAttribute('instanceColor', new THREE.InstancedBufferAttribute(colors, 3));
      mesh.geometry.setAttribute('instanceRandom', new THREE.InstancedBufferAttribute(randoms, 1));
      
      // Force update
      mesh.geometry.attributes.instanceColor.needsUpdate = true;
      mesh.geometry.attributes.instanceRandom.needsUpdate = true;
    }
  }, [matrices, colors, randoms, bladeGeometry]); // Add bladeGeometry to dependencies

  // Animate shader uniforms
  useFrame((state) => {
    if (materialRef.current && controls.enableWind) {
      materialRef.current.time = state.clock.elapsedTime;
      materialRef.current.windStrength = controls.windStrength;
      materialRef.current.windSpeed = controls.windSpeed;
      
      const windDir = (controls.windDirection * Math.PI) / 180;
      materialRef.current.windDirection.set(Math.cos(windDir), Math.sin(windDir));
      
      materialRef.current.gustIntensity = controls.windGusts ? 1.0 : 0.0;
    }
  });

  const count = controls.density * controls.density;

  return (
    <group position={[controls.position.x, controls.position.y, controls.position.z]}>
      {/* Terrain with natural undulations */}
      <mesh 
        geometry={terrainGeometry} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.001, 0]}
      >
        <meshStandardMaterial 
          color="#6b4e3d" 
          roughness={0.85}
        />
      </mesh>
      
      {/* Optimized instanced grass */}
      <instancedMesh
        key={`grass-${controls.bladeWidth}-${controls.bladeHeight}-${count}`}
        ref={meshRef}
        args={[undefined, undefined, count]}
        frustumCulled={false}
        geometry={bladeGeometry}
      >
        {/* @ts-ignore */}
        <grassShaderMaterial
          ref={materialRef}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
      
      {/* Rocks and details remain the same for visual consistency */}
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
      
      {/* Reference objects */}
      {controls.showReference && (
        <group position={[controls.patchSize * 0.6, 0, controls.patchSize * 0.6]}>
          <mesh>
            <boxGeometry args={[controls.patchSize * 0.1, 0.002, 0.002]} />
            <meshBasicMaterial color="yellow" />
          </mesh>
          
          <mesh position={[0, controls.patchSize * 0.05, 0]}>
            <boxGeometry args={[0.002, controls.patchSize * 0.1, 0.002]} />
            <meshBasicMaterial color="cyan" />
          </mesh>
          
          {controls.enableWind && (
            <group 
              rotation={[0, (controls.windDirection * Math.PI) / 180, 0]}
              position={[0, controls.patchSize * 0.02, 0]}
            >
              <mesh position={[controls.patchSize * 0.05, 0, 0]}>
                <boxGeometry args={[controls.patchSize * 0.08 * controls.windStrength, 0.005, 0.005]} />
                <meshBasicMaterial color="red" />
              </mesh>
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