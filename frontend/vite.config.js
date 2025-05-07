import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(), 
    react()
  ],
  server: {
    proxy: {
      '/api': {
        // For local testing use http://localhost:5000
        target: 'https://mp3converter-tiago-api.onrender.com', // current backend URL with render
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
