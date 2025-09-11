import { test, expect } from '../fixtures/auth';
import { testUsers, AuthHelpers } from '../fixtures/auth';

/**
 * PA-QA Complete User Journey Tests
 * 
 * Tests end-to-end user workflows including:
 * - Complete onboarding flow
 * - Multi-page navigation
 * - Data creation and management
 * - Complex user interactions
 * - Cross-feature integration
 */

test.describe('Complete User Journeys', () => {
  test.beforeEach(async ({ page }) => {
    await AuthHelpers.setupAuthMocks(page);
  });

  test.afterEach(async ({ page }) => {
    await AuthHelpers.cleanup(page);
  });

  test.describe('New User Onboarding Journey', () => {
    test('should complete full onboarding flow', async ({ page }) => {
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(page);

      // Step 1: First-time login
      await loginPage.goto();
      await loginPage.login(testUsers.user.email, testUsers.user.password);
      await loginPage.expectSuccessfulLogin();

      // Step 2: Welcome to dashboard
      await dashboardPage.expectDashboardLoaded();
      await dashboardPage.expectWelcomeWidget('Test User');
      await dashboardPage.takeScreenshot('onboarding-welcome');

      // Step 3: Profile setup
      await dashboardPage.goToProfile();
      await expect(page).toHaveURL(/.*profile/);
      
      // Fill out profile information
      await page.fill('[data-testid="first-name"]', 'Test');
      await page.fill('[data-testid="last-name"]', 'User');
      await page.fill('[data-testid="phone"]', '+1234567890');
      await page.selectOption('[data-testid="timezone"]', 'America/New_York');
      await page.click('[data-testid="save-profile"]');
      
      // Verify profile saved
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await page.screenshot({ path: 'test-results/onboarding-profile-complete.png' });

      // Step 4: Settings configuration
      await dashboardPage.goToSettings();
      await expect(page).toHaveURL(/.*settings/);
      
      // Configure notifications
      await page.check('[data-testid="email-notifications"]');
      await page.check('[data-testid="push-notifications"]');
      await page.selectOption('[data-testid="theme"]', 'light');
      await page.click('[data-testid="save-settings"]');
      
      // Verify settings saved
      await expect(page.locator('[data-testid="settings-saved"]')).toBeVisible();

      // Step 5: Create first project
      await dashboardPage.navigateToProjects();
      await expect(page).toHaveURL(/.*projects/);
      
      await page.click('[data-testid="create-project-button"]');
      await page.fill('[data-testid="project-name"]', 'My First Project');
      await page.fill('[data-testid="project-description"]', 'This is my first project for testing');
      await page.selectOption('[data-testid="project-type"]', 'web');
      await page.click('[data-testid="create-project-submit"]');
      
      // Verify project created
      await expect(page.locator('[data-testid="project-created-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="project-list"]')).toContainText('My First Project');

      // Step 6: Complete onboarding tour
      await dashboardPage.goto();
      await page.click('[data-testid="start-tour"]');
      
      // Go through tour steps
      for (let i = 0; i < 5; i++) {
        await expect(page.locator('[data-testid="tour-step"]')).toBeVisible();
        await page.click('[data-testid="tour-next"]');
      }
      
      await page.click('[data-testid="tour-complete"]');
      await expect(page.locator('[data-testid="tour-completed"]')).toBeVisible();
      
      // Final screenshot
      await dashboardPage.takeScreenshot('onboarding-complete');
    });

    test('should handle onboarding interruption and resume', async ({ page }) => {
      const loginPage = new (await import('../pages/LoginPage')).LoginPage(page);
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(page);

      // Start onboarding
      await loginPage.goto();
      await loginPage.login(testUsers.user.email, testUsers.user.password);
      await dashboardPage.expectDashboardLoaded();

      // Interrupt onboarding by navigating away
      await dashboardPage.navigateToProjects();
      
      // Return to dashboard - should resume onboarding
      await dashboardPage.goto();
      await expect(page.locator('[data-testid="resume-onboarding"]')).toBeVisible();
      
      await page.click('[data-testid="resume-onboarding"]');
      await expect(page.locator('[data-testid="onboarding-step"]')).toBeVisible();
    });
  });

  test.describe('Project Management Journey', () => {
    test('should complete full project lifecycle', async ({ authenticatedPage }) => {
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(authenticatedPage);

      // Navigate to projects
      await dashboardPage.goto();
      await dashboardPage.navigateToProjects();

      // Create new project
      await authenticatedPage.click('[data-testid="create-project-button"]');
      await authenticatedPage.fill('[data-testid="project-name"]', 'E2E Test Project');
      await authenticatedPage.fill('[data-testid="project-description"]', 'Project for end-to-end testing');
      await authenticatedPage.selectOption('[data-testid="project-type"]', 'web');
      await authenticatedPage.click('[data-testid="create-project-submit"]');

      // Verify project created and navigate to project details
      await expect(authenticatedPage.locator('[data-testid="project-list"]')).toContainText('E2E Test Project');
      await authenticatedPage.click('[data-testid="project-item"]:has-text("E2E Test Project")');
      await expect(authenticatedPage).toHaveURL(/.*projects\/.*\/details/);

      // Add team members
      await authenticatedPage.click('[data-testid="add-team-member"]');
      await authenticatedPage.fill('[data-testid="member-email"]', 'teammate@example.com');
      await authenticatedPage.selectOption('[data-testid="member-role"]', 'developer');
      await authenticatedPage.click('[data-testid="send-invitation"]');
      
      await expect(authenticatedPage.locator('[data-testid="team-members"]')).toContainText('teammate@example.com');

      // Create tasks
      await authenticatedPage.click('[data-testid="tasks-tab"]');
      for (let i = 1; i <= 3; i++) {
        await authenticatedPage.click('[data-testid="create-task"]');
        await authenticatedPage.fill('[data-testid="task-title"]', `Task ${i}`);
        await authenticatedPage.fill('[data-testid="task-description"]', `Description for task ${i}`);
        await authenticatedPage.selectOption('[data-testid="task-priority"]', i === 1 ? 'high' : 'medium');
        await authenticatedPage.click('[data-testid="save-task"]');
      }

      // Verify tasks created
      await expect(authenticatedPage.locator('[data-testid="task-list"] [data-testid="task-item"]')).toHaveCount(3);

      // Update task status
      await authenticatedPage.click('[data-testid="task-item"]:first-child [data-testid="task-status"]');
      await authenticatedPage.selectOption('[data-testid="status-select"]', 'in-progress');
      await expect(authenticatedPage.locator('[data-testid="task-item"]:first-child')).toContainText('In Progress');

      // Upload files
      await authenticatedPage.click('[data-testid="files-tab"]');
      await authenticatedPage.setInputFiles('[data-testid="file-upload"]', 'tests/fixtures/sample-document.pdf');
      await expect(authenticatedPage.locator('[data-testid="file-list"]')).toContainText('sample-document.pdf');

      // Add comments
      await authenticatedPage.click('[data-testid="comments-tab"]');
      await authenticatedPage.fill('[data-testid="comment-input"]', 'This is a test comment for the project');
      await authenticatedPage.click('[data-testid="post-comment"]');
      
      await expect(authenticatedPage.locator('[data-testid="comment-list"]')).toContainText('This is a test comment');

      // Generate reports
      await authenticatedPage.click('[data-testid="reports-tab"]');
      await authenticatedPage.click('[data-testid="generate-report"]');
      await authenticatedPage.selectOption('[data-testid="report-type"]', 'progress');
      await authenticatedPage.click('[data-testid="generate-report-submit"]');
      
      await expect(authenticatedPage.locator('[data-testid="report-generated"]')).toBeVisible();

      // Archive project
      await authenticatedPage.click('[data-testid="project-settings"]');
      await authenticatedPage.click('[data-testid="archive-project"]');
      await authenticatedPage.click('[data-testid="confirm-archive"]');
      
      await expect(authenticatedPage.locator('[data-testid="project-archived"]')).toBeVisible();
      await expect(authenticatedPage).toHaveURL(/.*projects/);

      // Verify project appears in archived list
      await authenticatedPage.click('[data-testid="archived-projects-tab"]');
      await expect(authenticatedPage.locator('[data-testid="archived-project-list"]')).toContainText('E2E Test Project');
    });

    test('should handle collaborative editing', async ({ browser }) => {
      // Create two browser contexts to simulate different users
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      // Setup both pages
      await AuthHelpers.setupAuthMocks(page1);
      await AuthHelpers.setupAuthMocks(page2);

      // Login as different users
      await AuthHelpers.loginAs(page1, 'user');
      await AuthHelpers.loginAs(page2, 'admin');

      // Both users navigate to the same project
      const projectUrl = '/projects/test-project/edit';
      await page1.goto(projectUrl);
      await page2.goto(projectUrl);

      // User 1 starts editing
      await page1.click('[data-testid="edit-project-name"]');
      await page1.fill('[data-testid="project-name-input"]', 'Collaborative Project');

      // User 2 should see the edit indicator
      await expect(page2.locator('[data-testid="editing-indicator"]')).toContainText('Test User is editing');

      // User 1 saves changes
      await page1.click('[data-testid="save-project"]');

      // User 2 should see the updated content
      await expect(page2.locator('[data-testid="project-name"]')).toContainText('Collaborative Project');

      // Cleanup
      await context1.close();
      await context2.close();
    });
  });

  test.describe('E-commerce Journey', () => {
    test('should complete purchase flow', async ({ authenticatedPage }) => {
      // Navigate to shop
      await authenticatedPage.goto('/shop');
      
      // Browse products
      await authenticatedPage.click('[data-testid="product-category-electronics"]');
      await expect(authenticatedPage.locator('[data-testid="product-grid"]')).toBeVisible();

      // Search for specific product
      await authenticatedPage.fill('[data-testid="product-search"]', 'laptop');
      await authenticatedPage.keyboard.press('Enter');
      await expect(authenticatedPage.locator('[data-testid="search-results"]')).toContainText('laptop');

      // View product details
      await authenticatedPage.click('[data-testid="product-item"]:first-child');
      await expect(authenticatedPage.locator('[data-testid="product-details"]')).toBeVisible();

      // Add to cart
      await authenticatedPage.selectOption('[data-testid="product-variant"]', 'silver-16gb');
      await authenticatedPage.click('[data-testid="add-to-cart"]');
      await expect(authenticatedPage.locator('[data-testid="cart-notification"]')).toContainText('Added to cart');

      // Continue shopping
      await authenticatedPage.click('[data-testid="continue-shopping"]');
      await authenticatedPage.click('[data-testid="product-category-accessories"]');
      await authenticatedPage.click('[data-testid="product-item"]:has-text("Mouse")');
      await authenticatedPage.click('[data-testid="add-to-cart"]');

      // View cart
      await authenticatedPage.click('[data-testid="cart-icon"]');
      await expect(authenticatedPage.locator('[data-testid="cart-items"]')).toHaveCount(2);

      // Update quantities
      await authenticatedPage.fill('[data-testid="quantity-input"]:first-child', '2');
      await authenticatedPage.click('[data-testid="update-cart"]');

      // Remove item
      await authenticatedPage.click('[data-testid="remove-item"]:last-child');
      await expect(authenticatedPage.locator('[data-testid="cart-items"]')).toHaveCount(1);

      // Proceed to checkout
      await authenticatedPage.click('[data-testid="checkout-button"]');
      await expect(authenticatedPage).toHaveURL(/.*checkout/);

      // Fill shipping information
      await authenticatedPage.fill('[data-testid="shipping-address"]', '123 Test Street');
      await authenticatedPage.fill('[data-testid="shipping-city"]', 'Test City');
      await authenticatedPage.selectOption('[data-testid="shipping-state"]', 'CA');
      await authenticatedPage.fill('[data-testid="shipping-zip"]', '12345');

      // Select shipping method
      await authenticatedPage.click('[data-testid="shipping-method-standard"]');

      // Fill payment information
      await authenticatedPage.fill('[data-testid="card-number"]', '4111111111111111');
      await authenticatedPage.fill('[data-testid="card-expiry"]', '12/25');
      await authenticatedPage.fill('[data-testid="card-cvc"]', '123');
      await authenticatedPage.fill('[data-testid="cardholder-name"]', 'Test User');

      // Apply coupon
      await authenticatedPage.fill('[data-testid="coupon-code"]', 'TESTDISCOUNT');
      await authenticatedPage.click('[data-testid="apply-coupon"]');
      await expect(authenticatedPage.locator('[data-testid="discount-applied"]')).toBeVisible();

      // Review order
      await expect(authenticatedPage.locator('[data-testid="order-summary"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="total-amount"]')).toContainText('$');

      // Complete purchase
      await authenticatedPage.click('[data-testid="place-order"]');
      await expect(authenticatedPage.locator('[data-testid="order-confirmation"]')).toBeVisible();
      
      // Get order number
      const orderNumber = await authenticatedPage.locator('[data-testid="order-number"]').textContent();
      expect(orderNumber).toMatch(/ORD-\d+/);

      // Verify email confirmation sent
      await expect(authenticatedPage.locator('[data-testid="email-confirmation"]')).toContainText('confirmation email');
    });

    test('should handle abandoned cart recovery', async ({ authenticatedPage }) => {
      // Add items to cart
      await authenticatedPage.goto('/shop');
      await authenticatedPage.click('[data-testid="product-item"]:first-child');
      await authenticatedPage.click('[data-testid="add-to-cart"]');
      
      // Start checkout but abandon
      await authenticatedPage.click('[data-testid="cart-icon"]');
      await authenticatedPage.click('[data-testid="checkout-button"]');
      await authenticatedPage.fill('[data-testid="email"]', testUsers.user.email);
      
      // Leave the page (simulate abandonment)
      await authenticatedPage.goto('/dashboard');
      
      // Return later and check for cart recovery
      await authenticatedPage.goto('/shop');
      await expect(authenticatedPage.locator('[data-testid="cart-recovery-banner"]')).toBeVisible();
      
      await authenticatedPage.click('[data-testid="return-to-cart"]');
      await expect(authenticatedPage.locator('[data-testid="cart-items"]')).toHaveCount(1);
    });
  });

  test.describe('Data Management Journey', () => {
    test('should complete data import and export workflow', async ({ authenticatedPage }) => {
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(authenticatedPage);
      
      await dashboardPage.goto();
      await dashboardPage.navigateToReports();

      // Import data
      await authenticatedPage.click('[data-testid="import-data"]');
      await authenticatedPage.selectOption('[data-testid="import-type"]', 'csv');
      await authenticatedPage.setInputFiles('[data-testid="file-input"]', 'tests/fixtures/sample-data.csv');
      
      // Map columns
      await authenticatedPage.selectOption('[data-testid="column-mapping-name"]', 'full_name');
      await authenticatedPage.selectOption('[data-testid="column-mapping-email"]', 'email_address');
      await authenticatedPage.click('[data-testid="start-import"]');
      
      // Wait for import completion
      await expect(authenticatedPage.locator('[data-testid="import-progress"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="import-complete"]')).toBeVisible({ timeout: 30000 });
      
      // Verify imported data
      await authenticatedPage.click('[data-testid="view-imported-data"]');
      await expect(authenticatedPage.locator('[data-testid="data-table"] tbody tr')).toHaveCount.greaterThan(0);

      // Filter and search data
      await authenticatedPage.fill('[data-testid="search-filter"]', 'john');
      await expect(authenticatedPage.locator('[data-testid="filtered-results"]')).toContainText('john');

      // Export filtered data
      await authenticatedPage.click('[data-testid="export-filtered"]');
      await authenticatedPage.selectOption('[data-testid="export-format"]', 'xlsx');
      await authenticatedPage.click('[data-testid="start-export"]');
      
      // Wait for download
      const downloadPromise = authenticatedPage.waitForEvent('download');
      await authenticatedPage.click('[data-testid="download-export"]');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toMatch(/.*\.xlsx$/);
    });

    test('should handle data validation and error correction', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/data/validation');
      
      // Upload file with errors
      await authenticatedPage.setInputFiles('[data-testid="validation-file"]', 'tests/fixtures/invalid-data.csv');
      await authenticatedPage.click('[data-testid="validate-data"]');
      
      // Review validation errors
      await expect(authenticatedPage.locator('[data-testid="validation-errors"]')).toBeVisible();
      await expect(authenticatedPage.locator('[data-testid="error-count"]')).toContainText('5 errors found');
      
      // Correct errors one by one
      await authenticatedPage.click('[data-testid="error-row-1"]');
      await authenticatedPage.fill('[data-testid="correction-input"]', 'corrected@example.com');
      await authenticatedPage.click('[data-testid="apply-correction"]');
      
      // Use bulk correction for similar errors
      await authenticatedPage.click('[data-testid="select-similar-errors"]');
      await authenticatedPage.click('[data-testid="bulk-correct"]');
      await authenticatedPage.selectOption('[data-testid="correction-rule"]', 'format-phone-numbers');
      await authenticatedPage.click('[data-testid="apply-bulk-correction"]');
      
      // Re-validate
      await authenticatedPage.click('[data-testid="re-validate"]');
      await expect(authenticatedPage.locator('[data-testid="validation-success"]')).toBeVisible();
      
      // Proceed with clean data
      await authenticatedPage.click('[data-testid="proceed-with-data"]');
      await expect(authenticatedPage.locator('[data-testid="data-processing-complete"]')).toBeVisible();
    });
  });

  test.describe('Multi-Platform Journey', () => {
    test('should maintain consistency across devices', async ({ browser }) => {
      // Desktop experience
      const desktopContext = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
      });
      const desktopPage = await desktopContext.newPage();
      
      await AuthHelpers.setupAuthMocks(desktopPage);
      await AuthHelpers.loginAs(desktopPage, 'user');
      
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(desktopPage);
      await dashboardPage.goto();
      
      // Create some data on desktop
      await dashboardPage.navigateToProjects();
      await desktopPage.click('[data-testid="create-project-button"]');
      await desktopPage.fill('[data-testid="project-name"]', 'Cross-Platform Project');
      await desktopPage.click('[data-testid="create-project-submit"]');
      
      // Mobile experience
      const mobileContext = await browser.newContext({
        ...browser.devices()['iPhone 12']
      });
      const mobilePage = await mobileContext.newPage();
      
      await AuthHelpers.setupAuthMocks(mobilePage);
      await AuthHelpers.loginAs(mobilePage, 'user');
      
      const mobileDashboard = new (await import('../pages/DashboardPage')).DashboardPage(mobilePage);
      await mobileDashboard.goto();
      
      // Verify data synchronization
      await mobileDashboard.navigateToProjects();
      await expect(mobilePage.locator('[data-testid="project-list"]')).toContainText('Cross-Platform Project');
      
      // Test mobile-specific interactions
      await mobilePage.click('[data-testid="mobile-menu-toggle"]');
      await expect(mobilePage.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Cleanup
      await desktopContext.close();
      await mobileContext.close();
    });
  });

  test.describe('Error Recovery Journey', () => {
    test('should recover from network failures gracefully', async ({ authenticatedPage }) => {
      const dashboardPage = new (await import('../pages/DashboardPage')).DashboardPage(authenticatedPage);
      
      await dashboardPage.goto();
      
      // Start a data-heavy operation
      await dashboardPage.navigateToReports();
      await authenticatedPage.click('[data-testid="generate-large-report"]');
      
      // Simulate network failure mid-operation
      await AuthHelpers.setupNetworkConditions(authenticatedPage, 'offline');
      
      // Should show offline indicator
      await expect(authenticatedPage.locator('[data-testid="offline-indicator"]')).toBeVisible();
      
      // Restore network
      await AuthHelpers.setupNetworkConditions(authenticatedPage, 'slow');
      await authenticatedPage.unroute('**/api/**');
      
      // Should auto-retry and complete
      await expect(authenticatedPage.locator('[data-testid="report-complete"]')).toBeVisible({ timeout: 30000 });
    });
  });
});