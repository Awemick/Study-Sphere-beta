import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'esnext', // Use latest ES features including top-level await
    minify: false, // Disable minification for debugging
  },
  esbuild: {
    target: 'esnext', // Ensure esbuild also uses latest target
  },
})