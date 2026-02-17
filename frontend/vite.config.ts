import path from "path" // 1. Add this import
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import istanbul from 'vite-plugin-istanbul'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    istanbul({
      include: 'src/**/*',
      exclude: ['node_modules', 'e2e/**'],
      extension: ['.ts', '.tsx'],
      requireEnv: false,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})