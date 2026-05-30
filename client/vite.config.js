import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy /ababil-api/* → https://testnetv1.ababilpay.xyz/*
      // This avoids browser CORS blocks on direct localhost → external API calls
      '/ababil-api': {
        target: 'https://testnetv1.ababilpay.xyz',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/ababil-api/, ''),
      },
    },
  },
})
