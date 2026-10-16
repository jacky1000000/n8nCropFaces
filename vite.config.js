import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/n8n-webhook': {
        target: 'https://automation.vkjj.net',
        changeOrigin: true,
        secure: true,
        proxyTimeout: 600000,
        timeout: 600000,
        rewrite: (path) => path.replace('/api/n8n-webhook', '/webhook-test/14b151b2-4677-464e-86e2-a44cb013a1e9'),
      },
    },
  },
})
