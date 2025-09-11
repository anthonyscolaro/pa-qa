# Jest to Vitest Migration Guide - PA-QA Framework

## 🚀 Overview

This guide walks you through migrating from Jest to Vitest in your React projects using the PA-QA framework. Vitest offers faster execution, better ES modules support, and improved developer experience while maintaining Jest compatibility.

## 📋 Migration Benefits

### Why Migrate to Vitest?

- **⚡ 2-10x Faster**: Native ES modules and Vite's bundling speed
- **🔧 Better DX**: Hot reload for tests, improved error messages
- **📦 Zero Config**: Works out of the box with Vite projects
- **🔄 Jest Compatible**: Minimal API changes required
- **🎯 Modern**: Built for modern JavaScript/TypeScript

### Performance Comparison

```
Test Suite: 1000 unit tests
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Framework   │ Cold Start  │ Watch Mode  │ Memory      │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ Jest        │ 45s         │ 8s          │ 512MB       │
│ Vitest      │ 12s         │ 2s          │ 256MB       │
│ Improvement │ 3.75x       │ 4x          │ 2x          │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

## 🎯 Migration Strategy

### Phase 1: Assessment and Planning

1. **Analyze Current Jest Setup**
2. **Identify Migration Blockers**
3. **Plan Incremental Migration**
4. **Backup Current Configuration**

### Phase 2: Core Migration

1. **Replace Dependencies**
2. **Update Configuration**
3. **Migrate Test Files**
4. **Fix Compatibility Issues**

### Phase 3: Optimization

1. **Leverage Vitest Features**
2. **Optimize Performance**
3. **Update CI/CD Pipelines**
4. **Team Training**

## 🔧 Step-by-Step Migration

### Step 1: Backup Current Setup

```bash
# Create backup branch
git checkout -b backup/jest-setup
git add .
git commit -m "Backup Jest configuration before Vitest migration"
git checkout main

# Create migration branch
git checkout -b migrate/jest-to-vitest

# Document current setup
cp package.json package.json.jest-backup
cp jest.config.js jest.config.js.backup
```

### Step 2: Analyze Current Jest Configuration

```bash
# Examine current Jest setup
cat package.json | grep -A 10 -B 10 jest
cat jest.config.js

# List test files
find . -name "*.test.*" -o -name "*.spec.*" | head -20

# Check test scripts
grep -r "jest" package.json
```

Example current Jest configuration:
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
}
```

### Step 3: Install Vitest Dependencies

```bash
# Remove Jest dependencies
npm uninstall jest @types/jest jest-environment-jsdom babel-jest

# Install Vitest dependencies
npm install --save-dev vitest @vitest/ui jsdom @testing-library/jest-dom

# Install additional Vitest utilities
npm install --save-dev @vitest/coverage-v8 happy-dom

# Update React Testing Library if needed
npm install --save-dev @testing-library/react@latest @testing-library/user-event@latest
```

Updated package.json dependencies:
```json
{
  "devDependencies": {
    "vitest": "^0.34.6",
    "@vitest/ui": "^0.34.6",
    "@vitest/coverage-v8": "^0.34.6",
    "jsdom": "^22.1.0",
    "happy-dom": "^10.0.3",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/user-event": "^14.5.1"
  }
}
```

### Step 4: Create Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        '**/*.d.ts',
        '**/*.config.*',
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
    // Jest compatibility
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

### Step 5: Update Setup Files

```typescript
// src/setupTests.ts (updated from setupTests.js)
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia
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

// Mock scrollTo
global.scrollTo = vi.fn()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock })
```

### Step 6: Update Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:ci": "vitest run --coverage --reporter=verbose"
  }
}
```

### Step 7: Migrate Test Files

#### Update Imports and Mocking

```typescript
// ❌ Jest imports (old)
import { jest } from '@jest/globals'

// ✅ Vitest imports (new)
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

// ❌ Jest mocking (old)
jest.mock('../services/api')
const mockFetch = jest.fn()

