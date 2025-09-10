# Multi-Agent Testing Framework Workflow

## 🚀 Core Principle: Parallel Test Development

**ALWAYS spawn multiple agents concurrently for independent testing tasks.** This dramatically improves test suite creation speed and coverage.

## 📋 When to Use Multi-Agent Workflows in PA-QA

### Automatic Multi-Agent Triggers
1. **New project template creation** - Spawn agents for each test type
2. **Test suite generation** - Multiple agents for unit/integration/E2E
3. **Cross-framework testing** - Parallel creation for React/Vue/Next.js
4. **Performance benchmarking** - Concurrent load and stress testing
5. **Accessibility auditing** - Multiple agents for different WCAG criteria

### Testing Tasks Suitable for Multi-Agent
- **Test template generation** - Different test types simultaneously
- **Framework migration** - Port tests across frameworks in parallel
- **Coverage analysis** - Multiple agents analyzing different modules
- **Security scanning** - Concurrent vulnerability assessments
- **Documentation generation** - Create guides while writing tests

## 🎯 PA-QA Multi-Agent Patterns

### Pattern 1: Complete Test Suite Generator
```typescript
// Launch all test type agents simultaneously
const testAgents = [
  Task({
    subagent_type: "general-purpose",
    description: "Generate unit tests",
    prompt: `Create comprehensive unit tests for [component/module].
             Include: edge cases, error handling, mocking, assertions.
             Use Jest/Vitest patterns from shared/testing-utilities.`
  }),
  Task({
    subagent_type: "general-purpose",
    description: "Generate integration tests",
    prompt: `Create integration tests for API endpoints and database.
             Test: authentication, data flow, error responses.
             Follow patterns from project-types/api-services.`
  }),
  Task({
    subagent_type: "general-purpose",
    description: "Generate E2E tests",
    prompt: `Create Playwright E2E tests for critical user paths.
             Cover: login, main workflow, edge cases.
             Use templates from project-types/web-apps.`
  })
];
```

### Pattern 2: Framework Template Porting
```typescript
// Port test templates across frameworks in parallel
Task({
  subagent_type: "general-purpose",
  description: "Port to React",
  prompt: "Adapt test templates for React Testing Library..."
});

Task({
  subagent_type: "general-purpose",
  description: "Port to Vue",
  prompt: "Adapt test templates for Vue Test Utils..."
});

Task({
  subagent_type: "general-purpose",
  description: "Port to Next.js",
  prompt: "Adapt test templates for Next.js with App Router..."
});
```

### Pattern 3: Intelligent Test Research Agent
```typescript
Task({
  subagent_type: "general-purpose",
  description: "Research testing best practices",
  prompt: `You are an expert QA architect for PA-QA framework.
  
  PHASE 1 - Analysis:
  - Review blog-poster-reference for existing patterns
  - Identify gaps in current test coverage
  - Find industry best practices for [framework]
  
  PHASE 2 - Pattern Discovery:
  - Extract reusable testing patterns
  - Identify common test utilities needed
  - Document anti-patterns to avoid
  
  PHASE 3 - Template Design:
  - Create comprehensive test template structure
  - Design helper functions and fixtures
  - Plan CI/CD integration approach
  
  PHASE 4 - Implementation:
  - Generate complete test suite templates
  - Create reusable testing utilities
  - Build Docker test environments
  
  PHASE 5 - Documentation:
  - Write setup guides for developers
  - Document testing best practices
  - Create troubleshooting guides
  
  Return actionable templates ready for project-types/ directory.`
})
```

### Pattern 4: Test Validation Agent
```typescript
Task({
  subagent_type: "general-purpose",
  description: "Validate test quality",
  prompt: `Review generated tests for:
  - Code coverage (minimum 70%)
  - Edge case handling
  - Performance impact
  - Accessibility compliance
  - Security considerations
  
  Return specific improvements needed.`
})
```

## 🔄 Multi-Agent Coordination for Testing

### Test Suite Assembly
```typescript
// Good: Clear responsibilities for each agent
const unitAgent = Task({...});      // Returns: Component tests
const apiAgent = Task({...});        // Returns: API tests
const e2eAgent = Task({...});        // Returns: User flow tests
const perfAgent = Task({...});       // Returns: Load tests
const a11yAgent = Task({...});       // Returns: Accessibility tests

// Coordinate outputs into complete test suite
// Merge into project-types/[type]/tests/ structure
```

### Parallel Testing Environments
```typescript
// Spawn agents for different environments
const agents = [
  dockerAgent,     // Create Docker test containers
  ciAgent,         // Setup GitHub Actions
  localAgent,      // Configure local testing
  stagingAgent     // Setup staging tests
];
```

## 📊 PA-QA Agent Performance Guidelines

### Optimal Agent Distribution
- **2-3 agents**: Single framework test suite
- **4-6 agents**: Multi-framework templates
- **8-10 agents**: Complete project type with all test levels

### Agent Task Duration
- **Quick** (< 1min): Generate single test file
- **Medium** (1-3min): Create test suite for component
- **Long** (3-5min): Full framework template with utilities

## 🚨 PA-QA Critical Rules

1. **ALWAYS parallelize** test generation for different test types
2. **REUSE patterns** from blog-poster-reference when available
3. **VALIDATE tests** with dedicated agent before committing
4. **DOCUMENT patterns** for team reusability
5. **COORDINATE templates** into proper project-types structure

## 📝 PA-QA Specific Scenarios

### Scenario 1: New React Project Template
```typescript
const agents = [
  unitTestAgent,        // Jest + React Testing Library
  integrationAgent,     // API mocking with MSW
  e2eAgent,            // Playwright tests
  accessibilityAgent,   // axe-core integration
  performanceAgent,     // Lighthouse CI setup
  dockerAgent,         // Test container config
  cicdAgent           // GitHub Actions workflow
];
```

### Scenario 2: WordPress Testing Suite
```typescript
const agents = [
  phpUnitAgent,        // PHP unit tests
  wpCliAgent,          // WP-CLI integration tests
  seleniumAgent,       // Browser automation
  databaseAgent,       // Transaction testing
  multiSiteAgent,      // Multi-site specific tests
  securityAgent       // Security scanning
];
```

### Scenario 3: API Service Testing
```typescript
const agents = [
  contractAgent,       // Pact contract tests
  loadAgent,          // K6 load testing
  securityAgent,      // OWASP ZAP integration
  graphqlAgent,       // Schema validation
  postmanAgent       // Collection generation
];
```

## 🔧 Tools for PA-QA Multi-Agent Work

- **Task tool**: Spawn testing agents
- **TodoWrite**: Track template creation progress
- **WebFetch**: Research testing documentation
- **MultiEdit**: Apply patterns across files

## ✅ Success Metrics for PA-QA

Effective multi-agent testing achieves:
- **70% faster** test template creation
- **Comprehensive coverage** across all test types
- **Reusable patterns** in shared/ directory
- **Framework-agnostic** utilities
- **Zero-setup** test environments with Docker