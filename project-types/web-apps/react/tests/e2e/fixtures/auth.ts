import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

/**
 * PA-QA Authentication Fixtures
 * 
 * Provides reusable authentication states and user scenarios
 * Includes API mocking for consistent testing
 */

// Test user data
export const testUsers = {
  admin: {
    email: 'admin@example.com',
    password: 'AdminPass123!',
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'admin']
  },
  user: {
    email: 'user@example.com',
    password: 'UserPass123!',
    role: 'user',
    permissions: ['read', 'write']
  },
  viewer: {
    email: 'viewer@example.com',
    password: 'ViewerPass123!',
    role: 'viewer',
    permissions: ['read']
  },
  inactive: {
    email: 'inactive@example.com',
    password: 'InactivePass123!',
    role: 'user',
    status: 'inactive'
  }
};

// API response mocks
export const authApiMocks = {
  loginSuccess: {
    success: true,
    token: 'mock-jwt-token-12345',
    user: {
      id: 1,
      email: 'user@example.com',
      name: 'Test User',
      role: 'user',
      avatar: 'https://example.com/avatar.jpg'
    },
    permissions: ['read', 'write']
  },
  loginError: {
    success: false,
    error: 'Invalid credentials',
    message: 'Email or password is incorrect'
  },
  tokenRefresh: {
    success: true,
    token: 'mock-refreshed-jwt-token-67890',
    expiresIn: 3600
  },
  userProfile: {
    id: 1,
    email: 'user@example.com',
    name: 'Test User',
    role: 'user',
    avatar: 'https://example.com/avatar.jpg',
    preferences: {
      theme: 'light',
      notifications: true
    }
  }
};

// Storage state paths
export const storageStates = {
  admin: 'tests/e2e/.auth/admin.json',
  user: 'tests/e2e/.auth/user.json',
  viewer: 'tests/e2e/.auth/viewer.json'
};

/**
 * Extended test type with authentication fixtures
 */
type AuthFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  authenticatedPage: Page;
  adminPage: Page;
  viewerPage: Page;
};

export const test = base.extend<AuthFixtures>({
  // Login page fixture
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  // Dashboard page fixture
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },

  // Authenticated user page (regular user)
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: storageStates.user
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // Admin user page
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: storageStates.admin
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // Viewer user page
  viewerPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: storageStates.viewer
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  }
});

export { expect } from '@playwright/test';

/**
 * Authentication helper functions
 */
export class AuthHelpers {
  /**
   * Mock authentication API endpoints
   */
  static async setupAuthMocks(page: Page): Promise<void> {
    // Mock login endpoint
    await page.route('**/api/auth/login', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData.email === testUsers.user.email && postData.password === testUsers.user.password) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(authApiMocks.loginSuccess)
        });
      } else if (postData.email === testUsers.inactive.email) {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Account inactive',
            message: 'Your account has been deactivated. Please contact support.'
          })
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify(authApiMocks.loginError)
        });
      }
    });

    // Mock token refresh endpoint
    await page.route('**/api/auth/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(authApiMocks.tokenRefresh)
      });
    });

    // Mock user profile endpoint
    await page.route('**/api/user/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(authApiMocks.userProfile)
      });
    });

    // Mock logout endpoint
    await page.route('**/api/auth/logout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Logged out successfully' })
      });
    });

    // Mock OAuth endpoints
    await page.route('**/api/auth/google', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...authApiMocks.loginSuccess,
          user: {
            ...authApiMocks.loginSuccess.user,
            email: 'google.user@example.com',
            provider: 'google'
          }
        })
      });
    });
  }

  /**
   * Perform login and save storage state
   */
  static async loginAndSaveState(
    page: Page,
    userType: keyof typeof testUsers,
    storageStatePath: string
  ): Promise<void> {
    const user = testUsers[userType];
    const loginPage = new LoginPage(page);

    // Setup mocks
    await this.setupAuthMocks(page);

    // Perform login
    await loginPage.goto();
    await loginPage.login(user.email, user.password);
    await loginPage.expectSuccessfulLogin();

    // Save storage state
    await page.context().storageState({ path: storageStatePath });
  }

  /**
   * Login with specific user type
   */
  static async loginAs(page: Page, userType: keyof typeof testUsers): Promise<void> {
    const user = testUsers[userType];
    const loginPage = new LoginPage(page);

    await this.setupAuthMocks(page);
    await loginPage.goto();
    await loginPage.login(user.email, user.password);
    await loginPage.expectSuccessfulLogin();
  }

  /**
   * Mock network conditions for authentication
   */
  static async setupNetworkConditions(page: Page, condition: 'slow' | 'offline' | 'unstable'): Promise<void> {
    switch (condition) {
      case 'slow':
        // Simulate slow network
        await page.route('**/api/**', async (route) => {
          await new Promise(resolve => setTimeout(resolve, 2000));
          await route.continue();
        });
        break;

      case 'offline':
        // Simulate offline condition
        await page.route('**/api/**', async (route) => {
          await route.abort('failed');
        });
        break;

      case 'unstable':
        // Simulate unstable network (50% failure rate)
        await page.route('**/api/**', async (route) => {
          if (Math.random() > 0.5) {
            await route.abort('failed');
          } else {
            await route.continue();
          }
        });
        break;
    }
  }

  /**
   * Validate JWT token structure
   */
  static validateJwtToken(token: string): boolean {
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }

  /**
   * Mock session expiration
   */
  static async mockSessionExpiration(page: Page): Promise<void> {
    await page.route('**/api/**', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Token expired',
          message: 'Your session has expired. Please log in again.'
        })
      });
    });
  }

  /**
   * Setup role-based access control mocks
   */
  static async setupRBACMocks(page: Page, userRole: string): Promise<void> {
    await page.route('**/api/admin/**', async (route) => {
      if (userRole === 'admin') {
        await route.continue();
      } else {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Insufficient permissions',
            message: 'You do not have permission to access this resource.'
          })
        });
      }
    });

    await page.route('**/api/users/**', async (route) => {
      if (['admin', 'user'].includes(userRole)) {
        await route.continue();
      } else {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Insufficient permissions',
            message: 'You do not have permission to access this resource.'
          })
        });
      }
    });
  }

  /**
   * Cleanup authentication state
   */
  static async cleanup(page: Page): Promise<void> {
    // Clear all routes
    await page.unroute('**/api/**');
    
    // Clear storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Clear cookies
    await page.context().clearCookies();
  }
}