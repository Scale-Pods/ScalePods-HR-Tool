import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        reset: path.resolve(__dirname, 'reset-password.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/n8n-proxy': {
        target: 'https://n8n.srv1711190.hstgr.cloud',
        changeOrigin: true,
        rewrite: p => p.replace('/n8n-proxy', ''),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
