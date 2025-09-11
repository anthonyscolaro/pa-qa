# PA-QA GitHub Actions CI/CD Templates

This directory contains comprehensive GitHub Actions workflows for the PA-QA framework, designed to provide robust testing, security scanning, performance monitoring, and deployment automation for web development projects.

## 🚀 Quick Start

1. **Copy the relevant workflow files** to your project's `.github/workflows/` directory
2. **Configure secrets and variables** in your GitHub repository settings
3. **Customize the workflows** based on your project's specific needs
4. **Commit and push** to trigger the workflows

## 📁 Workflow Files Overview

| Workflow | Purpose | Triggers | Features |
|----------|---------|----------|----------|
| **react-test.yml** | React/Vitest testing | Push, PR | Matrix testing, sharding, coverage |
| **fastapi-test.yml** | FastAPI/Python testing | Push, PR | Multiple Python versions, services |
| **wordpress-test.yml** | WordPress/PHP testing | Push, PR | Multi-version, multisite support |
| **security-scan.yml** | Security scanning | Push, PR, schedule | SAST, dependencies, secrets |
| **performance-test.yml** | Performance testing | Push, PR, schedule | Load testing, regression checks |
| **deploy-staging.yml** | Staging deployment | Push to develop | Rollback support, health checks |
| **deploy-production.yml** | Production deployment | Tags, manual | Blue-green, canary, safety checks |
| **allure-reports.yml** | Test reporting | Workflow completion | Centralized reporting |
| **dependency-update.yml** | Dependency updates | Schedule, manual | Automated PRs, security checks |

## ⚙️ Configuration

### Required Secrets

Set these secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

#### Authentication & Access
```bash
GITHUB_TOKEN              # Automatically provided by GitHub
DEPENDENCY_UPDATE_TOKEN    # Personal access token for dependency PRs
```

#### Container Registry
```bash
REGISTRY_USERNAME          # Container registry username
REGISTRY_PASSWORD          # Container registry password or token
```

#### Cloud Providers
```bash
# AWS (for EKS, S3, etc.)
AWS_ACCESS_KEY_ID          # AWS access key
AWS_SECRET_ACCESS_KEY      # AWS secret key

# Azure (if using AKS)
AZURE_CREDENTIALS          # Azure service principal

# Google Cloud (if using GKE)
GCP_SA_KEY                # Google Cloud service account key
```

#### External Services
```bash
# Code Coverage
CODECOV_TOKEN             # Codecov upload token

# Security Scanning
SNYK_TOKEN                # Snyk API token
SEMGREP_APP_TOKEN         # Semgrep App token

# Monitoring & Reporting
ALLURE_TOKEN              # Allure server authentication
MONITORING_TOKEN          # Monitoring system API token

# Notifications
SLACK_WEBHOOK             # Slack webhook URL for notifications
SLACK_SECURITY_WEBHOOK    # Slack webhook for security alerts
SLACK_EMERGENCY_WEBHOOK   # Slack webhook for emergency alerts

# Deployment
VERCEL_TOKEN              # Vercel deployment token
DEPLOYMENT_WEBHOOK_TOKEN  # Custom deployment tracking webhook
INCIDENT_TOKEN            # Incident management system token

# WordPress (if applicable)
WP_STAGING_DB_USER        # WordPress staging database user
WP_STAGING_DB_PASS        # WordPress staging database password
WP_PROD_DB_USER           # WordPress production database user
WP_PROD_DB_PASS           # WordPress production database password
```

### Required Variables

Set these variables in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

#### Container & Registry
```bash
CONTAINER_REGISTRY        # Container registry URL (e.g., ghcr.io)
```

#### Cloud Infrastructure
```bash
# AWS
AWS_REGION               # AWS region (e.g., us-west-2)
EKS_CLUSTER_NAME         # EKS cluster name for deployments

# Deployment
DEPLOYMENT_BUCKET        # S3 bucket for deployment artifacts
CLOUDFRONT_DISTRIBUTION_ID  # CloudFront distribution for React apps
```

#### External Services
```bash
# Monitoring & APIs
MONITORING_API           # Monitoring system API endpoint
DEPLOYMENT_API           # Deployment tracking API endpoint
STAGING_API_URL          # Staging environment API URL
INCIDENT_API             # Incident management API endpoint

# Allure Reporting
ALLURE_SERVER_URL        # Allure server URL (default: https://allure.projectassistant.ai)

# Vercel (for React apps)
VERCEL_ORG_ID           # Vercel organization ID

# Domain & URLs
PRODUCTION_DOMAIN        # Production domain name
STAGING_DOMAIN          # Staging domain name
WP_STAGING_URL          # WordPress staging URL
```

