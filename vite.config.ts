import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-')) return 'vendor-charts'
          if (id.includes('framer-motion')) return 'vendor-motion'
          if (id.includes('@supabase')) return 'vendor-supabase'
          if (id.includes('@tanstack')) return 'vendor-query'
          if (id.includes('i18next') || id.includes('i18n')) return 'vendor-i18n'
          if (id.includes('@radix-ui')) return 'vendor-radix'
          if (id.includes('react-router') || id.includes('react-dom') || id.includes('node_modules/react/')) return 'vendor-react'
          return 'vendor'
        },
      },
    },
  },
})
