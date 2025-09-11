/**
 * E2E Tests for PA-QA Showcase Application
 * 
 * This file demonstrates comprehensive end-to-end testing using Playwright.
 * It covers navigation, user interactions, form submissions, and cross-browser
 * compatibility testing for the PA-QA Showcase application.
 */

import { test, expect, Page } from '@playwright/test'

// Test data
const testUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  message: 'This is a test message for the PA-QA showcase application.'
}

// Helper functions
async function navigateToPage(page: Page, path: string) {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

async function checkPageAccessibility(page: Page) {
  // Basic accessibility checks
  const h1 = page.locator('h1').first()
  await expect(h1).toBeVisible()
  
  // Check for skip links
  const skipLink = page.locator('a[href="#main-content"]')
  if (await skipLink.count() > 0) {
    await expect(skipLink).toBeVisible()
  }
}

test.describe('PA-QA Showcase - Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToPage(page, '/')
  })

  test('should load homepage successfully', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/PA-QA Testing Showcase/)
    
    // Check main heading
    const mainHeading = page.locator('h1')
    await expect(mainHeading).toBeVisible()
    await expect(mainHeading).toContainText('PA-QA Testing Framework')
    
    // Check navigation is present
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
  })

  test('should display hero section', async ({ page }) => {
    // Check hero section exists
    const hero = page.locator('[data-testid="hero-section"]').or(page.locator('section').first())
    await expect(hero).toBeVisible()
    
    // Check for CTA buttons
    const ctaButtons = page.locator('a[href*="/docs"], a[href*="/examples"]')
    await expect(ctaButtons.first()).toBeVisible()
  })

  test('should show framework features', async ({ page }) => {
    // Check for feature cards or list
    const features = page.locator('[data-testid="features"]').or(page.locator('section').nth(1))
    await expect(features).toBeVisible()
    
    // Check for testing framework mentions
    await expect(page.locator('text=Vitest')).toBeVisible()
    await expect(page.locator('text=Playwright')).toBeVisible()
  })
})

test.describe('PA-QA Showcase - Navigation', () => {
  test('should navigate between main pages', async ({ page }) => {
    await navigateToPage(page, '/')
    
    // Test navigation to Documentation
    await page.click('a[href="/docs"]')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/docs')
    
    // Test navigation to Examples
    await page.click('a[href="/examples"]')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/examples')
    
    // Test navigation to Best Practices
    await page.click('a[href="/best-practices"]')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/best-practices')
    
    // Test navigation back to Home
    await page.click('a[href="/"]')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toBe(page.url().split('/')[0] + '//')
  })

  test('should handle mobile navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await navigateToPage(page, '/')
    
    // Check mobile menu button exists
    const menuButton = page.locator('button[aria-label*="menu"], button[aria-expanded]')
    await expect(menuButton).toBeVisible()
    
    // Open mobile menu
    await menuButton.click()
    
    // Check mobile menu is open
    const mobileNav = page.locator('[role="dialog"], nav[data-mobile="true"]')
    await expect(mobileNav).toBeVisible()
    
    // Test navigation in mobile menu
    await page.click('a[href="/docs"]')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toContain('/docs')
  })

  test('should highlight active navigation item', async ({ page }) => {
    await navigateToPage(page, '/docs')
    
    // Check active navigation styling
    const activeNavItem = page.locator('nav a[href="/docs"]')
    await expect(activeNavItem).toHaveClass(/active|current|text-blue/)
  })
})

test.describe('PA-QA Showcase - Theme Toggle', () => {
  test('should toggle between light and dark themes', async ({ page }) => {
    await navigateToPage(page, '/')
    
    // Find theme toggle button
    const themeToggle = page.locator('button[aria-label*="theme"], button[title*="theme"]')
    await expect(themeToggle).toBeVisible()
    
    // Get initial theme
    const initialTheme = await page.locator('html').getAttribute('class')
    
    // Click theme toggle
    await themeToggle.click()
    await page.waitForTimeout(500) // Wait for transition
    
    // Check theme changed
    const newTheme = await page.locator('html').getAttribute('class')
    expect(newTheme).not.toBe(initialTheme)
  })

  test('should persist theme preference', async ({ page, context }) => {
    await navigateToPage(page, '/')
    
    // Toggle to dark theme
    const themeToggle = page.locator('button[aria-label*="theme"], button[title*="theme"]')
    await themeToggle.click()
    await page.waitForTimeout(500)
    
    // Check dark theme is applied
    const darkTheme = await page.locator('html').getAttribute('class')
    expect(darkTheme).toContain('dark')
    
    // Create new page to test persistence
    const newPage = await context.newPage()
    await newPage.goto('/')
    await newPage.waitForLoadState('networkidle')
    
    // Check theme is still dark
    const persistedTheme = await newPage.locator('html').getAttribute('class')
    expect(persistedTheme).toContain('dark')
    
    await newPage.close()
  })
})

