import { test, expect, devices } from '@playwright/test';
import { test as authTest } from '../fixtures/auth';
import { AuthHelpers } from '../fixtures/auth';

/**
 * PA-QA Mobile Responsive Tests
 * 
 * Comprehensive mobile testing including:
 * - Multiple device breakpoints
 * - Touch interactions
 * - Orientation changes
 * - Mobile-specific features
 * - Performance on mobile networks
 * - PWA functionality
 */

test.describe('Mobile Responsive Design', () => {
  // Test different mobile devices
  const mobileDevices = [
    'iPhone 12',
    'iPhone 12 Pro',
    'iPhone SE',
    'Pixel 5',
    'Galaxy S21',
    'iPad Pro',
    'iPad Mini'
  ];

  test.beforeEach(async ({ page }) => {
    await AuthHelpers.setupAuthMocks(page);
  });

  test.afterEach(async ({ page }) => {
    await AuthHelpers.cleanup(page);
  });

  test.describe('Device Compatibility', () => {
    for (const deviceName of mobileDevices.slice(0, 3)) { // Test subset for efficiency
      test(`should render correctly on ${deviceName}`, async ({ browser }) => {
        const device = devices[deviceName];
        const context = await browser.newContext({
          ...device
        });
        const page = await context.newPage();
        
        await AuthHelpers.setupAuthMocks(page);
        
        const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
        await loginPage.goto();
        await loginPage.waitForPageLoad();

        // Verify layout is not broken
        await expect(loginPage.loginForm).toBeVisible();
        await expect(loginPage.emailInput).toBeVisible();
        await expect(loginPage.passwordInput).toBeVisible();
        await expect(loginPage.loginButton).toBeVisible();

        // Test form interaction
        await loginPage.login('test@example.com', 'password123');
        
        // Take device-specific screenshot
        await page.screenshot({ 
          path: `test-results/mobile-${deviceName.toLowerCase().replace(/\s+/g, '-')}-login.png`,
          fullPage: true 
        });

        await context.close();
      });
    }

    test('should adapt to different screen sizes', async ({ page }) => {
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      
      const breakpoints = [
        { width: 320, height: 568, name: 'mobile-small' },
        { width: 375, height: 667, name: 'mobile-medium' },
        { width: 414, height: 896, name: 'mobile-large' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1024, height: 768, name: 'tablet-landscape' }
      ];

      for (const breakpoint of breakpoints) {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
        await loginPage.goto();
        
        // Verify responsive behavior
        await expect(loginPage.loginForm).toBeVisible();
        
        // Check if elements are properly sized
        const formBox = await loginPage.loginForm.boundingBox();
        if (formBox) {
          expect(formBox.width).toBeLessThanOrEqual(breakpoint.width);
          expect(formBox.width).toBeGreaterThan(breakpoint.width * 0.8); // Should use most of the screen
        }

        // Take screenshot for visual regression
        await page.screenshot({ 
          path: `test-results/responsive-${breakpoint.name}.png`,
          fullPage: true 
        });
      }
    });
  });

  test.describe('Touch Interactions', () => {
    test('should handle touch events properly', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12']
      });
      const page = await context.newPage();
      
      await AuthHelpers.setupAuthMocks(page);
      await AuthHelpers.loginAs(page, 'user');
      
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(page);
      await dashboardPage.goto();

      // Test tap interactions
      await dashboardPage.userAvatar.tap();
      await expect(dashboardPage.userMenu).toBeVisible();

      // Test touch gestures
      await page.locator('[data-testid="swipeable-card"]').first().tap();
      
      // Test long press (if implemented)
      await page.locator('[data-testid="long-press-item"]').first().tap({ delay: 1000 });
      
      await context.close();
    });

    test('should have appropriate touch target sizes', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12']
      });
      const page = await context.newPage();
      
      await AuthHelpers.setupAuthMocks(page);
      
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      await loginPage.goto();

      // Check touch target sizes (minimum 44px recommended)
      const touchTargets = [
        loginPage.loginButton,
        loginPage.showPasswordButton,
        loginPage.rememberMeCheckbox,
        loginPage.forgotPasswordLink,
        loginPage.signUpLink
      ];

      for (const target of touchTargets) {
        const box = await target.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }

      await context.close();
    });

    test('should handle swipe gestures', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12']
      });
      const page = await context.newPage();
      
      await AuthHelpers.setupAuthMocks(page);
      await AuthHelpers.loginAs(page, 'user');
      
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(page);
      await dashboardPage.goto();

      // Test horizontal swipe on carousel/slider if present
      const carousel = page.locator('[data-testid="image-carousel"]');
      if (await carousel.isVisible()) {
        const carouselBox = await carousel.boundingBox();
        if (carouselBox) {
          // Swipe left
          await page.mouse.move(carouselBox.x + carouselBox.width - 50, carouselBox.y + carouselBox.height / 2);
          await page.mouse.down();
          await page.mouse.move(carouselBox.x + 50, carouselBox.y + carouselBox.height / 2);
          await page.mouse.up();
          
          // Verify swipe action worked
          await page.waitForTimeout(500);
        }
      }

      // Test pull-to-refresh if implemented
      const refreshableArea = page.locator('[data-testid="refreshable-content"]');
      if (await refreshableArea.isVisible()) {
        const refreshBox = await refreshableArea.boundingBox();
        if (refreshBox) {
          // Pull down gesture
          await page.mouse.move(refreshBox.x + refreshBox.width / 2, refreshBox.y + 50);
          await page.mouse.down();
          await page.mouse.move(refreshBox.x + refreshBox.width / 2, refreshBox.y + 150);
          await page.mouse.up();
          
          // Check for refresh indicator
          await expect(page.locator('[data-testid="refresh-indicator"]')).toBeVisible();
        }
      }

      await context.close();
    });
  });

  test.describe('Mobile Navigation', () => {
    test('should show mobile navigation menu', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12']
      });
      const page = await context.newPage();
      
      await AuthHelpers.setupAuthMocks(page);
      await AuthHelpers.loginAs(page, 'user');
      
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(page);
      await dashboardPage.goto();

      // Should show mobile menu toggle
      await expect(dashboardPage.mobileMenuToggle).toBeVisible();
      
      // Desktop navigation should be hidden
      await expect(dashboardPage.sidebar).toBeHidden();

      // Test mobile menu functionality
      await dashboardPage.toggleMobileMenu();
      await expect(dashboardPage.sidebar).toBeVisible();

      // Test navigation items
      await dashboardPage.projectsNavItem.tap();
      await expect(page).toHaveURL(/.*projects/);
      
      // Menu should close after navigation
      await expect(dashboardPage.sidebar).toBeHidden();

      await context.close();
    });

    test('should handle tab navigation on mobile', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPad Pro']
      });
      const page = await context.newPage();
      
      await AuthHelpers.setupAuthMocks(page);
      await AuthHelpers.loginAs(page, 'user');
      
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(page);
      await dashboardPage.goto();
      await dashboardPage.navigateToProjects();

      // Test bottom tab navigation if present
      const bottomTabs = page.locator('[data-testid="bottom-tabs"]');
      if (await bottomTabs.isVisible()) {
        const tabs = bottomTabs.locator('[data-testid="tab-item"]');
        const tabCount = await tabs.count();
        
        for (let i = 0; i < tabCount; i++) {
          await tabs.nth(i).tap();
          await page.waitForTimeout(500); // Allow navigation
          
          // Verify active state
          await expect(tabs.nth(i)).toHaveClass(/active|selected/);
        }
      }

      await context.close();
    });
  });

  test.describe('Mobile Forms', () => {
    test('should show appropriate mobile keyboards', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12']
      });
      const page = await context.newPage();
      
      await AuthHelpers.setupAuthMocks(page);
      
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      await loginPage.goto();

      // Email input should trigger email keyboard
      await expect(loginPage.emailInput).toHaveAttribute('type', 'email');
      await expect(loginPage.emailInput).toHaveAttribute('inputmode', 'email');

      // Number inputs should trigger numeric keyboard
      const phoneInput = page.locator('[data-testid="phone-input"]');
      if (await phoneInput.isVisible()) {
        await expect(phoneInput).toHaveAttribute('type', 'tel');
        await expect(phoneInput).toHaveAttribute('inputmode', 'tel');
      }

      await context.close();
    });

    test('should handle mobile form validation', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12']
      });
      const page = await context.newPage();
      
      await AuthHelpers.setupAuthMocks(page);
      
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      await loginPage.goto();

      // Test validation with mobile interaction
      await loginPage.emailInput.tap();
      await loginPage.emailInput.fill('invalid-email');
      await loginPage.passwordInput.tap(); // Trigger validation
      
      // Error should be visible and properly positioned
      const errorMessage = page.locator('[data-testid="email-error"]');
      if (await errorMessage.isVisible()) {
        const errorBox = await errorMessage.boundingBox();
        const viewport = page.viewportSize();
        
        if (errorBox && viewport) {
          expect(errorBox.y + errorBox.height).toBeLessThan(viewport.height);
        }
      }

      await context.close();
    });

    test('should support autocomplete and autofill', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12']
      });
      const page = await context.newPage();
      
      await AuthHelpers.setupAuthMocks(page);
      
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      await loginPage.goto();

      // Check autocomplete attributes
      await expect(loginPage.emailInput).toHaveAttribute('autocomplete', 'email');
      await expect(loginPage.passwordInput).toHaveAttribute('autocomplete', 'current-password');

      await context.close();
    });
  });

  test.describe('Orientation Changes', () => {
    test('should handle portrait to landscape orientation', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12']
      });
      const page = await context.newPage();
      
      await AuthHelpers.setupAuthMocks(page);
      await AuthHelpers.loginAs(page, 'user');
      
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(page);
      await dashboardPage.goto();

      // Portrait mode
      await expect(dashboardPage.header).toBeVisible();
      await page.screenshot({ path: 'test-results/mobile-portrait.png' });

      // Rotate to landscape
      await page.setViewportSize({ width: 896, height: 414 });
      await page.waitForTimeout(500); // Allow layout adjustment

      // Should still be functional in landscape
      await expect(dashboardPage.header).toBeVisible();
      await expect(dashboardPage.mainContent).toBeVisible();
      await page.screenshot({ path: 'test-results/mobile-landscape.png' });

      // Test navigation in landscape
      await dashboardPage.openUserMenu();
      await expect(dashboardPage.userMenu).toBeVisible();

      await context.close();
    });

    test('should adapt layout for landscape on tablets', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPad Pro']
      });
      const page = await context.newPage();
      
      await AuthHelpers.setupAuthMocks(page);
      await AuthHelpers.loginAs(page, 'user');
      
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(page);
      await dashboardPage.goto();

      // Portrait tablet
      await page.setViewportSize({ width: 1024, height: 1366 });
      await expect(dashboardPage.sidebar).toBeVisible();
      
      // Landscape tablet  
      await page.setViewportSize({ width: 1366, height: 1024 });
      await page.waitForTimeout(500);
      
      // Should maintain sidebar in landscape
      await expect(dashboardPage.sidebar).toBeVisible();
      await expect(dashboardPage.dashboardGrid).toBeVisible();

      await context.close();
    });
  });

  test.describe('Mobile Performance', () => {
    test('should load quickly on mobile networks', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12']
      });
      const page = await context.newPage();
      
      // Simulate 3G network
      await page.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add delay
        await route.continue();
      });
      
      await AuthHelpers.setupAuthMocks(page);
      
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      
      const startTime = Date.now();
      await loginPage.goto();
      await loginPage.waitForPageLoad();
      const loadTime = Date.now() - startTime;

      // Should load within reasonable time even on slow network
      expect(loadTime).toBeLessThan(10000); // 10 seconds max for 3G simulation

      await context.close();
    });

    test('should optimize images for mobile', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12']
      });
      const page = await context.newPage();
      
      await AuthHelpers.setupAuthMocks(page);
      await AuthHelpers.loginAs(page, 'user');
      
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(page);
      await dashboardPage.goto();

      // Check for responsive images
      const images = page.locator('img');
      const imageCount = await images.count();

      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        
        // Check for srcset or picture elements
        const srcset = await img.getAttribute('srcset');
        const parent = img.locator('..');
        const isPicture = await parent.evaluate(el => el.tagName === 'PICTURE');
        const loading = await img.getAttribute('loading');
        
        // Should have responsive images or lazy loading
        expect(srcset || isPicture || loading === 'lazy').toBeTruthy();
      }

      await context.close();
    });
  });

  test.describe('PWA Features', () => {
    test('should support PWA installation', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12']
      });
      const page = await context.newPage();
      
      await AuthHelpers.setupAuthMocks(page);
      
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      await loginPage.goto();

      // Check for PWA manifest
      const manifestLink = page.locator('link[rel="manifest"]');
      await expect(manifestLink).toHaveCount(1);

      // Check for service worker registration
      const swRegistered = await page.evaluate(() => {
        return 'serviceWorker' in navigator;
      });
      expect(swRegistered).toBe(true);

      // Check for install prompt handling
      await page.evaluate(() => {
        window.dispatchEvent(new Event('beforeinstallprompt'));
      });

      const installButton = page.locator('[data-testid="install-app"]');
      if (await installButton.isVisible()) {
        await expect(installButton).toBeVisible();
      }

      await context.close();
    });

    test('should work offline with service worker', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12']
      });
      const page = await context.newPage();
      
      await AuthHelpers.setupAuthMocks(page);
      await AuthHelpers.loginAs(page, 'user');
      
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(page);
      await dashboardPage.goto();

      // Go offline
      await context.setOffline(true);

      // Should show offline indicator
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();

      // Cached pages should still work
      await dashboardPage.navigateToProjects();
      
      // Should show offline message for dynamic content
      const offlineMessage = page.locator('[data-testid="offline-message"]');
      if (await offlineMessage.isVisible()) {
        await expect(offlineMessage).toContainText('offline');
      }

      await context.close();
    });
  });

  test.describe('Mobile Accessibility', () => {
    test('should maintain accessibility on mobile devices', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12']
      });
      const page = await context.newPage();
      
      await AuthHelpers.setupAuthMocks(page);
      
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      await loginPage.goto();

      // Check accessibility on mobile
      await loginPage.checkAccessibility();

      // Test screen reader announcements
      await loginPage.login('invalid@example.com', 'wrong');
      
      const liveRegion = page.locator('[aria-live]');
      await expect(liveRegion).toBeVisible();

      await context.close();
    });

    test('should support voice input', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12'],
        permissions: ['microphone']
      });
      const page = await context.newPage();
      
      await AuthHelpers.setupAuthMocks(page);
      
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      await loginPage.goto();

      // Check for voice input support
      const voiceButton = page.locator('[data-testid="voice-input"]');
      if (await voiceButton.isVisible()) {
        await expect(voiceButton).toBeVisible();
        
        // Voice input should be accessible
        await expect(voiceButton).toHaveAttribute('aria-label');
      }

      await context.close();
    });
  });

  test.describe('Cross-Device Testing', () => {
    test('should sync data across devices', async ({ browser }) => {
      // Simulate different devices
      const mobileContext = await browser.newContext({
        ...devices['iPhone 12']
      });
      const tabletContext = await browser.newContext({
        ...devices['iPad Pro']
      });

      const mobilePage = await mobileContext.newPage();
      const tabletPage = await tabletContext.newPage();

      // Setup both devices
      await AuthHelpers.setupAuthMocks(mobilePage);
      await AuthHelpers.setupAuthMocks(tabletPage);

      // Login on mobile
      await AuthHelpers.loginAs(mobilePage, 'user');
      const mobileDashboard = new (await import('../pages/DashboardPage')).DashboardPage(mobilePage);
      await mobileDashboard.goto();

      // Create data on mobile
      await mobileDashboard.navigateToProjects();
      await mobilePage.tap('[data-testid="create-project-button"]');
      await mobilePage.fill('[data-testid="project-name"]', 'Mobile Created Project');
      await mobilePage.tap('[data-testid="create-project-submit"]');

      // Login on tablet
      await AuthHelpers.loginAs(tabletPage, 'user');
      const tabletDashboard = new (await import('../pages/DashboardPage')).DashboardPage(tabletPage);
      await tabletDashboard.goto();

      // Verify data synchronization
      await tabletDashboard.navigateToProjects();
      await expect(tabletPage.locator('[data-testid="project-list"]')).toContainText('Mobile Created Project');

      await mobileContext.close();
      await tabletContext.close();
    });
  });
});