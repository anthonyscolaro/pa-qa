# Allure Reporting Infrastructure for PA-QA Framework

Comprehensive Allure integration providing centralized test reporting, trend analysis, and notification systems across all supported testing frameworks.

## 🎯 Overview

This directory contains the complete Allure reporting infrastructure for the PA-QA testing framework. It provides:

- **Framework-specific configurations** for Jest, Vitest, Pytest, and PHPUnit
- **Centralized dashboard** at https://allure.projectassistant.ai
- **Automated result uploads** with retry mechanisms and security
- **Historical trend analysis** with flaky test detection
- **Multi-channel notifications** via Slack, Teams, Discord, and email
- **GitHub Pages deployment** for public report hosting
- **Local report generation** with watch mode and serving capabilities

## 📁 Directory Structure

```
shared/allure-config/
├── allure-jest.js              # Jest Allure reporter configuration
├── allure-vitest.ts            # Vitest Allure reporter configuration  
├── allure-pytest.ini           # Pytest Allure configuration
├── allure-phpunit.xml          # PHPUnit Allure adapter configuration
├── upload-results.sh           # Upload script to centralized dashboard
├── generate-report.sh          # Local report generation script
├── deploy-pages.yml            # GitHub Pages deployment workflow
├── notifications.js            # Slack/email notification system
├── trend-analysis.py           # Historical trend analysis script
└── README.md                   # This documentation
```

## 🚀 Quick Start

### 1. Framework Integration

Choose your testing framework and integrate the appropriate configuration:

#### Jest Projects
```javascript
// jest.config.js
const allureConfig = require('./shared/allure-config/allure-jest.js');

module.exports = {
  ...allureConfig,
  // Your other Jest configuration
};
```

#### Vitest Projects
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import allureConfig from './shared/allure-config/allure-vitest';

export default defineConfig({
  ...allureConfig,
  // Your other Vitest configuration
});
```

#### Pytest Projects
```bash
# Copy the configuration
cp shared/allure-config/allure-pytest.ini pytest.ini

# Install required packages
pip install pytest-allure-adaptor pytest-html pytest-cov
```

#### PHPUnit Projects
```bash
# Copy the configuration  
cp shared/allure-config/allure-phpunit.xml phpunit.xml

# Install required packages via Composer
composer require --dev allure-framework/allure-phpunit
```

### 2. Environment Configuration

Set up your environment variables:

```bash
# Required
export ALLURE_PROJECT_NAME="my-awesome-project"
export ALLURE_API_KEY="your-dashboard-api-key"

# Optional
export ALLURE_RESULTS_DIR="allure-results"
export ALLURE_SERVER_URL="https://allure.projectassistant.ai"
export SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
export EMAIL_TO="qa-team@company.com"
```

### 3. Run Tests and Generate Reports

```bash
# Run your tests (framework-specific)
npm test                    # For Jest/Vitest
pytest                      # For Pytest  
./vendor/bin/phpunit        # For PHPUnit

# Upload results to dashboard
./shared/allure-config/upload-results.sh -p my-project

# Generate local report
./shared/allure-config/generate-report.sh --serve --open
```

## 📊 Dashboard Integration

### Centralized Dashboard

All test reports are automatically uploaded to **https://allure.projectassistant.ai** providing:

- **Multi-project view** with project switching
- **Historical trends** and performance metrics
- **Real-time updates** from CI/CD pipelines
- **Team collaboration** with shared access
- **Advanced filtering** by framework, branch, environment

### Project URLs

Each project gets its own URL following the pattern:
```
https://allure.projectassistant.ai/{project-name}
```

### API Integration

Upload results programmatically:

```bash
# Manual upload
./shared/allure-config/upload-results.sh \
  --project "my-project" \
  --framework "jest" \
  --build "$BUILD_NUMBER" \
  --branch "$BRANCH_NAME" \
  --commit "$COMMIT_SHA"

# With notifications
./shared/allure-config/upload-results.sh \
  --project "my-project" \
  --notify
