import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteExternalsPlugin } from 'vite-plugin-externals'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic'
    }),
    viteExternalsPlugin({
      react: 'React',
      'react-dom': 'ReactDOM',
      '@mantine/core': 'MantineCore',
      "@mantine/notifications": 'MantineNotifications',
    }),
  ],
  build: {
    // minify: false,
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
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@mantine/core': 'MantineCore',
          "@mantine/notifications": 'MantineNotifications',
        },
      },
      external: ['react', 'react-dom', '@mantine/core', '@mantine/notifications'],
    }
  },
  optimizeDeps: {
    exclude: ['react', 'react-dom', '@mantine/core', '@mantine/notifications'],
  },
})
