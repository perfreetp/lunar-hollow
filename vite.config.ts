/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5180,
    host: '127.0.0.1',
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
