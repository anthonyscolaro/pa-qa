import { Page, Locator, expect } from '@playwright/test';

/**
 * PA-QA Dashboard Page Object
 * 
 * Handles all dashboard-related interactions and validations
 * Includes navigation, widgets, and user interactions
 */
export class DashboardPage {
  readonly page: Page;
  readonly header: Locator;
  readonly navigation: Locator;
  readonly sidebar: Locator;
  readonly mainContent: Locator;
  readonly userMenu: Locator;
  readonly userAvatar: Locator;
  readonly logoutButton: Locator;
  readonly settingsButton: Locator;
  readonly profileButton: Locator;
  readonly searchBox: Locator;
  readonly notificationsBell: Locator;
  readonly notificationsDropdown: Locator;
  readonly breadcrumbs: Locator;
  readonly loadingSpinner: Locator;
  readonly mobileMenuToggle: Locator;
  
  // Dashboard widgets
  readonly dashboardGrid: Locator;
  readonly welcomeWidget: Locator;
  readonly statsWidget: Locator;
  readonly chartWidget: Locator;
  readonly recentActivityWidget: Locator;
  readonly quickActionsWidget: Locator;
  
  // Navigation menu items
  readonly dashboardNavItem: Locator;
  readonly projectsNavItem: Locator;
  readonly usersNavItem: Locator;
  readonly settingsNavItem: Locator;
  readonly reportsNavItem: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Layout elements
    this.header = page.locator('[data-testid="dashboard-header"]');
    this.navigation = page.locator('[data-testid="main-navigation"]');
    this.sidebar = page.locator('[data-testid="sidebar"]');
    this.mainContent = page.locator('[data-testid="main-content"]');
    this.breadcrumbs = page.locator('[data-testid="breadcrumbs"]');
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    this.mobileMenuToggle = page.locator('[data-testid="mobile-menu-toggle"]');
    
    // User interface elements
    this.userMenu = page.locator('[data-testid="user-menu"]');
    this.userAvatar = page.locator('[data-testid="user-avatar"]');
    this.logoutButton = page.locator('[data-testid="logout-button"]');
    this.settingsButton = page.locator('[data-testid="settings-button"]');
    this.profileButton = page.locator('[data-testid="profile-button"]');
    this.searchBox = page.locator('[data-testid="search-box"]');
    this.notificationsBell = page.locator('[data-testid="notifications-bell"]');
    this.notificationsDropdown = page.locator('[data-testid="notifications-dropdown"]');
    
    // Dashboard widgets
    this.dashboardGrid = page.locator('[data-testid="dashboard-grid"]');
    this.welcomeWidget = page.locator('[data-testid="welcome-widget"]');
    this.statsWidget = page.locator('[data-testid="stats-widget"]');
    this.chartWidget = page.locator('[data-testid="chart-widget"]');
    this.recentActivityWidget = page.locator('[data-testid="recent-activity-widget"]');
    this.quickActionsWidget = page.locator('[data-testid="quick-actions-widget"]');
    
