import React from 'react';
import { Html } from '@react-three/drei';

export default function LoadingScreen() {
  return (
    <Html center>
      <div style={{
        color: '#2d5a2d',
        fontSize: '18px',
        fontWeight: 600,
        letterSpacing: '0.1em',
        textAlign: 'center',
        animation: 'pulse 2s infinite'
      }}>
        <div>🌱 Ecosystem Engine</div>
        <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '8px' }}>
          Generating procedural terrain...
        </div>
        <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
          Optimizing grass physics...
        </div>
      </div>
    </Html>
  );
}