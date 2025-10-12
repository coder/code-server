import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

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
          icons: ['lucide-react'],
          socket: ['socket.io-client']
        }
      }
    },
    assetsDir: 'assets',
    emptyOutDir: true,
    target: 'es2015',
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger']
    }
  },
  define: {
    'process.env': {}
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'https://cursor-backend.workers.dev',
        changeOrigin: true,
        secure: true
      },
      '/ws': {
        target: 'wss://cursor-backend.workers.dev',
        ws: true,
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 4173,
    host: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@monaco-editor/react',
      'lucide-react',
      'socket.io-client'
    ]
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})