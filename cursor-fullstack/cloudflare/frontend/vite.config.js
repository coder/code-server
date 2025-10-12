import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          monaco: ['@monaco-editor/react'],
          icons: ['lucide-react']
        }
      }
    }
  },
  define: {
    'process.env': {}
  },
  server: {
    port: 5173,
    host: true
  }
})