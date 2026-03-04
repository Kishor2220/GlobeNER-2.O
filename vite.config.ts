import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'lucide-react', 'recharts', 'd3', 'axios', 'framer-motion', 'clsx', 'tailwind-merge']
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: {
        ignored: [
          '**/local_models/**', 
          '**/*.db', 
          '**/*.db-journal',
          '**/README.md',
          '**/Dockerfile',
          '**/docker-compose.yml',
          '**/metadata.json',
          '**/.env',
          '**/.env.*'
        ]
      }
    },
  };
});
