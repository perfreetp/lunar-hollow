import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 5310,
    strictPort: false,
  },
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    // maplibre-gl is the bulk of the bundle and changes far less often than the
    // app, so splitting it lets the browser keep it cached across deploys.
    rollupOptions: {
      output: {
        manualChunks: {
          maplibre: ['maplibre-gl'],
        },
      },
    },
  },
});
