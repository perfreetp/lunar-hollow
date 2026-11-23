import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid()],
  optimizeDeps: {
    exclude: ['manifold-3d'],
  },
  build: {
    target: 'es2022',
  },
});
