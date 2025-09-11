# PA-QA Docker Testing Templates

Comprehensive Docker configurations for testing environments in the PA-QA framework. These templates provide standardized, containerized testing environments for React, WordPress, FastAPI, and other project types with multi-stage builds, browser support, and CI/CD integration.

## Overview

This directory contains Docker configurations that support:

- **Multi-stage builds** for optimal image sizes and caching
- **Browser support** for E2E testing (Chromium, Firefox, WebKit)
- **Service dependencies** (PostgreSQL, MySQL, Redis, Elasticsearch)
- **Parallel test execution** with resource management
- **Kubernetes scaling** for large test suites
- **Allure reporting** integration
- **Performance monitoring** and metrics collection

## Directory Structure

```
shared/docker-templates/testing/
├── node-test.Dockerfile           # Node.js/React/Vue test runner
├── python-test.Dockerfile         # Python/FastAPI test runner  
├── php-test.Dockerfile            # PHP/WordPress test runner
├── docker-compose.test.yml        # Local testing environment
├── docker-compose.services.yml    # Service dependencies
├── k8s-test-pod.yml               # Kubernetes test pods
├── test-runner.sh                 # Test execution script
├── cleanup.sh                     # Environment cleanup script
└── README.md                      # This documentation
```

## Quick Start

### 1. Run Tests for Your Project Type

```bash
# Auto-detect project type and run all tests
./test-runner.sh

# Run specific test suite for React project
./test-runner.sh --type react --suite e2e

# Run tests in parallel with verbose output
./test-runner.sh --parallel --verbose
```

### 2. Start Service Dependencies

```bash
# Start all services (databases, caching, etc.)
docker-compose -f docker-compose.services.yml up -d

# Start specific services
docker-compose -f docker-compose.services.yml up -d postgres redis
```

### 3. Run Individual Test Types

```bash
# Node.js tests
docker-compose -f docker-compose.test.yml up node-tests

# Python tests  
docker-compose -f docker-compose.test.yml up python-tests

# PHP tests
docker-compose -f docker-compose.test.yml up php-tests
```

## Dockerfiles

### Node.js Test Runner (`node-test.Dockerfile`)

Multi-stage Docker image for JavaScript/TypeScript projects with browser support.

**Stages:**
- `base`: Base Node.js environment with system dependencies
- `deps`: Dependency installation and caching
- `test-env`: Test environment setup
- `test-runner`: Unit and integration tests
- `e2e-runner`: End-to-end tests with browsers
- `perf-runner`: Performance testing with Lighthouse
- `full-suite`: Complete test suite runner

**Features:**
- Playwright, Chromium, Firefox, WebKit browsers
- Jest, Vitest, React Testing Library
- Lighthouse CI for performance testing
- Allure reporting integration
- Health checks and monitoring

**Usage:**
```bash
# Build full test suite image
docker build -f node-test.Dockerfile --target full-suite -t pa-qa/node-test .

# Run specific test stage
docker build -f node-test.Dockerfile --target e2e-runner -t pa-qa/e2e-test .
```

### Python Test Runner (`python-test.Dockerfile`)

Optimized for FastAPI, Django, and other Python frameworks.

**Stages:**
- `base`: Python environment with system dependencies
- `deps`: Poetry/pip dependency management
- `test-env`: Test environment with browsers
- `unit-runner`: Unit tests with pytest
- `integration-runner`: Integration tests with testcontainers
- `e2e-runner`: E2E tests with Selenium/Playwright
- `perf-runner`: Performance tests with Locust
- `load-runner`: Load testing with Locust web interface
- `security-runner`: Security testing with Bandit, Safety
- `full-suite`: Complete test suite

**Features:**
- pytest with asyncio support
- Testcontainers for integration testing
- Selenium and Playwright for E2E
- Locust for load testing
- Security scanning tools
- Allure reporting

**Usage:**
```bash
# Build Python test image
docker build -f python-test.Dockerfile --target full-suite -t pa-qa/python-test .

# Run load tests with web interface
docker build -f python-test.Dockerfile --target load-runner -t pa-qa/load-test .
docker run -p 8089:8089 pa-qa/load-test
```

### PHP Test Runner (`php-test.Dockerfile`)

Designed for WordPress, Laravel, and general PHP projects.

**Stages:**
- `base`: PHP 8.2 with extensions and tools
- `deps`: Composer dependency management
- `wp-test-env`: WordPress test suite setup
- `unit-runner`: PHPUnit unit tests
- `wp-integration-runner`: WordPress integration tests
- `e2e-runner`: Codeception E2E tests
- `quality-runner`: Code quality analysis
- `security-runner`: Security vulnerability scanning
- `perf-runner`: Performance benchmarking
- `full-suite`: Complete test suite

