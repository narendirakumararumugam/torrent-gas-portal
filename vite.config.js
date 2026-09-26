import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set base to the repository name so assets resolve correctly on GitHub Pages
export default defineConfig({
  base: '/torrent-gas-portal/',
  plugins: [react()],
})
