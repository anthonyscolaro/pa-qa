# E2E Test Agent Configuration

## Purpose
Generate end-to-end test suites for critical user workflows using Playwright, Cypress, or Selenium.

## Capabilities
- User journey testing
- Cross-browser compatibility
- Mobile responsive testing
- Authentication flows
- Payment workflows
- Form validation
- File uploads
- API integration testing

## Prompt Template
```typescript
Task({
  subagent_type: "general-purpose",
  description: "Generate E2E tests for ${application}",
  prompt: `You are an expert E2E test architect. Create comprehensive Playwright tests for ${application}.

  REQUIREMENTS:
  - Test critical user paths
  - Include accessibility checks
  - Test across viewports (mobile, tablet, desktop)
  - Handle authentication states
  - Verify data persistence
  - Check error states
  
  APPLICATION: ${application}
  BASE_URL: ${baseUrl}
  
  PHASE 1 - User Flow Analysis:
  - Map critical user journeys
  - Identify key interaction points
  - Document expected outcomes
  - List potential failure points
  
  PHASE 2 - Test Scenarios:
  - Authentication (login, logout, registration)
  - Core functionality workflows
  - Edge cases and error handling
  - Performance-critical paths
  - Accessibility compliance
  
  PHASE 3 - Test Implementation:
  - Page object models
  - Reusable test utilities
  - Custom commands/helpers
  - Test data management
  - Screenshot/video capture
  
  PHASE 4 - Cross-Browser Testing:
  - Chrome/Chromium tests
  - Firefox compatibility
  - Safari (if applicable)
  - Mobile browser testing
  
  PHASE 5 - CI/CD Integration:
  - Parallel test execution
  - Retry strategies
  - Result reporting
  - Artifact storage
  
  DELIVERABLES:
  1. Complete E2E test suite
  2. Page object models
  3. Test utilities
  4. Configuration files
  5. CI/CD workflow
  
  Follow Playwright best practices and use patterns from project-types/web-apps.`
})
```

## Test Structure

### Playwright Configuration
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'firefox', use: devices['Desktop Firefox'] },
    { name: 'mobile', use: devices['iPhone 12'] },
  ],
});
```

### Page Object Pattern
```typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}
  
  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email"]', email);
    await this.page.fill('[data-testid="password"]', password);
    await this.page.click('[data-testid="submit"]');
  }
}
```

### Test Example
```typescript
// tests/auth.spec.ts
test.describe('Authentication', () => {
  test('successful login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login('test@example.com', 'password');
    await expect(page).toHaveURL('/dashboard');
  });
});
```

## Accessibility Testing
```typescript
test('meets WCAG standards', async ({ page }) => {
  await injectAxe(page);
  const violations = await checkA11y(page);
  expect(violations).toHaveLength(0);
});
```

## Output Location
`project-types/${projectType}/${framework}/tests/e2e/`