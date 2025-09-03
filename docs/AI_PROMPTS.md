# AI Assistant Prompts for PA-QA Implementation

Copy these prompts to use with Claude, ChatGPT, or other AI coding assistants to implement Project Assistant's testing standards.

## 🚀 Complete Project Setup

### Full Testing Framework Implementation
```
I need to implement comprehensive E2E testing following PA-QA framework standards from https://github.com/anthonyscolaro/pa-qa

Project Details:
- Application type: [React/Vue/Angular/Next.js]
- Backend: [Node.js/Python/Java/.NET]
- Database: [PostgreSQL/MySQL/MongoDB]
- Authentication: [JWT/OAuth/Session-based]

Please provide:
1. Complete Playwright + TypeScript setup
2. Folder structure following PA-QA patterns
3. playwright.config.ts with multiple browsers
4. tsconfig.json for test files
5. Page Object Models for main pages
6. Test data factories
7. Helper utilities (API client, database helper)
8. Docker compose for test environment
9. CI/CD workflow (GitHub Actions)
10. Example tests for authentication and main features

Focus on TypeScript, maintainability, and following PA-QA patterns exactly.
```

## 📁 Project Structure

### Create Test Architecture
```
Following PA-QA standards, create this test structure for my project:

tests/
├── e2e/
│   ├── smoke/           # Quick health checks
│   ├── auth/            # Authentication tests
│   └── features/        # Feature-specific tests
├── helpers/
│   ├── page-objects/    # Page Object Models
│   ├── factories/       # Test data generation
│   ├── api-clients/     # API testing helpers
│   └── types/           # TypeScript type definitions
├── fixtures/            # Shared test data
└── config/             # Test configuration

Generate:
1. Base page object class with common methods
2. Example page objects for login and dashboard
3. User factory with TypeScript interfaces
4. API client helper with typed responses
5. Custom test types and interfaces
```

## 🎭 Playwright Configuration

### Generate playwright.config.ts
```
Create a playwright.config.ts following PA-QA standards with:

- TypeScript configuration
- Multiple browser projects (Chrome, Firefox, Safari)
- Mobile viewports (iPhone 12, Pixel 5)
- Allure reporter integration
- Screenshot on failure
- Video on failure
- Retry logic (2 retries in CI)
- Parallel execution settings
- Environment-specific base URLs (.env.test)
- Timeouts: 30s for tests, 10s for actions
- Test output directory structure

My app runs on [port] and needs [any special configuration].
```

## 📄 Page Objects

### Login Page Object
```
Create a TypeScript Page Object for login following PA-QA patterns:

Page elements:
- Email input: [selector]
- Password input: [selector]
- Remember me checkbox: [selector]
- Submit button: [selector]
- Forgot password link: [selector]
- Error message: [selector]

Requirements:
- Extend from BasePage class
- Use TypeScript with proper typing
- Include login() method
- Include validation methods
- Add wait strategies
- Handle loading states
- Include JSDoc comments
```

### Complex Page Object
```
Create a Page Object for a data table page with PA-QA patterns:

Features:
- Data table with sorting
- Search/filter inputs
- Pagination controls
- Row actions (edit, delete)
- Bulk selection
- Export buttons

Include methods for:
- Searching and filtering
- Sorting columns
- Navigating pages
- Selecting rows
- Performing bulk actions
- Waiting for data to load

Use TypeScript interfaces for row data structure.
```

## 🏭 Test Data Factories

### User Factory
```
Create a TypeScript test data factory following PA-QA patterns:

Generate test data for:
- Users (email, password, name, role)
- Products (name, price, description, category)
- Orders (items, shipping, payment)

Requirements:
- Use @faker-js/faker
- TypeScript interfaces for all data types
- Methods for single and batch creation
- Methods for specific scenarios (invalid data, edge cases)
- Consistent password generation
- Unique email generation
```

## 🧪 Test Suites

