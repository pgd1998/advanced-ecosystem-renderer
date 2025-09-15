import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import Scene from '@components/Scene';
import LoadingScreen from '@components/LoadingScreen';
import PerformanceMonitor from '@components/PerformanceMonitor';
import EcosystemControls from '@components/EcosystemControls';

export default function App() {
  return (
    <>
      <Canvas
        camera={{
          position: [0, 15, 30],
          fov: 60,
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
          background: 'linear-gradient(135deg, #87CEEB 0%, #98FB98 50%, #228B22 100%)'
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
        </Suspense>
      </Canvas>
      <PerformanceMonitor />
      <EcosystemControls />
    </>
  );
}