**Features:**
- WordPress Test Suite integration
- PHPUnit, Codeception, PHPStan
- Code quality tools (PHPCS, PHPMD)
- Security scanning
- WP-CLI integration
- MySQL and SQLite support

**Usage:**
```bash
# Build PHP test image
docker build -f php-test.Dockerfile --target full-suite -t pa-qa/php-test .

# Run WordPress integration tests
docker build -f php-test.Dockerfile --target wp-integration-runner -t pa-qa/wp-test .
```

## Docker Compose Configurations

### Test Environment (`docker-compose.test.yml`)

Complete testing environment with all project types and test runners.

**Services:**
- `node-tests`: Node.js/React test runner
- `python-tests`: Python/FastAPI test runner  
- `php-tests`: PHP/WordPress test runner
- `e2e-tests`: Browser-based E2E testing
- `performance-tests`: Performance testing with Lighthouse
- `load-tests`: Load testing with Locust
- `app/api/wordpress`: Application containers for testing
- `allure`: Allure reporting server
- `test-aggregator`: Result collection and aggregation

**Profiles:**
- `node`: Node.js tests only
- `python`: Python tests only
- `php`: PHP tests only
- `e2e`: End-to-end tests
- `performance`: Performance tests
- `load`: Load tests
- `all`: All test types

**Usage:**
```bash
# Run all tests
COMPOSE_PROFILES=all docker-compose -f docker-compose.test.yml up

# Run specific test type
COMPOSE_PROFILES=node docker-compose -f docker-compose.test.yml up

# Run E2E tests with dependencies
COMPOSE_PROFILES=e2e,app,services docker-compose -f docker-compose.test.yml up
```

### Service Dependencies (`docker-compose.services.yml`)

Comprehensive service stack for testing dependencies.

**Database Services:**
- `postgres`: PostgreSQL 15 for Node.js/Python apps
- `mysql`: MySQL 8.0 for WordPress/PHP apps  
- `mongodb`: MongoDB 6.0 for document storage
- `redis`: Redis 7 for caching and sessions

**Infrastructure Services:**
- `elasticsearch`: Elasticsearch 8.11 for search
- `minio`: S3-compatible object storage
- `rabbitmq`: Message broker with management UI
- `kafka`: Event streaming with Zookeeper
- `mailhog`: Email testing service

**Monitoring Services:**
- `jaeger`: Distributed tracing
- `prometheus`: Metrics collection
- `grafana`: Metrics visualization

**Browser Services:**
- `selenium-hub`: Selenium Grid hub
- `selenium-chrome`: Chrome browser nodes
- `selenium-firefox`: Firefox browser nodes

**Profiles:**
- `services`: Core services (postgres, mysql, redis)
- `postgres`: PostgreSQL only
- `mysql`: MySQL only  
- `mongodb`: MongoDB only
- `elasticsearch`: Elasticsearch only
- `monitoring`: Prometheus and Grafana
- `selenium`: Selenium Grid
- `all`: All services

**Usage:**
```bash
# Start core services
COMPOSE_PROFILES=services docker-compose -f docker-compose.services.yml up -d

# Start with monitoring
COMPOSE_PROFILES=services,monitoring docker-compose -f docker-compose.services.yml up -d

# Start everything
COMPOSE_PROFILES=all docker-compose -f docker-compose.services.yml up -d
```

## Kubernetes Configuration (`k8s-test-pod.yml`)

Scalable test execution in Kubernetes with parallel processing and auto-scaling.

**Resources:**
- `Namespace`: pa-qa-testing
- `ConfigMap`: Environment variables
- `Secret`: Database credentials  
- `PersistentVolume`: Test results storage
- `Services`: Database and service endpoints
- `Deployments`: PostgreSQL, MySQL, Redis
- `Jobs`: Parallel test execution
- `HorizontalPodAutoscaler`: Auto-scaling
- `NetworkPolicy`: Security policies
- `ResourceQuota`: Resource limits

**Test Jobs:**
- `node-tests`: 3 parallel Node.js test pods
- `python-tests`: 2 parallel Python test pods
- `php-tests`: 2 parallel PHP test pods
- `e2e-tests`: End-to-end testing pod
- `performance-tests`: Performance testing pod
- `load-tests`: 5 parallel load testing pods

