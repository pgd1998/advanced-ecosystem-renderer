import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import glsl from 'vite-plugin-glsl';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    glsl({
      include: [
        '**/*.glsl',
        '**/*.wgsl',
        '**/*.vert',
        '**/*.frag',
        '**/*.vs',
        '**/*.fs',
        '**/*.compute'
      ],
      exclude: undefined,
      warnDuplicatedImports: true,
      defaultExtension: 'glsl',
      compress: false,
      watch: true,
      root: '/'
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@shaders': resolve(__dirname, './src/shaders'),
      '@physics': resolve(__dirname, './src/physics'),
      '@utils': resolve(__dirname, './src/utils'),
      '@store': resolve(__dirname, './src/store'),
      '@algorithms': resolve(__dirname, './src/algorithms'),
      '@performance': resolve(__dirname, './src/performance')
    }
  },
  server: {
    port: 3000,
    open: true,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          'react-three': ['@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
          algorithms: ['simplex-noise']
        }
      }
    },
    target: 'esnext',
    minify: 'terser'
  },
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei', 'simplex-noise']
  }
});