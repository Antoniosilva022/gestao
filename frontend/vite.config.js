import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('xlsx')) return 'xlsx';
            if (id.includes('recharts')) return 'charts';
            if (id.includes('react-router')) return 'router';
            if (id.includes('axios')) return 'http';
            if (id.includes('react-hot-toast')) return 'toast';
            return 'vendor';
          }
        },
      },
    },
  },
});
