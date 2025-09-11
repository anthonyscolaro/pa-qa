import { Page, Locator, expect } from '@playwright/test';

/**
 * PA-QA Login Page Object
 * 
 * Handles all login-related interactions and validations
 * Includes accessibility checks and visual regression testing
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signUpLink: Locator;
  readonly errorMessage: Locator;
  readonly loadingSpinner: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly showPasswordButton: Locator;
  readonly loginForm: Locator;
  readonly socialLoginButtons: Locator;
  readonly googleLoginButton: Locator;
  readonly facebookLoginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Form elements
    this.loginForm = page.locator('[data-testid="login-form"]');
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
    this.rememberMeCheckbox = page.locator('[data-testid="remember-me-checkbox"]');
    this.showPasswordButton = page.locator('[data-testid="show-password-button"]');
    
    // Navigation links
    this.forgotPasswordLink = page.locator('[data-testid="forgot-password-link"]');
    this.signUpLink = page.locator('[data-testid="signup-link"]');
    
    // Feedback elements
    this.errorMessage = page.locator('[data-testid="error-message"]');
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"]');
    
    // Social login
    this.socialLoginButtons = page.locator('[data-testid="social-login-buttons"]');
    this.googleLoginButton = page.locator('[data-testid="google-login-button"]');
    this.facebookLoginButton = page.locator('[data-testid="facebook-login-button"]');
  }

  /**
   * Navigate to the login page
   */
  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await this.loginForm.waitFor({ state: 'visible' });
    await this.emailInput.waitFor({ state: 'visible' });
    await this.passwordInput.waitFor({ state: 'visible' });
    await this.loginButton.waitFor({ state: 'visible' });
  }

  /**
   * Perform login with email and password
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLoginButton();
  }

  /**
   * Fill email input with validation
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.clear();
    await this.emailInput.fill(email);
    
    // Validate email format
    if (email.includes('@')) {
      await expect(this.emailInput).toHaveValue(email);
    }
  }

  /**
   * Fill password input
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.clear();
    await this.passwordInput.fill(password);
    await expect(this.passwordInput).toHaveValue(password);
  }

  /**
   * Click login button and handle loading state
   */
  async clickLoginButton(): Promise<void> {
    await this.loginButton.click();
    
    // Wait for either success redirect or error message
    await Promise.race([
      this.page.waitForURL('**/dashboard', { timeout: 5000 }),
      this.errorMessage.waitFor({ state: 'visible', timeout: 5000 }),
      this.loadingSpinner.waitFor({ state: 'visible', timeout: 1000 })
    ]);
  }

  /**
   * Toggle remember me checkbox
   */
  async toggleRememberMe(): Promise<void> {
    await this.rememberMeCheckbox.click();
  }

  /**
   * Click show/hide password button
   */
  async togglePasswordVisibility(): Promise<void> {
    await this.showPasswordButton.click();
  }

  /**
   * Click forgot password link
   */
  async clickForgotPassword(): Promise<void> {
    await this.forgotPasswordLink.click();
    await this.page.waitForURL('**/forgot-password');
  }

  /**
   * Click sign up link
   */
  async clickSignUp(): Promise<void> {
    await this.signUpLink.click();
    await this.page.waitForURL('**/signup');
  }

  /**
   * Login with Google OAuth
   */
  async loginWithGoogle(): Promise<void> {
    await this.googleLoginButton.click();
    
    // Handle OAuth popup or redirect
    const popup = await this.page.waitForEvent('popup');
    await popup.waitForLoadState();
    
    // Mock OAuth response for testing
    await popup.close();
  }

  /**
   * Login with Facebook OAuth
   */
  async loginWithFacebook(): Promise<void> {
    await this.facebookLoginButton.click();
    
    // Handle OAuth popup or redirect
    const popup = await this.page.waitForEvent('popup');
    await popup.waitForLoadState();
    
    // Mock OAuth response for testing
    await popup.close();
  }

  /**
   * Validate error message is displayed
   */
  async expectErrorMessage(expectedMessage?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    
    if (expectedMessage) {
      await expect(this.errorMessage).toContainText(expectedMessage);
    }
  }

  /**
   * Validate successful login (redirected to dashboard)
   */
  async expectSuccessfulLogin(): Promise<void> {
    await this.page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(this.page).toHaveURL(/.*dashboard/);
  }

  /**
   * Validate login form is visible and accessible
   */
  async expectLoginFormVisible(): Promise<void> {
    await expect(this.loginForm).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
    
    // Accessibility checks
    await expect(this.emailInput).toHaveAttribute('type', 'email');
    await expect(this.passwordInput).toHaveAttribute('type', 'password');
    await expect(this.loginButton).toHaveAttribute('type', 'submit');
  }

  /**
   * Check if form is in loading state
   */
  async isLoading(): Promise<boolean> {
    try {
      await this.loadingSpinner.waitFor({ state: 'visible', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate form field requirements
   */
  async expectFormValidation(): Promise<void> {
    // Try to submit empty form
    await this.clickLoginButton();
    
    // Check for validation messages
    await expect(this.emailInput).toHaveAttribute('required');
    await expect(this.passwordInput).toHaveAttribute('required');
  }

  /**
   * Take screenshot for visual regression testing
   */
  async takeScreenshot(name: string): Promise<void> {
    await expect(this.page).toHaveScreenshot(`login-page-${name}.png`);
  }

  /**
   * Check accessibility compliance
   */
  async checkAccessibility(): Promise<void> {
    // Ensure proper focus management
    await this.emailInput.focus();
    await expect(this.emailInput).toBeFocused();
    
    // Check ARIA attributes
    await expect(this.loginButton).toHaveAttribute('aria-describedby');
    
    // Check color contrast and font sizes
    const loginButtonStyles = await this.loginButton.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        fontSize: styles.fontSize,
        color: styles.color,
        backgroundColor: styles.backgroundColor
      };
    });
    
    // Basic font size check (should be at least 16px for accessibility)
    const fontSize = parseInt(loginButtonStyles.fontSize);
    expect(fontSize).toBeGreaterThanOrEqual(16);
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(): Promise<void> {
    // Tab through form elements
    await this.page.keyboard.press('Tab');
    await expect(this.emailInput).toBeFocused();
    
    await this.page.keyboard.press('Tab');
    await expect(this.passwordInput).toBeFocused();
    
    await this.page.keyboard.press('Tab');
    await expect(this.rememberMeCheckbox).toBeFocused();
    
    await this.page.keyboard.press('Tab');
    await expect(this.loginButton).toBeFocused();
    
    // Test Enter key submission
    await this.emailInput.focus();
    await this.fillEmail('test@example.com');
    await this.fillPassword('password123');
    await this.page.keyboard.press('Enter');
  }

  /**
   * Test responsive design
   */
  async testResponsiveDesign(): Promise<void> {
    // Test mobile viewport
    await this.page.setViewportSize({ width: 375, height: 667 });
    await expect(this.loginForm).toBeVisible();
    await this.takeScreenshot('mobile');
    
    // Test tablet viewport
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await expect(this.loginForm).toBeVisible();
    await this.takeScreenshot('tablet');
    
    // Test desktop viewport
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    await expect(this.loginForm).toBeVisible();
    await this.takeScreenshot('desktop');
  }
}