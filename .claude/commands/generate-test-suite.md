# Generate Test Suite Command

Generate a comprehensive test suite for a specific project type using multi-agent workflow.

## Usage
```
/generate-test-suite <project-type> <framework> [options]
```

## Examples
```
/generate-test-suite web-app react --with-e2e --with-a11y
/generate-test-suite api-service fastapi --with-load-testing
/generate-test-suite wordpress plugin --with-multisite
```

## Multi-Agent Workflow

When this command is invoked:

1. **Research Agent**: Analyzes best practices and existing patterns
2. **Unit Test Agent**: Creates unit test templates
3. **Integration Agent**: Generates integration test suites
4. **E2E Agent**: Builds end-to-end test scenarios
5. **Performance Agent**: Sets up performance testing
6. **Accessibility Agent**: Adds accessibility testing
7. **CI/CD Agent**: Creates pipeline configurations
8. **Docker Agent**: Generates test containers

All agents run in parallel for maximum efficiency.

## Implementation

```typescript
// Launch all agents simultaneously
const agents = [
  Task({
    subagent_type: "general-purpose",
    description: "Research testing patterns",
    prompt: `Research best practices for ${framework} testing.
             Check blog-poster-reference for existing patterns.
             Identify required test utilities and fixtures.`
  }),
  
  Task({
    subagent_type: "general-purpose",
    description: "Generate unit tests",
    prompt: `Create unit test templates for ${framework}.
             Include: component tests, service tests, utility tests.
             Follow patterns from shared/testing-utilities.`
  }),
  
  Task({
    subagent_type: "general-purpose",
    description: "Generate E2E tests",
    prompt: `Create Playwright E2E test suite.
             Cover critical user paths and edge cases.
             Include accessibility checks.`
  }),
  
  Task({
    subagent_type: "general-purpose",
    description: "Setup CI/CD",
    prompt: `Create GitHub Actions workflow for testing.
             Include parallel test execution, caching, Allure reporting.`
  })
];
```

## Output Structure

Generated files will be placed in:
```
project-types/
└── <project-type>/
    └── <framework>/
        ├── tests/
        │   ├── unit/
        │   ├── integration/
        │   ├── e2e/
        │   ├── performance/
        │   └── accessibility/
        ├── configs/
        │   ├── jest.config.js
        │   ├── playwright.config.ts
        │   └── .eslintrc.js
        ├── docker/
        │   └── docker-compose.test.yml
        └── .github/
            └── workflows/
                └── test.yml
```