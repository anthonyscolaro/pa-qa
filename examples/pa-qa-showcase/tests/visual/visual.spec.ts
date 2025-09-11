/**
 * Visual Regression Testing Suite
 * 
 * This file provides comprehensive visual regression testing using Playwright's
 * screenshot comparison features. It captures and compares visual states of
 * the PA-QA Showcase application across different viewports, themes, and states.
 */

import { test, expect, Page } from '@playwright/test'

// Visual test configuration
const visualConfig = {
  // Screenshot comparison thresholds
  threshold: 0.2, // 20% difference threshold
  maxDiffPixels: 1000, // Maximum different pixels allowed
  
  // Animation handling
  animations: 'disabled' as const,
  
  // Viewport configurations
  viewports: {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 },
    ultrawide: { width: 2560, height: 1440 }
  },
  
  // Theme configurations
  themes: ['light', 'dark'],
  
  // Screenshot options
  screenshotOptions: {
    mode: 'fullPage' as const,
    animations: 'disabled' as const,
    caret: 'hide' as const,
    clip: undefined
  }
}

// Helper functions
async function setupPage(page: Page, theme?: 'light' | 'dark') {
  // Disable animations for consistent screenshots
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `
  })
  
  // Set theme if specified
  if (theme) {
    await page.emulateMedia({ 
      colorScheme: theme === 'dark' ? 'dark' : 'light' 
    })
    
    await page.evaluate((theme) => {
      document.documentElement.setAttribute('data-theme', theme)
      document.documentElement.classList.toggle('dark', theme === 'dark')
      localStorage.setItem('theme', theme)
    }, theme)
  }
  
  // Wait for fonts and images to load
  await page.waitForLoadState('networkidle')
  
  // Wait for any custom fonts
  await page.waitForFunction(() => document.fonts.ready)
}

async function hideVariableContent(page: Page) {
  // Hide elements that might have variable content (dates, random data, etc.)
  await page.addStyleTag({
    content: `
      [data-testid="current-time"],
      [data-testid="random-content"],
      .timestamp,
      .live-data {
        visibility: hidden !important;
      }
    `
  })
}

async function waitForStableLayout(page: Page, timeout: number = 3000) {
  // Wait for layout to stabilize
  await page.waitForTimeout(1000)
  
  // Wait for any lazy-loaded images
  await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'))
    return Promise.all(
      images.map(img => {
        if (img.complete) return Promise.resolve()
        return new Promise(resolve => {
          img.onload = resolve
          img.onerror = resolve
        })
      })
    )
  })
  
  // Wait a bit more for any remaining layout shifts
  await page.waitForTimeout(500)
}

test.describe('PA-QA Showcase - Visual Regression Tests', () => {
  test.describe('Homepage Visual Tests', () => {
    test('should match homepage visual baseline - desktop', async ({ page }) => {
      await page.setViewportSize(visualConfig.viewports.desktop)
      await page.goto('/')
      await setupPage(page)
      await hideVariableContent(page)
      await waitForStableLayout(page)
      
      await expect(page).toHaveScreenshot('homepage-desktop.png', {
        ...visualConfig.screenshotOptions,
        threshold: visualConfig.threshold,
        maxDiffPixels: visualConfig.maxDiffPixels
      })
    })

    test('should match homepage visual baseline - mobile', async ({ page }) => {
      await page.setViewportSize(visualConfig.viewports.mobile)
      await page.goto('/')
      await setupPage(page)
      await hideVariableContent(page)
      await waitForStableLayout(page)
      
      await expect(page).toHaveScreenshot('homepage-mobile.png', {
        ...visualConfig.screenshotOptions,
        threshold: visualConfig.threshold,
        maxDiffPixels: visualConfig.maxDiffPixels
      })
    })

    test('should match homepage visual baseline - tablet', async ({ page }) => {
      await page.setViewportSize(visualConfig.viewports.tablet)
      await page.goto('/')
      await setupPage(page)
      await hideVariableContent(page)
      await waitForStableLayout(page)
      
      await expect(page).toHaveScreenshot('homepage-tablet.png', {
        ...visualConfig.screenshotOptions,
        threshold: visualConfig.threshold,
        maxDiffPixels: visualConfig.maxDiffPixels
      })
    })
  })

  test.describe('Theme Visual Tests', () => {
    test('should match light theme visual baseline', async ({ page }) => {
      await page.setViewportSize(visualConfig.viewports.desktop)
      await page.goto('/')
      await setupPage(page, 'light')
      await hideVariableContent(page)
      await waitForStableLayout(page)
      
      await expect(page).toHaveScreenshot('homepage-light-theme.png', {
        ...visualConfig.screenshotOptions,
        threshold: visualConfig.threshold,
        maxDiffPixels: visualConfig.maxDiffPixels
      })
    })

    test('should match dark theme visual baseline', async ({ page }) => {
      await page.setViewportSize(visualConfig.viewports.desktop)
      await page.goto('/')
      await setupPage(page, 'dark')
      await hideVariableContent(page)
      await waitForStableLayout(page)
      
      await expect(page).toHaveScreenshot('homepage-dark-theme.png', {
        ...visualConfig.screenshotOptions,
        threshold: visualConfig.threshold,
        maxDiffPixels: visualConfig.maxDiffPixels
      })
    })

    test('should show theme toggle visual states', async ({ page }) => {
      await page.setViewportSize(visualConfig.viewports.desktop)
      await page.goto('/')
      await setupPage(page, 'light')
      await hideVariableContent(page)
      await waitForStableLayout(page)
      
      // Hover over theme toggle
      const themeToggle = page.locator('button[aria-label*="theme"], button[title*="theme"]')
      if (await themeToggle.count() > 0) {
        await themeToggle.hover()
        await page.waitForTimeout(300)
        
        await expect(themeToggle).toHaveScreenshot('theme-toggle-hover.png', {
          threshold: visualConfig.threshold,
          maxDiffPixels: 100
        })
      }
    })
  })

  test.describe('Navigation Visual Tests', () => {
    test('should match navigation visual states', async ({ page }) => {
      await page.setViewportSize(visualConfig.viewports.desktop)
      await page.goto('/')
      await setupPage(page)
      await hideVariableContent(page)
      await waitForStableLayout(page)
      
      // Test navigation hover states
      const navLinks = page.locator('nav a')
      const linkCount = await navLinks.count()
      
      if (linkCount > 0) {
        // Hover over first nav link
        await navLinks.first().hover()
        await page.waitForTimeout(300)
        
        await expect(page.locator('nav')).toHaveScreenshot('navigation-hover-state.png', {
          threshold: visualConfig.threshold,
          maxDiffPixels: 200
        })
      }
    })

    test('should match mobile navigation visual states', async ({ page }) => {
      await page.setViewportSize(visualConfig.viewports.mobile)
      await page.goto('/')
      await setupPage(page)
      await hideVariableContent(page)
      await waitForStableLayout(page)
      
      // Test mobile menu
      const menuButton = page.locator('button[aria-expanded], button[aria-controls]')
      if (await menuButton.count() > 0) {
        // Closed state
        await expect(page).toHaveScreenshot('mobile-nav-closed.png', {
          ...visualConfig.screenshotOptions,
          threshold: visualConfig.threshold,
          maxDiffPixels: visualConfig.maxDiffPixels
        })
        
        // Open mobile menu
        await menuButton.click()
        await page.waitForTimeout(500) // Wait for animation
        
        // Open state
        await expect(page).toHaveScreenshot('mobile-nav-open.png', {
          ...visualConfig.screenshotOptions,
          threshold: visualConfig.threshold,
          maxDiffPixels: visualConfig.maxDiffPixels
        })
      }
    })
  })

  test.describe('Content Page Visual Tests', () => {
    test('should match documentation page visual baseline', async ({ page }) => {
      await page.setViewportSize(visualConfig.viewports.desktop)
      await page.goto('/docs')
      await setupPage(page)
      await hideVariableContent(page)
      await waitForStableLayout(page)
      
      await expect(page).toHaveScreenshot('docs-page-desktop.png', {
        ...visualConfig.screenshotOptions,
        threshold: visualConfig.threshold,
        maxDiffPixels: visualConfig.maxDiffPixels
      })
    })

    test('should match examples page visual baseline', async ({ page }) => {
      await page.setViewportSize(visualConfig.viewports.desktop)
      await page.goto('/examples')
      await setupPage(page)
      await hideVariableContent(page)
      await waitForStableLayout(page)
      
      await expect(page).toHaveScreenshot('examples-page-desktop.png', {
        ...visualConfig.screenshotOptions,
        threshold: visualConfig.threshold,
        maxDiffPixels: visualConfig.maxDiffPixels
      })
    })

    test('should match best practices page visual baseline', async ({ page }) => {
      await page.setViewportSize(visualConfig.viewports.desktop)
      await page.goto('/best-practices')
      await setupPage(page)
      await hideVariableContent(page)
      await waitForStableLayout(page)
      
      await expect(page).toHaveScreenshot('best-practices-page-desktop.png', {
        ...visualConfig.screenshotOptions,
        threshold: visualConfig.threshold,
        maxDiffPixels: visualConfig.maxDiffPixels
      })
    })
  })

  test.describe('Component Visual Tests', () => {
    test('should match form component visual states', async ({ page }) => {
      await page.setViewportSize(visualConfig.viewports.desktop)
      await page.goto('/')
      await setupPage(page)
      await hideVariableContent(page)
      await waitForStableLayout(page)
      
      // Look for forms
      const forms = page.locator('form')
      if (await forms.count() > 0) {
        const form = forms.first()
        
        // Empty form state
        await expect(form).toHaveScreenshot('form-empty-state.png', {
          threshold: visualConfig.threshold,
          maxDiffPixels: 200
        })
        
        // Fill form
        const nameInput = form.locator('input[name="name"]')
        const emailInput = form.locator('input[name="email"]')
        const messageTextarea = form.locator('textarea[name="message"]')
        
        if (await nameInput.count() > 0) {
          await nameInput.fill('John Doe')
        }
        if (await emailInput.count() > 0) {
          await emailInput.fill('john@example.com')
        }
        if (await messageTextarea.count() > 0) {
          await messageTextarea.fill('This is a test message.')
        }
        
        await page.waitForTimeout(300)
        
        // Filled form state
        await expect(form).toHaveScreenshot('form-filled-state.png', {
          threshold: visualConfig.threshold,
          maxDiffPixels: 300
        })
      }
    })

    test('should match button component visual states', async ({ page }) => {
      await page.setViewportSize(visualConfig.viewports.desktop)
      await page.goto('/')
      await setupPage(page)
      await hideVariableContent(page)
      await waitForStableLayout(page)
      
      const buttons = page.locator('button, .btn')
      if (await buttons.count() > 0) {
        const primaryButton = buttons.first()
        
        // Default state
        await expect(primaryButton).toHaveScreenshot('button-default.png', {
          threshold: visualConfig.threshold,
          maxDiffPixels: 50
        })
        
        // Hover state
        await primaryButton.hover()
        await page.waitForTimeout(300)
        
        await expect(primaryButton).toHaveScreenshot('button-hover.png', {
          threshold: visualConfig.threshold,
          maxDiffPixels: 50
        })
        
        // Focus state
        await primaryButton.focus()
        await page.waitForTimeout(300)
        
        await expect(primaryButton).toHaveScreenshot('button-focus.png', {
          threshold: visualConfig.threshold,
          maxDiffPixels: 50
        })
      }
    })

    test('should match card component visual states', async ({ page }) => {
      await page.setViewportSize(visualConfig.viewports.desktop)
      await page.goto('/')
      await setupPage(page)
      await hideVariableContent(page)
      await waitForStableLayout(page)
      
      // Look for card-like components
      const cards = page.locator('.card, [data-testid*="card"], article, .feature, .showcase-card')
      if (await cards.count() > 0) {
        const firstCard = cards.first()
        
        // Default card state
        await expect(firstCard).toHaveScreenshot('card-default.png', {
          threshold: visualConfig.threshold,
          maxDiffPixels: 100
        })
        
        // Hover state (if interactive)
        await firstCard.hover()
        await page.waitForTimeout(300)
        
        await expect(firstCard).toHaveScreenshot('card-hover.png', {
          threshold: visualConfig.threshold,
          maxDiffPixels: 100
        })
      }
    })
  })

  test.describe('Loading State Visual Tests', () => {
    test('should match loading state visuals', async ({ page }) => {
      await page.setViewportSize(visualConfig.viewports.desktop)
      
      // Intercept requests to simulate loading
      await page.route('**/*', async (route) => {
        await page.waitForTimeout(2000) // Simulate slow loading
        route.continue()
      })
      
      const navigationPromise = page.goto('/')
      
      // Capture loading state
      await page.waitForTimeout(1000)
      
      const loadingElements = page.locator('[data-testid="loading"], .loading, .spinner')
      if (await loadingElements.count() > 0) {
        await expect(loadingElements.first()).toHaveScreenshot('loading-spinner.png', {
          threshold: visualConfig.threshold,
          maxDiffPixels: 100
        })
      }
      
      await navigationPromise
      await setupPage(page)
      await waitForStableLayout(page)
    })
  })

  test.describe('Error State Visual Tests', () => {
    test('should match 404 error page visual baseline', async ({ page }) => {
      await page.setViewportSize(visualConfig.viewports.desktop)
      await page.goto('/non-existent-page')
      await setupPage(page)
      await hideVariableContent(page)
      await waitForStableLayout(page)
      
      await expect(page).toHaveScreenshot('404-page-desktop.png', {
        ...visualConfig.screenshotOptions,
        threshold: visualConfig.threshold,
        maxDiffPixels: visualConfig.maxDiffPixels
      })
    })

    test('should match form validation error visuals', async ({ page }) => {
      await page.setViewportSize(visualConfig.viewports.desktop)
      await page.goto('/')
      await setupPage(page)
      await hideVariableContent(page)
      await waitForStableLayout(page)
      
      // Look for forms and try to trigger validation
      const forms = page.locator('form')
      if (await forms.count() > 0) {
        const form = forms.first()
        const submitButton = form.locator('button[type="submit"]')
        
        if (await submitButton.count() > 0) {
          // Try to submit empty form
          await submitButton.click()
          await page.waitForTimeout(500)
          
          // Check for validation errors
          const errorElements = page.locator('[aria-invalid="true"], .error, [role="alert"]')
          if (await errorElements.count() > 0) {
            await expect(form).toHaveScreenshot('form-validation-errors.png', {
              threshold: visualConfig.threshold,
              maxDiffPixels: 300
            })
          }
        }
      }
    })
  })

  test.describe('Cross-Browser Visual Consistency', () => {
    test('should maintain visual consistency across viewports', async ({ page }) => {
      const viewports = Object.entries(visualConfig.viewports)
      
      for (const [name, viewport] of viewports) {
        await page.setViewportSize(viewport)
        await page.goto('/')
        await setupPage(page)
        await hideVariableContent(page)
        await waitForStableLayout(page)
        
        await expect(page).toHaveScreenshot(`homepage-${name}.png`, {
          ...visualConfig.screenshotOptions,
          threshold: visualConfig.threshold,
          maxDiffPixels: visualConfig.maxDiffPixels
        })
      }
    })
  })

  test.describe('Interactive State Visual Tests', () => {
    test('should capture focus states for accessibility', async ({ page }) => {
      await page.setViewportSize(visualConfig.viewports.desktop)
      await page.goto('/')
      await setupPage(page)
      await hideVariableContent(page)
      await waitForStableLayout(page)
      
      // Test keyboard navigation focus states
      await page.keyboard.press('Tab')
      await page.waitForTimeout(300)
      
      const focusedElement = page.locator(':focus')
      if (await focusedElement.count() > 0) {
        await expect(focusedElement).toHaveScreenshot('focus-first-element.png', {
          threshold: visualConfig.threshold,
          maxDiffPixels: 100
        })
      }
      
      // Tab through more elements
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.waitForTimeout(300)
      
      const secondFocusedElement = page.locator(':focus')
      if (await secondFocusedElement.count() > 0) {
        await expect(secondFocusedElement).toHaveScreenshot('focus-navigation-element.png', {
          threshold: visualConfig.threshold,
          maxDiffPixels: 100
        })
      }
    })

    test('should capture dropdown/menu states', async ({ page }) => {
      await page.setViewportSize(visualConfig.viewports.desktop)
      await page.goto('/')
      await setupPage(page)
      await hideVariableContent(page)
      await waitForStableLayout(page)
      
      // Look for dropdowns or expandable menus
      const dropdowns = page.locator('[aria-expanded="false"], [role="button"][aria-haspopup]')
      if (await dropdowns.count() > 0) {
        const dropdown = dropdowns.first()
        
        // Closed state
        await expect(dropdown).toHaveScreenshot('dropdown-closed.png', {
          threshold: visualConfig.threshold,
          maxDiffPixels: 100
        })
        
        // Open dropdown
        await dropdown.click()
        await page.waitForTimeout(300)
        
        // Open state
        await expect(dropdown).toHaveScreenshot('dropdown-open.png', {
          threshold: visualConfig.threshold,
          maxDiffPixels: 200
        })
      }
    })
  })

  test.describe('Print Layout Visual Tests', () => {
    test('should match print layout visual baseline', async ({ page }) => {
      await page.setViewportSize(visualConfig.viewports.desktop)
      await page.goto('/')
      await setupPage(page)
      await hideVariableContent(page)
      await waitForStableLayout(page)
      
      // Emulate print media
      await page.emulateMedia({ media: 'print' })
      await page.waitForTimeout(500)
      
      await expect(page).toHaveScreenshot('homepage-print-layout.png', {
        ...visualConfig.screenshotOptions,
        threshold: visualConfig.threshold,
        maxDiffPixels: visualConfig.maxDiffPixels
      })
    })
  })
})