import React from 'react';
import { Leva, useControls } from 'leva';

export default function EcosystemControls() {
  const {
    grassDensity,
    windStrength,
    windSpeed,
    terrainHeight,
    timeOfDay,
    seasonalTint
  } = useControls('Ecosystem Settings', {
    grassDensity: { value: 15000, min: 1000, max: 50000, step: 1000 },
    windStrength: { value: 1.0, min: 0, max: 3.0, step: 0.1 },
    windSpeed: { value: 1.0, min: 0.1, max: 5.0, step: 0.1 },
    terrainHeight: { value: 8, min: 0, max: 20, step: 1 },
    timeOfDay: { value: 0.5, min: 0, max: 1, step: 0.01 },
    seasonalTint: { 
      value: '#4a7c59',
      options: {
        'Spring': '#7fb069',
        'Summer': '#4a7c59', 
        'Autumn': '#b8860b',
        'Winter': '#556b2f'
      }
    }
  });

  const performanceControls = useControls('Performance', {
    lodDistance: { value: 50, min: 10, max: 200, step: 5 },
    shadowQuality: { 
      value: 'Low',
      options: ['Off', 'Low', 'Medium', 'High']
    },
    antialiasing: false,
    enableWind: true,
    enableShadows: false
  });

  return (
    <>
      <Leva
        collapsed={false}
        oneLineLabels={true}
        titleBar={{ title: '🌿 Advanced Ecosystem Renderer' }}
        theme={{
          colors: {
            elevation1: '#1a2f1a',
            elevation2: '#2a4f2a',
            elevation3: '#3a6f3a',
            accent1: '#7fb069',
            accent2: '#4a7c59',
            accent3: '#98fb98',
            highlight1: '#ffffff',
            highlight2: '#e0e0e0',
            highlight3: '#c0c0c0',
            vivid1: '#7fb069',
            folderWidgetColor: '$accent1',
            folderTextColor: '$highlight3',
            toolTipBackground: '$elevation2',
            toolTipText: '$highlight2'
          },
          fontSizes: {
            root: '11px'
          },
          space: {
            xs: '3px',
            sm: '6px',
            md: '10px',
            rowGap: '7px',
            colGap: '7px'
          },
          fonts: {
            mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
          }
        }}
      />
      
      <div style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        color: '#ffffff',
        fontSize: '11px',
        fontFamily: 'monospace',
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '8px 12px',
        borderRadius: '6px',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(127, 176, 105, 0.3)',
        zIndex: 1000
      }}>
        <div style={{ color: '#7fb069', marginBottom: '4px' }}>🔧 Engineering Controls</div>
        <div>Grass Instances: {grassDensity.toLocaleString()}</div>
        <div>Wind Physics: {performanceControls.enableWind ? '✅' : '❌'}</div>
        <div>Quality: {performanceControls.shadowQuality}</div>
        <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px' }}>
          Real-time procedural optimization active
        </div>
      </div>
    </>
  );
}