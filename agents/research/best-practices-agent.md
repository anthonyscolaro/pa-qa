# Best Practices Research Agent

## Purpose
Research and compile testing best practices for different frameworks and project types.

## Capabilities
- Industry standard analysis
- Framework-specific patterns
- Anti-pattern identification
- Performance optimization strategies
- Security testing requirements
- Accessibility standards

## Prompt Template
```typescript
Task({
  subagent_type: "general-purpose",
  description: "Research testing best practices for ${framework}",
  prompt: `You are a QA research specialist. Compile comprehensive testing best practices for ${framework}.

  RESEARCH AREAS:
  - Official documentation patterns
  - Community best practices
  - Common pitfalls to avoid
  - Performance considerations
  - Security testing requirements
  - Accessibility standards
  
  FRAMEWORK: ${framework}
  PROJECT TYPE: ${projectType}
  
  PHASE 1 - Documentation Research:
  - Review official ${framework} testing docs
  - Analyze recommended patterns
  - Identify core testing principles
  - Note version-specific considerations
  
  PHASE 2 - Pattern Analysis:
  - Extract reusable testing patterns
  - Document test structure conventions
  - Identify helper utilities needed
  - Catalog mock strategies
  
  PHASE 3 - Anti-Pattern Detection:
  - Common testing mistakes
  - Performance bottlenecks
  - Flaky test patterns
  - Over-mocking issues
  
  PHASE 4 - Tool Evaluation:
  - Recommended testing libraries
  - CI/CD integration options
  - Reporting tools
  - Code coverage tools
  
  PHASE 5 - Standards Compilation:
  - Coverage requirements (70%+)
  - Performance benchmarks
  - Accessibility compliance (WCAG 2.1 AA)
  - Security testing checklist
  
  DELIVERABLES:
  1. Best practices document
  2. Testing checklist
  3. Tool recommendations
  4. Example patterns
  5. Anti-pattern guide
  
  Research from:
  - Official documentation
  - Testing blogs and guides
  - GitHub popular repositories
  - Stack Overflow patterns`
})
```

## Research Output Structure

### Best Practices Document
```markdown
# ${Framework} Testing Best Practices

## Core Principles
- Test behavior, not implementation
- Keep tests isolated and independent
- Use descriptive test names
- Follow AAA pattern

## Recommended Structure
- One test file per component/module
- Group related tests with describe blocks
- Use beforeEach for common setup
- Clean up in afterEach

## Mock Strategies
- Mock external dependencies
- Use test doubles for databases
- Avoid over-mocking
- Prefer integration tests when possible

## Performance Guidelines
- Parallelize test execution
- Use test databases/containers
- Optimize setup/teardown
- Cache dependencies in CI

## Common Pitfalls
- Testing implementation details
- Brittle selectors in E2E tests
- Inadequate error case testing
- Missing accessibility checks
```

### Testing Checklist
```markdown
## Testing Checklist

### Unit Tests
- [ ] All public methods tested
- [ ] Edge cases covered
- [ ] Error scenarios handled
- [ ] Mocks properly configured
- [ ] 70%+ code coverage

### Integration Tests
- [ ] API endpoints tested
- [ ] Database operations verified
- [ ] Authentication flows work
- [ ] Error responses correct
- [ ] Data validation works

### E2E Tests
- [ ] Critical paths tested
- [ ] Cross-browser compatibility
- [ ] Mobile responsiveness
- [ ] Accessibility compliance
- [ ] Performance acceptable
```

## Output Location
`docs/best-practices/${framework}/`