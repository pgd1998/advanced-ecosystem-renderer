import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Environment } from '@react-three/drei';
import * as THREE from 'three';
import SimpleGrassDemo from './SimpleGrassDemo';
import RealisticGrassDemo from './RealisticGrassDemo';
import OptimizedGrassDemo from './OptimizedGrassDemo';

export default function GrassDemo() {
  const [showOptimized] = useState(true);
  
  return (
    <div style={{ width: '100vw', height: '100vh', background: 'linear-gradient(135deg, #ffd89b 0%, #f4a261 50%, #e76f51 100%)' }}>
      <Canvas
        camera={{
          position: [3, 2, 3], // Adjusted for 3m patch
          fov: 75,
          near: 0.1,
          far: 100
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1
        }}
      >
        <Suspense fallback={null}>
          {/* Sunset sky and environment */}
          <Sky
            distance={450000}
            sunPosition={[100, 20, 100]}
            inclination={0.49}
            azimuth={0.25}
            turbidity={10}
            rayleigh={3}
            mieCoefficient={0.005}
            mieDirectionalG={0.7}
          />
          <Environment preset="sunset" />
          
          {/* Better lighting for grass */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[2, 5, 2]}
            intensity={0.8}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <directionalLight
            position={[-1, 3, -1]}
            intensity={0.3}
            color="#ffeaa7"
          />
          
          {/* The grass patch - using optimized version for performance */}
          {showOptimized ? <OptimizedGrassDemo /> : <RealisticGrassDemo />}
          
          {/* Camera controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={0.5}
            maxDistance={50}
            zoomSpeed={2}
            target={[0, 0, 0]}
          />
        </Suspense>
      </Canvas>
      
      {/* Instructions */}
      {/* <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        color: 'white',
        background: 'rgba(0,0,0,0.7)',
        padding: '15px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Grass Patch Demo (3m x 3m)</h3>
        <p style={{ margin: '5px 0' }}>Current: {showRealistic ? 'Realistic' : 'Simple'} Grass</p>
        <button 
          onClick={() => setShowRealistic(!showRealistic)}
          style={{
            padding: '5px 10px',
            margin: '5px 0',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Toggle: {showRealistic ? 'Show Simple' : 'Show Realistic'}
        </button>
        <hr style={{ margin: '10px 0', opacity: 0.3 }} />
        <p style={{ margin: '5px 0' }}>🖱️ Mouse: Orbit around</p>
        <p style={{ margin: '5px 0' }}>📏 Yellow line = 50cm</p>
        <p style={{ margin: '5px 0' }}>📏 Cyan line = 1m height</p>
        <p style={{ margin: '5px 0', fontSize: '10px', opacity: 0.7 }}>
          Realistic grass: Curved blades, tapered tips, varied colors
        </p>
      </div> */}
    </div>
  );
}