import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import Scene from '@components/Scene';
import LoadingScreen from '@components/LoadingScreen';
import PerformanceMonitor from '@components/PerformanceMonitor';
import PerformanceCollector from '@components/PerformanceCollector';
import EcosystemControls from '@components/EcosystemControls';
import GrassDemo from '@components/GrassDemo';

export default function App() {
  const [perfData, setPerfData] = useState({
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    triangles: 0,
    memoryUsage: 0
  });
  
  const [showGrassDemo, setShowGrassDemo] = useState(false);
  const [useLOD, setUseLOD] = useState(false);

  // Show grass demo if toggled
  if (showGrassDemo) {
    return (
      <div>
        <GrassDemo />
        <button 
          onClick={() => setShowGrassDemo(false)}
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            padding: '10px 20px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Back to Main Scene
        </button>
      </div>
    );
  }

  return (
    <>
      <Canvas
        camera={{
          position: [0, 50, 50],
          fov: 75,
          near: 0.1,
          far: 20000
        }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          preserveDrawingBuffer: false
        }}
        style={{
          background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 30%, #98FB98 100%)'
        }}
      >
        <Suspense fallback={<LoadingScreen />}>
          <Scene useLOD={useLOD} />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={0.1}
            maxDistance={10000}
            zoomSpeed={5}
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 2}
            enableDamping={true}
            dampingFactor={0.05}
          />
          <Stats showPanel={0} className="stats" />
          <PerformanceCollector onUpdate={setPerfData} />
        </Suspense>
      </Canvas>
      <PerformanceMonitor perfData={perfData} />
      <EcosystemControls />
      <div style={{ 
        position: 'fixed', 
        bottom: 20, 
        left: 20, 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '10px', 
        zIndex: 10000 
      }}>
        <button 
          onClick={() => setShowGrassDemo(true)}
          style={{
            padding: '10px 20px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'monospace',
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
          }}
        >
          View Grass Demo
        </button>
        
        <button 
          onClick={() => setUseLOD(!useLOD)}
          style={{
            padding: '10px 20px',
            background: useLOD ? '#4CAF50' : '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'monospace',
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
          }}
        >
          {useLOD ? 'LOD: ON' : 'LOD: OFF'}
        </button>
      </div>
    </>
  );
}