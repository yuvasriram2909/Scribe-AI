import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: path.resolve(process.cwd(), 'client'),
  build: {
    outDir: path.resolve(process.cwd(), 'client/dist'),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1600,
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  }
});
