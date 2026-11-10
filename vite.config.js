import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  // VITE_BASE=/snowfake/ khi xuất bản lên GitHub Pages; Vercel dùng mặc định '/'
  base: process.env.VITE_BASE || '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5195 },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          state: ['zustand'],
          editor: ['codemirror', '@codemirror/lang-sql', '@codemirror/state', '@codemirror/view', '@codemirror/language', '@codemirror/autocomplete'],
        },
      },
    },
  },
})
