import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 8080,      // Portni 8080 ga o'zgartirdik
    host: true,      // Tarmoqdagi boshqalar ulanishi uchun
    strictPort: true // Agar 8080 band bo'lsa, boshqa portga o'tib ketmaydi
  }
})
