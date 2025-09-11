/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Modern Vitest configuration for React (2024-2025 best practices)
export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for React component testing
    environment: 'jsdom',
    
    // Global test setup
    setupFiles: ['./src/test/setup.ts'],
    
    // Enable globals like describe, it, expect
    globals: true,
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '*.config.*',
        '**/*.d.ts',
        '**/*.stories.tsx',
        '**/index.ts'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    
    // Test isolation and cleanup
    isolate: true,
    clearMocks: true,
    mockReset: true,
    restoreMocks: true,
    
    // Performance: run tests in parallel
    threads: true,
    maxThreads: 4,
    minThreads: 1,
    
    // Reporter configuration
    reporters: ['default', 'html'],
    outputFile: {
      html: './test-results/index.html'
    },
    
    // Test filtering
    include: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    
    // Retry flaky tests in CI
    retry: process.env.CI ? 2 : 0,
    
    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Watch mode configuration
    watch: false,
    watchExclude: ['**/node_modules/**', '**/dist/**']
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@test': path.resolve(__dirname, './src/test')
    }
  }
});