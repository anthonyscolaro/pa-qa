# PA-QA React E2E Test Suite

A comprehensive end-to-end testing framework for React applications using Playwright, designed to ensure quality, accessibility, and performance across all user journeys.

## 🎯 Features

### Core Testing Capabilities
- **Cross-browser testing** - Chrome, Firefox, Safari, Edge
- **Mobile responsive testing** - iPhone, Android, iPad devices
- **Accessibility compliance** - WCAG 2.1 AA standards with axe-core
- **Visual regression testing** - Screenshot comparisons across browsers
- **Performance monitoring** - Load times, Core Web Vitals
- **API mocking** - Network interception and response mocking
- **Authentication flows** - Login, OAuth, session management
- **Page Object Model** - Maintainable and reusable test structure

### Advanced Features
- **Multi-device testing** - Consistent experience across platforms
- **Offline testing** - PWA and service worker validation
- **Real-time collaboration** - Multi-user scenario testing
- **Data validation** - Import/export workflows and error handling
- **Security testing** - CSRF, XSS, and authentication bypass prevention
- **Internationalization** - Multi-language support testing

## 📁 Project Structure

```
tests/e2e/
├── playwright.config.ts          # Main Playwright configuration
├── package.json                  # Dependencies and scripts
├── Dockerfile                    # Container configuration
├── .env.example                  # Environment variables template
├── README.md                     # This documentation
│
├── pages/                        # Page Object Model classes
│   ├── LoginPage.ts              # Login page interactions
│   └── DashboardPage.ts          # Dashboard page interactions
│
├── tests/                        # Test specifications
│   ├── auth.spec.ts              # Authentication flow tests
│   ├── user-journey.spec.ts      # Complete user workflows
│   ├── accessibility.spec.ts     # WCAG compliance tests
│   └── mobile.spec.ts            # Mobile responsive tests
│
├── fixtures/                     # Test data and utilities
│   ├── auth.ts                   # Authentication fixtures
│   ├── test-data.json            # Sample data sets
│   ├── sample-data.csv           # Import test files
│   └── invalid-data.csv          # Validation test files
│
├── utils/                        # Global setup and utilities
│   ├── global-setup.ts           # Pre-test setup
│   └── global-teardown.ts        # Post-test cleanup
│
└── results/                      # Generated test artifacts
    ├── screenshots/              # Visual regression images
    ├── videos/                   # Test execution recordings
    ├── traces/                   # Playwright trace files
    └── reports/                  # HTML and Allure reports
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Git for version control
- Docker (optional, for containerized testing)

### Installation

1. **Clone and navigate to the test directory:**
   ```bash
   cd project-types/web-apps/react/tests/e2e
   ```

2. **Install dependencies:**
   ```bash
   npm install
   npm run setup
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your application URLs and credentials
   ```

4. **Verify installation:**
   ```bash
   npm run test:auth
   ```

### Basic Usage

```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:auth           # Authentication tests
npm run test:journey        # User journey tests
npm run test:accessibility  # Accessibility tests
npm run test:mobile         # Mobile responsive tests

# Run tests in specific browsers
npm run test:chrome         # Chrome only
npm run test:firefox        # Firefox only
npm run test:safari         # Safari only

