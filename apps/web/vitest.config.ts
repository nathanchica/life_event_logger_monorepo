import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'automatic',
    include: '**/*.{jsx,js,tsx,ts}',
  })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      exclude: [
        'node_modules/**',
        'dist/**',
        'build/**',
        'coverage/**',
        'src/index.tsx',
        'src/mocks/**',
        'src/test/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/.*',
      ],
    },
  },
})