import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    sourcemap: false, // never publish source maps
    chunkSizeWarningLimit: 1000, // the 3D sphere chunk is large on purpose; it only loads when scrolled near
  },
})