```

## 🔄 CI/CD Integration

### GitHub Actions

Add the GitHub Pages deployment workflow:

```yaml
# .github/workflows/test-and-deploy.yml
name: Test and Deploy Reports

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      # ... your test steps ...
      
      - name: Upload Allure Results
        if: always()
        run: |
          ./shared/allure-config/upload-results.sh \
            --project "${{ github.repository }}" \
            --framework "jest" \
            --build "${{ github.run_number }}" \
            --branch "${{ github.ref_name }}" \
            --commit "${{ github.sha }}" \
            --notify

  deploy-reports:
    needs: test
    uses: ./.github/workflows/deploy-pages.yml
    if: github.ref == 'refs/heads/main'
```

Copy the complete workflow:
```bash
cp shared/allure-config/deploy-pages.yml .github/workflows/
```

### Other CI Platforms

#### Bitbucket Pipelines
```yaml
pipelines:
  default:
    - step:
        name: Test and Report
        script:
          - npm test
          - ./shared/allure-config/upload-results.sh -p $BITBUCKET_REPO_FULL_NAME -b $BITBUCKET_BUILD_NUMBER
```

#### GitLab CI
```yaml
test:
  script:
    - npm test
    - ./shared/allure-config/upload-results.sh -p $CI_PROJECT_NAME -b $CI_PIPELINE_ID
  artifacts:
    reports:
      allure: allure-results
```

#### Jenkins
```groovy
pipeline {
    agent any
    stages {
        stage('Test') {
            steps {
                sh 'npm test'
                sh "./shared/allure-config/upload-results.sh -p ${env.JOB_NAME} -b ${env.BUILD_NUMBER}"
            }
        }
    }
    post {
        always {
            allure([
                includeProperties: false,
                jdk: '',
                properties: [],
                reportBuildPolicy: 'ALWAYS',
                results: [[path: 'allure-results']]
            ])
        }
    }
}
```

## 📈 Trend Analysis

### Automatic Analysis

Trend analysis runs automatically and provides:

- **Pass rate trends** over 7, 30, and 90 days
- **Performance regression** detection
- **Flaky test identification** with confidence scoring
- **Failure categorization** by root cause
- **Build stability metrics** and predictions

### Manual Analysis

Generate trends locally:

```bash
# Basic trend analysis
python shared/allure-config/trend-analysis.py \
  --project "my-project" \
  --results "./allure-results" \
  --history "./allure-history"

# With visual charts
python shared/allure-config/trend-analysis.py \
  --project "my-project" \
  --charts \
  --format "all"

# For specific time period
python shared/allure-config/trend-analysis.py \
  --days 7 \
  --verbose
```

### Requirements

Install Python dependencies for trend analysis:
```bash
pip install matplotlib pandas numpy
```

## 🔔 Notification System

### Supported Channels

- **Slack** - Rich formatted messages with action buttons
- **Microsoft Teams** - Card-based notifications with facts
- **Discord** - Embedded messages with color coding
- **Email** - HTML formatted reports via SMTP
- **Custom Webhooks** - Configurable for any system

### Configuration

Set up notifications via environment variables:

```bash
# Slack
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
export SLACK_CHANNEL="#qa-testing"

# Microsoft Teams  
export TEAMS_WEBHOOK_URL="https://outlook.office.com/webhook/..."

# Discord
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."

# Email
export SMTP_HOST="smtp.gmail.com"
export SMTP_PORT="587"
export SMTP_USER="your-email@gmail.com"
export SMTP_PASSWORD="your-app-password"
export EMAIL_TO="qa-team@company.com,dev-team@company.com"

# Filtering
export NOTIFY_ONLY_FAILURES="false"
export MIN_FAILURE_COUNT="1"
export ENABLE_TREND_ALERTS="true"
```

### Manual Notifications

Send notifications manually:

```bash
# Success notification
node shared/allure-config/notifications.js \
  --project "my-project" \
  --status "success" \
  --report-url "https://allure.projectassistant.ai/my-project"

