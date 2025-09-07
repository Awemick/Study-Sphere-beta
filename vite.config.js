import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    target: 'esnext',
    minify: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        terms: resolve(__dirname, 'pages/terms.html'),
        privacy: resolve(__dirname, 'pages/privacy.html'),
        help: resolve(__dirname, 'pages/help.html'),
        about: resolve(__dirname, 'pages/about.html')
      }
    }
  },
  esbuild: {
    target: 'esnext',
  },
})
