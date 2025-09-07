# PA-QA: Project Assistant Quality Assurance Framework

A comprehensive testing and quality assurance reference framework for our web development agency. This repository contains templates, configurations, and best practices for setting up testing across different project types.

## 📁 Directory Structure

```
pa-qa/
├── project-types/           # Templates organized by project type
│   ├── web-apps/           # Modern web applications
│   │   ├── react/          # React SPA templates
│   │   ├── nextjs/         # Next.js full-stack templates
│   │   └── vue/            # Vue.js templates
│   ├── wordpress/          # WordPress projects
│   │   ├── plugin/         # WordPress plugin testing
│   │   ├── theme/          # WordPress theme testing
│   │   └── full-site/      # Full WordPress site testing
│   ├── api-services/       # Backend API services
│   │   ├── fastapi/        # Python FastAPI templates
│   │   ├── express/        # Node.js Express templates
│   │   └── graphql/        # GraphQL API templates
│   ├── mobile-apps/        # Mobile applications
│   │   ├── react-native/   # React Native templates
│   │   └── flutter/        # Flutter templates
│   └── static-sites/       # Static site generators
│       ├── gatsby/         # Gatsby templates
│       ├── hugo/           # Hugo templates
│       └── 11ty/           # Eleventy templates
│
├── shared/                 # Shared resources across all projects
│   ├── testing-utilities/  # Reusable testing utilities
│   │   ├── helpers/        # Common test helpers
│   │   ├── fixtures/       # Shared test fixtures
│   │   └── mocks/          # Mock services and data
│   ├── ci-cd-templates/    # CI/CD pipeline templates
│   │   ├── github-actions/ # GitHub Actions workflows
│   │   ├── bitbucket/      # Bitbucket Pipelines
│   │   └── gitlab/         # GitLab CI templates
│   ├── docker-templates/   # Docker configurations
│   │   ├── development/    # Dev environment containers
│   │   ├── testing/        # Test environment containers
│   │   └── production/     # Production-ready containers
│   ├── linting-configs/    # Code quality configurations
│   │   ├── javascript/     # ESLint configs
│   │   ├── typescript/     # TypeScript + ESLint
│   │   ├── python/         # Flake8, Black, mypy
│   │   └── php/            # PHP CS Fixer, PHPStan
│   ├── allure-config/      # Allure reporting setup
│   ├── monitoring-scripts/ # Performance monitoring
│   └── security-scanning/  # Security test templates
│
├── docs/                   # Documentation
│   ├── setup-guides/       # Step-by-step setup instructions
│   ├── best-practices/     # Testing best practices
│   └── troubleshooting/    # Common issues and solutions
│
└── blog-poster-reference/  # Reference implementation
    └── (symlink to ~/apps/blog-poster)
```

## 🚀 Quick Start

### For a New React Project:
```bash
cp -r project-types/web-apps/react/tests/* your-project/tests/
cp shared/linting-configs/javascript/.eslintrc.js your-project/
cp shared/ci-cd-templates/github-actions/react-test.yml your-project/.github/workflows/
```

### For a WordPress Project:
```bash
cp -r project-types/wordpress/full-site/tests/* your-project/tests/
cp shared/docker-templates/testing/wordpress-compose.yml your-project/
cp shared/linting-configs/php/phpcs.xml your-project/
```

## 🧪 Testing Stack

### Frontend Testing
- **Playwright** - E2E testing across browsers
- **Jest/Vitest** - Unit and component testing
- **React Testing Library** - React component testing
- **Cypress** - Alternative E2E testing

### Backend Testing
- **Pytest** (Python) - FastAPI/Django testing
- **Jest** (Node.js) - Express/NestJS testing
- **PHPUnit** (PHP) - WordPress/Laravel testing

### Specialized Testing
- **Allure** - Centralized test reporting
- **K6/Artillery** - Performance testing
- **axe-core/Pa11y** - Accessibility testing
- **Percy/Chromatic** - Visual regression testing

## 📊 Allure Dashboard Integration

All projects report to our centralized Allure dashboard at `allure.projectassistant.ai`

### Setup for Your Project:
1. Install Allure reporter for your test framework
2. Configure test runner to generate Allure results
3. Use the shared upload script after test runs
4. View results at: `https://allure.projectassistant.ai/projects/YOUR-PROJECT`

## 🔧 Shared Utilities

### Test Helpers
- Database seeders and cleaners
- Authentication helpers
- API client wrappers
- Email testing utilities
- File upload helpers

### Docker Templates
- Multi-stage builds for optimal size
- Development hot-reload configurations
- Test environment isolation
- Production security hardening

### CI/CD Templates
- Parallel test execution
- Caching strategies
- Deployment gates
- Notification integrations

## 📚 Documentation

- [Initial Setup Guide](docs/setup-guides/initial-setup.md)
- [Playwright Best Practices](docs/best-practices/playwright.md)
- [WordPress Testing Guide](docs/setup-guides/wordpress-testing.md)
- [Allure Configuration](docs/setup-guides/allure-setup.md)
- [Docker Testing Environments](docs/setup-guides/docker-testing.md)

## 🎯 Project Type Templates

### Web Applications (React/Next.js)
- Component testing with React Testing Library
- E2E testing with Playwright
- API mocking with MSW
- Accessibility testing with axe-core
- Performance monitoring with Lighthouse

### WordPress Sites
- PHPUnit for plugin/theme testing
- Playwright for admin UI testing
- WP-CLI integration tests
- Database transaction testing
- Multisite testing support

### API Services
- Contract testing with Pact
- Load testing with K6
- Security testing with OWASP ZAP
- API documentation testing
- GraphQL schema validation

### Mobile Apps
- Detox for React Native E2E
- Appium for cross-platform testing
- Device farm integration
- Performance profiling
- Crash reporting setup

## 🤝 Contributing

1. Add new templates in the appropriate `project-types/` directory
2. Share reusable utilities in the `shared/` directory
3. Document any new patterns in the `docs/` directory
4. Update this README with new additions

## 📞 Support

For questions or issues with testing setup:
1. Check the troubleshooting guide
2. Review the blog-poster reference implementation
3. Contact the QA team lead

---

**Maintained by:** Project Assistant Web Development Agency  
**Last Updated:** September 2025  
**Version:** 1.0.0