import { test, expect } from '../fixtures/auth';
import { testUsers, AuthHelpers } from '../fixtures/auth';

/**
 * PA-QA Authentication Flow Tests
 * 
 * Tests all authentication scenarios including:
 * - Login/logout flows
 * - OAuth authentication
 * - Session management
 * - Error handling
 * - Security validations
 */

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authentication mocks for all tests
    await AuthHelpers.setupAuthMocks(page);
  });

  test.afterEach(async ({ page }) => {
    // Cleanup after each test
    await AuthHelpers.cleanup(page);
  });

  test.describe('Login Flow', () => {
    test('should login successfully with valid credentials', async ({ loginPage, dashboardPage }) => {
      await loginPage.goto();
      
      // Verify login page is accessible
      await loginPage.expectLoginFormVisible();
      await loginPage.takeScreenshot('login-form');
      
      // Perform login
      await loginPage.login(testUsers.user.email, testUsers.user.password);
      
      // Verify successful login
      await loginPage.expectSuccessfulLogin();
      await dashboardPage.expectDashboardLoaded();
      
      // Take screenshot of dashboard
      await dashboardPage.takeScreenshot('successful-login');
    });

    test('should show error with invalid credentials', async ({ loginPage }) => {
      await loginPage.goto();
      
      // Attempt login with invalid credentials
      await loginPage.login('invalid@example.com', 'wrongpassword');
      
      // Verify error is displayed
      await loginPage.expectErrorMessage('Email or password is incorrect');
      
      // Ensure user remains on login page
      await expect(loginPage.page).toHaveURL(/.*login/);
      
      // Take screenshot of error state
      await loginPage.takeScreenshot('login-error');
    });

    test('should handle inactive account', async ({ loginPage }) => {
      await loginPage.goto();
      
      // Attempt login with inactive account
      await loginPage.login(testUsers.inactive.email, testUsers.inactive.password);
      
      // Verify appropriate error message
      await loginPage.expectErrorMessage('Your account has been deactivated');
      
      // Take screenshot of inactive account error
      await loginPage.takeScreenshot('inactive-account-error');
    });

    test('should validate required fields', async ({ loginPage }) => {
      await loginPage.goto();
      
      // Test form validation
      await loginPage.expectFormValidation();
      
      // Test individual field validation
      await loginPage.fillEmail('invalid-email');
      await loginPage.clickLoginButton();
      
      // Should show email format error
      const emailInput = loginPage.emailInput;
      await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });

    test('should toggle password visibility', async ({ loginPage }) => {
      await loginPage.goto();
      
      await loginPage.fillPassword('testpassword123');
      
      // Initially password should be hidden
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
      
      // Toggle visibility
      await loginPage.togglePasswordVisibility();
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');
      
      // Toggle back
      await loginPage.togglePasswordVisibility();
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    });

    test('should handle remember me functionality', async ({ loginPage }) => {
      await loginPage.goto();
      
      // Login with remember me checked
      await loginPage.fillEmail(testUsers.user.email);
      await loginPage.fillPassword(testUsers.user.password);
      await loginPage.toggleRememberMe();
      await loginPage.clickLoginButton();
      
      await loginPage.expectSuccessfulLogin();
      
      // Verify remember me checkbox was checked
      // This would typically persist login state longer
      await expect(loginPage.rememberMeCheckbox).toBeChecked();
    });

    test('should handle slow network conditions', async ({ loginPage, page }) => {
      await AuthHelpers.setupNetworkConditions(page, 'slow');
      await loginPage.goto();
      
      // Start login process
      await loginPage.login(testUsers.user.email, testUsers.user.password);
      
      // Should show loading state
      const isLoading = await loginPage.isLoading();
      expect(isLoading).toBe(true);
      
      // Eventually should complete
      await loginPage.expectSuccessfulLogin();
    });
  });

  test.describe('OAuth Authentication', () => {
    test('should login with Google OAuth', async ({ loginPage }) => {
      await loginPage.goto();
      
      // Mock OAuth popup
      await loginPage.page.evaluate(() => {
        window.open = () => {
          // Simulate successful OAuth
          window.postMessage({ type: 'oauth_success', provider: 'google' }, '*');
          return null;
        };
      });
      
      await loginPage.loginWithGoogle();
      await loginPage.expectSuccessfulLogin();
    });

    test('should handle OAuth errors', async ({ loginPage }) => {
      await loginPage.goto();
      
      // Mock OAuth failure
      await loginPage.page.evaluate(() => {
        window.open = () => {
          window.postMessage({ type: 'oauth_error', error: 'access_denied' }, '*');
          return null;
        };
      });
      
      await loginPage.loginWithGoogle();
      await loginPage.expectErrorMessage('OAuth authentication failed');
    });
  });

  test.describe('Session Management', () => {
    test('should logout successfully', async ({ authenticatedPage }) => {
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(authenticatedPage);
      
      await dashboardPage.goto();
      await dashboardPage.expectDashboardLoaded();
      
      // Perform logout
      await dashboardPage.logout();
      
      // Should redirect to login page
      await expect(authenticatedPage).toHaveURL(/.*login/);
    });

    test('should handle session expiration', async ({ authenticatedPage }) => {
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(authenticatedPage);
      
      await dashboardPage.goto();
      await dashboardPage.expectDashboardLoaded();
      
      // Mock session expiration
      await AuthHelpers.mockSessionExpiration(authenticatedPage);
      
      // Try to navigate or make API call
      await dashboardPage.navigateToProjects();
      
      // Should be redirected to login due to expired session
      await expect(authenticatedPage).toHaveURL(/.*login/);
    });

    test('should refresh token automatically', async ({ page }) => {
      // Setup token refresh scenario
      let tokenRefreshCalled = false;
      
      await page.route('**/api/auth/refresh', async (route) => {
        tokenRefreshCalled = true;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            token: 'new-refreshed-token',
            expiresIn: 3600
          })
        });
      });
      
      // Mock API call that triggers token refresh
      await page.route('**/api/dashboard', async (route) => {
        if (!tokenRefreshCalled) {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Token expired' })
          });
        } else {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: 'dashboard data' })
          });
        }
      });
      
      // Login and navigate
      await AuthHelpers.loginAs(page, 'user');
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(page);
      await dashboardPage.goto();
      
      // Verify token was refreshed
      expect(tokenRefreshCalled).toBe(true);
    });
  });

  test.describe('Security Validations', () => {
    test('should prevent CSRF attacks', async ({ loginPage }) => {
      await loginPage.goto();
      
      // Attempt to submit form without proper CSRF token
      await loginPage.page.evaluate(() => {
        const form = document.querySelector('[data-testid="login-form"]') as HTMLFormElement;
        if (form) {
          // Remove CSRF token if present
          const csrfToken = form.querySelector('input[name="_token"]') as HTMLInputElement;
          if (csrfToken) {
            csrfToken.remove();
          }
        }
      });
      
      await loginPage.login(testUsers.user.email, testUsers.user.password);
      
      // Should show security error
      await loginPage.expectErrorMessage('Security validation failed');
    });

    test('should handle rate limiting', async ({ loginPage }) => {
      await loginPage.goto();
      
      // Mock rate limiting after multiple attempts
      let attemptCount = 0;
      await loginPage.page.route('**/api/auth/login', async (route) => {
        attemptCount++;
        if (attemptCount > 3) {
          await route.fulfill({
            status: 429,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: 'Too many requests',
              message: 'Too many login attempts. Please try again later.',
              retryAfter: 300
            })
          });
        } else {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: 'Invalid credentials'
            })
          });
        }
      });
      
      // Make multiple failed login attempts
      for (let i = 0; i < 4; i++) {
        await loginPage.login('invalid@example.com', 'wrongpassword');
        await loginPage.page.waitForTimeout(500);
      }
      
      // Should show rate limiting message
      await loginPage.expectErrorMessage('Too many login attempts');
    });

    test('should validate JWT token structure', async ({ page }) => {
      await AuthHelpers.loginAs(page, 'user');
      
      // Get token from localStorage or API response
      const token = await page.evaluate(() => {
        return localStorage.getItem('authToken') || '';
      });
      
      // Validate JWT structure
      expect(AuthHelpers.validateJwtToken(token)).toBe(true);
    });

    test('should handle malformed responses', async ({ loginPage }) => {
      await loginPage.goto();
      
      // Mock malformed API response
      await loginPage.page.route('**/api/auth/login', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json response'
        });
      });
      
      await loginPage.login(testUsers.user.email, testUsers.user.password);
      
      // Should handle parsing error gracefully
      await loginPage.expectErrorMessage('An unexpected error occurred');
    });
  });

  test.describe('Accessibility Compliance', () => {
    test('should meet accessibility standards', async ({ loginPage }) => {
      await loginPage.goto();
      
      // Test accessibility features
      await loginPage.checkAccessibility();
      
      // Test screen reader compatibility
      await expect(loginPage.emailInput).toHaveAttribute('aria-label');
      await expect(loginPage.passwordInput).toHaveAttribute('aria-label');
      await expect(loginPage.loginButton).toHaveAttribute('aria-describedby');
    });

    test('should support keyboard navigation', async ({ loginPage }) => {
      await loginPage.goto();
      
      // Test full keyboard navigation flow
      await loginPage.testKeyboardNavigation();
      
      // Test escape key functionality
      await loginPage.fillEmail('test@example.com');
      await loginPage.page.keyboard.press('Escape');
      
      // Form should still be accessible
      await loginPage.expectLoginFormVisible();
    });

    test('should work with high contrast mode', async ({ loginPage }) => {
      await loginPage.goto();
      
      // Enable high contrast mode
      await loginPage.page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
      
      await loginPage.expectLoginFormVisible();
      await loginPage.takeScreenshot('high-contrast');
    });
  });

  test.describe('Visual Regression', () => {
    test('should match login page visual snapshot', async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.takeScreenshot('baseline');
    });

    test('should match error state visual snapshot', async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login('invalid@example.com', 'wrongpassword');
      await loginPage.takeScreenshot('error-state');
    });

    test('should match loading state visual snapshot', async ({ loginPage, page }) => {
      await AuthHelpers.setupNetworkConditions(page, 'slow');
      await loginPage.goto();
      
      // Start login to capture loading state
      await loginPage.fillEmail(testUsers.user.email);
      await loginPage.fillPassword(testUsers.user.password);
      await loginPage.loginButton.click();
      
      // Wait for loading spinner
      await loginPage.loadingSpinner.waitFor({ state: 'visible' });
      await loginPage.takeScreenshot('loading-state');
    });
  });

  test.describe('Performance', () => {
    test('should login within performance budget', async ({ loginPage }) => {
      await loginPage.goto();
      
      const startTime = Date.now();
      await loginPage.login(testUsers.user.email, testUsers.user.password);
      await loginPage.expectSuccessfulLogin();
      const endTime = Date.now();
      
      const loginTime = endTime - startTime;
      expect(loginTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle concurrent login attempts', async ({ browser }) => {
      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext()
      ]);
      
      const pages = await Promise.all(contexts.map(ctx => ctx.newPage()));
      
      // Setup mocks for all pages
      await Promise.all(pages.map(page => AuthHelpers.setupAuthMocks(page)));
      
      // Perform concurrent logins
      const loginPromises = pages.map(async (page) => {
        const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
        await loginPage.goto();
        await loginPage.login(testUsers.user.email, testUsers.user.password);
        await loginPage.expectSuccessfulLogin();
      });
      
      await Promise.all(loginPromises);
      
      // Cleanup
      await Promise.all(contexts.map(ctx => ctx.close()));
    });
  });
});