# Failure notification with details
node shared/allure-config/notifications.js \
  --project "my-project" \
  --status "failure" \
  --build "123" \
  --branch "main" \
  --commit "abc123def"

# Test configuration (dry run)
node shared/allure-config/notifications.js \
  --project "test" \
  --status "success" \
  --dry-run
```

## 🛠️ Local Development

### Generate Reports Locally

```bash
# Basic report generation
./shared/allure-config/generate-report.sh

# Generate and serve with auto-open
./shared/allure-config/generate-report.sh --serve --open

# Watch mode for development
./shared/allure-config/generate-report.sh --watch --serve --port 3000

# Clean regeneration with trends
./shared/allure-config/generate-report.sh --clean --trends
```

### Install Allure CLI

The script can automatically install Allure:

```bash
# Install/update Allure CLI
./shared/allure-config/generate-report.sh --install

# Check version
./shared/allure-config/generate-report.sh --version
```

### Report Customization

Customize report appearance by creating:

```bash
# Custom categories
cat > allure-results/categories.json << EOF
[
  {
    "name": "API Failures",
    "matchedStatuses": ["failed"],
    "messageRegex": ".*API.*|.*HTTP.*"
  }
]
EOF

# Environment info
cat > allure-results/environment.properties << EOF
Environment=Production
Version=1.2.3
Database=PostgreSQL 13
EOF
```

## 🔧 Advanced Configuration

### Framework-Specific Features

#### Jest Advanced Setup
```javascript
// Enhanced Jest configuration
module.exports = {
  // ... base config from allure-jest.js
  
  // Custom test environment
  setupFilesAfterEnv: [
    'shared/allure-config/jest-allure-setup.js',
    '<rootDir>/tests/custom-setup.js'
  ],
  
  // Coverage integration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
  ],
  
  // Parallel execution
  maxWorkers: '50%',
};
```

#### Vitest Enhanced Configuration
```typescript
export default defineConfig({
  test: {
    // ... base config from allure-vitest.ts
    
    // Custom globals
    globals: true,
    
    // Environment-specific setup
    setupFiles: [
      'shared/allure-config/vitest-allure-test-setup.ts',
      'tests/setup.ts'
    ],
    
    // Browser testing
    browser: {
      enabled: true,
      name: 'chrome',
      headless: true,
    },
  },
});
```

#### Pytest Advanced Setup
```ini
# Additional pytest configuration
[tool:pytest]
# ... base config from allure-pytest.ini

# Custom markers
markers =
    smoke: Smoke tests for CI
    integration: Integration tests
    slow: Slow running tests
    api: API tests
    
# Parallel execution
addopts = 
    -n auto
    --dist loadfile
    
# Plugin configuration
pytest_plugins = [
    "pytest_html",
    "pytest_cov", 
    "pytest_xdist",
]
```

#### PHPUnit Enhanced Configuration
```xml
<!-- Additional PHPUnit configuration -->
<phpunit>
    <!-- Base configuration from allure-phpunit.xml -->
    
    <!-- Custom test suites -->
    <testsuites>
        <testsuite name="API">
            <directory>tests/Api</directory>
        </testsuite>
        <testsuite name="Browser">
            <directory>tests/Browser</directory>
        </testsuite>
    </testsuites>
    
    <!-- Laravel-specific setup -->
    <php>
        <env name="APP_ENV" value="testing"/>
        <env name="DB_CONNECTION" value="sqlite"/>
        <env name="DB_DATABASE" value=":memory:"/>
    </php>
</phpunit>
```

### Security Considerations

#### API Key Management

Store API keys securely:

```bash
# Use GitHub Secrets for CI/CD
# Settings > Secrets and variables > Actions
ALLURE_API_KEY="your-secret-key"

# Use environment files locally (never commit!)
echo "ALLURE_API_KEY=your-secret-key" > .env.local

