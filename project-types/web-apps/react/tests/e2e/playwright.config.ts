import { defineConfig, devices } from '@playwright/test';

/**
 * PA-QA Playwright Configuration for React Applications
 * 
 * This configuration provides:
 * - Cross-browser testing (Chrome, Firefox, Safari)
 * - Mobile responsive testing
 * - Visual regression testing
 * - API mocking capabilities
 * - Accessibility testing integration
 * - Allure reporting
 */

export default defineConfig({
  // Test directory
  testDir: './tests',
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['allure-playwright', {
      detail: true,
      outputFolder: 'allure-results',
      suiteTitle: true,
      environmentInfo: {
        framework: 'React',
        node_version: process.version,
        test_environment: process.env.NODE_ENV || 'development'
      }
    }]
  ],
  
  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Record video on first retry
    video: 'retain-on-failure',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Global timeout for all actions
    actionTimeout: 15000,
    
    // Navigation timeout
    navigationTimeout: 30000,
  },
  
  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable Chrome DevTools features
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        }
      },
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    
    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    
    // Tablet testing
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
    
    // High DPI testing
    {
      name: 'High DPI',
      use: { 
        ...devices['Desktop Chrome HiDPI'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    
    // Dark mode testing
    {
      name: 'Dark Mode',
      use: { 
        ...devices['Desktop Chrome'],
        colorScheme: 'dark'
      },
    },
    
    // Slow network simulation
    {
      name: 'Slow Network',
      use: { 
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--simulate-slow-connection']
        }
      },
    }
  ],
  
  // Global setup and teardown
  globalSetup: require.resolve('./utils/global-setup.ts'),
  globalTeardown: require.resolve('./utils/global-teardown.ts'),
  
  // Test timeout
  timeout: 60000,
  
  // Expect timeout for assertions
  expect: {
    timeout: 10000,
    // Visual comparison threshold
    threshold: 0.2,
    // Animation handling
    toHaveScreenshot: {
      mode: 'css',
      animations: 'disabled'
    },
    toMatchSnapshot: {
      threshold: 0.2
    }
  },
  
  // Output directory
  outputDir: 'test-results/',
  
  // Web server configuration for local development
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  
  // Metadata for Allure reports
  metadata: {
    url: process.env.BASE_URL || 'http://localhost:3000',
    environment: process.env.NODE_ENV || 'development',
    framework: 'React + Playwright',
    version: process.env.npm_package_version || '1.0.0'
  }
});