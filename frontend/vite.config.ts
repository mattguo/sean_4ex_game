import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react({ babel: { plugins: ['relay'] } })],
  server: {
    port: 5173,
    proxy: {
      // Proxy all /graphql requests to backend API
      '/graphql': {
        target: 'http://localhost:9000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
