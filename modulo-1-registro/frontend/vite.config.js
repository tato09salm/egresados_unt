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
        path.resolve(__dirname, '../../shared')
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
