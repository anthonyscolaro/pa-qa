/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment configuration
    environment: 'jsdom',
    globals: true,
    
    // Setup files
    setupFiles: ['./tests/setup/vitest-setup.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      exclude: [
        'coverage/**',
        'dist/**',
        'packages/*/test{,s}/**',
        '**/*.d.ts',
        'cypress/**',
        'test{,s}/**',
        'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
        '**/__tests__/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        '**/.{eslint,mocha,prettier}rc.{js,cjs,yml}',
        '.next/**',
        'next.config.js',
        'tailwind.config.js',
        'postcss.config.js',
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      },
      all: true,
      include: [
        'app/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}'
      ]
    },
    
    // Test patterns
    include: [
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/unit/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/integration/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
      'tests/e2e/**',
      'tests/accessibility/**',
      'tests/performance/**',
      'tests/visual/**'
    ],
    
    // Test execution options
    testTimeout: 10000,
    hookTimeout: 10000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        isolate: true
      }
    },
    
    // Reporters
    reporters: [
      'default',
      'html',
      'json',
      ['allure-vitest', { 
        resultsDir: './allure-results',
        links: [
          {
            type: 'repository',
            url: 'https://github.com/projectassistant/pa-qa',
            name: 'PA-QA Repository'
          },
          {
            type: 'issue',
            url: 'https://github.com/projectassistant/pa-qa/issues',
            name: 'Issues'
          }
        ]
      }]
    ],
    
    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    
    // Watch options
    watch: false,
    
    // UI configuration
    ui: true,
    open: false,
    
    // Environment variables for tests
    env: {
      NODE_ENV: 'test',
      NEXT_PUBLIC_API_URL: 'http://localhost:3001/api',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000'
    }
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '@/components': resolve(__dirname, './components'),
      '@/app': resolve(__dirname, './app'),
      '@/lib': resolve(__dirname, './lib'),
      '@/hooks': resolve(__dirname, './hooks'),
      '@/types': resolve(__dirname, './types'),
      '@/tests': resolve(__dirname, './tests')
    }
  },
  
  // Define configuration
  define: {
    'process.env.NODE_ENV': '"test"'
  }
})