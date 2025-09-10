# PA-QA Testing Agents

This directory contains specialized agent configurations for the PA-QA testing framework. Each agent is designed to handle specific aspects of test suite generation and validation.

## 📁 Agent Categories

### testing/
Agents focused on generating different types of tests:
- **unit-test-agent**: Creates unit test templates
- **integration-test-agent**: Generates API and database integration tests
- **e2e-test-agent**: Builds Playwright/Cypress E2E test suites
- **performance-test-agent**: Sets up K6/Artillery load testing
- **accessibility-test-agent**: Implements axe-core/Pa11y testing

### research/
Agents for gathering testing best practices:
- **framework-research-agent**: Discovers framework-specific patterns
- **blog-poster-analyzer**: Extracts patterns from reference project
- **best-practices-agent**: Researches industry testing standards

### implementation/
Agents that create supporting infrastructure:
- **docker-config-agent**: Generates test container configurations
- **ci-cd-agent**: Creates GitHub Actions/Bitbucket pipelines
- **allure-setup-agent**: Configures Allure reporting
- **mock-data-agent**: Creates fixtures and mock services

### validation/
Agents that ensure quality:
- **coverage-validator**: Checks test coverage metrics
- **pattern-validator**: Ensures consistent patterns
- **security-scanner**: Validates security testing

## 🚀 Usage Pattern

```typescript
// Example: Generate complete React test suite
const testSuiteAgents = [
  await Task({
    subagent_type: "general-purpose",
    description: "Research React patterns",
    prompt: researchAgent.getPrompt("react")
  }),
  await Task({
    subagent_type: "general-purpose",
    description: "Generate unit tests",
    prompt: unitTestAgent.getPrompt("react")
  }),
  await Task({
    subagent_type: "general-purpose",
    description: "Generate E2E tests",
    prompt: e2eAgent.getPrompt("react")
  }),
  await Task({
    subagent_type: "general-purpose",
    description: "Setup CI/CD",
    prompt: cicdAgent.getPrompt("github-actions")
  })
];
```

## 🎯 Agent Coordination

Agents work in parallel but follow this logical flow:

1. **Research Phase** (research/)
   - Gather best practices
   - Analyze existing patterns
   - Identify requirements

2. **Generation Phase** (testing/)
   - Create test templates
   - Generate utilities
   - Build fixtures

3. **Infrastructure Phase** (implementation/)
   - Setup Docker containers
   - Configure CI/CD
   - Add reporting tools

4. **Validation Phase** (validation/)
   - Check coverage
   - Validate patterns
   - Ensure quality

## 📊 Performance Metrics

| Agent Type | Avg Duration | Output Size |
|------------|--------------|-------------|
| Research | 30-60s | 5-10 KB |
| Unit Tests | 45-90s | 20-50 KB |
| E2E Tests | 60-120s | 30-60 KB |
| CI/CD Setup | 30-45s | 10-15 KB |
| Validation | 15-30s | 2-5 KB |

## 🔧 Configuration

Each agent can be configured with:
- **Framework**: react, vue, nextjs, wordpress, fastapi
- **Test Level**: unit, integration, e2e, performance, accessibility
- **Coverage Target**: 70%, 80%, 90%
- **Output Format**: jest, vitest, pytest, phpunit

## ✅ Quality Standards

All agents must:
- Generate runnable tests out of the box
- Include comprehensive assertions
- Follow framework best practices
- Integrate with CI/CD pipelines
- Support Docker environments
- Include documentation