test.describe('PA-QA Showcase - Documentation Page', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToPage(page, '/docs')
  })

  test('should display documentation content', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Documentation/)
    
    // Check main content area
    const mainContent = page.locator('main, [role="main"]')
    await expect(mainContent).toBeVisible()
    
    // Check for documentation sections
    const headings = page.locator('h1, h2, h3')
    await expect(headings.first()).toBeVisible()
  })

  test('should have working table of contents', async ({ page }) => {
    // Look for table of contents
    const toc = page.locator('[data-testid="toc"], .table-of-contents, nav[aria-label*="content"]')
    
    if (await toc.count() > 0) {
      await expect(toc).toBeVisible()
      
      // Test TOC links
      const tocLinks = toc.locator('a')
      const firstLink = tocLinks.first()
      
      if (await firstLink.count() > 0) {
        const href = await firstLink.getAttribute('href')
        await firstLink.click()
        
        if (href?.startsWith('#')) {
          // Check anchor navigation
          const targetElement = page.locator(href)
          await expect(targetElement).toBeInViewport()
        }
      }
    }
  })

  test('should have syntax highlighted code blocks', async ({ page }) => {
    // Look for code blocks
    const codeBlocks = page.locator('pre code, .highlight')
    
    if (await codeBlocks.count() > 0) {
      await expect(codeBlocks.first()).toBeVisible()
      
      // Check for syntax highlighting classes
      const firstCodeBlock = codeBlocks.first()
      const classes = await firstCodeBlock.getAttribute('class')
      expect(classes).toBeTruthy()
    }
  })
})

test.describe('PA-QA Showcase - Examples Page', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToPage(page, '/examples')
  })

  test('should display testing examples', async ({ page }) => {
    // Check page loads
    await expect(page).toHaveTitle(/Examples/)
    
    // Look for example cards or sections
    const examples = page.locator('[data-testid="example-card"], .example, article')
    await expect(examples.first()).toBeVisible()
  })

  test('should have interactive test runner', async ({ page }) => {
    // Look for test runner component
    const testRunner = page.locator('[data-testid="test-runner"], .test-runner')
    
    if (await testRunner.count() > 0) {
      await expect(testRunner).toBeVisible()
      
      // Look for run button
      const runButton = testRunner.locator('button:has-text("Run"), button:has-text("Execute")')
      
      if (await runButton.count() > 0) {
        await expect(runButton).toBeVisible()
        
        // Test running examples
        await runButton.click()
        await page.waitForTimeout(1000)
        
        // Check for results
        const results = page.locator('[data-testid="test-results"], .test-results')
        if (await results.count() > 0) {
          await expect(results).toBeVisible()
        }
      }
    }
  })

  test('should display coverage reports', async ({ page }) => {
    // Look for coverage report component
    const coverageReport = page.locator('[data-testid="coverage-report"], .coverage-report')
    
    if (await coverageReport.count() > 0) {
      await expect(coverageReport).toBeVisible()
      
      // Check for coverage metrics
      const metrics = coverageReport.locator('text=/\\d+%/')
      if (await metrics.count() > 0) {
        await expect(metrics.first()).toBeVisible()
      }
    }
  })
})

