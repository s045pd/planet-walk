import { defineConfig } from 'vite';

export default defineConfig({
  base: '/planet-walk/',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
  server: {
    open: true,
  },
});
