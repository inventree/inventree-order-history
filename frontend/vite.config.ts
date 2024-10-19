import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    cssCodeSplit: false,
    manifest: false,
    rollupOptions: {
      preserveEntrySignatures: "exports-only",
      input: [
        './src/OrderHistoryPanel.tsx',
      ],
      output: {
        dir: '../order_history/static',
        entryFileNames: '[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
      }
  }
})