test.describe('PA-QA Showcase - Forms and Interactions', () => {
  test('should handle contact form submission', async ({ page }) => {
    await navigateToPage(page, '/')
    
    // Look for contact form
    const contactForm = page.locator('form[data-testid="contact-form"], form:has(input[name="email"])')
    
    if (await contactForm.count() > 0) {
      await expect(contactForm).toBeVisible()
      
      // Fill out form
      await page.fill('input[name="name"]', testUser.name)
      await page.fill('input[name="email"]', testUser.email)
      await page.fill('textarea[name="message"]', testUser.message)
      
      // Submit form
      await page.click('button[type="submit"]')
      
      // Check for success message or redirect
      await expect(
        page.locator('text=/thank you|success|sent/i').or(
          page.locator('[data-testid="success-message"]')
        )
      ).toBeVisible({ timeout: 5000 })
    }
  })

  test('should validate form inputs', async ({ page }) => {
    await navigateToPage(page, '/')
    
    const contactForm = page.locator('form[data-testid="contact-form"], form:has(input[name="email"])')
    
    if (await contactForm.count() > 0) {
      // Try to submit empty form
      await page.click('button[type="submit"]')
      
      // Check for validation messages
      const validationMessage = page.locator('input:invalid, [aria-invalid="true"]').first()
      if (await validationMessage.count() > 0) {
        await expect(validationMessage).toBeVisible()
      }
    }
  })

  test('should handle search functionality', async ({ page }) => {
    await navigateToPage(page, '/')
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"]')
    
    if (await searchInput.count() > 0) {
      await expect(searchInput).toBeVisible()
      
      // Perform search
      await searchInput.fill('testing')
      await page.keyboard.press('Enter')
      
      await page.waitForTimeout(1000)
      
      // Check for search results
      const results = page.locator('[data-testid="search-results"], .search-results')
      if (await results.count() > 0) {
        await expect(results).toBeVisible()
      }
    }
  })
})

test.describe('PA-QA Showcase - Performance and Loading', () => {
  test('should load pages within acceptable time', async ({ page }) => {
    const startTime = Date.now()
    await navigateToPage(page, '/')
    const loadTime = Date.now() - startTime
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000)
  })

  test('should handle loading states', async ({ page }) => {
    await page.goto('/')
    
    // Check for loading indicators during page load
    const loadingIndicators = page.locator('[data-testid="loading"], .loading, .spinner')
    
    // If loading indicators exist, they should eventually disappear
    if (await loadingIndicators.count() > 0) {
      await expect(loadingIndicators.first()).toBeHidden({ timeout: 10000 })
    }
  })

  test('should be responsive on different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 }, // iPhone SE
      { width: 768, height: 1024 }, // iPad
      { width: 1920, height: 1080 }, // Desktop
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await navigateToPage(page, '/')
      
      // Check that content is visible and accessible
      const mainContent = page.locator('main, [role="main"]')
      await expect(mainContent).toBeVisible()
      
      // Check navigation works
      const nav = page.locator('nav')
      await expect(nav).toBeVisible()
    }
  })
})

test.describe('PA-QA Showcase - Error Handling', () => {
  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/non-existent-page', { waitUntil: 'networkidle' })
    
    // Check for 404 page content
    await expect(
      page.locator('text=/404|not found|page not found/i').or(
        page.locator('h1:has-text("404")')
      )
    ).toBeVisible()
    
    // Check for navigation back to home
    const homeLink = page.locator('a[href="/"], a:has-text("home")')
    if (await homeLink.count() > 0) {
      await expect(homeLink.first()).toBeVisible()
    }
  })

  test('should handle JavaScript errors gracefully', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    await navigateToPage(page, '/')
    
    // Navigate through different pages
    const links = ['/docs', '/examples', '/best-practices']
    
    for (const link of links) {
      try {
        await page.goto(link, { waitUntil: 'networkidle' })
        await page.waitForTimeout(1000)
      } catch (error) {
        // Page should load even if there are minor errors
        console.log(`Navigation to ${link} had issues:`, error)
      }
    }
    
    // Check that no critical JavaScript errors occurred
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('analytics') &&
      !error.includes('ads')
    )
    
    expect(criticalErrors.length).toBeLessThan(3) // Allow for minor non-critical errors
  })
})

test.describe('PA-QA Showcase - SEO and Meta Tags', () => {
  test('should have proper meta tags', async ({ page }) => {
    await navigateToPage(page, '/')
    
    // Check title
    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title.length).toBeGreaterThan(10)
    
    // Check meta description
    const description = page.locator('meta[name="description"]')
    if (await description.count() > 0) {
      const content = await description.getAttribute('content')
      expect(content).toBeTruthy()
      expect(content!.length).toBeGreaterThan(50)
    }
    
    // Check viewport meta tag
    const viewport = page.locator('meta[name="viewport"]')
    await expect(viewport).toHaveAttribute('content', /width=device-width/)
  })

  test('should have proper heading structure', async ({ page }) => {
    await navigateToPage(page, '/')
    
    // Check for h1
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
    
    // Count heading levels
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1) // Should have exactly one h1
  })
})