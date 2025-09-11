/**
 * Playwright Global Setup
 * 
 * This file handles global setup for Playwright E2E tests.
 * It prepares the test environment, sets up authentication,
 * and ensures the application is ready for testing.
 */

import { chromium, FullConfig } from '@playwright/test'
import path from 'path'
import fs from 'fs'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Playwright global setup...')
  
  // Ensure test directories exist
  const testDirs = [
    'test-results',
    'allure-results',
    'playwright-report',
    'tests/screenshots',
    'tests/videos'
  ]
  
  for (const dir of testDirs) {
    const fullPath = path.join(process.cwd(), dir)
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true })
      console.log(`📁 Created directory: ${dir}`)
    }
  }
  
  // Start browser for authentication and app readiness checks
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    // Wait for the application to be ready
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000'
    console.log(`🔍 Checking application readiness at ${baseURL}`)
    
    // Wait up to 60 seconds for the app to be ready
    let retries = 0
    const maxRetries = 30
    
    while (retries < maxRetries) {
      try {
        const response = await page.goto(baseURL, { 
          waitUntil: 'networkidle',
          timeout: 10000 
        })
        
        if (response?.ok()) {
          console.log('✅ Application is ready!')
          break
        }
      } catch (error) {
        retries++
        console.log(`⏳ Waiting for application... (attempt ${retries}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        if (retries === maxRetries) {
          throw new Error(`Application not ready after ${maxRetries} attempts`)
        }
      }
    }
    
    // Pre-authenticate if needed (for tests that require authentication)
    // This is a placeholder - implement actual authentication flow if needed
    console.log('🔐 Setting up test authentication state...')
    
    // Set up any global test data or state
    await page.evaluate(() => {
      // Clear any existing storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Set up test-specific localStorage items if needed
      localStorage.setItem('test-mode', 'true')
      localStorage.setItem('theme', 'light')
    })
    
    // Save authentication state if needed
    const authFile = path.join(process.cwd(), 'tests/setup/auth.json')
    await context.storageState({ path: authFile })
    console.log('💾 Authentication state saved')
    
    // Take a screenshot of the ready application
    await page.screenshot({ 
      path: path.join(process.cwd(), 'test-results/app-ready.png'),
      fullPage: true 
    })
    console.log('📸 App readiness screenshot saved')
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await context.close()
    await browser.close()
  }
  
  // Set environment variables for tests
  process.env.PLAYWRIGHT_BASE_URL = config.projects[0].use.baseURL || 'http://localhost:3000'
  process.env.TEST_USER_EMAIL = 'test@example.com'
  process.env.TEST_USER_PASSWORD = 'testpassword123'
  
  console.log('✅ Playwright global setup completed successfully!')
}

export default globalSetup