// ✅ Vitest mocking (new)
vi.mock('../services/api')
const mockFetch = vi.fn()
```

#### Complete Test File Migration Example

```typescript
// Before: Button.test.jsx (Jest)
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from './Button'

jest.mock('../utils/analytics')

describe('Button Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})

// After: Button.test.tsx (Vitest)
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import Button from './Button'

vi.mock('../utils/analytics')

describe('Button Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

#### Advanced Mocking Migration

```typescript
// ❌ Jest module mocking (old)
jest.mock('../services/api', () => ({
  fetchUsers: jest.fn().mockResolvedValue([]),
  createUser: jest.fn().mockResolvedValue({ id: 1 })
}))

// ✅ Vitest module mocking (new)
vi.mock('../services/api', () => ({
  fetchUsers: vi.fn().mockResolvedValue([]),
  createUser: vi.fn().mockResolvedValue({ id: 1 })
}))

// ❌ Jest partial mocking (old)
jest.mock('../utils/helpers', () => ({
  ...jest.requireActual('../utils/helpers'),
  formatDate: jest.fn().mockReturnValue('2023-01-01')
}))

// ✅ Vitest partial mocking (new)
vi.mock('../utils/helpers', async () => {
  const actual = await vi.importActual('../utils/helpers')
  return {
    ...actual,
    formatDate: vi.fn().mockReturnValue('2023-01-01')
  }
})
```

#### Async Testing Migration

```typescript
// ❌ Jest async testing (old)
it('fetches user data', async () => {
  const mockData = { id: 1, name: 'John' }
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockData
  })

  const result = await fetchUser(1)
  expect(result).toEqual(mockData)
})

// ✅ Vitest async testing (new)
it('fetches user data', async () => {
  const mockData = { id: 1, name: 'John' }
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: true,
    json: vi.fn().mockResolvedValueOnce(mockData)
  })

  const result = await fetchUser(1)
  expect(result).toEqual(mockData)
})
```

### Step 8: Handle Special Cases

#### React Testing Library Integration

```typescript
// Enhanced test utilities for Vitest
// src/test-utils.tsx
import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@mui/material/styles'
import { theme } from './theme'

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
  queryClient?: QueryClient
}

export const renderWithProviders = (
  ui: React.ReactElement,
  {
    initialEntries = ['/'],
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: CustomRenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  }
}

// Re-export everything from testing library
export * from '@testing-library/react'
export { userEvent } from '@testing-library/user-event'
```

#### Mock Service Worker (MSW) Integration

```typescript
// src/mocks/handlers.ts
import { rest } from 'msw'

export const handlers = [
  rest.get('/api/users', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' }
      ])
    )
  }),

  rest.post('/api/users', (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({ id: 3, name: 'New User' })
    )
  })
]

// src/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)

// src/setupTests.ts (add to existing setup)
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

#### Custom Matchers

```typescript
// src/test-utils/matchers.ts
import { expect } from 'vitest'

expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      }
    }
  },
})

// Add to setupTests.ts
import './test-utils/matchers'

// Usage in tests
expect(response.time).toBeWithinRange(90, 110)
```

### Step 9: Update CI/CD Configuration

#### GitHub Actions Update

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [16, 18, 20]

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linting
      run: npm run lint

    - name: Run tests with Vitest
      run: npm run test:ci

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/clover.xml
        fail_ci_if_error: true

    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: test-results-${{ matrix.node-version }}
        path: |
          coverage/
          test-results.xml
```

#### Docker Integration

```dockerfile
# Dockerfile.test
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Run tests with Vitest
CMD ["npm", "run", "test:ci"]
```

### Step 10: Verification and Testing

#### Run Migration Tests

```bash
# Test the migration
npm run test

# Test with coverage
npm run test:coverage

# Test with UI
npm run test:ui

# Test in CI mode
npm run test:ci

# Compare performance
time npm run test:run
```

#### Validate Test Results

```bash
# Check coverage reports
open coverage/index.html

# Verify all tests pass
npm run test:run | grep -E "(PASS|FAIL)"

# Check for any Jest remnants
grep -r "jest" src/ tests/ --exclude-dir=node_modules
```

## 🔄 Migration Checklist