### Authentication Test Suite
```
Create a complete authentication test suite following PA-QA patterns:

Test scenarios:
1. Successful login with valid credentials
2. Failed login with invalid password
3. Failed login with non-existent user
4. Remember me functionality
5. Logout functionality
6. Session expiration handling
7. Password reset flow
8. Account lockout after failed attempts

Use:
- TypeScript
- Page Object Model
- Test data factories
- Proper test isolation
- Before/after hooks
- Test tags for organization
```

### E2E User Journey
```
Create an E2E test for complete user journey following PA-QA:

Journey: [Describe the flow, e.g., "User registers, browses products, adds to cart, checks out"]

Include:
- Setup and teardown
- Test data preparation
- Multiple assertions at each step
- Error handling
- Screenshot at key points
- Performance timing
- Cleanup after test
```

## 🐳 Docker Configuration

### Docker Compose for Testing
```
Create docker-compose.yml for testing environment following PA-QA:

Services needed:
- Playwright test runner
- Application (if needed)
- Database (test instance)
- Mailpit for email testing
- Allure reporting service

Include:
- Proper networking
- Volume mounts for test results
- Environment variables
- Health checks
- Profiles for different test scenarios
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow
```
Create .github/workflows/e2e-tests.yml following PA-QA standards:

Requirements:
- Trigger on PR and push to main
- Set up Node.js and dependencies
- Cache node_modules
- Install Playwright browsers
- Run tests in parallel
- Upload test artifacts
- Publish Allure report
- Comment on PR with results
- Fail check if tests fail

Include matrix strategy for multiple OS if needed.
```

## 🔍 Debugging & Troubleshooting

### Debug Configuration
```
Set up debugging configuration for Playwright tests:

1. VS Code launch.json for debugging tests
2. Playwright Inspector setup
3. Trace viewer configuration
4. Console log helpers
5. Custom debug utilities
6. Network request logging
7. Screenshot helpers

Follow PA-QA patterns for maintainable debugging.
```

## 📊 Reporting

### Allure Setup
```
Configure Allure reporting following PA-QA standards:

1. Install allure-playwright
2. Configure in playwright.config.ts
3. Set up categories for failures
4. Add environment information
5. Create report generation script
6. Set up historical trends
7. Configure CI artifact upload

Generate example script to view reports locally.
```

## 🎯 Specific Test Patterns

### Retry Logic and Flaky Test Handling
```
Implement retry logic for flaky operations following PA-QA:

Scenarios that need retry:
- Network requests
- Element visibility
- Database operations
- File uploads

Create utilities for:
- Custom retry function with exponential backoff
- Wrapper for flaky assertions
- Smart wait strategies
- Timeout configurations
```

### API Testing Integration
```
Create API testing helpers integrated with UI tests (PA-QA pattern):

1. API client class with TypeScript
2. Authentication token management
3. Request/response interceptors
4. Type-safe request methods
5. Integration with UI tests (setup via API)
6. Response validation helpers
7. Performance timing

Use for test data setup and validation.
```

### Database Helpers
```
Create database helper utilities following PA-QA patterns:

Operations:
- User verification after registration
- Data cleanup after tests
- Seed data creation
- Direct database queries for validation

Requirements:
- TypeScript with proper typing
- Connection pooling
- Transaction support
- Safe cleanup methods
- Query builders
```

## 💡 Tips for Using These Prompts

1. **Be Specific**: Replace placeholders like [selector] with actual values
2. **Provide Context**: Describe your application's specific needs
3. **Iterate**: Start with basic implementation, then add complexity
4. **Combine Prompts**: Use multiple prompts together for complete implementation
5. **Review Output**: Always review AI-generated code for security and best practices

## 📝 Custom Prompt Template

```
Following PA-QA framework standards (https://github.com/anthonyscolaro/pa-qa):

Task: [Describe what you need]

Context:
- Application: [Your app details]
- Current setup: [What you already have]
- Specific requirements: [Any special needs]

Please provide:
1. [Specific deliverable 1]
2. [Specific deliverable 2]
3. [Tests to verify the implementation]

Use TypeScript, follow PA-QA patterns, and include error handling.
```

---

Remember: These prompts are starting points. Customize them based on your specific project needs while maintaining PA-QA standards.