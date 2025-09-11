import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom environment for DOM testing
    environment: 'jsdom',
    
    // Global test configuration
    globals: true,
    
    // Setup file for global test utilities
    setupFiles: ['./tests/setup.ts'],
    
    // Include patterns for test files
    include: [
      'src/**/*.{test,spec}.{js,ts,tsx}',
      'tests/**/*.{test,spec}.{js,ts,tsx}'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'build',
      'coverage'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        'src/**/*.d.ts',
        'src/**/*.stories.{js,ts,jsx,tsx}',
        'src/**/*.config.{js,ts}',
        'src/**/index.{js,ts,tsx}',
        '**/*.config.{js,ts}',
        '**/coverage/**',
        '**/dist/**',
        '**/build/**'
      ],
      // Enforce minimum coverage thresholds
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    
    // Test timeout configuration
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
    
    // Parallel testing
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        useAtomics: true
      }
    },
    
    // Reporter configuration for Allure integration
    reporters: ['default', 'json'],
    outputFile: {
      json: './test-results/results.json'
    },
    
    // Watch mode configuration
    watch: {
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/coverage/**'
      ]
    }
  },
  
  // Resolve configuration for imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@/components': path.resolve(__dirname, '../src/components'),
      '@/hooks': path.resolve(__dirname, '../src/hooks'),
      '@/utils': path.resolve(__dirname, '../src/utils'),
      '@/types': path.resolve(__dirname, '../src/types'),
      '@/contexts': path.resolve(__dirname, '../src/contexts'),
      '@/services': path.resolve(__dirname, '../src/services'),
      '@/test-utils': path.resolve(__dirname, '../tests/test-utils')
    }
  },
  
  // Define global variables for TypeScript
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'test'),
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production')
  }
})