**Usage:**
```bash
# Deploy to Kubernetes
kubectl apply -f k8s-test-pod.yml

# Monitor test progress
kubectl get jobs -n pa-qa-testing -w

# View test logs
kubectl logs -f job/node-tests -n pa-qa-testing

# Cleanup
kubectl delete namespace pa-qa-testing
```

## Scripts

### Test Runner (`test-runner.sh`)

Comprehensive test orchestration script with auto-detection and parallel execution.

**Features:**
- Auto-detect project type (React, FastAPI, WordPress, etc.)
- Support for all test suites (unit, integration, E2E, performance)
- Parallel execution with resource management
- Environment support (local, CI, Kubernetes)
- Allure integration and result upload
- Health checks and monitoring
- Timeout handling and cleanup

**Usage:**
```bash
# Basic usage - auto-detect and run all tests
./test-runner.sh

# Specific project and test type
./test-runner.sh --type react --suite e2e --verbose

# CI environment
./test-runner.sh --env ci --parallel --timeout 1800

# Kubernetes deployment
./test-runner.sh --env k8s --suite performance

# Dry run to see what would execute
./test-runner.sh --dry-run --type fastapi --suite all
```

**Options:**
- `--type`: Project type (node|python|php|wordpress|react|fastapi|auto)
- `--suite`: Test suite (unit|integration|e2e|performance|load|security|all)
- `--env`: Environment (local|ci|k8s)
- `--parallel`: Enable parallel execution
- `--timeout`: Test timeout in seconds
- `--verbose`: Verbose output
- `--dry-run`: Show commands without executing

### Cleanup Script (`cleanup.sh`)

Comprehensive environment cleanup with selective preservation.

**Features:**
- Multi-scope cleanup (local, compose, Kubernetes, all)
- Selective preservation of volumes, images, networks
- Dry run mode to preview cleanup actions
- Force mode for automated cleanup
- Comprehensive summary reporting

**Usage:**
```bash
# Clean everything with confirmation
./cleanup.sh

# Force cleanup without confirmation  
./cleanup.sh --force

# Clean only Docker Compose resources
./cleanup.sh --scope compose

# Preserve volumes and images
./cleanup.sh --preserve-volumes --preserve-images

# Dry run to see what would be cleaned
./cleanup.sh --dry-run --scope all
```

**Options:**
- `--scope`: Cleanup scope (local|compose|k8s|all)
- `--force`: Force cleanup without confirmation
- `--preserve-volumes`: Preserve Docker volumes
- `--preserve-images`: Preserve Docker images  
- `--preserve-networks`: Preserve Docker networks
- `--dry-run`: Show actions without executing

## Environment Variables

### Test Runner Configuration

```bash
# Project type override
PA_QA_PROJECT_TYPE=react

# Allure server URL
PA_QA_ALLURE_URL=https://allure.projectassistant.ai

# Docker registry for custom images
PA_QA_DOCKER_REGISTRY=registry.company.com

# Enable Docker BuildKit
DOCKER_BUILDKIT=1
```

### Test Environment

```bash
# Application environment
NODE_ENV=test
PYTHONPATH=/app
WP_ENV=test
CI=true

# Database connections
DATABASE_URL=postgresql://test_user:test_pass@postgres:5432/test_db
REDIS_URL=redis://redis:6379/0
WP_DB_HOST=mysql
WP_DB_NAME=wordpress_test

# Browser configuration
CHROME_BIN=/usr/bin/chromium-browser
PLAYWRIGHT_BROWSERS_PATH=/app/browsers
HEADED=false

# Allure reporting
ALLURE_RESULTS_DIR=/app/allure-results
```

### Service Configuration

```bash
# PostgreSQL
POSTGRES_DB=test_db
POSTGRES_USER=test_user
POSTGRES_PASSWORD=test_pass

# MySQL  
MYSQL_DATABASE=wordpress_test
MYSQL_USER=test_user
MYSQL_PASSWORD=test_pass
MYSQL_ROOT_PASSWORD=test_pass

# Redis (no password by default)
# MongoDB
MONGO_INITDB_ROOT_USERNAME=test_user
MONGO_INITDB_ROOT_PASSWORD=test_pass
MONGO_INITDB_DATABASE=test_db
```

## Performance Optimization

### Build Optimization

```bash
# Enable BuildKit for faster builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Use build cache
docker build --cache-from pa-qa/node-test:latest -t pa-qa/node-test .

# Multi-stage builds for smaller images
docker build --target test-runner -t pa-qa/node-test:light .
```

### Resource Management

```yaml
# Docker Compose resource limits
services:
  node-tests:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
```

