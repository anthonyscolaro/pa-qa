# PA-QA Example Configurations

This directory contains example configurations and test patterns following 2024-2025 best practices based on LocalDocs research.

## 📁 Files Overview

### React Testing (Vitest)
- **`vitest-react-config.ts`** - Modern Vitest configuration for React applications
  - Includes coverage thresholds (70%)
  - Parallel test execution
  - Path aliases
  - jsdom environment setup

- **`vitest-setup.ts`** - Test environment setup file
  - MSW server initialization
  - React Testing Library cleanup
  - Common browser API mocks
  - Custom error handling

- **`msw-handlers.ts`** - Mock Service Worker v2.0 handlers
  - Authentication endpoints
  - CRUD operations
  - Pagination support
  - Error scenarios
  - File upload mocking

### WordPress Testing
- **`wordpress-phpunit.xml`** - PHPUnit 9.x configuration
  - Test suite organization (unit, integration, REST API)
  - Code coverage configuration
  - WordPress-specific environment variables
  - Database transaction handling

### FastAPI Testing
- **`fastapi-pytest.ini`** - Pytest configuration for FastAPI
  - Async test support with pytest-asyncio
  - Coverage requirements
  - Custom markers
  - Logging configuration

- **`fastapi-async-test.py`** - Comprehensive async test examples
  - AsyncClient usage with SQLAlchemy 2.0
  - Database transaction isolation
  - WebSocket testing
  - Background task testing
  - Parametrized tests

## 🚀 Quick Start

### React/Vitest Setup
```bash
# Install dependencies
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom msw

# Copy configuration
cp examples/vitest-react-config.ts ./vite.config.ts
cp examples/vitest-setup.ts ./src/test/setup.ts
cp examples/msw-handlers.ts ./src/mocks/handlers.ts

# Run tests
npm run test
```

### WordPress Setup
```bash
# Using @wordpress/env (modern approach)
npm install -g @wordpress/env
wp-env start

# Copy PHPUnit configuration
cp examples/wordpress-phpunit.xml ./phpunit.xml

# Run tests
wp-env run tests-cli phpunit
```

### FastAPI Setup
```bash
# Install dependencies
pip install pytest pytest-asyncio httpx pytest-cov pytest-mock

# Copy configuration
cp examples/fastapi-pytest.ini ./pytest.ini
cp examples/fastapi-async-test.py ./tests/test_example.py

# Run tests
pytest
```

## 🎯 Key Best Practices Demonstrated

### 1. Modern Tool Choices
- **Vitest over Jest** for React (4x faster)
- **@wordpress/env** over traditional WordPress setup
- **AsyncClient** for FastAPI async testing

### 2. Test Isolation
- Database transactions with automatic rollback
- Isolated test client instances
- Mock service reset between tests

### 3. Coverage Requirements
- Minimum 70% code coverage enforced
- Branch coverage tracking
- Exclude non-testable files

### 4. Performance Optimization
- Parallel test execution
- Connection pooling management
- Efficient fixture scoping

### 5. Real-World Patterns
- Authentication testing
- Pagination handling
- File upload mocking
- WebSocket testing
- Background task verification

## 📊 Coverage Reports

All configurations generate coverage reports in multiple formats:
- **HTML**: Interactive browser report
- **JSON**: Machine-readable format
- **LCOV**: For CI/CD integration
- **Console**: Terminal output

## 🔗 References

These examples are based on:
- LocalDocs research on modern testing practices
- Official framework documentation
- Community best practices
- Production-tested patterns

## 💡 Tips

1. **Use semantic queries** in React tests (`getByRole` over `getByTestId`)
2. **Test behavior, not implementation** - focus on user interactions
3. **Mock at the network level** with MSW, not module level
4. **Use factories** for test data generation
5. **Implement proper cleanup** to prevent test pollution

## 🚦 CI/CD Integration

These configurations work seamlessly with:
- GitHub Actions
- Bitbucket Pipelines
- GitLab CI
- Jenkins
- CircleCI

See `shared/ci-cd-templates/` for complete pipeline configurations.