import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import Scene from '@components/Scene';
import LoadingScreen from '@components/LoadingScreen';
import PerformanceMonitor from '@components/PerformanceMonitor';
import PerformanceCollector from '@components/PerformanceCollector';
import EcosystemControls from '@components/EcosystemControls';

export default function App() {
  const [perfData, setPerfData] = useState({
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    triangles: 0,
    memoryUsage: 0
  });

  return (
    <>
      <Canvas
        camera={{
          position: [0, 5, 15],
          fov: 75,
          near: 0.1,
          far: 1000
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
          <Scene />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={100}
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 2.2}
            maxAzimuthAngle={Math.PI}
            minAzimuthAngle={-Math.PI}
            enableDamping={true}
            dampingFactor={0.05}
          />
          <Stats showPanel={0} className="stats" />
          <PerformanceCollector onUpdate={setPerfData} />
        </Suspense>
      </Canvas>
      <PerformanceMonitor perfData={perfData} />
      <EcosystemControls />
    </>
  );
}