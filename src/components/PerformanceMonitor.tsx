import React, { useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

interface PerformanceData {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  memoryUsage: number;
}

export default function PerformanceMonitor() {
  const { gl } = useThree();
  const [perfData, setPerfData] = useState<PerformanceData>({
    fps: 0,
    frameTime: 0,
    drawCalls: 0,
    triangles: 0,
    memoryUsage: 0
  });

  const [frameCount, setFrameCount] = useState(0);
  const [lastTime, setLastTime] = useState(performance.now());

  useFrame(() => {
    setFrameCount(prev => prev + 1);
    
    const now = performance.now();
    const deltaTime = now - lastTime;
    
    // Update FPS every 60 frames
    if (frameCount % 60 === 0) {
      const fps = Math.round(60000 / deltaTime);
      const frameTime = Number((deltaTime / 60).toFixed(2));
      
      // Get WebGL render info
      const info = gl.info;
      
      setPerfData({
        fps,
        frameTime,
        drawCalls: info.render.calls,
        triangles: info.render.triangles,
        memoryUsage: (performance as any).memory?.usedJSHeapSize 
          ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
          : 0
      });
      
      setLastTime(now);
    }
  });

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '12px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#00ff00',
      border: '1px solid #00ff00',
      minWidth: '200px',
      zIndex: 1000
    }}>
      <div style={{ color: '#ffffff', marginBottom: '8px', fontWeight: 'bold' }}>
        🌱 Ecosystem Performance
      </div>
      <div>FPS: <span style={{ color: perfData.fps > 50 ? '#00ff00' : '#ffaa00' }}>
        {perfData.fps}
      </span></div>
      <div>Frame Time: {perfData.frameTime}ms</div>
      <div>Draw Calls: {perfData.drawCalls}</div>
      <div>Triangles: {perfData.triangles.toLocaleString()}</div>
      {perfData.memoryUsage > 0 && (
        <div>Memory: {perfData.memoryUsage}MB</div>
      )}
      <div style={{ 
        marginTop: '8px', 
        padding: '4px', 
        background: 'rgba(0, 255, 0, 0.1)',
        borderRadius: '4px',
        fontSize: '10px'
      }}>
        Status: {perfData.fps > 50 ? '🟢 Optimal' : perfData.fps > 30 ? '🟡 Good' : '🔴 Needs Optimization'}
      </div>
    </div>
  );
}