import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset paths keep the production build working on GitHub Pages project URLs.
  base: './',
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5001', changeOrigin: true }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    // tests must not depend on a developer's .env: feature switches start off, and a test turns on what it needs
    env: { VITE_LOOP: 'off' },
    include: ['src/**/*.test.{js,jsx}'],
    css: false
  }
});