# Debug and development
npm run test:headed         # Run with browser UI
npm run test:debug          # Debug mode with DevTools
npm run test:ui             # Playwright UI mode
```

## 📋 Test Categories

### Authentication Tests (`auth.spec.ts`)

Comprehensive authentication flow validation:

- ✅ **Login/Logout flows** - Valid and invalid credentials
- ✅ **OAuth integration** - Google, Facebook, social logins
- ✅ **Session management** - Token refresh, expiration handling
- ✅ **Security validation** - CSRF protection, rate limiting
- ✅ **Password features** - Show/hide, forgot password
- ✅ **Multi-factor authentication** - SMS, email, authenticator apps
- ✅ **Remember me functionality** - Persistent sessions
- ✅ **Account states** - Active, inactive, locked accounts

**Example test:**
```typescript
test('should login successfully with valid credentials', async ({ loginPage, dashboardPage }) => {
  await loginPage.goto();
  await loginPage.login('user@example.com', 'SecurePassword123!');
  await loginPage.expectSuccessfulLogin();
  await dashboardPage.expectDashboardLoaded();
});
```

### User Journey Tests (`user-journey.spec.ts`)

End-to-end user workflows:

- ✅ **Onboarding flow** - New user registration and setup
- ✅ **Project management** - Create, update, collaborate, archive
- ✅ **E-commerce workflow** - Browse, cart, checkout, payment
- ✅ **Data management** - Import, export, validation, filtering
- ✅ **Multi-user collaboration** - Real-time editing, notifications
- ✅ **Error recovery** - Network failures, session timeout handling
- ✅ **Cross-device sync** - Data consistency across platforms

**Example test:**
```typescript
test('should complete full project lifecycle', async ({ authenticatedPage }) => {
  const dashboardPage = new DashboardPage(authenticatedPage);
  await dashboardPage.navigateToProjects();
  
  // Create project
  await authenticatedPage.click('[data-testid="create-project-button"]');
  await authenticatedPage.fill('[data-testid="project-name"]', 'E2E Test Project');
  await authenticatedPage.click('[data-testid="create-project-submit"]');
  
  // Verify creation and continue workflow...
});
```

### Accessibility Tests (`accessibility.spec.ts`)

WCAG 2.1 AA compliance validation:

- ✅ **Automated scanning** - axe-core integration for violation detection
- ✅ **Keyboard navigation** - Tab order, focus management, shortcuts
- ✅ **Screen reader support** - ARIA labels, roles, live regions
- ✅ **Color contrast** - Minimum 4.5:1 ratio validation
- ✅ **Focus indicators** - Visible focus states for all interactive elements
- ✅ **Form accessibility** - Labels, error messages, validation
- ✅ **Modal management** - Focus trapping, escape key handling
- ✅ **Heading hierarchy** - Proper H1-H6 structure
- ✅ **Alternative text** - Images, icons, media descriptions

**Example test:**
```typescript
test('should pass axe accessibility scan', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
    
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

### Mobile Responsive Tests (`mobile.spec.ts`)

Multi-device and responsive design validation:

- ✅ **Device compatibility** - iPhone, Android, iPad testing
- ✅ **Touch interactions** - Tap, swipe, long press gestures
- ✅ **Orientation changes** - Portrait to landscape adaptation
- ✅ **Mobile navigation** - Hamburger menus, bottom tabs
- ✅ **Form optimization** - Appropriate keyboards, validation
- ✅ **Performance on mobile** - Load times on 3G/4G networks
- ✅ **PWA features** - Installation, offline functionality
- ✅ **Cross-device sync** - Data consistency across platforms

**Example test:**
```typescript
test('should adapt to different screen sizes', async ({ page }) => {
  const breakpoints = [
    { width: 320, height: 568, name: 'mobile-small' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1920, height: 1080, name: 'desktop' }
  ];
  
  for (const breakpoint of breakpoints) {
    await page.setViewportSize(breakpoint);
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    await page.screenshot({ path: `responsive-${breakpoint.name}.png` });
  }
});
```

## 🔧 Configuration

### Environment Variables

Key environment variables for test configuration:

```bash
# Application URLs
BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000/api

# Test Users
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!

# Browser Settings
HEADLESS=true
SLOW_MO=0

# Performance Budgets
PERFORMANCE_BUDGET_LOAD_TIME=3000
PERFORMANCE_BUDGET_FCP=1500

# Accessibility
ACCESSIBILITY_STANDARD=wcag2aa
ACCESSIBILITY_FAIL_ON_VIOLATIONS=true

# Reporting
ALLURE_SERVER_URL=https://allure.projectassistant.ai
PROJECT_NAME=my-react-app
```

### Playwright Configuration

The `playwright.config.ts` file includes:

- **Multiple browser projects** - Chrome, Firefox, Safari, Edge
- **Mobile device projects** - iPhone, Android, iPad
- **Performance projects** - Slow network, high DPI
- **Accessibility projects** - Dark mode, reduced motion
- **Visual regression settings** - Screenshot comparison thresholds
- **Global setup/teardown** - Authentication, cleanup
- **Allure reporting** - Centralized dashboard integration

### Custom Projects

```typescript
// Example custom project configuration
{
  name: 'Dark Mode',
  use: { 
    ...devices['Desktop Chrome'],
    colorScheme: 'dark'
  },
},
{
  name: 'Slow Network',
  use: { 
    ...devices['Desktop Chrome'],
    launchOptions: {
      args: ['--simulate-slow-connection']
    }
  },
}
```

## 🎨 Page Object Model

### Structure

Each page is represented by a TypeScript class with:

- **Locators** - Element selectors using data-testid attributes
- **Actions** - User interactions (click, fill, navigate)
- **Assertions** - Expected state validations
- **Utilities** - Helper methods for complex interactions

### Example Page Object

```typescript
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="email-input"]');
    this.passwordInput = page.locator('[data-testid="password-input"]');
    this.loginButton = page.locator('[data-testid="login-button"]');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectSuccessfulLogin(): Promise<void> {
    await this.page.waitForURL('**/dashboard');
    await expect(this.page).toHaveURL(/.*dashboard/);
  }
}
```

## 🧪 Test Data Management

### Fixtures

Test data is organized in the `fixtures/` directory:

- **auth.ts** - Authentication states and user data
- **test-data.json** - Sample application data
- **sample-data.csv** - Import/export test files
- **invalid-data.csv** - Validation error scenarios

### Authentication Fixtures

Pre-configured user states for different test scenarios:

```typescript
export const testUsers = {
  admin: {
    email: 'admin@example.com',
    password: 'AdminPass123!',
    role: 'admin'
  },
  user: {
    email: 'user@example.com',
    password: 'UserPass123!',
    role: 'user'
  }
};
```

### API Mocking

Network interception for consistent testing:

```typescript
// Mock authentication API
await page.route('**/api/auth/login', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, token: 'mock-token' })
  });
});
```

## 📊 Reporting

### Built-in Reports

- **HTML Report** - Interactive test results with traces
- **Allure Report** - Comprehensive dashboard with history
- **JSON Report** - Machine-readable results for CI/CD
- **JUnit Report** - Integration with test management tools

### Generating Reports

```bash
# View HTML report
npm run report

# Generate and serve Allure report
npm run report:allure

# Open existing Allure report
npm run report:open
```

### Allure Dashboard Integration

Tests automatically upload results to the centralized Allure dashboard at `https://allure.projectassistant.ai`. Each project maintains:

- **Test history** - Last 30 test runs
- **Trend analysis** - Pass/fail rates over time
- **Performance metrics** - Load times and Core Web Vitals
- **Accessibility scores** - WCAG compliance tracking
- **Device coverage** - Browser and mobile device matrix

## 🐳 Docker Integration

### Running Tests in Docker

```bash
# Build the Docker image
npm run docker:build

# Run tests in container
npm run docker:run

# Run specific test suite
docker run --rm pa-qa-react-e2e npm run test:auth
```

### Docker Compose Integration

```yaml
version: '3.8'
services:
  e2e-tests:
    build: .
    volumes:
      - ./results:/app/results
    environment:
      - BASE_URL=http://app:3000
      - CI=true
    depends_on:
      - app
```

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd project-types/web-apps/react/tests/e2e
          npm ci
          npm run setup
      
      - name: Run E2E tests
        run: npm run ci
        env:
          BASE_URL: ${{ secrets.BASE_URL }}
          
      - name: Upload results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: e2e-results
          path: results/
```

### Pipeline Scripts

```bash
# Parallel execution across multiple workers
npm run ci:parallel

# Generate and upload reports
npm run report:allure
```

## 🛠️ Development Workflow

### Writing New Tests

1. **Create Page Objects** for new application pages
2. **Add test data** to fixtures for new scenarios
3. **Write test specifications** following existing patterns
4. **Add data-testid attributes** to application elements
5. **Update configuration** for new test categories

### Test Organization

- **Group related tests** using `test.describe()` blocks
- **Use descriptive test names** that explain the expected behavior
- **Tag tests appropriately** (`@smoke`, `@regression`, `@accessibility`)
- **Include setup and teardown** for test isolation

### Best Practices

- **Use data-testid selectors** for stable element targeting
- **Implement proper waiting** for dynamic content
- **Mock external dependencies** for test reliability
- **Take screenshots** for visual regression testing
- **Include accessibility checks** in all user flows
- **Test error scenarios** as well as happy paths

## 🔍 Debugging

### Debug Mode

```bash
# Run with browser UI visible
npm run test:headed

# Step through tests with DevTools
npm run test:debug

# Use Playwright UI for test exploration
npm run test:ui
```

### Troubleshooting

1. **Check element selectors** - Ensure data-testid attributes exist
2. **Verify timing** - Add appropriate waits for dynamic content
3. **Review screenshots** - Check visual state at failure points
4. **Examine traces** - Use Playwright's trace viewer for step-by-step debugging
5. **Check network** - Verify API mocks and network conditions

### Common Issues

- **Flaky tests** - Add proper waits, improve selectors
- **Authentication failures** - Verify mock endpoints and test data
- **Visual regression** - Update snapshots after intentional changes
- **Performance issues** - Check timeout settings and network simulation

## 📈 Performance Monitoring

### Metrics Tracked

- **Load Time** - Time to interactive
- **First Contentful Paint** - Initial render performance
- **Largest Contentful Paint** - Perceived loading performance
- **Cumulative Layout Shift** - Visual stability
- **First Input Delay** - Interactivity responsiveness

### Performance Budgets

```typescript
const performanceBudgets = {
  loadTime: 3000,
  firstContentfulPaint: 1500,
  largestContentfulPaint: 2500,
  cumulativeLayoutShift: 0.1,
  firstInputDelay: 100
};
```

## 🛡️ Security Testing

### Security Checks

- **CSRF Protection** - Verify token validation
- **XSS Prevention** - Test input sanitization
- **Authentication Bypass** - Verify access controls
- **Session Security** - Test token expiration and refresh
- **Input Validation** - Test malicious input handling

## 🌍 Accessibility Standards

### WCAG 2.1 AA Compliance

- **Level A** - Basic accessibility features
- **Level AA** - Standard accessibility (target level)
- **Color Contrast** - 4.5:1 minimum ratio
- **Keyboard Navigation** - All functionality accessible via keyboard
- **Screen Reader** - Proper ARIA labels and roles
- **Focus Management** - Visible focus indicators

### Accessibility Tools

- **axe-core** - Automated accessibility testing
- **Manual Testing** - Keyboard navigation verification
- **Screen Reader Testing** - NVDA, JAWS, VoiceOver compatibility
- **Color Blindness** - Testing with color vision simulators

## 📞 Support

### Getting Help

- **Documentation** - Check this README and inline code comments
- **Issues** - Create GitHub issues for bugs or feature requests
- **Team Chat** - #qa-testing Slack channel for quick questions
- **Code Review** - Request reviews for new test implementations

### Contributing

1. **Fork the repository** and create a feature branch
2. **Write tests** following the established patterns
3. **Update documentation** for new features or changes
4. **Submit a pull request** with clear description
5. **Ensure all tests pass** in CI/CD pipeline

---

**Happy Testing! 🎉**

This E2E test suite provides comprehensive coverage for React applications, ensuring quality, accessibility, and performance across all user journeys. For questions or contributions, please reach out to the PA-QA team.