### Pre-Migration Checklist

- [ ] Backup current Jest configuration
- [ ] Document existing test patterns
- [ ] Identify custom Jest configurations
- [ ] Note any Jest-specific plugins or extensions
- [ ] Plan for CI/CD pipeline updates

### Migration Checklist

- [ ] Install Vitest dependencies
- [ ] Remove Jest dependencies  
- [ ] Create vitest.config.ts
- [ ] Update setupTests file
- [ ] Update package.json scripts
- [ ] Migrate test imports (jest → vi)
- [ ] Update mocking syntax
- [ ] Fix async test patterns
- [ ] Update CI/CD configuration
- [ ] Test coverage configuration

### Post-Migration Checklist

- [ ] All tests pass
- [ ] Coverage reports generate correctly
- [ ] CI/CD pipeline works
- [ ] Performance improved
- [ ] Team trained on new syntax
- [ ] Documentation updated

## 🚨 Common Migration Issues

### Issue 1: ES Module Compatibility

**Problem**: Jest configuration conflicts with ES modules

**Solution**:
```typescript
// vitest.config.ts - Better ES module support
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // Handle ES modules properly
    deps: {
      inline: ['@testing-library/jest-dom']
    }
  }
})
```

### Issue 2: Mock Implementation Differences

**Problem**: Jest mock behavior differs from Vitest

**Solution**:
```typescript
// Create compatibility helper
// src/test-utils/jest-compat.ts
import { vi } from 'vitest'

export const jest = {
  fn: vi.fn,
  spyOn: vi.spyOn,
  mock: vi.mock,
  clearAllMocks: vi.clearAllMocks,
  resetAllMocks: vi.resetAllMocks,
  restoreAllMocks: vi.restoreAllMocks,
}

// Use in tests for gradual migration
import { jest } from '../test-utils/jest-compat'
```

### Issue 3: Coverage Configuration

**Problem**: Coverage thresholds not working

**Solution**:
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8', // or 'c8'
      thresholds: {
        global: {
          lines: 70,
          functions: 70,
          branches: 70,
          statements: 70
        },
        // Per-file thresholds
        'src/utils/': {
          lines: 90,
          functions: 90
        }
      }
    }
  }
})
```

### Issue 4: TypeScript Configuration

**Problem**: TypeScript types not working correctly

**Solution**:
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}

// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    typecheck: {
      tsconfig: './tsconfig.test.json'
    }
  }
})
```

## 🎯 Optimization After Migration

### Leverage Vitest Features

#### 1. Watch Mode Improvements

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    watch: {
      // Only run tests related to changed files
      include: ['src/**'],
      exclude: ['node_modules/**']
    }
  }
})
```

#### 2. Concurrent Testing

```typescript
// vitest.config.ts  
export default defineConfig({
  test: {
    // Run tests in parallel
    threads: true,
    // Limit concurrent tests
    maxConcurrency: 5,
    // File-level parallelism
    fileParallelism: true
  }
})
```

#### 3. Advanced Mocking

```typescript
// Better module mocking with Vitest
vi.mock('../api/client', async () => {
  const actual = await vi.importActual('../api/client')
  return {
    ...actual,
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    }
  }
})

// Better timer mocking
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

test('delayed execution', async () => {
  const callback = vi.fn()
  setTimeout(callback, 1000)
  
  vi.advanceTimersByTime(1000)
  expect(callback).toHaveBeenCalled()
})
```

#### 4. Workspace Configuration

```typescript
// vitest.workspace.ts
import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  // Unit tests
  {
    test: {
      name: 'unit',
      include: ['src/**/*.{test,spec}.{js,ts}'],
      environment: 'jsdom'
    }
  },
  // Integration tests  
  {
    test: {
      name: 'integration',
      include: ['tests/integration/**/*.{test,spec}.{js,ts}'],
      environment: 'node'
    }
  }
])
```

### Performance Optimization

#### 1. Test File Organization

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx      # Co-located tests
│   │   └── index.ts
│   └── Form/
│       ├── Form.tsx
│       ├── Form.test.tsx
│       └── index.ts
└── utils/
    ├── helpers.ts
    └── helpers.test.ts
```