#### WordPress Configuration
```bash
WP_STAGING_HOST         # WordPress staging server hostname
WP_STAGING_PATH         # WordPress staging installation path
WP_STAGING_DB_HOST      # WordPress staging database host
WP_PROD_HOST            # WordPress production server hostname
WP_PROD_PATH            # WordPress production installation path
WP_PROD_DB_HOST         # WordPress production database host
```

## 🎯 Project Type Detection

The workflows automatically detect your project type based on configuration files:

- **React**: `package.json` with React dependency
- **FastAPI**: `requirements.txt` with FastAPI
- **WordPress**: `wp-config.php` or `style.css` with theme header
- **Generic**: Fallback for other project types

## 🔧 Customization Guide

### Matrix Testing Configuration

Each testing workflow supports matrix builds across multiple versions:

```yaml
strategy:
  matrix:
    # React
    node-version: [18, 20, 22]
    
    # Python
    python-version: ['3.9', '3.10', '3.11', '3.12']
    
    # PHP
    php-version: ['7.4', '8.0', '8.1', '8.2', '8.3']
    wp-version: ['6.0', '6.1', '6.2', '6.3', 'latest']
```

### Test Sharding

Large test suites are automatically sharded for parallel execution:

```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]  # 4-way sharding
```

### Environment-Specific Configuration

Workflows adapt to different environments:

```yaml
env:
  NODE_ENV: ${{ github.ref == 'refs/heads/main' && 'production' || 'test' }}
  API_URL: ${{ github.ref == 'refs/heads/main' && vars.PROD_API_URL || vars.STAGING_API_URL }}
```

## 🛡️ Security Features

### Secret Scanning
- **TruffleHog**: Detects secrets in code and git history
- **GitLeaks**: Additional secret detection with custom rules

### Static Analysis
- **Semgrep**: Multi-language security analysis
- **CodeQL**: GitHub's semantic code analysis

### Dependency Scanning
- **Snyk**: Vulnerability scanning for all package managers
- **npm audit**: Node.js security audit
- **Safety**: Python dependency security
- **Composer audit**: PHP dependency security

### Container Scanning
- **Trivy**: Vulnerability scanning for containers and filesystems
- **Hadolint**: Dockerfile best practices

## 📊 Performance Testing

### Load Testing Tools
- **K6**: Modern load testing with JavaScript
- **Locust**: Python-based load testing
- **Artillery**: Node.js performance testing

### Monitoring Integration
- **Lighthouse**: Web performance auditing
- **Core Web Vitals**: Performance metrics
- **Custom metrics**: API response times, throughput

### Regression Detection
- Automatic performance baseline comparison
- Configurable thresholds for performance metrics
- Historical trend analysis

## 🚀 Deployment Strategies

### Rolling Deployment (Default)
- Gradual rollout with zero downtime
- Automatic rollback on health check failures
- Suitable for most applications

### Blue-Green Deployment
- Full environment switch
- Instant rollback capability
- Best for critical applications

### Canary Deployment
- Gradual traffic shift to new version
- Real-time monitoring and automatic rollback
- Risk mitigation for high-traffic applications

## 📈 Allure Reporting

### Centralized Dashboard
- **URL**: `https://allure.projectassistant.ai`
- **Features**: Test results, trends, history
- **Integration**: Automatic upload from all test workflows

### Report Types
- **Test Results**: Pass/fail rates, execution times
- **Performance**: Lighthouse scores, load test results
- **Security**: Vulnerability reports, compliance checks
- **Coverage**: Code coverage across all test types

## 🔄 Dependency Management

### Automated Updates
- **Schedule**: Monday-Friday at 9 AM UTC
- **Types**: Patch, minor, major updates
- **Safety**: Automatic testing before PR creation

### Update Process
1. **Detection**: Scan for outdated dependencies
2. **Testing**: Run full test suite with updates
3. **Security**: Check for new vulnerabilities
4. **PR Creation**: Automated pull requests with details

## 📋 Best Practices

### Workflow Organization
```
.github/workflows/
├── react-test.yml          # Primary testing workflow
├── security-scan.yml       # Run on all pushes
├── performance-test.yml     # Run on main branch
├── deploy-staging.yml       # Auto-deploy develop branch
├── deploy-production.yml    # Manual/tag-triggered
├── allure-reports.yml       # Consolidate test results
└── dependency-update.yml    # Scheduled maintenance
```