# Load in scripts
source .env.local
```

#### Access Control

Configure dashboard access:

```bash
# Project-specific access
export ALLURE_PROJECT_ACCESS="team-leads,qa-engineers"

# Branch-based filtering
export ALLURE_BRANCH_FILTER="main,develop,release/*"
```

### Performance Optimization

#### Large Result Sets

For projects with many tests:

```bash
# Compress results before upload
export COMPRESSION_ENABLED="true"
export COMPRESSION_LEVEL="6"

# Batch processing
export BATCH_SIZE="100"
export PARALLEL_UPLOADS="true"
```

#### Network Optimization

Optimize upload performance:

```bash
# Retry configuration
export MAX_RETRIES="3"
export RETRY_DELAY="5"
export TIMEOUT="300"

# Connection pooling
export CONNECTION_POOL_SIZE="10"
```

## 🐛 Troubleshooting

### Common Issues

#### Upload Failures
```bash
# Check API connectivity
curl -I https://allure.projectassistant.ai/api/health

# Validate API key
./shared/allure-config/upload-results.sh --dry-run --verbose

# Check results format
allure generate allure-results --dry-run
```

#### Missing Dependencies
```bash
# Install Allure CLI
./shared/allure-config/generate-report.sh --install

# Check Java version (required for Allure)
java -version

# Install Node.js dependencies
npm install allure-jest allure-vitest

