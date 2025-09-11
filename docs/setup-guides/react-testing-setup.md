# React Testing Setup Guide - PA-QA Framework

## 🚀 Quick Start

Get your React project testing-ready in under 5 minutes with comprehensive unit, integration, and E2E tests using Vitest, React Testing Library, and Playwright.

## 📋 Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn package manager
- Existing React project (Create React App, Vite, or Next.js)
- Docker (optional, for containerized testing)

## 🎯 What You'll Get

After following this guide, your React project will have:

✅ **Unit Tests** with Vitest + React Testing Library  
✅ **Integration Tests** with MSW for API mocking  
✅ **E2E Tests** with Playwright  
✅ **Accessibility Tests** with axe-core  
✅ **Performance Tests** with Lighthouse CI  
✅ **Code Coverage** reporting with 70% minimum thresholds  
✅ **Allure Reporting** integration  
✅ **CI/CD Ready** GitHub Actions workflow  

## 🔧 Step 1: Copy PA-QA Templates

### Option A: Manual Copy (Recommended for Learning)

```bash
# Navigate to your React project
cd your-react-project

# Copy configuration files
cp /path/to/pa-qa/project-types/web-apps/react/configs/* ./

# Create tests directory structure
mkdir -p tests/{unit,integration,e2e,fixtures}

# Copy test utilities and setup
cp /path/to/pa-qa/project-types/web-apps/react/tests/setup.ts ./tests/
cp /path/to/pa-qa/project-types/web-apps/react/tests/test-utils.tsx ./tests/

# Copy example tests for reference
cp -r /path/to/pa-qa/project-types/web-apps/react/tests/unit/* ./tests/unit/
cp -r /path/to/pa-qa/project-types/web-apps/react/tests/e2e/* ./tests/e2e/
```

### Option B: Multi-Agent Setup (Advanced)

```bash
# Use PA-QA multi-agent command to generate custom test suite
cd your-react-project
pa-qa generate-test-suite web-app react --with-e2e --with-a11y --project-name="your-project"
```

## 🔧 Step 2: Install Dependencies

### Merge package.json Dependencies

Add these dependencies to your existing `package.json`:

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.5.1",
    "@vitest/ui": "^0.34.6",
    "vitest": "^0.34.6",
    "jsdom": "^22.1.0",
    "msw": "^1.3.2",
    "@axe-core/react": "^4.8.2",
    "@playwright/test": "^1.40.0",
    "allure-vitest": "^2.4.0",
    "allure-playwright": "^2.4.0"
  },
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:allure": "allure generate allure-results -o allure-report --clean",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### Install Dependencies

```bash
npm install
# or
yarn install
```

### Install Playwright Browsers

```bash
npx playwright install
```

## 🔧 Step 3: Configure Testing Environment

### Vitest Configuration (vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        'dist/',
        'build/'
      ],
      thresholds: {
        global: {
          lines: 70,
          functions: 70,
          branches: 70,
          statements: 70
        }
      }
    },
    reporters: [
      'default',
      ['allure-vitest', { 
        resultsDir: 'allure-results',
        projectName: 'Your React Project'
      }]
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
})
```

### Test Setup (tests/setup.ts)

```typescript
import '@testing-library/jest-dom'
import { beforeEach, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Clean up after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Mock common browser APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
})

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })
```

### Test Utilities (tests/test-utils.tsx)

```typescript
import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
  queryClient?: QueryClient
}

export const renderWithProviders = (
  ui: ReactElement,
  {
    initialEntries = ['/'],
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  )

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  }
}

// Export everything from testing library
export * from '@testing-library/react'
export { userEvent } from '@testing-library/user-event'
```

### Playwright Configuration (playwright.config.ts)

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['allure-playwright', { 
      resultsDir: 'allure-results-e2e',
      projectName: 'E2E Tests'
    }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

## 🔧 Step 4: Write Your First Tests

### Unit Test Example (tests/unit/Button.test.tsx)

```typescript
import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders, screen, userEvent } from '../test-utils'
import { Button } from '@/components/Button'

describe('Button Component', () => {
  it('renders with correct text', () => {
    renderWithProviders(<Button>Click me</Button>)
    
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    renderWithProviders(
      <Button onClick={handleClick}>Click me</Button>
    )
    
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies correct variant styles', () => {
    renderWithProviders(<Button variant="primary">Primary</Button>)
    
    expect(screen.getByRole('button')).toHaveClass('btn-primary')
  })

  it('is disabled when loading', () => {
    renderWithProviders(<Button loading>Loading</Button>)
    
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})
```

### Integration Test Example (tests/integration/UserProfile.test.tsx)

```typescript
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { renderWithProviders, screen, waitFor } from '../test-utils'
import { UserProfile } from '@/components/UserProfile'

// Mock API responses
const server = setupServer(
  rest.get('/api/user/123', (req, res, ctx) => {
    return res(ctx.json({
      id: 123,
      name: 'John Doe',
      email: 'john@example.com'
    }))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('UserProfile Integration', () => {
  it('loads and displays user data', async () => {
    renderWithProviders(<UserProfile userId="123" />)
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    server.use(
      rest.get('/api/user/123', (req, res, ctx) => {
        return res(ctx.status(500))
      })
    )
    
    renderWithProviders(<UserProfile userId="123" />)
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/error loading user/i)
    })
  })
})
```

### E2E Test Example (tests/e2e/authentication.spec.ts)

```typescript
import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('user can login successfully', async ({ page }) => {
    await page.goto('/')
    
    // Navigate to login
    await page.click('text=Login')
    await expect(page).toHaveURL('/login')
    
    // Fill login form
    await page.fill('[data-testid=email]', 'test@example.com')
    await page.fill('[data-testid=password]', 'password123')
    await page.click('button[type=submit]')
    
    // Verify successful login
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Welcome back')).toBeVisible()
  })
  
  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('[data-testid=email]', 'invalid@example.com')
    await page.fill('[data-testid=password]', 'wrongpassword')
    await page.click('button[type=submit]')
    
    await expect(page.locator('[role=alert]')).toHaveText(/invalid credentials/i)
  })
})
```

## 🔧 Step 5: Set Up Allure Reporting

### Install Allure CLI

```bash
# macOS
brew install allure

