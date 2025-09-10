# PA-QA Project Instructions - Multi-Agent Testing Framework

## Project Purpose
This repository serves as the central testing and quality assurance reference for our web development agency, powered by multi-agent workflows for rapid test suite generation. It contains templates, configurations, and best practices that should be used across all client projects to ensure consistent, high-quality testing.

## 🤖 Multi-Agent Workflow Approach
This project uses parallel agent execution for maximum efficiency. When generating test suites or templates, multiple specialized agents work simultaneously on different aspects (unit tests, E2E tests, CI/CD setup, etc.). See `memory/multi-agent-workflow.md` for patterns.

## Key Objectives
1. **Standardize Testing** - Provide consistent testing templates for all project types
2. **Share Resources** - Centralize reusable testing utilities and configurations
3. **Document Best Practices** - Maintain up-to-date testing guidelines and patterns
4. **Enable Rapid Setup** - Allow developers to quickly set up comprehensive testing for new projects

## Directory Structure Guidelines

### `/project-types/`
- Each subdirectory represents a specific project type (web-apps, wordpress, api-services, etc.)
- Templates should be complete and ready to copy into new projects
- Include example tests that demonstrate best practices
- Maintain framework-specific configurations (React vs Vue, FastAPI vs Express)

### `/shared/`
- Only add truly reusable components that work across multiple project types
- Keep utilities generic and well-documented
- Version configurations appropriately for different tool versions
- Maintain backward compatibility when updating shared resources

### `/docs/`
- Keep documentation concise and actionable
- Include real examples from the blog-poster reference
- Update guides when new patterns are discovered
- Link to official documentation for tools

## Testing Standards

### Required Testing Levels
1. **Unit Tests** - Minimum 70% code coverage for business logic
2. **Integration Tests** - API endpoints, database operations, third-party services
3. **E2E Tests** - Critical user paths and workflows
4. **Performance Tests** - For high-traffic or resource-intensive features
5. **Accessibility Tests** - WCAG 2.1 AA compliance

### Testing Tools by Language

#### JavaScript/TypeScript
- **Unit/Component**: Jest, Vitest, React Testing Library
- **E2E**: Playwright (primary), Cypress (alternative)
- **Performance**: Lighthouse CI, WebPageTest
- **Accessibility**: axe-core, Pa11y

#### Python
- **Unit/Integration**: Pytest with pytest-asyncio
- **Mocking**: unittest.mock, pytest-mock
- **Coverage**: pytest-cov
- **Performance**: Locust, pytest-benchmark

#### PHP/WordPress
- **Unit**: PHPUnit
- **Integration**: WP-CLI tests, WordPress Test Suite
- **Code Quality**: PHP_CodeSniffer, PHPStan
- **Database**: Database transactions, fixtures

## Allure Reporting Integration

All projects must integrate with our centralized Allure dashboard:
- **URL**: `https://allure.projectassistant.ai`
- **Upload Script**: Use `shared/allure-config/upload-results.sh`
- **Project Naming**: Use kebab-case (e.g., `client-name-project-type`)
- **History**: Maintain last 30 test runs per project

## Docker-First Approach

All testing must be executable in Docker containers:
- **Consistency**: Same environment locally and in CI/CD
- **Isolation**: No pollution between test runs
- **Portability**: Tests run on any machine with Docker
- **Templates**: Use configurations from `shared/docker-templates/testing/`

## CI/CD Integration

### GitHub Actions (Primary)
- Use templates from `shared/ci-cd-templates/github-actions/`
- Run tests in parallel when possible
- Upload results to Allure on every push to main
- Cache dependencies appropriately

### Bitbucket Pipelines
- Use templates from `shared/ci-cd-templates/bitbucket/`
- Configure for client projects still on Bitbucket
- Ensure compatibility with Docker-in-Docker

## Adding New Templates (Multi-Agent Approach)

When adding templates for new frameworks or project types, use the multi-agent workflow:

1. **Launch Research Agents**: Spawn parallel agents to research best practices
2. **Generate Test Suites**: Multiple agents create different test types simultaneously
3. **Validate Quality**: Validation agents ensure coverage and standards
4. **Create Structure**:
   ```
   project-types/[type]/[framework]/
   ├── tests/
   │   ├── unit/
   │   ├── integration/
   │   ├── e2e/
   │   └── fixtures/
   ├── configs/
   │   ├── jest.config.js
   │   ├── playwright.config.ts
   │   └── .eslintrc.js
   ├── docker/
   │   ├── Dockerfile.test
   │   └── docker-compose.test.yml
   └── README.md
   ```
4. **Document**: Add setup instructions and examples
5. **Test**: Verify templates work in a fresh project
6. **Share**: Move reusable parts to `/shared/`

## Quality Checklist

Before marking any testing template as complete:
- [ ] Includes unit test examples
- [ ] Includes integration test examples
- [ ] Includes E2E test examples
- [ ] Has Docker configuration
- [ ] Has CI/CD pipeline template
- [ ] Integrates with Allure reporting
- [ ] Includes linting configuration
- [ ] Has clear documentation
- [ ] Contains working examples
- [ ] Tested in isolation

## Maintenance

### Weekly Tasks
- Review and update dependencies in shared configurations
- Check for new versions of testing tools
- Update documentation based on team feedback

### Monthly Tasks
- Audit Allure dashboard for stale projects
- Review and optimize CI/CD pipelines
- Update best practices based on industry changes

### Quarterly Tasks
- Major version updates for testing frameworks
- Refactor shared utilities based on usage patterns
- Team training on new testing techniques

## Support Resources

### Internal
- Blog-poster reference: `blog-poster-reference/` (symlink)
- Team Slack: #qa-testing channel
- Wiki: Internal testing playbook

### External
- [Playwright Docs](https://playwright.dev/docs/intro)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Pytest Documentation](https://docs.pytest.org/)
- [PHPUnit Documentation](https://phpunit.de/documentation.html)
- [Allure Documentation](https://docs.qameta.io/allure/)

## Multi-Agent Commands

### Generate Complete Test Suite
```bash
/generate-test-suite web-app react --with-e2e --with-a11y
```
This spawns multiple agents in parallel to create:
- Unit test templates
- Integration test suites
- E2E test scenarios
- Performance tests
- CI/CD configurations
- Docker test environments

See `.claude/commands/generate-test-suite.md` for details.

## Agent Directory Structure
```
agents/
├── testing/           # Test generation agents
├── research/          # Best practices research
├── implementation/    # Infrastructure setup
└── validation/        # Quality assurance
```

## Version History
- **v2.0.0** (Sept 2025) - Multi-agent workflow integration
  - Parallel test suite generation
  - Intelligent research agents
  - Automated validation
- **v1.0.0** (Sept 2025) - Initial framework setup with blog-poster reference
  - Templates for React, WordPress, FastAPI
  - Allure dashboard integration
  - Docker-first testing approach

---

**Remember**: The goal is to make testing setup so easy that there's no excuse not to have comprehensive tests in every project! With multi-agent workflows, complete test suites can be generated in minutes, not hours.