#### 2. Smart Test Execution

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    // Only run tests for changed files
    changed: process.env.CI !== 'true',
    // Bail on first failure in CI
    bail: process.env.CI === 'true' ? 1 : 0,
    // Timeout optimization
    testTimeout: process.env.CI === 'true' ? 30000 : 10000
  }
})
```

## 📊 Migration Results Validation

### Performance Comparison

```bash
# Create performance comparison script
# scripts/compare-performance.sh

echo "🔍 Comparing Jest vs Vitest Performance"

# Test with Jest (if available)
if command -v jest &> /dev/null; then
  echo "📊 Jest Performance:"
  time npm run test:jest 2>&1 | grep -E "(Time:|Tests:|Snapshots:)"
fi

# Test with Vitest
echo "⚡ Vitest Performance:"
time npm run test:run 2>&1 | grep -E "(Test Files|Tests|Duration)"

echo "✅ Performance comparison complete"
```

### Quality Metrics

```typescript
// scripts/validate-migration.ts
import { execSync } from 'child_process'
import fs from 'fs'

interface MigrationMetrics {
  testCount: number
  coveragePercentage: number
  executionTime: number
  memoryUsage: number
}

const validateMigration = async (): Promise<MigrationMetrics> => {
  console.log('🔍 Validating migration results...')
  
  // Run tests and capture metrics
  const testOutput = execSync('npm run test:ci', { encoding: 'utf8' })
  
  // Parse test results
  const testCount = parseInt(testOutput.match(/(\d+) passed/)?.[1] || '0')
  
  // Check coverage
  const coverageReport = JSON.parse(
    fs.readFileSync('coverage/coverage-summary.json', 'utf8')
  )
  const coveragePercentage = coverageReport.total.lines.pct
  
  console.log(`✅ Migration validation complete:`)
  console.log(`   Tests: ${testCount}`)
  console.log(`   Coverage: ${coveragePercentage}%`)
  
  return {
    testCount,
    coveragePercentage,
    executionTime: 0, // Would need timing logic
    memoryUsage: 0     // Would need memory monitoring
  }
}

if (require.main === module) {
  validateMigration()
}
```

## 📚 Resources and Next Steps

### Documentation Links

- [Vitest Documentation](https://vitest.dev/)
- [Migration from Jest](https://vitest.dev/guide/migration.html)
- [Vitest API Reference](https://vitest.dev/api/)
- [Testing React with Vitest](https://vitest.dev/guide/testing-react.html)

### PA-QA Framework Integration

- [React Testing Setup Guide](/docs/setup-guides/react-testing-setup.md)
- [Testing Patterns Best Practices](/docs/best-practices/testing-patterns.md)
- [CI/CD Integration Guide](/docs/setup-guides/ci-cd-integration.md)

### Team Training

1. **Share Migration Benefits**: Performance improvements, better DX
2. **Update Documentation**: Team wikis, onboarding guides
3. **Provide Training**: Workshops on Vitest-specific features
4. **Create Examples**: Real project examples for reference

### Continuous Improvement

```typescript
// Setup monitoring for test performance
// scripts/test-metrics.ts
const trackTestMetrics = () => {
  const metrics = {
    timestamp: new Date().toISOString(),
    testCount: getTestCount(),
    executionTime: getExecutionTime(),
    coveragePercentage: getCoveragePercentage(),
    flakyTests: getFlakyTests()
  }
  
  // Send to monitoring dashboard
  sendMetrics(metrics)
}
```

## 🎉 Conclusion

Migrating from Jest to Vitest provides significant benefits:

- **⚡ 3-4x faster test execution**
- **🔧 Better development experience**  
- **📦 Modern ES module support**
- **🔄 Seamless integration with Vite**
- **🎯 Enhanced debugging capabilities**

The migration process, while requiring careful planning, results in a more performant and maintainable testing setup that aligns with modern JavaScript development practices.

---

**Successfully migrated?** Update your team documentation and consider sharing your migration experience with the PA-QA community!