# Windows (using Scoop)
scoop install allure

# Linux
wget https://github.com/allure-framework/allure2/releases/download/2.24.0/allure-2.24.0.tgz
tar -zxvf allure-2.24.0.tgz
sudo mv allure-2.24.0 /opt/allure
echo 'export PATH="/opt/allure/bin:$PATH"' >> ~/.bashrc
```

### Generate and View Reports

```bash
# Run tests and generate results
npm run test:run
npm run test:e2e

# Generate Allure report
npm run test:allure

# Serve report locally
allure serve allure-results
```

### Upload to PA-QA Allure Dashboard

```bash
# Copy upload script from PA-QA
cp /path/to/pa-qa/shared/allure-config/upload-results.sh ./

# Upload results to centralized dashboard
./upload-results.sh your-project-name
```

## 🔧 Step 6: Docker Integration

### Copy Docker Configuration

```bash
cp /path/to/pa-qa/shared/docker-templates/testing/node-test.Dockerfile ./Dockerfile.test
cp /path/to/pa-qa/shared/docker-templates/testing/docker-compose.test.yml ./
```

### Run Tests in Docker

```bash
# Build test image
docker build -f Dockerfile.test -t your-app-tests .

# Run all tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit

# Run specific test suites
docker run --rm your-app-tests npm run test:unit
docker run --rm your-app-tests npm run test:e2e
```

## 🔧 Step 7: CI/CD Integration

### Copy GitHub Actions Workflow

```bash
mkdir -p .github/workflows
cp /path/to/pa-qa/shared/ci-cd-templates/github-actions/react-test.yml .github/workflows/
```

### Customize for Your Project

Edit `.github/workflows/react-test.yml`:

```yaml
name: React Testing Pipeline
on: [push, pull_request]

env:
  ALLURE_PROJECT_NAME: your-project-name
  
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:e2e
      
      - name: Upload to Allure
        if: always()
        run: ./upload-results.sh ${{ env.ALLURE_PROJECT_NAME }}
```

## ✅ Step 8: Verification

### Run Test Suite

```bash
# Unit tests
npm run test:run

# E2E tests  
npm run test:e2e

# Coverage report
npm run test:coverage

# All tests with reporting
npm run test:run && npm run test:e2e && npm run test:allure
```

### Check Coverage

Ensure you have at least 70% coverage:

```bash
npm run test:coverage
# Look for coverage summary in output
# Files should show Lines/Functions/Branches/Statements all > 70%
```

### Verify Allure Integration

```bash
# Generate and view report
npm run test:allure
allure serve allure-results

# Check dashboard upload
./upload-results.sh your-project-name
# Visit https://allure.projectassistant.ai/your-project-name
```

## 🎯 What's Next?

### Customize for Your Project

1. **Add custom test utilities** for your specific components
2. **Configure MSW handlers** for your API endpoints  
3. **Create E2E tests** for your main user flows
4. **Set up performance budgets** in Lighthouse CI
5. **Add accessibility tests** with axe-core

### Explore Advanced Features

- **Visual regression testing** with Playwright
- **Component testing** with Storybook
- **Performance testing** with Lighthouse CI
- **Cross-browser testing** with BrowserStack
- **API contract testing** with Pact

## 🆘 Troubleshooting

### Common Issues

**Tests timing out**
```bash
# Increase timeout in vitest.config.ts
test: {
  testTimeout: 10000
}
```

**Mock not working**
```bash
# Clear mocks in beforeEach
beforeEach(() => {
  vi.clearAllMocks()
})
```

**E2E tests failing in CI**
```bash
# Add retry configuration in playwright.config.ts
retries: process.env.CI ? 2 : 0
```

**Coverage too low**
```bash
# Check excluded files in vitest.config.ts
# Add more test cases for edge cases
# Remove test files from coverage
```

### Get Help

- **Documentation**: `/docs/troubleshooting/common-issues.md`
- **Examples**: `/project-types/web-apps/react/tests/`
- **Community**: Join our Slack #qa-testing channel
- **Issues**: Create issue in PA-QA repository

## 📚 Additional Resources

- [PA-QA Best Practices](/docs/best-practices/testing-patterns.md)
- [Multi-Agent Workflow Guide](/docs/best-practices/multi-agent-workflow.md)
- [Docker Testing Setup](/docs/setup-guides/docker-testing-setup.md)
- [Migration from Jest](/docs/migration/jest-to-vitest.md)
- [Frequently Asked Questions](/docs/faq.md)

---

**🎉 Congratulations!** Your React project now has comprehensive testing setup with the PA-QA framework. You're ready to build high-quality, well-tested applications with confidence.