    // Navigation items
    this.dashboardNavItem = page.locator('[data-testid="nav-dashboard"]');
    this.projectsNavItem = page.locator('[data-testid="nav-projects"]');
    this.usersNavItem = page.locator('[data-testid="nav-users"]');
    this.settingsNavItem = page.locator('[data-testid="nav-settings"]');
    this.reportsNavItem = page.locator('[data-testid="nav-reports"]');
  }

  /**
   * Navigate to the dashboard page
   */
  async goto(): Promise<void> {
    await this.page.goto('/dashboard');
    await this.waitForPageLoad();
  }

  /**
   * Wait for dashboard to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await this.header.waitFor({ state: 'visible' });
    await this.mainContent.waitFor({ state: 'visible' });
    await this.dashboardGrid.waitFor({ state: 'visible' });
    
    // Wait for any loading spinners to disappear
    try {
      await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 5000 });
    } catch {
      // Loading spinner might not be present
    }
  }

  /**
   * Open user menu dropdown
   */
  async openUserMenu(): Promise<void> {
    await this.userAvatar.click();
    await this.userMenu.waitFor({ state: 'visible' });
  }

  /**
   * Close user menu dropdown
   */
  async closeUserMenu(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.userMenu.waitFor({ state: 'hidden' });
  }

  /**
   * Logout from the application
   */
  async logout(): Promise<void> {
    await this.openUserMenu();
    await this.logoutButton.click();
    await this.page.waitForURL('**/login');
  }

  /**
   * Navigate to profile page
   */
  async goToProfile(): Promise<void> {
    await this.openUserMenu();
    await this.profileButton.click();
    await this.page.waitForURL('**/profile');
  }

  /**
   * Navigate to settings page
   */
  async goToSettings(): Promise<void> {
    await this.openUserMenu();
    await this.settingsButton.click();
    await this.page.waitForURL('**/settings');
  }

  /**
   * Open notifications dropdown
   */
  async openNotifications(): Promise<void> {
    await this.notificationsBell.click();
    await this.notificationsDropdown.waitFor({ state: 'visible' });
  }

  /**
   * Search using the search box
   */
  async search(query: string): Promise<void> {
    await this.searchBox.fill(query);
    await this.page.keyboard.press('Enter');
    
    // Wait for search results to load
    await this.page.waitForTimeout(1000);
  }

  /**
   * Navigate using sidebar navigation
   */
  async navigateToProjects(): Promise<void> {
    await this.projectsNavItem.click();
    await this.page.waitForURL('**/projects');
  }

  async navigateToUsers(): Promise<void> {
    await this.usersNavItem.click();
    await this.page.waitForURL('**/users');
  }

  async navigateToReports(): Promise<void> {
    await this.reportsNavItem.click();
    await this.page.waitForURL('**/reports');
  }

  /**
   * Toggle mobile menu on smaller screens
   */
  async toggleMobileMenu(): Promise<void> {
    await this.mobileMenuToggle.click();
    
    // Check if sidebar is now visible/hidden
    const sidebarVisible = await this.sidebar.isVisible();
    if (sidebarVisible) {
      await this.sidebar.waitFor({ state: 'visible' });
    } else {
      await this.sidebar.waitFor({ state: 'hidden' });
    }
  }

  /**
   * Validate dashboard is loaded and accessible
   */
  async expectDashboardLoaded(): Promise<void> {
    await expect(this.header).toBeVisible();
    await expect(this.navigation).toBeVisible();
    await expect(this.mainContent).toBeVisible();
    await expect(this.dashboardGrid).toBeVisible();
    
    // Check that user is authenticated
    await expect(this.userAvatar).toBeVisible();
  }

  /**
   * Validate welcome widget displays user information
   */
  async expectWelcomeWidget(userName?: string): Promise<void> {
    await expect(this.welcomeWidget).toBeVisible();
    
    if (userName) {
      await expect(this.welcomeWidget).toContainText(userName);
    }
  }

  /**
   * Validate statistics widget shows data
   */
  async expectStatsWidget(): Promise<void> {
    await expect(this.statsWidget).toBeVisible();
    
    // Check for numeric values in stats
    const statsText = await this.statsWidget.textContent();
    expect(statsText).toMatch(/\d+/); // Should contain numbers
  }

  /**
   * Validate chart widget is rendering
   */
  async expectChartWidget(): Promise<void> {
    await expect(this.chartWidget).toBeVisible();
    
    // Check for chart elements (SVG, canvas, or chart library elements)
    const chartElements = this.chartWidget.locator('svg, canvas, .chart');
    await expect(chartElements.first()).toBeVisible();
  }

  /**
   * Validate recent activity shows entries
   */
  async expectRecentActivity(): Promise<void> {
    await expect(this.recentActivityWidget).toBeVisible();
    
    // Check for activity items
    const activityItems = this.recentActivityWidget.locator('[data-testid="activity-item"]');
    await expect(activityItems.first()).toBeVisible();
  }

  /**
   * Validate breadcrumb navigation
   */
  async expectBreadcrumbs(expectedPath: string[]): Promise<void> {
    await expect(this.breadcrumbs).toBeVisible();
    
    for (const pathItem of expectedPath) {
      await expect(this.breadcrumbs).toContainText(pathItem);
    }
  }

  /**
   * Check notification count
   */
  async getNotificationCount(): Promise<number> {
    const badge = this.notificationsBell.locator('.notification-badge');
    
    if (await badge.isVisible()) {
      const count = await badge.textContent();
      return parseInt(count || '0');
    }
    
    return 0;
  }

  /**
   * Validate notification functionality
   */
  async expectNotificationsWorking(): Promise<void> {
    await this.openNotifications();
    await expect(this.notificationsDropdown).toBeVisible();
    
    // Check for notification items or empty state
    const hasNotifications = await this.notificationsDropdown.locator('[data-testid="notification-item"]').count();
    const emptyState = this.notificationsDropdown.locator('[data-testid="no-notifications"]');
    
    if (hasNotifications > 0) {
      await expect(this.notificationsDropdown.locator('[data-testid="notification-item"]').first()).toBeVisible();
    } else {
      await expect(emptyState).toBeVisible();
    }
  }

  /**
   * Test search functionality
   */
  async testSearchFunctionality(): Promise<void> {
    const searchTerm = 'test';
    await this.search(searchTerm);
    
    // Validate search was performed (URL change or results shown)
    await expect(this.page).toHaveURL(new RegExp(`.*search.*${searchTerm}.*`));
  }

  /**
   * Take screenshot for visual regression testing
   */
  async takeScreenshot(name: string): Promise<void> {
    await expect(this.page).toHaveScreenshot(`dashboard-${name}.png`);
  }

  /**
   * Check accessibility compliance
   */
  async checkAccessibility(): Promise<void> {
    // Test keyboard navigation
    await this.testKeyboardNavigation();
    
    // Check ARIA attributes
    await expect(this.navigation).toHaveAttribute('role', 'navigation');
    await expect(this.mainContent).toHaveAttribute('role', 'main');
    
    // Check heading hierarchy
    const headings = this.page.locator('h1, h2, h3, h4, h5, h6');
    const h1Count = await headings.locator('h1').count();
    expect(h1Count).toBe(1); // Should have exactly one h1
  }

  /**
   * Test keyboard navigation through dashboard
   */
  async testKeyboardNavigation(): Promise<void> {
    // Test tab navigation through main elements
    await this.page.keyboard.press('Tab');
    
    // Should be able to navigate to search box
    await this.searchBox.focus();
    await expect(this.searchBox).toBeFocused();
    
    // Navigate to user menu
    await this.userAvatar.focus();
    await expect(this.userAvatar).toBeFocused();
    
    // Test arrow key navigation in menus
    await this.openUserMenu();
    await this.page.keyboard.press('ArrowDown');
    await this.page.keyboard.press('ArrowUp');
  }

  /**
   * Test responsive design at different breakpoints
   */
  async testResponsiveDesign(): Promise<void> {
    // Mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 });
    await expect(this.mobileMenuToggle).toBeVisible();
    await this.takeScreenshot('mobile');
    
    // Tablet viewport
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await expect(this.sidebar).toBeVisible();
    await this.takeScreenshot('tablet');
    
    // Desktop viewport
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    await expect(this.sidebar).toBeVisible();
    await expect(this.dashboardGrid).toBeVisible();
    await this.takeScreenshot('desktop');
  }

  /**
   * Test widget interactions
   */
  async testWidgetInteractions(): Promise<void> {
    // Test if widgets are interactive
    const widgets = [
      this.statsWidget,
      this.chartWidget,
      this.recentActivityWidget,
      this.quickActionsWidget
    ];
    
    for (const widget of widgets) {
      if (await widget.isVisible()) {
        // Check if widget has hover effects
        await widget.hover();
        
        // Check if widget is clickable
        const clickableElements = widget.locator('button, a, [role="button"]');
        const clickableCount = await clickableElements.count();
        
        if (clickableCount > 0) {
          await expect(clickableElements.first()).toBeVisible();
        }
      }
    }
  }

  /**
   * Validate page performance metrics
   */
  async checkPerformanceMetrics(): Promise<void> {
    // Measure page load time
    const startTime = Date.now();
    await this.waitForPageLoad();
    const loadTime = Date.now() - startTime;
    
    // Dashboard should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check for performance-related attributes
    const lazyImages = this.page.locator('img[loading="lazy"]');
    const lazyImageCount = await lazyImages.count();
    
    // Should have some lazy loading implemented for performance
    if (lazyImageCount > 0) {
      console.log(`Found ${lazyImageCount} lazy-loaded images`);
    }
  }
}