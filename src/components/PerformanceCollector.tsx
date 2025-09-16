import { useFrame, useThree } from '@react-three/fiber';

interface PerformanceCollectorProps {
  onUpdate: (data: {
    fps: number;
    frameTime: number;
    drawCalls: number;
    triangles: number;
    memoryUsage: number;
  }) => void;
}

export default function PerformanceCollector({ onUpdate }: PerformanceCollectorProps) {
  const { gl } = useThree();
  let frameCount = 0;
  let lastTime = performance.now();

  useFrame(() => {
    frameCount++;
    
    const now = performance.now();
    const deltaTime = now - lastTime;
    
    // Update FPS every 60 frames
    if (frameCount % 60 === 0) {
      const fps = Math.round(60000 / deltaTime);
      const frameTime = Number((deltaTime / 60).toFixed(2));
      
      // Get WebGL render info
      const info = gl.info;
      
      onUpdate({
        fps,
        frameTime,
        drawCalls: info.render.calls,
        triangles: info.render.triangles,
        memoryUsage: (performance as any).memory?.usedJSHeapSize 
          ? Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
          : 0
      });
      
      lastTime = now;
    }
  });

  return null;
}