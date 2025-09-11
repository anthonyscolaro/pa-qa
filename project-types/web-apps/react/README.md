# React Testing Templates with Vitest

This directory contains comprehensive React unit testing templates using Vitest as the test runner, following 2024 best practices for the PA-QA framework.

## Overview

These templates provide complete, runnable test examples that demonstrate:
- Component testing with React Testing Library v14+
- Custom hooks testing with renderHook patterns
- Context/Redux testing with providers
- Mock strategies with Vitest mocking (vi.mock)
- Edge cases and error boundaries
- Semantic queries (getByRole, getByLabelText)
- Behavior-focused testing over implementation details

## Quick Start

1. **Copy the configuration files to your project:**
   ```bash
   cp configs/vitest.config.ts your-project/
   cp configs/package.json your-project/ # Merge dependencies
   ```

2. **Copy the test utilities:**
   ```bash
   cp tests/setup.ts your-project/tests/
   cp tests/test-utils.tsx your-project/tests/
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Run tests:**
   ```bash
   npm run test
   ```

## Directory Structure

```
react/
├── configs/
│   ├── vitest.config.ts      # Vitest configuration with jsdom
│   └── package.json          # Dependencies template
├── tests/
│   ├── setup.ts              # Global test setup
│   ├── test-utils.tsx        # Custom render utilities
│   └── unit/
│       ├── Button.test.tsx           # Component testing example
│       ├── useAuth.test.ts           # Custom hook testing
│       ├── UserContext.test.tsx      # Context testing
│       ├── Form.test.tsx             # Form interaction testing
│       └── ErrorBoundary.test.tsx    # Error boundary testing
└── README.md
```

## Test Files Overview

### 1. Button.test.tsx
**Purpose:** Comprehensive component testing example
**Covers:**
- Rendering with different props
- User interactions (click, keyboard)
- Different variants and states
- Accessibility testing
- Loading and disabled states
- Edge cases and performance

**Key Patterns:**
```typescript
// Semantic queries
const button = screen.getByRole('button', { name: /click me/i })

// User interactions
const user = userEvent.setup()
await user.click(button)

// Accessibility testing
expect(button).toHaveAttribute('aria-label', 'Close dialog')
```

### 2. useAuth.test.ts
**Purpose:** Custom hook testing with renderHook
**Covers:**
- Hook initialization and state management
- Async operations (login, logout, token refresh)
- Error handling and edge cases
- Local storage interactions
- Hook stability and re-renders

**Key Patterns:**
```typescript
// Hook testing
const { result } = renderHook(() => useAuth())

// Testing async operations
await act(async () => {
  await result.current.login(credentials)
})

// State assertions
expect(result.current.isAuthenticated).toBe(true)
```

### 3. UserContext.test.tsx
**Purpose:** React Context testing with providers
**Covers:**
- Context provider setup and state management
- Multiple consumers
- Context updates and state changes
- Error scenarios
- Provider re-rendering

**Key Patterns:**
```typescript
// Custom render with context
render(
  <UserProvider userId="1">
    <TestComponent />
  </UserProvider>
)

// Testing context updates
await user.click(screen.getByText('Update User'))
expect(screen.getByText('Updated Name')).toBeInTheDocument()
```

### 4. Form.test.tsx
**Purpose:** Complex form interactions and validation
**Covers:**
- Form field validation (real-time and on submit)
- User input simulation
- Async validation (email availability)
- Form submission with loading states
- Accessibility and keyboard navigation
- Error handling and edge cases

**Key Patterns:**
```typescript
// Form interaction
await user.type(screen.getByLabelText(/email/i), 'test@example.com')
await user.click(screen.getByRole('button', { type: 'submit' }))

// Validation testing
expect(screen.getByText(/email is required/i)).toBeInTheDocument()

// Accessibility
expect(emailInput).toHaveAttribute('aria-invalid', 'true')
```

### 5. ErrorBoundary.test.tsx
**Purpose:** Error boundary testing and error handling
**Covers:**
- Error catching and display
- Custom error fallbacks
- Error recovery mechanisms
- Error reporting integration
- Accessibility in error states
- Nested error boundaries

**Key Patterns:**
```typescript
// Testing error boundaries
render(
  <ErrorBoundary>
    <ThrowError shouldError />
  </ErrorBoundary>
)

expect(screen.getByRole('alert')).toBeInTheDocument()

