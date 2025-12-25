import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        extension: path.resolve(__dirname, 'src/extension.ts'),
        webview: path.resolve(__dirname, 'src/webview/main.tsx')
      },
      name: 'ContextBridge',
      formats: ['es']
    },
    rollupOptions: {
      external: ['vscode'],
      output: {
        dir: 'dist',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
      }
    },
    outDir: 'dist',
    sourcemap: true,
    minify: false,
    target: 'ES2020'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