# Install Python dependencies  
pip install allure-pytest matplotlib pandas
```

#### Permission Issues
```bash
# Make scripts executable
chmod +x shared/allure-config/*.sh
chmod +x shared/allure-config/*.py
chmod +x shared/allure-config/*.js

# Fix directory permissions
chmod 755 allure-results allure-report
```

### Debug Mode

Enable verbose logging:

```bash
# Upload script
./shared/allure-config/upload-results.sh --verbose

# Report generation
./shared/allure-config/generate-report.sh --verbose

# Notifications
node shared/allure-config/notifications.js --verbose

# Trend analysis
python shared/allure-config/trend-analysis.py --verbose
```

### Log Analysis

Check logs for issues:

```bash
# CI/CD logs
grep -i "allure" .github/workflows/*.yml

# Application logs
tail -f logs/allure-upload.log

# System logs
journalctl -u allure-server
```

## 📚 Best Practices

### Test Organization

Structure tests for optimal reporting:

```javascript
// Good: Descriptive test names
describe('User Authentication API', () => {
  it('should login with valid credentials', () => {
    // Test implementation
  });
  
  it('should reject login with invalid password', () => {
    // Test implementation
  });
});

// Good: Use test metadata
test('should process payment successfully', () => {
  allure.feature('Payments');
  allure.story('Credit Card Processing');
  allure.severity('critical');
  // Test implementation
});
```

### Result Quality

Ensure high-quality reports:

```javascript
// Add meaningful attachments
await allure.attachment('Request Payload', JSON.stringify(requestData), 'application/json');
await allure.attachment('Response', responseBody, 'text/html');

// Capture screenshots on failure
if (test.failed) {
  const screenshot = await page.screenshot();
  await allure.attachment('Screenshot', screenshot, 'image/png');
}

// Add step-by-step documentation
await allure.step('Navigate to login page', async () => {
  await page.goto('/login');
});

await allure.step('Enter credentials', async () => {
  await page.fill('#username', 'user@example.com');
  await page.fill('#password', 'password123');
});
```

### Performance Guidelines

Optimize for large test suites:

```bash
# Parallel test execution
npm test -- --maxWorkers=4                    # Jest
npx vitest --reporter=allure --threads=4      # Vitest
pytest -n auto                                # Pytest
./vendor/bin/phpunit --process-isolation      # PHPUnit

# Result size management
export ALLURE_MAX_ATTACHMENT_SIZE="10MB"
export ALLURE_COMPRESS_ATTACHMENTS="true"

# History management
export ALLURE_HISTORY_LIMIT="30"
export ALLURE_CLEANUP_OLD_BUILDS="true"
```

## 🔄 Migration Guide

### From Existing Allure Setup

If you already have Allure configured:

1. **Backup existing configuration**:
   ```bash
   cp jest.config.js jest.config.js.backup
   cp pytest.ini pytest.ini.backup
   ```

2. **Migrate to PA-QA structure**:
   ```bash
   # Copy PA-QA configurations
   cp shared/allure-config/allure-jest.js ./
   cp shared/allure-config/allure-pytest.ini ./pytest.ini
   
   # Update import paths
   sed -i 's|./allure-results|./shared/allure-config/allure-results|g' jest.config.js
   ```

3. **Update CI/CD pipelines**:
   ```bash
   # Replace old upload commands
   # OLD: allure-commandline generate allure-results --output allure-report
   # NEW: ./shared/allure-config/generate-report.sh --serve
   ```

### From Other Reporting Tools

#### From Jest HTML Reporter
```javascript
// Remove old reporter
// reporters: ['jest-html-reporter']

// Add Allure configuration
const allureConfig = require('./shared/allure-config/allure-jest.js');
module.exports = allureConfig;
```

#### From Pytest HTML
```bash
# Remove old plugin
pip uninstall pytest-html

# Install Allure adapter
pip install pytest-allure-adaptor

# Update configuration
cp shared/allure-config/allure-pytest.ini pytest.ini
```

## 🎯 Integration Examples

### React Application

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import allureConfig from './shared/allure-config/allure-vitest';

export default defineConfig({
  plugins: [react()],
  ...allureConfig,
  test: {
    ...allureConfig.test,
    environment: 'jsdom',
    setupFiles: [
      ...allureConfig.test.setupFiles,
      './src/test-setup.ts'
    ],
  },
});
```

### FastAPI Application

```python
# conftest.py
import pytest
from allure_commons.types import AttachmentType
import allure

@pytest.fixture
def client():
    from main import app
    from fastapi.testclient import TestClient
    return TestClient(app)

@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()
    if rep.when == "call" and rep.failed:
        allure.attach(
            str(rep.longrepr),
            name="Test Failure Details",
            attachment_type=AttachmentType.TEXT
        )
```

### WordPress Plugin

```xml
<!-- phpunit.xml for WordPress -->
<phpunit
    bootstrap="tests/bootstrap.php"
    backupGlobals="false"
    colors="true"
    convertErrorsToExceptions="true"
    convertNoticesToExceptions="true"
    convertWarningsToExceptions="true">
    
    <!-- Include PA-QA Allure configuration -->
    <extensions>
        <bootstrap class="Qameta\Allure\PHPUnit\AllureExtension">
            <parameter name="resultsDirectory">allure-results</parameter>
        </bootstrap>
    </extensions>
    
    <testsuites>
        <testsuite name="WordPress Plugin Tests">
            <directory>./tests/</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

## 📞 Support

### Getting Help

1. **Documentation**: Check this README and inline code comments
2. **Examples**: Review the `/examples/` directory for sample implementations
3. **Issues**: Report bugs and feature requests via GitHub Issues
4. **Team Slack**: #qa-testing channel for internal support

### Contributing

Contributions welcome! Please:

1. **Follow conventions**: Use the established patterns and naming
2. **Test thoroughly**: Verify with multiple frameworks and CI platforms  
3. **Update docs**: Keep README and inline comments current
4. **Add examples**: Include working examples for new features

### Roadmap

Upcoming features:

- [ ] **AI-powered test analysis** with failure pattern recognition
- [ ] **Cross-platform mobile testing** integration  
- [ ] **Load testing** integration with K6 and Artillery
- [ ] **Visual regression testing** with Percy/Chromatic
- [ ] **Accessibility testing** integration with axe-core
- [ ] **Security testing** integration with OWASP ZAP

---

**Remember**: Great testing infrastructure should be invisible to developers but invaluable to the team. This Allure setup aims to provide comprehensive insights while requiring minimal configuration effort.

For the latest updates and examples, visit: **https://allure.projectassistant.ai**