// Error recovery
await user.click(screen.getByText('Try Again'))
```

## Configuration Details

### vitest.config.ts Features
- **jsdom environment** for DOM testing
- **Coverage thresholds** (70% minimum)
- **TypeScript support** with path aliases
- **Global test utilities** setup
- **Allure reporting** integration
- **Parallel test execution**

### test-utils.tsx Features
- **Custom render function** with providers
- **Router and Query Client** setup
- **Theme and User Context** mocking
- **Accessibility helpers**
- **Mock API utilities**

### setup.ts Features
- **Global mocks** (IntersectionObserver, ResizeObserver, matchMedia)
- **Cleanup after each test**
- **Console error suppression** for tests
- **Storage mocking** (localStorage, sessionStorage)

## Testing Best Practices

### 1. Query Priority (use in this order)
1. **getByRole** - Most accessible
2. **getByLabelText** - Form elements
3. **getByPlaceholderText** - Input placeholders
4. **getByText** - Text content
5. **getByDisplayValue** - Form values
6. **getByAltText** - Images
7. **getByTitle** - Title attributes
8. **getByTestId** - Last resort

### 2. User Interactions
```typescript
// ✅ Good - Use userEvent for realistic interactions
const user = userEvent.setup()
await user.click(button)
await user.type(input, 'text')

// ❌ Avoid - fireEvent is less realistic
fireEvent.click(button)
```

### 3. Async Testing
```typescript
// ✅ Good - Wait for elements to appear
await waitFor(() => {
  expect(screen.getByText('Loading complete')).toBeInTheDocument()
})

// ✅ Good - Use findBy queries for async elements
const asyncElement = await screen.findByText('Async content')
```

### 4. Mocking
```typescript
// ✅ Good - Mock at the module level
vi.mock('../services/api', () => ({
  fetchUser: vi.fn().mockResolvedValue(mockUser)
}))

// ✅ Good - Clear mocks between tests
beforeEach(() => {
  vi.clearAllMocks()
})
```

## Coverage Requirements

All test files are designed to achieve **70%+ code coverage** including:
- **Lines:** 70%
- **Functions:** 70%
- **Branches:** 70%
- **Statements:** 70%

## Allure Integration

Tests are configured to work with the centralized Allure dashboard:
- **Results:** Automatically uploaded to `https://allure.projectassistant.ai`
- **History:** Last 30 test runs maintained
- **Reports:** Generated with `npm run test:allure`

## Accessibility Testing

All test examples include accessibility considerations:
- Proper ARIA attributes testing
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast awareness

## Scripts

```bash
# Development
npm run test          # Run tests in watch mode
npm run test:ui       # Run with Vitest UI
npm run test:coverage # Generate coverage report

# CI/CD
npm run test:run      # Run tests once
npm run test:allure   # Generate Allure report

# Code Quality
npm run lint          # ESLint check
npm run lint:fix      # Fix ESLint issues
npm run type-check    # TypeScript check
```

## Common Patterns

### Testing Components with Props
```typescript
it('renders with different variants', () => {
  render(<Button variant="primary">Primary</Button>)
  expect(screen.getByRole('button')).toHaveClass('btn-primary')
})
```

### Testing Async Operations
```typescript
it('handles async operations', async () => {
  const user = userEvent.setup()
  
  await user.click(screen.getByText('Load Data'))
  
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument()
  })
})
```

### Testing Error States
```typescript
it('displays error message', async () => {
  mockAPI.fetchData.mockRejectedValue(new Error('Failed'))
  
  render(<DataComponent />)
  
  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent('Failed')
  })
})
```

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout in vitest.config.ts
   - Use proper async/await patterns
   - Check for infinite loops in useEffect

2. **Act warnings**
   - Wrap state updates in act()
   - Use userEvent instead of fireEvent
   - Ensure proper cleanup

3. **Mock not working**
   - Check mock placement (before imports)
   - Use vi.clearAllMocks() in beforeEach
   - Verify mock return values

4. **Coverage issues**
   - Check excluded files in config
   - Ensure all branches are tested
   - Add edge case tests

## Integration with PA-QA Framework

These templates integrate with:
- **Docker containers** for consistent environments
- **GitHub Actions** for CI/CD
- **Allure reporting** for centralized dashboards
- **Code quality tools** (ESLint, TypeScript)

## Contributing

When adding new test patterns:
1. Follow existing naming conventions
2. Include comprehensive comments
3. Test both happy and error paths
4. Ensure accessibility considerations
5. Update this README with new patterns

---

**Note:** These templates are part of the PA-QA framework and should be customized for your specific project needs while maintaining the core testing principles and patterns demonstrated.