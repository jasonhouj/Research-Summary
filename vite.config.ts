import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // Debug: log the webhook URLs at startup
    console.log('n8n Search Webhook URL:', env.VITE_N8N_SEARCH_WEBHOOK_URL);
    console.log('n8n Summarize Webhook URL:', env.VITE_N8N_WEBHOOK_URL);

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/n8n-search': {
            target: 'https://jiieee.app.n8n.cloud',
            changeOrigin: true,
            rewrite: (_path) => {
              // Use the webhook path directly
              return '/webhook/paper-search';
            },
          },
          '/api/n8n': {
            target: 'https://jiieee.app.n8n.cloud',
            changeOrigin: true,
            rewrite: (_path) => {
              return '/webhook/summarize-paper';
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
