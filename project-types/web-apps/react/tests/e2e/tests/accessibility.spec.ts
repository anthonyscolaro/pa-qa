import { test, expect } from '../fixtures/auth';
import { AuthHelpers } from '../fixtures/auth';
import AxeBuilder from '@axe-core/playwright';

/**
 * PA-QA Accessibility Tests
 * 
 * Comprehensive accessibility testing including:
 * - WCAG 2.1 AA compliance
 * - Screen reader compatibility
 * - Keyboard navigation
 * - Color contrast validation
 * - Focus management
 * - ARIA implementation
 */

test.describe('Accessibility Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await AuthHelpers.setupAuthMocks(page);
  });

  test.afterEach(async ({ page }) => {
    await AuthHelpers.cleanup(page);
  });

  test.describe('WCAG 2.1 AA Compliance', () => {
    test('should pass axe accessibility scan on login page', async ({ page }) => {
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      await loginPage.goto();
      await loginPage.waitForPageLoad();

      // Run axe scan
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should pass axe accessibility scan on dashboard', async ({ authenticatedPage }) => {
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(authenticatedPage);
      await dashboardPage.goto();
      await dashboardPage.waitForPageLoad();

      const accessibilityScanResults = await new AxeBuilder({ page: authenticatedPage })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .exclude('.third-party-widget') // Exclude third-party components
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should pass accessibility scan with dynamic content', async ({ authenticatedPage }) => {
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(authenticatedPage);
      await dashboardPage.goto();

      // Interact with dynamic elements
      await dashboardPage.openNotifications();
      await dashboardPage.openUserMenu();

      const accessibilityScanResults = await new AxeBuilder({ page: authenticatedPage })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should validate form accessibility', async ({ page }) => {
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      await loginPage.goto();

      // Check form labels and associations
      await expect(loginPage.emailInput).toHaveAttribute('aria-label');
      await expect(loginPage.passwordInput).toHaveAttribute('aria-label');
      
      // Check required field indicators
      await expect(loginPage.emailInput).toHaveAttribute('required');
      await expect(loginPage.passwordInput).toHaveAttribute('required');
      
      // Check error message associations
      await loginPage.login('invalid-email', 'short');
      
      const emailErrorId = await loginPage.emailInput.getAttribute('aria-describedby');
      if (emailErrorId) {
        await expect(page.locator(`#${emailErrorId}`)).toBeVisible();
      }

      // Run axe scan on form with errors
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate login form with keyboard only', async ({ page }) => {
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      await loginPage.goto();

      // Test tab navigation
      await page.keyboard.press('Tab');
      await expect(loginPage.emailInput).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(loginPage.passwordInput).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(loginPage.rememberMeCheckbox).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(loginPage.loginButton).toBeFocused();

      // Test reverse tab navigation
      await page.keyboard.press('Shift+Tab');
      await expect(loginPage.rememberMeCheckbox).toBeFocused();

      // Test form submission with Enter
      await loginPage.emailInput.focus();
      await page.keyboard.type('test@example.com');
      await page.keyboard.press('Tab');
      await page.keyboard.type('password123');
      await page.keyboard.press('Enter');

      // Should attempt login
      await expect(page.locator('[data-testid="loading-spinner"], [data-testid="error-message"]')).toBeVisible();
    });

    test('should navigate dashboard with keyboard only', async ({ authenticatedPage }) => {
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(authenticatedPage);
      await dashboardPage.goto();

      // Test main navigation
      await authenticatedPage.keyboard.press('Tab');
      await authenticatedPage.keyboard.press('Tab');
      await authenticatedPage.keyboard.press('Tab');
      
      // Should reach first navigation item
      await expect(dashboardPage.dashboardNavItem).toBeFocused();

      // Test arrow key navigation within menu
      await authenticatedPage.keyboard.press('ArrowDown');
      await expect(dashboardPage.projectsNavItem).toBeFocused();

      await authenticatedPage.keyboard.press('ArrowDown');
      await expect(dashboardPage.usersNavItem).toBeFocused();

      await authenticatedPage.keyboard.press('ArrowUp');
      await expect(dashboardPage.projectsNavItem).toBeFocused();

      // Test Enter key activation
      await authenticatedPage.keyboard.press('Enter');
      await expect(authenticatedPage).toHaveURL(/.*projects/);
    });

    test('should handle modal keyboard navigation', async ({ authenticatedPage }) => {
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(authenticatedPage);
      await dashboardPage.goto();
      await dashboardPage.navigateToProjects();

      // Open modal
      await authenticatedPage.click('[data-testid="create-project-button"]');
      const modal = authenticatedPage.locator('[data-testid="create-project-modal"]');
      await expect(modal).toBeVisible();

      // Focus should be trapped in modal
      await authenticatedPage.keyboard.press('Tab');
      await expect(authenticatedPage.locator('[data-testid="project-name"]')).toBeFocused();

      // Tab through modal elements
      const modalElements = [
        '[data-testid="project-name"]',
        '[data-testid="project-description"]',
        '[data-testid="project-type"]',
        '[data-testid="create-project-submit"]',
        '[data-testid="cancel-button"]'
      ];

      for (let i = 0; i < modalElements.length; i++) {
        await expect(authenticatedPage.locator(modalElements[i])).toBeFocused();
        if (i < modalElements.length - 1) {
          await authenticatedPage.keyboard.press('Tab');
        }
      }

      // Test Escape key to close modal
      await authenticatedPage.keyboard.press('Escape');
      await expect(modal).toBeHidden();
    });

    test('should handle dropdown keyboard navigation', async ({ authenticatedPage }) => {
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(authenticatedPage);
      await dashboardPage.goto();

      // Open user menu with keyboard
      await dashboardPage.userAvatar.focus();
      await authenticatedPage.keyboard.press('Enter');
      await expect(dashboardPage.userMenu).toBeVisible();

      // Navigate dropdown with arrow keys
      await authenticatedPage.keyboard.press('ArrowDown');
      await expect(dashboardPage.profileButton).toBeFocused();

      await authenticatedPage.keyboard.press('ArrowDown');
      await expect(dashboardPage.settingsButton).toBeFocused();

      await authenticatedPage.keyboard.press('ArrowDown');
      await expect(dashboardPage.logoutButton).toBeFocused();

      // Test Home/End keys
      await authenticatedPage.keyboard.press('Home');
      await expect(dashboardPage.profileButton).toBeFocused();

      await authenticatedPage.keyboard.press('End');
      await expect(dashboardPage.logoutButton).toBeFocused();

      // Close with Escape
      await authenticatedPage.keyboard.press('Escape');
      await expect(dashboardPage.userMenu).toBeHidden();
    });
  });

  test.describe('Screen Reader Compatibility', () => {
    test('should have proper heading hierarchy', async ({ authenticatedPage }) => {
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(authenticatedPage);
      await dashboardPage.goto();

      // Check heading hierarchy
      const h1 = authenticatedPage.locator('h1');
      await expect(h1).toHaveCount(1);
      await expect(h1).toContainText('Dashboard');

      const h2Elements = authenticatedPage.locator('h2');
      const h2Count = await h2Elements.count();
      expect(h2Count).toBeGreaterThan(0);

      // Verify no heading level is skipped
      const allHeadings = authenticatedPage.locator('h1, h2, h3, h4, h5, h6');
      const headingLevels = await allHeadings.evaluateAll((headings) => {
        return headings.map(h => parseInt(h.tagName.substring(1)));
      });

      for (let i = 1; i < headingLevels.length; i++) {
        const diff = headingLevels[i] - headingLevels[i - 1];
        expect(diff).toBeLessThanOrEqual(1);
      }
    });

    test('should have descriptive link text', async ({ authenticatedPage }) => {
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(authenticatedPage);
      await dashboardPage.goto();

      const links = authenticatedPage.locator('a');
      const linkCount = await links.count();

      for (let i = 0; i < linkCount; i++) {
        const link = links.nth(i);
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        const title = await link.getAttribute('title');

        // Link should have descriptive text or aria-label
        const hasDescriptiveText = text && text.trim().length > 0 && !['click here', 'read more', 'more'].includes(text.toLowerCase());
        const hasAriaLabel = ariaLabel && ariaLabel.trim().length > 0;
        const hasTitle = title && title.trim().length > 0;

        expect(hasDescriptiveText || hasAriaLabel || hasTitle).toBe(true);
      }
    });

    test('should have proper form labels', async ({ page }) => {
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      await loginPage.goto();

      // Check form controls have labels
      const formControls = page.locator('input, select, textarea');
      const controlCount = await formControls.count();

      for (let i = 0; i < controlCount; i++) {
        const control = formControls.nth(i);
        const id = await control.getAttribute('id');
        const ariaLabel = await control.getAttribute('aria-label');
        const ariaLabelledBy = await control.getAttribute('aria-labelledby');

        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = await label.count() > 0;
          const hasAriaLabel = ariaLabel && ariaLabel.trim().length > 0;
          const hasAriaLabelledBy = ariaLabelledBy && ariaLabelledBy.trim().length > 0;

          expect(hasLabel || hasAriaLabel || hasAriaLabelledBy).toBe(true);
        }
      }
    });

    test('should announce dynamic content changes', async ({ authenticatedPage }) => {
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(authenticatedPage);
      await dashboardPage.goto();

      // Test live region for notifications
      await dashboardPage.openNotifications();
      
      const liveRegion = authenticatedPage.locator('[aria-live="polite"], [aria-live="assertive"]');
      await expect(liveRegion).toHaveCount.greaterThan(0);

      // Test status messages
      await dashboardPage.navigateToProjects();
      await authenticatedPage.click('[data-testid="create-project-button"]');
      await authenticatedPage.fill('[data-testid="project-name"]', 'Test Project');
      await authenticatedPage.click('[data-testid="create-project-submit"]');

      // Should have status message that's announced
      const statusMessage = authenticatedPage.locator('[role="status"], [aria-live]');
      await expect(statusMessage).toBeVisible();
    });
  });

  test.describe('Focus Management', () => {
    test('should maintain logical focus order', async ({ page }) => {
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      await loginPage.goto();

      const focusableElements = [
        loginPage.emailInput,
        loginPage.passwordInput,
        loginPage.rememberMeCheckbox,
        loginPage.showPasswordButton,
        loginPage.loginButton,
        loginPage.forgotPasswordLink,
        loginPage.signUpLink
      ];

      // Test tab order
      for (let i = 0; i < focusableElements.length; i++) {
        await page.keyboard.press('Tab');
        await expect(focusableElements[i]).toBeFocused();
      }
    });

    test('should handle focus on route changes', async ({ authenticatedPage }) => {
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(authenticatedPage);
      await dashboardPage.goto();

      // Navigate to different page
      await dashboardPage.navigateToProjects();
      
      // Focus should be on main heading or skip link
      const mainHeading = authenticatedPage.locator('h1');
      const skipLink = authenticatedPage.locator('[data-testid="skip-to-content"]');
      
      const h1Focused = await mainHeading.evaluate(el => el === document.activeElement);
      const skipLinkFocused = await skipLink.evaluate(el => el === document.activeElement);
      
      expect(h1Focused || skipLinkFocused).toBe(true);
    });

    test('should restore focus after modal closes', async ({ authenticatedPage }) => {
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(authenticatedPage);
      await dashboardPage.goto();
      await dashboardPage.navigateToProjects();

      // Focus on trigger element
      const createButton = authenticatedPage.locator('[data-testid="create-project-button"]');
      await createButton.focus();
      await createButton.click();

      // Modal opens
      const modal = authenticatedPage.locator('[data-testid="create-project-modal"]');
      await expect(modal).toBeVisible();

      // Close modal
      await authenticatedPage.keyboard.press('Escape');
      await expect(modal).toBeHidden();

      // Focus should return to trigger element
      await expect(createButton).toBeFocused();
    });

    test('should provide visible focus indicators', async ({ page }) => {
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      await loginPage.goto();

      // Test focus visibility on interactive elements
      const interactiveElements = [
        loginPage.emailInput,
        loginPage.passwordInput,
        loginPage.loginButton,
        loginPage.forgotPasswordLink
      ];

      for (const element of interactiveElements) {
        await element.focus();
        
        // Check for focus styles
        const outlineStyle = await element.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            outline: styles.outline,
            outlineColor: styles.outlineColor,
            outlineWidth: styles.outlineWidth,
            boxShadow: styles.boxShadow
          };
        });

        // Should have visible focus indicator
        const hasFocusIndicator = 
          outlineStyle.outline !== 'none' ||
          outlineStyle.outlineWidth !== '0px' ||
          outlineStyle.boxShadow !== 'none';

        expect(hasFocusIndicator).toBe(true);
      }
    });
  });

  test.describe('Color and Contrast', () => {
    test('should meet color contrast requirements', async ({ page }) => {
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      await loginPage.goto();

      // Run axe color contrast check
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['color-contrast'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should work without color alone', async ({ page }) => {
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      await loginPage.goto();

      // Try invalid login to show error
      await loginPage.login('invalid@example.com', 'wrongpassword');
      await loginPage.expectErrorMessage();

      // Error should be indicated by more than just color
      const errorMessage = loginPage.errorMessage;
      
      // Check for icons, text, or other visual indicators
      const errorIcon = errorMessage.locator('svg, .icon, [data-icon]');
      const errorText = await errorMessage.textContent();
      
      const hasIcon = await errorIcon.count() > 0;
      const hasErrorText = errorText && errorText.includes('error') || errorText.includes('invalid');
      
      expect(hasIcon || hasErrorText).toBe(true);
    });

    test('should work in high contrast mode', async ({ page }) => {
      // Enable high contrast mode
      await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
      
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      await loginPage.goto();

      // Elements should still be visible and functional
      await expect(loginPage.loginForm).toBeVisible();
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
      await expect(loginPage.loginButton).toBeVisible();

      // Test interaction
      await loginPage.fillEmail('test@example.com');
      await loginPage.fillPassword('password123');
      
      // Should still work in high contrast
      await expect(loginPage.emailInput).toHaveValue('test@example.com');
      await expect(loginPage.passwordInput).toHaveValue('password123');
    });
  });

  test.describe('Motion and Animation', () => {
    test('should respect reduced motion preferences', async ({ page }) => {
      // Enable reduced motion
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      await loginPage.goto();

      // Check that animations are disabled or reduced
      const animatedElements = page.locator('[data-testid*="animated"], .fade, .slide, .bounce');
      const count = await animatedElements.count();

      for (let i = 0; i < count; i++) {
        const element = animatedElements.nth(i);
        const animationDuration = await element.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return styles.animationDuration;
        });

        // Animation should be disabled or very short
        expect(animationDuration === '0s' || animationDuration === 'none').toBe(true);
      }
    });

    test('should not cause seizures with flashing content', async ({ page }) => {
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      await loginPage.goto();

      // Check for rapidly flashing content
      const flashingElements = page.locator('.blink, .flash, [data-testid*="flash"]');
      const count = await flashingElements.count();

      // Should have no rapidly flashing elements
      expect(count).toBe(0);
    });
  });

  test.describe('Language and Content', () => {
    test('should have proper language attributes', async ({ page }) => {
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      await loginPage.goto();

      // Check html lang attribute
      const htmlLang = await page.locator('html').getAttribute('lang');
      expect(htmlLang).toBeTruthy();
      expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // e.g., 'en' or 'en-US'

      // Check for content in different languages
      const foreignContent = page.locator('[lang]:not([lang=""], [lang="en"], [lang="en-US"])');
      const foreignCount = await foreignContent.count();

      for (let i = 0; i < foreignCount; i++) {
        const element = foreignContent.nth(i);
        const lang = await element.getAttribute('lang');
        expect(lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
      }
    });

    test('should have descriptive page titles', async ({ page }) => {
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      await loginPage.goto();

      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
      expect(title).not.toBe('Untitled');
      expect(title).toMatch(/login|sign in/i);
    });

    test('should have meaningful error messages', async ({ page }) => {
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      await loginPage.goto();

      // Test various error scenarios
      await loginPage.login('', '');
      let errorText = await loginPage.errorMessage.textContent();
      expect(errorText).toContain('required');

      await loginPage.login('invalid-email', 'password');
      errorText = await loginPage.errorMessage.textContent();
      expect(errorText).toContain('valid email');

      await loginPage.login('test@example.com', '123');
      errorText = await loginPage.errorMessage.textContent();
      expect(errorText).toMatch(/password.*length|too short/i);
    });
  });

  test.describe('Responsive Accessibility', () => {
    test('should maintain accessibility on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      await loginPage.goto();

      // Run accessibility scan on mobile
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);

      // Test touch targets are large enough (minimum 44px)
      const touchTargets = page.locator('button, a, input[type="checkbox"], input[type="radio"]');
      const count = await touchTargets.count();

      for (let i = 0; i < count; i++) {
        const target = touchTargets.nth(i);
        const box = await target.boundingBox();
        
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should maintain accessibility on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      await loginPage.goto();

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  test.describe('Performance and Accessibility', () => {
    test('should not impact performance significantly', async ({ page }) => {
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      
      const startTime = Date.now();
      await loginPage.goto();
      await loginPage.waitForPageLoad();
      const loadTime = Date.now() - startTime;

      // Page should load quickly even with accessibility features
      expect(loadTime).toBeLessThan(3000);

      // Check for excessive DOM nodes that might slow screen readers
      const elementCount = await page.locator('*').count();
      expect(elementCount).toBeLessThan(1000); // Reasonable limit
    });
  });
});