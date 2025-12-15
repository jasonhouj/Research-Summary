import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/n8n': {
            target: 'https://jiieee.app.n8n.cloud',
            changeOrigin: true,
            rewrite: () => {
              // Extract the webhook path from the full URL
              const webhookUrl = env.VITE_N8N_WEBHOOK_URL || '';
              const match = webhookUrl.match(/\/webhook\/.+$/);
              return match ? match[0] : '/webhook/summarize-paper';
            },
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