### Kubernetes Resource Optimization

```yaml
resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "2Gi" 
    cpu: "1000m"
```

## Monitoring and Observability

### Health Checks

All containers include comprehensive health checks:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1
```

### Metrics Collection

Integration with Prometheus for metrics:

```yaml
# Prometheus configuration
- job_name: 'pa-qa-tests'
  static_configs:
    - targets: ['node-tests:3000', 'python-tests:8000']
```

### Log Aggregation

Structured logging with JSON format:

```bash
# View aggregated logs
docker-compose logs --follow --tail=100

# Filter by service
docker-compose logs node-tests python-tests
```

## Troubleshooting

### Common Issues

**1. Browser Tests Failing**
```bash
# Check browser installation
docker exec pa-qa-node-tests npx playwright --version

# Update browsers
docker exec pa-qa-node-tests npx playwright install

# Check display
docker exec pa-qa-node-tests xvfb-run --auto-servernum --server-args="-screen 0 1280x960x24" npm run test:e2e
```

**2. Database Connection Issues**
```bash
# Check service health
docker-compose ps
docker-compose logs postgres mysql redis

# Test connections
docker exec pa-qa-postgres psql -U test_user -d test_db -c "SELECT 1"
docker exec pa-qa-mysql mysql -u test_user -ptest_pass -e "SELECT 1"
docker exec pa-qa-redis redis-cli ping
```

**3. Resource Constraints**
```bash
# Check Docker resources
docker system df
docker stats

# Clean up resources
./cleanup.sh --scope local
docker system prune -a -f
```

**4. Permission Issues**
```bash
# Fix ownership
sudo chown -R $USER:$USER test-results/
chmod -R 755 test-results/

# Check container user
docker exec pa-qa-node-tests id
```

### Debug Mode

Enable debug mode for detailed troubleshooting:

```bash
# Verbose test runner
./test-runner.sh --verbose --dry-run

# Debug Docker builds
docker build --progress=plain --no-cache -f node-test.Dockerfile .

# Container debugging
docker run -it --entrypoint /bin/bash pa-qa/node-test
```

### Performance Profiling

Profile test execution performance:

```bash
# Time test execution
time ./test-runner.sh --type react --suite unit

# Docker build timing
docker build --progress=plain -f node-test.Dockerfile . 2>&1 | ts

# Resource monitoring
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

## Integration Examples

### GitHub Actions

```yaml
name: PA-QA Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run PA-QA Tests
        run: |
          ./shared/docker-templates/testing/test-runner.sh \
            --env ci \
            --parallel \
            --upload-allure
```

### GitLab CI

```yaml
stages:
  - test

pa-qa-tests:
  stage: test
  script:
    - ./shared/docker-templates/testing/test-runner.sh --env ci --parallel
  artifacts:
    reports:
      junit: test-results/*.xml
    paths:
      - test-results/
      - coverage/
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    stages {
        stage('Test') {
            steps {
                sh './shared/docker-templates/testing/test-runner.sh --env ci --parallel'
            }
            post {
                always {
                    publishHTML([
                        allowMissing: false,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'test-results',
                        reportFiles: 'index.html',
                        reportName: 'Test Results'
                    ])
                }
            }
        }
    }
}
```

## Security Considerations

### Container Security

- Non-root users in all containers
- Minimal base images (Alpine Linux)
- Security scanning with tools like Trivy
- Network policies in Kubernetes
- Resource quotas and limits

### Secrets Management

```bash
# Use Docker secrets
echo "test_pass" | docker secret create db_password -

# Use Kubernetes secrets
kubectl create secret generic test-secrets \
  --from-literal=postgres-password=test_pass \
  --from-literal=mysql-password=test_pass
```

### Network Security

```yaml
# Docker Compose network isolation
networks:
  test-network:
    driver: bridge
    internal: true
```

## Contributing

### Adding New Test Types

1. Create new Dockerfile stage:
```dockerfile
FROM test-env AS new-test-runner
RUN install-new-tools
CMD ["new-test-command"]
```

2. Add to Docker Compose:
```yaml
new-tests:
  build:
    target: new-test-runner
  profiles:
    - new-tests
    - all
```

3. Update test runner script:
```bash
case $test_suite in
    new-tests)
        run_new_tests
        ;;
esac
```

### Best Practices

- Use multi-stage builds for optimization
- Include comprehensive health checks
- Add proper resource limits
- Include monitoring and logging
- Document configuration options
- Test in isolation before integration

## License

This project is part of the PA-QA framework and follows the same licensing terms.