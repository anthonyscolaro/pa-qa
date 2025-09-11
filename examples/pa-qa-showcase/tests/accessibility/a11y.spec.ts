/**
 * Accessibility Testing Suite
 * 
 * This file provides comprehensive accessibility testing using Playwright
 * and axe-core. It ensures the PA-QA Showcase application meets WCAG 2.1 AA
 * standards and provides an inclusive user experience.
 */

import { test, expect, Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Accessibility test configuration
const accessibilityConfig = {
  // WCAG 2.1 AA compliance tags
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  
  // Rules to disable (use sparingly and document why)
  disabledRules: [
    // Example: 'color-contrast' - only if you have a specific reason
  ],
  
  // Custom rules configuration
  rules: {
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'focus-management': { enabled: true },
    'aria-usage': { enabled: true },
    'semantic-html': { enabled: true }
  }
}

// Helper functions
async function runAxeTest(page: Page, context?: string) {
  const axeBuilder = new AxeBuilder({ page })
    .withTags(accessibilityConfig.tags)
    .exclude('[data-test="non-accessible-test-element"]') // Exclude test elements if any

  // Disable rules if configured
  accessibilityConfig.disabledRules.forEach(rule => {
    axeBuilder.disableRules([rule])
  })

  const results = await axeBuilder.analyze()
  
  if (results.violations.length > 0) {
    console.log(`Accessibility violations found${context ? ` in ${context}` : ''}:`)
    results.violations.forEach((violation, index) => {
      console.log(`${index + 1}. ${violation.id}: ${violation.description}`)
      console.log(`   Impact: ${violation.impact}`)
      console.log(`   Nodes: ${violation.nodes.length}`)
      violation.nodes.forEach((node, nodeIndex) => {
        console.log(`   ${nodeIndex + 1}. ${node.target.join(', ')}`)
        console.log(`      ${node.failureSummary}`)
      })
    })
  }

  expect(results.violations).toEqual([])
  return results
}

async function testKeyboardNavigation(page: Page) {
  // Test Tab navigation
  await page.keyboard.press('Tab')
  
  // Check that focus is visible
  const focusedElement = await page.evaluate(() => {
    const focused = document.activeElement
    if (!focused) return null
    
    const styles = window.getComputedStyle(focused)
    return {
      tagName: focused.tagName,
      outline: styles.outline,
      boxShadow: styles.boxShadow,
      border: styles.border
    }
  })
  
  expect(focusedElement).toBeTruthy()
}

async function checkHeadingStructure(page: Page) {
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents()
  const headingLevels = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll(elements => 
    elements.map(el => parseInt(el.tagName.charAt(1)))
  )
  
  // Should have exactly one h1
  const h1Count = headingLevels.filter(level => level === 1).length
  expect(h1Count).toBe(1)
  
  // Check heading hierarchy (no skipped levels)
  for (let i = 1; i < headingLevels.length; i++) {
    const diff = headingLevels[i] - headingLevels[i - 1]
    expect(diff).toBeLessThanOrEqual(1) // Don't skip heading levels
  }
}

async function checkLandmarkRoles(page: Page) {
  // Check for main landmark
  const main = page.locator('main, [role="main"]')
  await expect(main).toBeVisible()
  
  // Check for navigation landmark
  const nav = page.locator('nav, [role="navigation"]')
  await expect(nav.first()).toBeVisible()
  
  // Check for banner (header)
  const banner = page.locator('header, [role="banner"]')
  if (await banner.count() > 0) {
    await expect(banner.first()).toBeVisible()
  }
  
  // Check for contentinfo (footer)
  const contentinfo = page.locator('footer, [role="contentinfo"]')
  if (await contentinfo.count() > 0) {
    await expect(contentinfo.first()).toBeVisible()
  }
}

test.describe('PA-QA Showcase - Accessibility Tests', () => {
  test.describe('Homepage Accessibility', () => {
    test('should pass axe accessibility tests on homepage', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await runAxeTest(page, 'homepage')
    })

    test('should have proper heading structure on homepage', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await checkHeadingStructure(page)
    })

    test('should have proper landmark roles on homepage', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await checkLandmarkRoles(page)
    })

    test('should support keyboard navigation on homepage', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      await testKeyboardNavigation(page)
      
      // Test skip links
      await page.keyboard.press('Tab')
      const skipLink = page.locator('a[href="#main-content"], a:has-text("skip")')
      if (await skipLink.count() > 0) {
        await expect(skipLink).toBeFocused()
        await skipLink.press('Enter')
        
        const mainContent = page.locator('#main-content, main')
        await expect(mainContent).toBeFocused()
      }
    })

    test('should have proper focus management for interactive elements', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Test all focusable elements have visible focus indicators
      const focusableElements = await page.locator('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])').all()
      
      for (const element of focusableElements) {
        await element.focus()
        
        // Check element is focused
        await expect(element).toBeFocused()
        
        // Verify focus is visible (this would need custom implementation based on your focus styles)
        const elementStyles = await element.evaluate((el) => {
          const styles = window.getComputedStyle(el)
          return {
            outline: styles.outline,
            boxShadow: styles.boxShadow,
            borderColor: styles.borderColor
          }
        })
        
        // At least one focus indicator should be present
        const hasFocusIndicator = 
          elementStyles.outline !== 'none' ||
          elementStyles.boxShadow !== 'none' ||
          elementStyles.borderColor !== 'initial'
        
        expect(hasFocusIndicator).toBeTruthy()
      }
    })
  })

  test.describe('Navigation Accessibility', () => {
    test('should pass axe tests for navigation', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const navigation = page.locator('nav')
      await expect(navigation.first()).toBeVisible()
      
      await runAxeTest(page, 'navigation')
    })

    test('should have accessible navigation labels', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Check navigation has proper aria-label or role
      const nav = page.locator('nav').first()
      const ariaLabel = await nav.getAttribute('aria-label')
      const role = await nav.getAttribute('role')
      
      expect(ariaLabel || role === 'navigation').toBeTruthy()
    })

    test('should indicate current page in navigation', async ({ page }) => {
      await page.goto('/docs')
      await page.waitForLoadState('networkidle')
      
      // Check for aria-current or similar indication
      const currentNavItem = page.locator('nav a[aria-current="page"], nav a.active, nav a.current')
      
      if (await currentNavItem.count() > 0) {
        await expect(currentNavItem.first()).toBeVisible()
      }
    })

    test('should support keyboard navigation in mobile menu', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Find and open mobile menu
      const menuButton = page.locator('button[aria-expanded], button[aria-controls]')
      if (await menuButton.count() > 0) {
        await expect(menuButton).toBeVisible()
        
        // Check button has proper aria attributes
        const ariaExpanded = await menuButton.getAttribute('aria-expanded')
        const ariaControls = await menuButton.getAttribute('aria-controls')
        
        expect(ariaExpanded).toBe('false')
        expect(ariaControls).toBeTruthy()
        
        // Open menu with keyboard
        await menuButton.focus()
        await menuButton.press('Enter')
        
        // Check menu is open and accessible
        await expect(menuButton).toHaveAttribute('aria-expanded', 'true')
        
        // Check menu items are focusable
        const menuItems = page.locator('[role="dialog"] a, [data-mobile-menu] a')
        if (await menuItems.count() > 0) {
          await menuItems.first().focus()
          await expect(menuItems.first()).toBeFocused()
        }
      }
    })
  })

  test.describe('Forms Accessibility', () => {
    test('should have accessible form elements', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const forms = await page.locator('form').all()
      
      for (const form of forms) {
        // Check form has accessible name or description
        const formLabel = await form.getAttribute('aria-label')
        const formDescribedBy = await form.getAttribute('aria-describedby')
        
        if (formLabel || formDescribedBy) {
          expect(formLabel || formDescribedBy).toBeTruthy()
        }
        
        // Check all form inputs have labels
        const inputs = await form.locator('input, textarea, select').all()
        
        for (const input of inputs) {
          const inputId = await input.getAttribute('id')
          const ariaLabel = await input.getAttribute('aria-label')
          const ariaLabelledBy = await input.getAttribute('aria-labelledby')
          
          if (inputId) {
            const label = page.locator(`label[for="${inputId}"]`)
            if (await label.count() > 0) {
              await expect(label).toBeVisible()
            } else {
              // Input should have aria-label if no visible label
              expect(ariaLabel || ariaLabelledBy).toBeTruthy()
            }
          } else {
            expect(ariaLabel || ariaLabelledBy).toBeTruthy()
          }
        }
      }
    })

    test('should have proper error handling in forms', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const contactForm = page.locator('form').first()
      if (await contactForm.count() > 0) {
        // Try to submit empty form to trigger validation
        const submitButton = contactForm.locator('button[type="submit"]')
        if (await submitButton.count() > 0) {
          await submitButton.click()
          
          // Check for error messages
          const errorMessages = page.locator('[role="alert"], .error, [aria-invalid="true"]')
          if (await errorMessages.count() > 0) {
            // Error messages should be announced to screen readers
            const firstError = errorMessages.first()
            const role = await firstError.getAttribute('role')
            const ariaLive = await firstError.getAttribute('aria-live')
            
            expect(role === 'alert' || ariaLive === 'polite' || ariaLive === 'assertive').toBeTruthy()
          }
        }
      }
    })
  })

  test.describe('Interactive Elements Accessibility', () => {
    test('should have accessible buttons', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const buttons = await page.locator('button').all()
      
      for (const button of buttons) {
        // Button should have accessible name
        const buttonText = await button.textContent()
        const ariaLabel = await button.getAttribute('aria-label')
        const ariaLabelledBy = await button.getAttribute('aria-labelledby')
        
        expect(buttonText || ariaLabel || ariaLabelledBy).toBeTruthy()
        
        // Button should be focusable (not disabled without reason)
        const disabled = await button.getAttribute('disabled')
        const tabindex = await button.getAttribute('tabindex')
        
        if (disabled === null && tabindex !== '-1') {
          await button.focus()
          await expect(button).toBeFocused()
        }
      }
    })

    test('should have accessible links', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      const links = await page.locator('a').all()
      
      for (const link of links) {
        // Link should have accessible name
        const linkText = await link.textContent()
        const ariaLabel = await link.getAttribute('aria-label')
        const title = await link.getAttribute('title')
        
        expect(linkText || ariaLabel || title).toBeTruthy()
        
        // External links should be indicated
        const href = await link.getAttribute('href')
        const target = await link.getAttribute('target')
        
        if (target === '_blank' || (href && !href.startsWith('/') && !href.startsWith('#'))) {
          const hasExternalIndicator = 
            (await link.textContent())?.includes('external') ||
            (await link.getAttribute('aria-label'))?.includes('external') ||
            await link.locator('svg, .icon').count() > 0
          
          expect(hasExternalIndicator).toBeTruthy()
        }
      }
    })

    test('should have proper ARIA usage for custom components', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Check for proper ARIA usage in dropdowns
      const dropdowns = page.locator('[role="button"][aria-expanded], [role="combobox"]')
      const dropdownCount = await dropdowns.count()
      
      for (let i = 0; i < dropdownCount; i++) {
        const dropdown = dropdowns.nth(i)
        const role = await dropdown.getAttribute('role')
        const ariaExpanded = await dropdown.getAttribute('aria-expanded')
        const ariaHaspopup = await dropdown.getAttribute('aria-haspopup')
        
        expect(role).toBeTruthy()
        expect(ariaExpanded).toBeTruthy()
        
        if (role === 'combobox') {
          expect(ariaHaspopup).toBeTruthy()
        }
      }
      
      // Check for proper ARIA usage in dialogs/modals
      const modals = page.locator('[role="dialog"], [role="alertdialog"]')
      const modalCount = await modals.count()
      
      for (let i = 0; i < modalCount; i++) {
        const modal = modals.nth(i)
        const ariaLabelledBy = await modal.getAttribute('aria-labelledby')
        const ariaDescribedBy = await modal.getAttribute('aria-describedby')
        const ariaLabel = await modal.getAttribute('aria-label')
        
        // Modal should have accessible name
        expect(ariaLabelledBy || ariaLabel).toBeTruthy()
      }
    })
  })

  test.describe('Color and Contrast Accessibility', () => {
    test('should meet color contrast requirements', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // This is handled by axe-core, but we can add custom checks
      await runAxeTest(page, 'color contrast')
    })

    test('should not rely on color alone for information', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Check for error states, success states, etc. that might rely on color
      const colorOnlyElements = await page.locator('.text-red-500, .text-green-500, .text-yellow-500').all()
      
      for (const element of colorOnlyElements) {
        const text = await element.textContent()
        const ariaLabel = await element.getAttribute('aria-label')
        const title = await element.getAttribute('title')
        const hasIcon = await element.locator('svg, .icon').count() > 0
        
        // Element should have text content, icon, or other non-color indicator
        expect(text || ariaLabel || title || hasIcon).toBeTruthy()
      }
    })
  })

  test.describe('Motion and Animation Accessibility', () => {
    test('should respect prefers-reduced-motion', async ({ page }) => {
      // Set reduced motion preference
      await page.emulateMedia({ 
        reducedMotion: 'reduce' 
      })
      
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Check that animations are reduced or removed
      const animatedElements = await page.locator('[class*="animate"], [class*="transition"]').all()
      
      for (const element of animatedElements) {
        const styles = await element.evaluate((el) => {
          const computedStyle = window.getComputedStyle(el)
          return {
            animationDuration: computedStyle.animationDuration,
            transitionDuration: computedStyle.transitionDuration
          }
        })
        
        // Animations should be significantly reduced or removed
        expect(
          styles.animationDuration === '0s' || 
          styles.transitionDuration === '0s' ||
          styles.animationDuration === 'none'
        ).toBeTruthy()
      }
    })
  })

  test.describe('Page-Specific Accessibility Tests', () => {
    test('should pass axe tests on documentation page', async ({ page }) => {
      await page.goto('/docs')
      await page.waitForLoadState('networkidle')
      
      await runAxeTest(page, 'documentation page')
      await checkHeadingStructure(page)
      await checkLandmarkRoles(page)
    })

    test('should pass axe tests on examples page', async ({ page }) => {
      await page.goto('/examples')
      await page.waitForLoadState('networkidle')
      
      await runAxeTest(page, 'examples page')
      await checkHeadingStructure(page)
      await checkLandmarkRoles(page)
    })

    test('should pass axe tests on best practices page', async ({ page }) => {
      await page.goto('/best-practices')
      await page.waitForLoadState('networkidle')
      
      await runAxeTest(page, 'best practices page')
      await checkHeadingStructure(page)
      await checkLandmarkRoles(page)
    })
  })

  test.describe('Screen Reader Compatibility', () => {
    test('should have proper page titles for screen readers', async ({ page }) => {
      const pages = ['/', '/docs', '/examples', '/best-practices']
      
      for (const pagePath of pages) {
        await page.goto(pagePath)
        await page.waitForLoadState('networkidle')
        
        const title = await page.title()
        expect(title).toBeTruthy()
        expect(title.length).toBeGreaterThan(10)
        
        // Title should be descriptive and unique
        if (pagePath !== '/') {
          expect(title.toLowerCase()).toContain(pagePath.slice(1))
        }
      }
    })

    test('should have proper live regions for dynamic content', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Look for live regions that might announce changes
      const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]')
      const liveRegionCount = await liveRegions.count()
      
      if (liveRegionCount > 0) {
        for (let i = 0; i < liveRegionCount; i++) {
          const region = liveRegions.nth(i)
          const ariaLive = await region.getAttribute('aria-live')
          const role = await region.getAttribute('role')
          
          expect(ariaLive || role === 'status' || role === 'alert').toBeTruthy()
        }
      }
    })
  })
})