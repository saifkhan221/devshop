import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import strip from '@rollup/plugin-strip'

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    // Strip console.log / console.warn / debugger from production build
    // Prevents accidental data or token leaks visible in browser DevTools
    ...(mode === 'production'
      ? [strip({ functions: ['console.log', 'console.warn', 'console.info', 'console.debug'], debugger: true })]
      : [])
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  // Proxy Google News RSS through our own origin so the browser never hits a
  // cross-origin request (matches the Vercel rewrite used in production).
  server: {
    proxy: {
      '/gnews': {
        target: 'https://news.google.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/gnews/, ''),
      },
    },
  },

  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  },

  build: {
    // No source maps in production — hides your source code from DevTools
    sourcemap: false,
  }
}))