### Branch Strategy
- **Feature branches**: Run tests and security scans
- **Develop branch**: Deploy to staging automatically
- **Main branch**: Run full test suite + performance tests
- **Tags (v*.*.*)**: Deploy to production

### Resource Optimization
- **Conditional execution**: Skip irrelevant jobs based on file changes
- **Caching**: Aggressive caching for dependencies and build artifacts
- **Parallel execution**: Matrix builds and job parallelization
- **Artifact cleanup**: Automatic cleanup of old artifacts

## 🔍 Troubleshooting

### Common Issues

#### Test Failures
```bash
# Check test logs
gh run view $RUN_ID --log

# Download test artifacts
gh run download $RUN_ID --name test-results
```

#### Deployment Issues
```bash
# Check deployment status
kubectl get deployments -n production

# View deployment logs
kubectl logs -f deployment/pa-qa-app -n production
```

#### Security Scan Failures
```bash
# Review security findings
gh run download $RUN_ID --name security-scan-results

# Check SARIF results
cat security-results/*.sarif | jq '.runs[].results[]'
```

### Performance Optimization

#### Workflow Speed
- Enable dependency caching
- Use matrix exclusions for unnecessary combinations
- Implement smart job skipping based on changed files

#### Resource Usage
```yaml
# Optimize for smaller jobs
runs-on: ubuntu-latest-4-cores  # Use larger runners for heavy workloads

# Set appropriate timeouts
timeout-minutes: 30  # Prevent hanging jobs
```

## 🔗 Integration Examples

### Project-Specific Customization

#### React Project
```yaml
# .github/workflows/test.yml
name: Test React App
on: [push, pull_request]
jobs:
  test:
    uses: ./.github/workflows/react-test.yml
    secrets: inherit
    with:
      node-versions: '[18, 20]'  # Customize Node.js versions
```

#### FastAPI Project
```yaml
# .github/workflows/api-test.yml
name: Test FastAPI
on: [push, pull_request]
jobs:
  test:
    uses: ./.github/workflows/fastapi-test.yml
    secrets: inherit
    with:
      python-versions: '["3.11", "3.12"]'  # Latest Python versions only
```

### Multi-Project Repository
```yaml
# .github/workflows/monorepo.yml
name: Monorepo CI
on: [push, pull_request]
jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.changes.outputs.frontend }}
      backend: ${{ steps.changes.outputs.backend }}
    steps:
      - uses: dorny/paths-filter@v3
        id: changes
        with:
          filters: |
            frontend:
              - 'frontend/**'
            backend:
              - 'backend/**'

  test-frontend:
    needs: detect-changes
    if: needs.detect-changes.outputs.frontend == 'true'
    uses: ./.github/workflows/react-test.yml
    secrets: inherit

  test-backend:
    needs: detect-changes
    if: needs.detect-changes.outputs.backend == 'true'
    uses: ./.github/workflows/fastapi-test.yml
    secrets: inherit
```

## 📚 Additional Resources

### Documentation
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PA-QA Framework Guide](../../../docs/)
- [Allure Framework](https://docs.qameta.io/allure/)

### Monitoring Dashboards
- **Allure Reports**: `https://allure.projectassistant.ai`
- **GitHub Actions**: Repository insights and workflow runs
- **Security Dashboards**: SARIF results in Security tab

### Support
- **Issues**: GitHub repository issues
- **Slack**: `#qa-testing` channel
- **Documentation**: PA-QA wiki

---

## 🆕 Version History

### v2.0.0 (September 2024)
- ✨ Multi-agent workflow integration
- 🔒 Enhanced security scanning with multiple tools
- 📊 Comprehensive performance testing
- 🚀 Advanced deployment strategies (blue-green, canary)
- 📈 Centralized Allure reporting
- 🔄 Automated dependency management

### v1.0.0 (Initial Release)
- 🧪 Basic testing workflows for React, FastAPI, WordPress
- 🛡️ Security scanning integration
- 📦 Container-based testing
- 🔄 Simple deployment workflows

---

**💡 Pro Tip**: Start with the basic workflows and gradually enable advanced features like performance testing and security scanning as your project matures. The workflows are designed to be incremental and non-breaking.

**🤖 Automation**: These workflows are part of the PA-QA multi-agent framework. They work together to provide comprehensive quality assurance with minimal manual intervention.