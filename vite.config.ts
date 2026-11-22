import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5180,
    open: false
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1500
  }
})
