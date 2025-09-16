import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class WebGLErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.log('WebGL Error caught:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.log('WebGL Error details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, #ffd89b 0%, #19547b 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#333',
          fontFamily: 'monospace'
        }}>
          <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.9)', padding: '20px', borderRadius: '10px' }}>
            <h2>🌿 WebGL Context Issue</h2>
            <p>The 3D rendering context was lost.</p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Reload Scene
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WebGLErrorBoundary;