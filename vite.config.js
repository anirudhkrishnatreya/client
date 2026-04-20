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
  }
});
