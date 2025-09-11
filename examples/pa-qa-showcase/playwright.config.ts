import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E Testing Configuration for PA-QA Showcase
 * 
 * Features:
 * - Cross-browser testing (Chromium, Firefox, WebKit)
 * - Mobile device testing
 * - Accessibility testing with axe-core
 * - Performance testing with Lighthouse
 * - Visual regression testing
 * - Allure reporting integration
 * - Parallel test execution
 * - Screenshot and video recording on failure
 */

export default defineConfig({
  // Test directory structure
  testDir: './tests',
  testMatch: [
    'tests/e2e/**/*.spec.ts',
    'tests/accessibility/**/*.spec.ts',
    'tests/performance/**/*.spec.ts',
    'tests/visual/**/*.spec.ts'
  ],
  
  // Global test configuration
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30 * 1000,
  expect: {
    timeout: 5 * 1000,
    toHaveScreenshot: { 
      mode: 'local',
      threshold: 0.2,
      maxDiffPixels: 1000
    },
    toMatchScreenshot: {
      threshold: 0.2,
      maxDiffPixels: 1000
    }
  },
  
  // Global setup
  globalSetup: require.resolve('./tests/setup/playwright-setup.ts'),
  
  // Reporting configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['allure-playwright', { 
      detail: true,
      outputFolder: 'allure-results',
      suiteTitle: false,
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
    }],
    ['list']
  ],
  
  // Output directories
  outputDir: 'test-results/',
  
  // Global test options
  use: {
    // Base URL for tests
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    // Browser options
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Screenshots and videos
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    
    // Test artifacts
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
    
    // Locale and timezone
    locale: 'en-US',
    timezoneId: 'America/New_York'
  },

  // Browser projects
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome'
      },
      testDir: './tests/e2e'
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testDir: './tests/e2e'
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testDir: './tests/e2e'
    },

    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testDir: './tests/e2e'
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      testDir: './tests/e2e'
    },

    // Tablet browsers
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
      testDir: './tests/e2e'
    },

    // Accessibility testing - run on Chromium only for speed
    {
      name: 'accessibility',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome'
      },
      testDir: './tests/accessibility',
      testMatch: '**/*.spec.ts'
    },

    // Performance testing - run on Chromium only
    {
      name: 'performance',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome'
      },
      testDir: './tests/performance',
      testMatch: '**/*.spec.ts'
    },

    // Visual regression testing - run on Chromium for consistency
    {
      name: 'visual-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: { width: 1920, height: 1080 }
      },
      testDir: './tests/visual',
      testMatch: '**/*.spec.ts'
    },
    {
      name: 'visual-mobile',
      use: { 
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 }
      },
      testDir: './tests/visual',
      testMatch: '**/*.spec.ts'
    }
  ],

  // Web server configuration for local testing
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NODE_ENV: 'test'
    }
  },
  
  // Global teardown
  globalTeardown: require.resolve('./tests/setup/playwright-teardown.ts')
})