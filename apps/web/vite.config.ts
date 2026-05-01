import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = env.VITE_API_BASE_URL ?? 'http://localhost:3000';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@waifu-panel/shared': path.resolve(__dirname, '../..', 'packages/shared/src')
      }
    },
    server: {
      host: env.HOST ?? 'localhost',
      port: 5173,
      open: true,
      allowedHosts: true,
      proxy: {
        '/uploads': {
          target: apiBaseUrl,
          changeOrigin: true
        }
      }
    }
  };
});
