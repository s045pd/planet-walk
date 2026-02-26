import { defineConfig } from 'vite';

export default defineConfig({
  base: '/planet-walk/',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/three/')) {
            return 'three';
          }
          return undefined;
        },
      },
    },
  },
  server: {
    open: true,
  },
});
