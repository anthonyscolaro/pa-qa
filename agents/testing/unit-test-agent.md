# Unit Test Agent Configuration

## Purpose
Generate comprehensive unit test templates for various frameworks and languages.

## Capabilities
- Component testing (React, Vue, Angular)
- Service/utility testing (business logic)
- Mock generation and stubbing
- Edge case identification
- Error handling scenarios

## Prompt Template
```typescript
Task({
  subagent_type: "general-purpose",
  description: "Generate unit tests for ${framework}",
  prompt: `You are an expert unit test architect. Generate comprehensive unit tests for ${framework}.

  REQUIREMENTS:
  - Minimum 70% code coverage
  - Test all public methods/functions
  - Include edge cases and error scenarios
  - Use appropriate mocking strategies
  - Follow AAA pattern (Arrange, Act, Assert)
  
  FRAMEWORK: ${framework}
  COMPONENT/MODULE: ${componentPath}
  
  PHASE 1 - Analysis:
  - Identify all testable units
  - Determine dependencies to mock
  - List edge cases and error conditions
  
  PHASE 2 - Test Structure:
  - Create describe blocks for logical grouping
  - Generate test cases for happy paths
  - Add edge case tests
  - Include error handling tests
  
  PHASE 3 - Mock Strategy:
  - Create reusable mock factories
  - Setup test fixtures
  - Configure test database if needed
  
  PHASE 4 - Assertions:
  - Use framework-specific matchers
  - Test state changes
  - Verify function calls
  - Check error messages
  
  DELIVERABLES:
  1. Complete test file(s)
  2. Mock utilities
  3. Test fixtures
  4. Setup/teardown helpers
  
  Use patterns from shared/testing-utilities for consistency.`
})
```

## Framework-Specific Patterns

### React (Jest + React Testing Library)
```javascript
describe('Component', () => {
  beforeEach(() => {
    // Setup
  });
  
  it('renders correctly', () => {
    // Test
  });
  
  it('handles user interaction', () => {
    // Test
  });
});
```

### Vue (Vitest + Vue Test Utils)
```javascript
describe('Component', () => {
  it('mounts successfully', () => {
    // Test
  });
});
```

### Python (Pytest)
```python
class TestService:
    def test_method_success(self):
        # Test
        
    def test_method_error(self):
        # Test
```

### PHP (PHPUnit)
```php
class ServiceTest extends TestCase {
    public function testMethodSuccess() {
        // Test
    }
}
```

## Output Location
`project-types/${projectType}/${framework}/tests/unit/`