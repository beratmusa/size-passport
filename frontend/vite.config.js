import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: '../size-passport-app/extensions/size-passport-block/assets',
    emptyOutDir: false, // Don't empty so we don't accidentally wipe other shopify assets
    cssCodeSplit: false,
    rollupOptions: {
      // Input is pointing to main.jsx directly, ignoring index.html
      input: {
        'size-passport': path.resolve(__dirname, 'src/main.jsx'),
      },
      output: {
        entryFileNames: 'size-passport.js',
        assetFileNames: 'size-passport.[ext]',
        inlineDynamicImports: true,
        format: 'iife',
      },
    }
  }
})