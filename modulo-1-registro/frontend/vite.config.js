import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    fs: {
      allow: [
        __dirname,
        path.resolve(__dirname, '../../shared'),
        path.resolve(__dirname, '../../modulo-3-seguimiento/frontend')
      ]
    },
    proxy: {
      '/api/mentores':  { target: 'http://localhost:3004', changeOrigin: true },
      '/api/mentoria':  { target: 'http://localhost:3004', changeOrigin: true },
      '/api/sesiones':  { target: 'http://localhost:3004', changeOrigin: true },
      '/api/mentorado': { target: 'http://localhost:3004', changeOrigin: true },
      '/api':           { target: 'http://localhost:3001', changeOrigin: true }
    }
  }
});
